'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  ShoppingBag,
  RefreshCw,
  Search,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  DollarSign,
  Award,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CustomerAdminDTO,
  Order,
  fetchCustomers,
  blockCustomer,
  unblockCustomer,
  adjustCustomerWallet,
  fetchOrders,
  ApiError,
} from '@/lib/api';

type CustomerTab = 'all' | 'active' | 'blocked';

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0.00';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<CustomerTab>('all');
  const [customers, setCustomers] = useState<CustomerAdminDTO[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 360 Customer Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAdminDTO | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Block/Unblock Modal
  const [blockActionTarget, setBlockActionTarget] = useState<CustomerAdminDTO | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  // Wallet Adjustment Modal
  const [walletTarget, setWalletTarget] = useState<CustomerAdminDTO | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAdjustmentType, setWalletAdjustmentType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
  const [showWalletConfirm, setShowWalletConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cList, oList] = await Promise.all([
        fetchCustomers(),
        fetchOrders().catch(() => [] as Order[]),
      ]);
      setCustomers(Array.isArray(cList) ? cList : []);
      setAllOrders(Array.isArray(oList) ? oList : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load customer profiles';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => !c.blocked).length;
  const blockedCustomers = customers.filter((c) => c.blocked).length;
  const totalSpentAggregate = customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    // Tab filter
    if (activeTab === 'active' && c.blocked) return false;
    if (activeTab === 'blocked' && !c.blocked) return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      String(c.id).includes(term)
    );
  });

  // Open Block/Unblock modal
  const handleOpenBlockModal = (customer: CustomerAdminDTO) => {
    setBlockActionTarget(customer);
    setBlockReason('');
    setBlockError(null);
    setBlockSuccess(null);
    setShowBlockConfirm(false);
    setIsBlockModalOpen(true);
  };

  // Submit Block or Unblock
  const handleSubmitBlockAction = async () => {
    if (!blockActionTarget) return;

    if (!blockActionTarget.blocked && !blockReason.trim()) {
      setBlockError('Please provide a mandatory security reason for suspension.');
      return;
    }

    if (!showBlockConfirm) {
      setShowBlockConfirm(true);
      return;
    }

    setIsSubmittingBlock(true);
    setBlockError(null);
    try {
      if (blockActionTarget.blocked) {
        await unblockCustomer(blockActionTarget.id);
        setBlockSuccess(`Customer ${blockActionTarget.name} has been reinstated successfully.`);
      } else {
        await blockCustomer(blockActionTarget.id, blockReason.trim());
        setBlockSuccess(`Customer ${blockActionTarget.name} has been suspended.`);
      }

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === blockActionTarget.id ? { ...c, blocked: !blockActionTarget.blocked } : c
        )
      );

      setTimeout(() => {
        setIsBlockModalOpen(false);
        setBlockSuccess(null);
        setShowBlockConfirm(false);
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed. Please try again.';
      setBlockError(msg);
      setShowBlockConfirm(false);
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  // Open Wallet Adjustment Modal
  const handleOpenWalletModal = (customer: CustomerAdminDTO) => {
    setWalletTarget(customer);
    setWalletAdjustmentType('CREDIT');
    setWalletAmount('');
    setWalletReason('');
    setWalletError(null);
    setWalletSuccess(null);
    setShowWalletConfirm(false);
    setIsWalletModalOpen(true);
  };

  // Submit Wallet Adjustment
  const handleSubmitWalletAdjustment = async () => {
    if (!walletTarget) return;

    const parsedAmount = parseFloat(walletAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setWalletError('Please enter a positive numeric adjustment amount.');
      return;
    }

    if (!walletReason.trim()) {
      setWalletError('Please provide an operational audit reason for the adjustment.');
      return;
    }

    const currentBalance = Number(walletTarget.walletBalance) || 0;
    const effectiveDelta = walletAdjustmentType === 'CREDIT' ? parsedAmount : -parsedAmount;
    const finalBalance = currentBalance + effectiveDelta;

    if (finalBalance < 0) {
      setWalletError(
        `Cannot debit ${formatCurrency(parsedAmount)}: Wallet balance would become negative (${formatCurrency(finalBalance)}). Current balance: ${formatCurrency(currentBalance)}.`
      );
      return;
    }

    if (!showWalletConfirm) {
      setShowWalletConfirm(true);
      return;
    }

    setIsSubmittingWallet(true);
    setWalletError(null);
    try {
      await adjustCustomerWallet(walletTarget.id, {
        amount: effectiveDelta,
        reason: walletReason.trim(),
      });

      setWalletSuccess(
        `Successfully ${walletAdjustmentType === 'CREDIT' ? 'credited' : 'debited'} ${formatCurrency(parsedAmount)} to ${walletTarget.name}'s wallet. New balance: ${formatCurrency(finalBalance)}.`
      );

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === walletTarget.id ? { ...c, walletBalance: finalBalance } : c
        )
      );

      setTimeout(() => {
        setIsWalletModalOpen(false);
        setWalletSuccess(null);
        setShowWalletConfirm(false);
      }, 1800);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to adjust customer wallet';
      setWalletError(msg);
      setShowWalletConfirm(false);
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  // Customer Orders Filter
  const customerOrders = selectedCustomer
    ? allOrders.filter(
        (o) =>
          (o.user && o.user.id === selectedCustomer.id) ||
          (o.customer && o.customer.id === selectedCustomer.id)
      )
    : [];

  const columns: Column<CustomerAdminDTO>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '70px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px' }}>#{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Customer Profile',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.name}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>{item.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item) => <span style={{ fontSize: '12.5px', color: 'var(--slate-700)' }}>{item.phone}</span>,
    },
    {
      key: 'walletBalance',
      header: 'Wallet',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
          {formatCurrency(item.walletBalance)}
        </span>
      ),
    },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 600, color: 'var(--brand-primary)', fontSize: '12px' }}>
          ★ {item.loyaltyPoints ?? 0} pts
        </span>
      ),
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
          {item.totalOrders ?? 0}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Lifetime Spend',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
          {formatCurrency(item.totalSpent)}
        </span>
      ),
    },
    {
      key: 'blocked',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.blocked ? 'danger' : 'success'} withDot size="sm">
          {item.blocked ? 'Suspended' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setSelectedCustomer(item);
              setIsDetailModalOpen(true);
            }}
            title="View 360 Profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--slate-500)',
              transition: 'all 120ms ease',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--slate-100)';
              e.currentTarget.style.color = 'var(--brand-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--slate-500)';
            }}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenWalletModal(item)}
            title="Adjust Wallet Balance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--slate-500)',
              transition: 'all 120ms ease',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--slate-100)';
              e.currentTarget.style.color = 'var(--success)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--slate-500)';
            }}
          >
            <Wallet size={15} />
          </button>
          <button
            onClick={() => handleOpenBlockModal(item)}
            title={item.blocked ? 'Reinstate Customer' : 'Suspend Customer'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: item.blocked ? 'var(--success)' : 'var(--danger)',
              transition: 'all 120ms ease',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = item.blocked ? 'var(--success-surface)' : 'var(--danger-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {item.blocked ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Customer Directory & Account Governance"
        subtitle="Manage registered customers, wallet adjustments, loyalty balances, and fraud security suspensions."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Customers' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={loadData}
            disabled={isLoading}
          >
            Refresh
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <StatCard
          title="Total User Base"
          value={String(totalCustomers)}
          icon={Users}
          iconColor="var(--info)"
          badge="Platform Database"
        />
        <StatCard
          title="Active Accounts"
          value={String(activeCustomers)}
          icon={UserCheck}
          iconColor="var(--success)"
          badge="Good Standing"
        />
        <StatCard
          title="Suspended Accounts"
          value={String(blockedCustomers)}
          icon={UserX}
          iconColor="var(--danger)"
          badge="Fraud / Policy Guard"
        />
        <StatCard
          title="Cumulative Spend"
          value={formatCurrency(totalSpentAggregate)}
          icon={ShoppingBag}
          iconColor="var(--brand-primary)"
          badge="Delivered Orders"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-surface)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Main Container */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            borderBottom: '1px solid var(--border-light)',
            padding: '0 20px',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'all' as const, label: `All Customers (${customers.length})` },
            { key: 'active' as const, label: `Active (${activeCustomers})` },
            { key: 'blocked' as const, label: `Suspended (${blockedCustomers})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? 'var(--brand-primary)' : 'var(--slate-500)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
                background: 'none',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: activeTab === tab.key ? 'var(--brand-primary)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              maxWidth: '380px',
              padding: '0 12px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--slate-50)',
            }}
          >
            <Search size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search by customer name, email, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                fontSize: '13px',
                color: 'var(--slate-800)',
              }}
            />
          </div>
          <Badge variant="neutral" size="sm">
            {filteredCustomers.length} Profile{filteredCustomers.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Customer Table */}
        <DataTable<CustomerAdminDTO>
          columns={columns}
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Customers Found"
          emptyDescription="No customer profiles matching the selected filter criteria."
        />
      </div>

      {/* =================== 360 CUSTOMER PROFILE MODAL =================== */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Customer 360° Profile"
        description={selectedCustomer ? `Customer #${selectedCustomer.id} • ${selectedCustomer.name}` : ''}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedCustomer && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Wallet size={14} />}
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenWalletModal(selectedCustomer);
                  }}
                >
                  Adjust Wallet
                </Button>
                <Button
                  variant={selectedCustomer.blocked ? 'primary' : 'danger'}
                  size="sm"
                  leftIcon={selectedCustomer.blocked ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenBlockModal(selectedCustomer);
                  }}
                >
                  {selectedCustomer.blocked ? 'Reinstate User' : 'Suspend User'}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Identity & Contact */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11.5px' }}>Full Name</span>
                <strong>{selectedCustomer.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11.5px' }}>Email Address</span>
                <strong>{selectedCustomer.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11.5px' }}>Mobile Phone</span>
                <strong>{selectedCustomer.phone}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11.5px' }}>Joined Date</span>
                <span>{formatDate(selectedCustomer.joinedAt)}</span>
              </div>
            </div>

            {/* Financial & Loyalty Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--slate-500)' }}>
                  <Wallet size={14} /> Wallet Balance
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', marginTop: '4px' }}>
                  {formatCurrency(selectedCustomer.walletBalance)}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--slate-500)' }}>
                  <Award size={14} /> Loyalty Points
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '4px' }}>
                  ★ {selectedCustomer.loyaltyPoints ?? 0}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--slate-500)' }}>
                  <DollarSign size={14} /> Lifetime Spent
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
                  {formatCurrency(selectedCustomer.totalSpent)}
                </div>
              </div>
            </div>

            {/* Account Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: selectedCustomer.blocked ? 'var(--danger-surface)' : 'var(--success-surface)', borderRadius: 'var(--radius-md)', border: `1px solid ${selectedCustomer.blocked ? 'var(--danger)' : 'var(--success)'}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: selectedCustomer.blocked ? 'var(--danger)' : 'var(--success)' }}>
                  {selectedCustomer.blocked ? 'Account Under Security Suspension' : 'Account in Good Standing'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--slate-600)' }}>
                  {selectedCustomer.blocked ? 'User is prevented from placing new orders on the platform.' : 'User has unrestricted order dispatch privileges.'}
                </div>
              </div>
              <Badge variant={selectedCustomer.blocked ? 'danger' : 'success'} withDot size="sm">
                {selectedCustomer.blocked ? 'BLOCKED' : 'ACTIVE'}
              </Badge>
            </div>

            {/* Order History */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '8px' }}>
                Customer Order History ({customerOrders.length} orders recorded)
              </h4>
              {customerOrders.length > 0 ? (
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Order ID</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Restaurant</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((o) => (
                        <tr key={o.orderId || o.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>#{o.orderId || o.id}</td>
                          <td style={{ padding: '8px 12px' }}>{o.restaurant?.name || '—'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Badge variant={o.status === 'DELIVERED' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'brand'} size="sm">
                              {o.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', color: 'var(--slate-500)', fontSize: '12.5px' }}>
                  No recent orders found for this customer.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* =================== SUSPEND / REINSTATE MODAL =================== */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => {
          if (!isSubmittingBlock) {
            setIsBlockModalOpen(false);
            setShowBlockConfirm(false);
          }
        }}
        title={blockActionTarget?.blocked ? 'Reinstate Customer Account' : 'Suspend Customer Account'}
        description={blockActionTarget ? `${blockActionTarget.name} (${blockActionTarget.email})` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsBlockModalOpen(false);
                setShowBlockConfirm(false);
              }}
              disabled={isSubmittingBlock}
            >
              Cancel
            </Button>
            <Button
              variant={blockActionTarget?.blocked ? 'primary' : 'danger'}
              size="sm"
              onClick={handleSubmitBlockAction}
              isLoading={isSubmittingBlock}
              disabled={isSubmittingBlock || !!blockSuccess}
            >
              {showBlockConfirm
                ? blockActionTarget?.blocked
                  ? 'Confirm Reinstatement'
                  : 'Confirm Suspension'
                : blockActionTarget?.blocked
                ? 'Reinstate User'
                : 'Suspend User'}
            </Button>
          </div>
        }
      >
        {blockActionTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {blockSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--success-surface)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} />
                {blockSuccess}
              </div>
            )}

            {blockError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--danger-surface)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} />
                {blockError}
              </div>
            )}

            {showBlockConfirm && !blockSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--warning-surface)',
                  border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--slate-800)',
                  fontSize: '13px',
                }}
              >
                <strong>⚠️ Please Confirm:</strong>{' '}
                {blockActionTarget.blocked
                  ? `Are you sure you want to lift the suspension for ${blockActionTarget.name}? The user will immediately regain order placement access.`
                  : `Are you sure you want to suspend ${blockActionTarget.name}? This will revoke their ordering privileges.`}
              </div>
            )}

            {!blockActionTarget.blocked ? (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                  Mandatory Suspension Reason *
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => {
                    setBlockReason(e.target.value);
                    setShowBlockConfirm(false);
                    setBlockError(null);
                  }}
                  placeholder="e.g. Fraudulent chargeback history, coupon abuse, invalid delivery claims"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                  disabled={isSubmittingBlock || !!blockSuccess}
                />
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--slate-600)', lineHeight: '1.5' }}>
                Reinstating this account will clear the security restriction and allow the customer to transact normally across the FoodApp platform.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* =================== WALLET ADJUSTMENT MODAL =================== */}
      <Modal
        isOpen={isWalletModalOpen}
        onClose={() => {
          if (!isSubmittingWallet) {
            setIsWalletModalOpen(false);
            setShowWalletConfirm(false);
          }
        }}
        title="Adjust Customer Wallet Balance"
        description={walletTarget ? `${walletTarget.name} • Current Balance: ${formatCurrency(walletTarget.walletBalance)}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsWalletModalOpen(false);
                setShowWalletConfirm(false);
              }}
              disabled={isSubmittingWallet}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitWalletAdjustment}
              isLoading={isSubmittingWallet}
              disabled={isSubmittingWallet || !!walletSuccess}
            >
              {showWalletConfirm ? 'Confirm Adjustment' : 'Apply Adjustment'}
            </Button>
          </div>
        }
      >
        {walletTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {walletSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--success-surface)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} />
                {walletSuccess}
              </div>
            )}

            {walletError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--danger-surface)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} />
                {walletError}
              </div>
            )}

            {/* Confirmation Banner */}
            {showWalletConfirm && !walletSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--warning-surface)',
                  border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--slate-800)',
                  fontSize: '13px',
                }}
              >
                <strong>⚠️ Please Confirm:</strong> You are about to{' '}
                <strong>{walletAdjustmentType === 'CREDIT' ? 'credit' : 'debit'} {formatCurrency(parseFloat(walletAmount))}</strong>{' '}
                {walletAdjustmentType === 'CREDIT' ? 'to' : 'from'} {walletTarget.name}'s wallet.
              </div>
            )}

            {/* Current Balance card */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--slate-600)' }}>Current Wallet Balance:</span>
              <strong style={{ fontSize: '16px', color: 'var(--slate-900)' }}>
                {formatCurrency(walletTarget.walletBalance)}
              </strong>
            </div>

            {/* Adjustment Type Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Action Type *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setWalletAdjustmentType('CREDIT');
                    setShowWalletConfirm(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: walletAdjustmentType === 'CREDIT' ? '2px solid var(--success)' : '1px solid var(--border-light)',
                    backgroundColor: walletAdjustmentType === 'CREDIT' ? 'var(--success-surface)' : 'white',
                    color: walletAdjustmentType === 'CREDIT' ? 'var(--success)' : 'var(--slate-700)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <PlusCircle size={15} /> Credit (Add Funds)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWalletAdjustmentType('DEBIT');
                    setShowWalletConfirm(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: walletAdjustmentType === 'DEBIT' ? '2px solid var(--danger)' : '1px solid var(--border-light)',
                    backgroundColor: walletAdjustmentType === 'DEBIT' ? 'var(--danger-surface)' : 'white',
                    color: walletAdjustmentType === 'DEBIT' ? 'var(--danger)' : 'var(--slate-700)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <MinusCircle size={15} /> Debit (Deduct Funds)
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Adjustment Amount (₹) *
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 250.00"
                value={walletAmount}
                onChange={(e) => {
                  setWalletAmount(e.target.value);
                  setShowWalletConfirm(false);
                  setWalletError(null);
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
                disabled={isSubmittingWallet || !!walletSuccess}
              />
            </div>

            {/* Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Audit Reason *
              </label>
              <textarea
                value={walletReason}
                onChange={(e) => {
                  setWalletReason(e.target.value);
                  setShowWalletConfirm(false);
                  setWalletError(null);
                }}
                placeholder="Reason for adjustment (e.g., promotional credit, goodwill compensation, dispute resolution)"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
                disabled={isSubmittingWallet || !!walletSuccess}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
