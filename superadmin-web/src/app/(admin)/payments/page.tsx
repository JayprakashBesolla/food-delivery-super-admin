'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertOctagon,
  RefreshCw,
  Search,
  Eye,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  PaymentTransaction,
  fetchAllTransactions,
  fetchSuccessfulTransactions,
  fetchFailedTransactions,
  fetchRefundedTransactions,
  fetchPaymentDisputes,
  triggerPaymentRefund,
  ApiError,
} from '@/lib/api';

type PaymentTab = 'all' | 'successful' | 'failed' | 'refunded' | 'disputed';

const TABS: { key: PaymentTab; label: string; color: string }[] = [
  { key: 'all', label: 'All Transactions', color: 'var(--slate-600)' },
  { key: 'successful', label: 'Successful', color: 'var(--success)' },
  { key: 'failed', label: 'Failed', color: 'var(--danger)' },
  { key: 'refunded', label: 'Refunded', color: 'var(--info)' },
  { key: 'disputed', label: 'Disputed', color: 'var(--warning)' },
];

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

function getStatusBadge(status: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'brand'> = {
    SUCCESS: 'success',
    PENDING: 'warning',
    FAILED: 'danger',
    REFUNDED: 'brand',
  };
  return (
    <Badge variant={map[status] || 'neutral'} withDot size="sm">
      {status}
    </Badge>
  );
}

function getDisputeBadge(disputeStatus: string | undefined | null) {
  if (!disputeStatus || disputeStatus === 'NONE') return null;
  const map: Record<string, 'warning' | 'danger' | 'success' | 'neutral'> = {
    NEEDS_RESPONSE: 'danger',
    UNDER_REVIEW: 'warning',
    WON: 'success',
    LOST: 'danger',
  };
  return (
    <Badge variant={map[disputeStatus] || 'neutral'} size="sm">
      Dispute: {disputeStatus}
    </Badge>
  );
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>('all');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Detail modal
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTxn, setRefundTxn] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

  // Confirmation step for refund
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: PaymentTransaction[];
      switch (activeTab) {
        case 'successful':
          data = await fetchSuccessfulTransactions();
          break;
        case 'failed':
          data = await fetchFailedTransactions();
          break;
        case 'refunded':
          data = await fetchRefundedTransactions();
          break;
        case 'disputed':
          data = await fetchPaymentDisputes();
          break;
        default:
          data = await fetchAllTransactions();
      }
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load transactions';
      setError(msg);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const allTxns = transactions;
  const successCount = allTxns.filter((t) => t.status === 'SUCCESS').length;
  const failedCount = allTxns.filter((t) => t.status === 'FAILED').length;
  const refundedCount = allTxns.filter((t) => t.status === 'REFUNDED').length;
  const totalGross = allTxns
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalRefunded = allTxns.reduce((sum, t) => sum + (Number(t.refundAmount) || 0), 0);
  const successRate =
    allTxns.length > 0 ? ((successCount / allTxns.length) * 100).toFixed(1) : '0.0';

  // Search filter
  const filtered = transactions.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.transactionReference ?? '').toLowerCase().includes(term) ||
      String(t.id).includes(term) ||
      (t.order?.orderId ?? String(t.order?.id ?? '')).toLowerCase().includes(term) ||
      (t.user?.name ?? '').toLowerCase().includes(term) ||
      (t.user?.email ?? '').toLowerCase().includes(term) ||
      (t.provider ?? '').toLowerCase().includes(term)
    );
  });

  // Refund handler
  const handleOpenRefund = (txn: PaymentTransaction) => {
    setRefundTxn(txn);
    const maxRefundable = Number(txn.amount) - (Number(txn.refundAmount) || 0);
    setRefundAmount(String(Math.max(0, maxRefundable)));
    setRefundReason('');
    setRefundError(null);
    setRefundSuccess(null);
    setShowRefundConfirm(false);
    setShowRefundModal(true);
  };

  const handleSubmitRefund = async () => {
    if (!refundTxn) return;

    const amount = parseFloat(refundAmount);
    const maxRefundable = Number(refundTxn.amount) - (Number(refundTxn.refundAmount) || 0);

    if (isNaN(amount) || amount <= 0) {
      setRefundError('Enter a valid refund amount greater than 0.');
      return;
    }
    if (amount > maxRefundable) {
      setRefundError(`Maximum refundable amount is ${formatCurrency(maxRefundable)}.`);
      return;
    }
    if (!refundReason.trim()) {
      setRefundError('Please provide a reason for the refund.');
      return;
    }

    if (!showRefundConfirm) {
      setShowRefundConfirm(true);
      return;
    }

    setIsSubmittingRefund(true);
    setRefundError(null);
    try {
      await triggerPaymentRefund(refundTxn.id, {
        amount,
        reason: refundReason.trim(),
      });
      setRefundSuccess(
        `Refund of ${formatCurrency(amount)} processed successfully for TXN #${refundTxn.transactionReference || refundTxn.id}.`
      );
      setTimeout(() => {
        setShowRefundModal(false);
        setRefundSuccess(null);
        fetchData();
      }, 2000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Refund failed. Please try again.';
      setRefundError(msg);
      setShowRefundConfirm(false);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const columns: Column<PaymentTransaction>[] = [
    {
      key: 'transactionReference',
      header: 'Transaction ID',
      width: '180px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '11.5px', fontWeight: 600 }}>
          {item.transactionReference || `TXN-${item.id}`}
        </span>
      ),
    },
    {
      key: 'orderId',
      header: 'Order',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
          #{item.order?.orderId || item.order?.id || '—'}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Customer',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--slate-800)' }}>
            {item.user?.name || '—'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            {item.user?.email || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Gateway',
      render: (item) => (
        <Badge variant="neutral" size="sm">
          {item.provider || '—'}
        </Badge>
      ),
    },
    {
      key: 'paymentMethodType',
      header: 'Method',
      render: (item) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-700)' }}>
          {item.paymentMethodType || '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13px' }}>
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {getStatusBadge(item.status)}
          {getDisputeBadge(item.disputeStatus)}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setSelectedTxn(item);
              setShowDetailModal(true);
            }}
            title="View Details"
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
          {(item.status === 'SUCCESS' || item.status === 'PENDING') && (
            <button
              onClick={() => handleOpenRefund(item)}
              title="Issue Refund"
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--danger-surface)';
                e.currentTarget.style.color = 'var(--danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--slate-500)';
              }}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Payment Gateways & Transactions"
        subtitle="UPI, Card, NetBanking ledger, payment gateway reconciliations, and instant refunds."
        breadcrumbs={[{ label: 'Financials' }, { label: 'Payments' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={fetchData}
          >
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="dashboard-grid">
        <StatCard
          title="Gross Inflows"
          value={formatCurrency(totalGross)}
          icon={CreditCard}
          iconColor="var(--success)"
          badge="Settled"
        />
        <StatCard
          title="Payment Success Rate"
          value={`${successRate}%`}
          icon={CheckCircle}
          iconColor="var(--brand-primary)"
          badge={`${successCount} of ${allTxns.length}`}
        />
        <StatCard
          title="Failed Attempts"
          value={String(failedCount)}
          icon={AlertOctagon}
          iconColor="var(--danger)"
          badge="Gateway Drops"
        />
        <StatCard
          title="Refunded"
          value={formatCurrency(totalRefunded)}
          icon={RefreshCw}
          iconColor="var(--info)"
          badge={`${refundedCount} txns`}
        />
      </div>

      {/* Error Banner */}
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

      {/* Tabs + Search */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tabs */}
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
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? 'var(--brand-primary)' : 'var(--slate-500)',
                borderBottom: activeTab === tab.key ? '2px solid var(--brand-primary)' : '2px solid transparent',
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
              maxWidth: '420px',
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
              placeholder="Search by TXN ID, order ID, customer name, email..."
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
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Data Table */}
        <DataTable<PaymentTransaction>
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Transactions Found"
          emptyDescription={
            activeTab === 'all'
              ? 'No payment transactions recorded yet.'
              : `No ${activeTab} transactions found.`
          }
        />
      </div>

      {/* =================== DETAIL MODAL =================== */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Transaction Details"
        description={selectedTxn ? `TXN ${selectedTxn.transactionReference || `#${selectedTxn.id}`}` : ''}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedTxn && (selectedTxn.status === 'SUCCESS' || selectedTxn.status === 'PENDING') && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenRefund(selectedTxn);
                }}
              >
                Issue Refund
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedTxn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Transaction Info */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Transaction Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <DetailRow label="Transaction ID" value={selectedTxn.transactionReference || `#${selectedTxn.id}`} mono />
                <DetailRow label="Status" value={<>{getStatusBadge(selectedTxn.status)}</>} />
                <DetailRow label="Amount" value={formatCurrency(selectedTxn.amount)} bold />
                <DetailRow label="Currency" value={selectedTxn.currency || 'INR'} />
                <DetailRow label="Gateway / Provider" value={selectedTxn.provider} />
                <DetailRow label="Payment Method" value={selectedTxn.paymentMethodType || '—'} />
                <DetailRow label="Gateway Fee" value={formatCurrency(selectedTxn.gatewayFee)} />
                <DetailRow label="Date" value={formatDate(selectedTxn.createdAt)} />
              </div>
            </div>

            {/* Order Info */}
            {selectedTxn.order && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Related Order
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <DetailRow label="Order ID" value={`#${selectedTxn.order.orderId || selectedTxn.order.id}`} mono />
                  <DetailRow label="Order Status" value={selectedTxn.order.status} />
                  <DetailRow label="Order Amount" value={formatCurrency(selectedTxn.order.totalAmount)} />
                  <DetailRow label="Restaurant" value={selectedTxn.order.restaurant?.name || '—'} />
                </div>
              </div>
            )}

            {/* Customer Info */}
            {selectedTxn.user && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Customer
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <DetailRow label="Name" value={selectedTxn.user.name} />
                  <DetailRow label="Email" value={selectedTxn.user.email} />
                  <DetailRow label="Phone" value={selectedTxn.user.phone || '—'} />
                </div>
              </div>
            )}

            {/* Refund Info (if refunded) */}
            {(selectedTxn.status === 'REFUNDED' || (Number(selectedTxn.refundAmount) || 0) > 0) && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Refund Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <DetailRow label="Refund Amount" value={formatCurrency(selectedTxn.refundAmount)} bold />
                  <DetailRow label="Refund Reference" value={selectedTxn.refundReference || '—'} mono />
                </div>
              </div>
            )}

            {/* Failure Info */}
            {selectedTxn.failureReason && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--danger-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--danger)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>
                  Failure Reason
                </div>
                <div style={{ fontSize: '13px', color: 'var(--slate-800)' }}>
                  {selectedTxn.failureReason}
                </div>
              </div>
            )}

            {/* Dispute Info */}
            {selectedTxn.disputeStatus && selectedTxn.disputeStatus !== 'NONE' && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--warning-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--warning)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning)', marginBottom: '4px' }}>
                  Dispute Status
                </div>
                <div style={{ fontSize: '13px', color: 'var(--slate-800)' }}>
                  {selectedTxn.disputeStatus}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* =================== REFUND MODAL =================== */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          if (!isSubmittingRefund) {
            setShowRefundModal(false);
            setShowRefundConfirm(false);
          }
        }}
        title="Issue Payment Refund"
        description={
          refundTxn
            ? `Refund for TXN ${refundTxn.transactionReference || `#${refundTxn.id}`} — Original: ${formatCurrency(refundTxn.amount)}`
            : ''
        }
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowRefundModal(false);
                setShowRefundConfirm(false);
              }}
              disabled={isSubmittingRefund}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleSubmitRefund}
              isLoading={isSubmittingRefund}
              disabled={isSubmittingRefund || !!refundSuccess}
            >
              {showRefundConfirm ? 'Confirm Refund' : 'Process Refund'}
            </Button>
          </div>
        }
      >
        {refundTxn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Success */}
            {refundSuccess && (
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
                {refundSuccess}
              </div>
            )}

            {/* Error */}
            {refundError && (
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
                {refundError}
              </div>
            )}

            {/* Confirmation Banner */}
            {showRefundConfirm && !refundSuccess && (
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
                <strong>⚠️ Please confirm:</strong> You are about to refund{' '}
                <strong>{formatCurrency(parseFloat(refundAmount))}</strong> to{' '}
                <strong>{refundTxn.user?.name || 'customer'}</strong>. This action cannot be undone.
              </div>
            )}

            {/* Transaction summary */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Original Amount:</span>{' '}
                  <strong>{formatCurrency(refundTxn.amount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Already Refunded:</span>{' '}
                  <strong>{formatCurrency(refundTxn.refundAmount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Max Refundable:</span>{' '}
                  <strong style={{ color: 'var(--success)' }}>
                    {formatCurrency(Number(refundTxn.amount) - (Number(refundTxn.refundAmount) || 0))}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Customer:</span>{' '}
                  <strong>{refundTxn.user?.name || '—'}</strong>
                </div>
              </div>
            </div>

            {/* Refund Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Refund Amount (₹) *
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="0.01"
                max={Number(refundTxn.amount) - (Number(refundTxn.refundAmount) || 0)}
                step="0.01"
                value={refundAmount}
                onChange={(e) => {
                  setRefundAmount(e.target.value);
                  setShowRefundConfirm(false);
                  setRefundError(null);
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                disabled={isSubmittingRefund || !!refundSuccess}
              />
            </div>

            {/* Refund Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Reason for Refund *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => {
                  setRefundReason(e.target.value);
                  setShowRefundConfirm(false);
                  setRefundError(null);
                }}
                placeholder="Provide a clear reason for this refund (e.g., incorrect order, quality issue, customer request)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
                disabled={isSubmittingRefund || !!refundSuccess}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================================
// Reusable Detail Row component
// ============================================================================

function DetailRow({
  label,
  value,
  mono = false,
  bold = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div>
      <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginBottom: '2px' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'var(--slate-800)',
          fontWeight: bold ? 700 : 500,
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      >
        {value}
      </div>
    </div>
  );
}
