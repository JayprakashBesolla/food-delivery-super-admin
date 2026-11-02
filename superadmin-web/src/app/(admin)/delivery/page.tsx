'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Navigation,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  DollarSign,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Package,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  RiderAdminDTO,
  Order,
  fetchDeliveryPartners,
  fetchLiveDeliveries,
  fetchPartnerEarnings,
  fetchDeliveryIssues,
  ApiError,
} from '@/lib/api';

type DeliveryTab = 'fleet' | 'live' | 'earnings' | 'issues';

interface PartnerEarningItem {
  riderId: number;
  name: string;
  phone: string;
  deliveriesCount: number;
  deliveryPay: number;
  bonusPay: number;
  totalEarnings: number;
}

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

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('fleet');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Data states
  const [riders, setRiders] = useState<RiderAdminDTO[]>([]);
  const [liveDeliveries, setLiveDeliveries] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<PartnerEarningItem[]>([]);
  const [issues, setIssues] = useState<Order[]>([]);

  // Modals
  const [selectedRider, setSelectedRider] = useState<RiderAdminDTO | null>(null);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rList, lOrders, earnList, issList] = await Promise.all([
        fetchDeliveryPartners(),
        fetchLiveDeliveries(),
        fetchPartnerEarnings(),
        fetchDeliveryIssues(),
      ]);
      setRiders(Array.isArray(rList) ? rList : []);
      setLiveDeliveries(Array.isArray(lOrders) ? lOrders : []);
      setEarnings(Array.isArray(earnList) ? (earnList as unknown as PartnerEarningItem[]) : []);
      setIssues(Array.isArray(issList) ? issList : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load delivery fleet data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate stats
  const totalRiders = riders.length;
  const activeInTransit = liveDeliveries.length;
  const totalDeliveries = riders.reduce((sum, r) => sum + (Number(r.lifetimeDeliveries) || 0), 0);
  const totalFleetPayouts = earnings.reduce((sum, e) => sum + (Number(e.totalEarnings) || 0), 0);
  const totalIssuesCount = issues.length;

  // Filter logic
  const filteredRiders = riders.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.phone.toLowerCase().includes(term) ||
      String(r.id).includes(term) ||
      (r.currentActiveOrderId && r.currentActiveOrderId.toLowerCase().includes(term))
    );
  });

  const filteredLive = liveDeliveries.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId && o.orderId.toLowerCase().includes(term)) ||
      (o.id && String(o.id).toLowerCase().includes(term)) ||
      (o.riderName && o.riderName.toLowerCase().includes(term)) ||
      (o.riderPhone && o.riderPhone.toLowerCase().includes(term)) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(term))
    );
  });

  const filteredEarnings = earnings.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.phone.toLowerCase().includes(term) ||
      String(e.riderId).includes(term)
    );
  });

  const filteredIssues = issues.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId && o.orderId.toLowerCase().includes(term)) ||
      (o.cancelReason && o.cancelReason.toLowerCase().includes(term)) ||
      (o.riderPhone && o.riderPhone.toLowerCase().includes(term))
    );
  });

  // Rider columns
  const riderColumns: Column<RiderAdminDTO>[] = [
    {
      key: 'id',
      header: 'Rider ID',
      width: '100px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px' }}>RD-{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Partner Details',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.name}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>{item.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Mobile Phone',
      render: (item) => <span style={{ fontSize: '12.5px', color: 'var(--slate-700)' }}>{item.phone}</span>,
    },
    {
      key: 'lifetimeDeliveries',
      header: 'Fulfillments',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
          {item.lifetimeDeliveries} orders
        </span>
      ),
    },
    {
      key: 'totalEarnings',
      header: 'Total Earnings',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
          {formatCurrency(item.totalEarnings)}
        </span>
      ),
    },
    {
      key: 'currentActiveOrderId',
      header: 'Active Dispatch',
      render: (item) =>
        item.currentActiveOrderId ? (
          <Badge variant="brand" size="sm" withDot>
            #{item.currentActiveOrderId}
          </Badge>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>Idle / Standby</span>
        ),
    },
    {
      key: 'blocked',
      header: 'Account Status',
      render: (item) => (
        <Badge variant={item.blocked ? 'danger' : 'success'} withDot size="sm">
          {item.blocked ? 'Suspended' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye size={12} />}
          onClick={() => {
            setSelectedRider(item);
            setIsRiderModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  // Live order columns
  const liveColumns: Column<Order>[] = [
    {
      key: 'orderId',
      header: 'Order ID',
      width: '120px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>
          #{item.orderId || item.id}
        </span>
      ),
    },
    {
      key: 'restaurant',
      header: 'Pickup Store',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
            {item.restaurant?.name || 'Store'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            {item.businessSector || 'FOOD'}
          </div>
        </div>
      ),
    },
    {
      key: 'rider',
      header: 'Assigned Rider',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
            {item.riderName || 'Rider Assigned'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            {item.riderPhone || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'deliveryAddress',
      header: 'Delivery Address',
      render: (item) => (
        <div style={{ maxWidth: '240px', fontSize: '12px', color: 'var(--slate-700)' }}>
          {item.deliveryAddress || 'Address on file'}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Order Value',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
          {formatCurrency(item.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant="brand" withDot size="sm">
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye size={12} />}
          onClick={() => {
            setSelectedOrder(item);
            setIsOrderModalOpen(true);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  // Earnings columns
  const earningColumns: Column<PartnerEarningItem>[] = [
    {
      key: 'riderId',
      header: 'Rider ID',
      width: '100px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px' }}>RD-{item.riderId}</span>,
    },
    {
      key: 'name',
      header: 'Rider Name',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.name}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>{item.phone}</div>
        </div>
      ),
    },
    {
      key: 'deliveriesCount',
      header: 'Trips Completed',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
          {item.deliveriesCount}
        </span>
      ),
    },
    {
      key: 'deliveryPay',
      header: 'Base Trip Pay',
      align: 'right',
      render: (item) => (
        <span style={{ color: 'var(--slate-700)' }}>
          {formatCurrency(item.deliveryPay)}
        </span>
      ),
    },
    {
      key: 'bonusPay',
      header: 'Milestone Bonus',
      align: 'right',
      render: (item) => (
        <span style={{ color: item.bonusPay > 0 ? 'var(--success)' : 'var(--slate-400)' }}>
          {formatCurrency(item.bonusPay)}
        </span>
      ),
    },
    {
      key: 'totalEarnings',
      header: 'Total Earnings',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '13px' }}>
          {formatCurrency(item.totalEarnings)}
        </span>
      ),
    },
  ];

  // Issues columns
  const issueColumns: Column<Order>[] = [
    {
      key: 'orderId',
      header: 'Order Reference',
      width: '130px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>
          #{item.orderId || item.id}
        </span>
      ),
    },
    {
      key: 'riderPhone',
      header: 'Rider Contact',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
            {item.riderName || 'Rider'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            {item.riderPhone || 'No contact'}
          </div>
        </div>
      ),
    },
    {
      key: 'cancelReason',
      header: 'Reported Exception / Cancellation',
      render: (item) => (
        <div style={{ color: 'var(--danger)', fontSize: '12.5px', fontWeight: 500 }}>
          {item.cancelReason || 'Fulfillment aborted after pickup'}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Order Value',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
          {formatCurrency(item.totalAmount)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatDate(item.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Delivery Fleet Operations & Telemetry"
        subtitle="Manage logistics partners, active order dispatches, partner earnings, and delivery bottlenecks."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Delivery Fleet' }]}
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

      {/* KPI Stats */}
      <div className="dashboard-grid">
        <StatCard
          title="Total Registered Fleet"
          value={String(totalRiders)}
          icon={Truck}
          iconColor="var(--info)"
          badge="Verified Partners"
        />
        <StatCard
          title="Active In-Transit"
          value={String(activeInTransit)}
          icon={Navigation}
          iconColor="var(--brand-primary)"
          badge="Delivering Now"
        />
        <StatCard
          title="Total Deliveries"
          value={String(totalDeliveries)}
          icon={CheckCircle}
          iconColor="var(--success)"
          badge="Fulfilled Trips"
        />
        <StatCard
          title="Fleet Exceptions"
          value={String(totalIssuesCount)}
          icon={AlertTriangle}
          iconColor="var(--danger)"
          badge="Bottlenecks"
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

      {/* Main Tabbed Container */}
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
            { key: 'fleet' as const, label: `Fleet Directory (${riders.length})` },
            { key: 'live' as const, label: `Live In-Transit (${liveDeliveries.length})` },
            { key: 'earnings' as const, label: `Earnings Ledger (${earnings.length})` },
            { key: 'issues' as const, label: `Exceptions & Delays (${issues.length})` },
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
              placeholder="Search by rider name, phone, email, order ID..."
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
        </div>

        {/* Tab 1: Fleet Directory */}
        {activeTab === 'fleet' && (
          <DataTable<RiderAdminDTO>
            columns={riderColumns}
            data={filteredRiders}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyTitle="No Delivery Partners Found"
            emptyDescription="No registered delivery partners found matching the filter query."
          />
        )}

        {/* Tab 2: Live Deliveries */}
        {activeTab === 'live' && (
          <DataTable<Order>
            columns={liveColumns}
            data={filteredLive}
            keyExtractor={(item) => item.orderId || item.id || ''}
            isLoading={isLoading}
            emptyTitle="No Orders In-Transit"
            emptyDescription="There are currently no active deliveries out on the road."
          />
        )}

        {/* Tab 3: Partner Earnings */}
        {activeTab === 'earnings' && (
          <DataTable<PartnerEarningItem>
            columns={earningColumns}
            data={filteredEarnings}
            keyExtractor={(item) => item.riderId}
            isLoading={isLoading}
            emptyTitle="No Earnings Records"
            emptyDescription="No trip earnings have been accumulated for delivery partners yet."
          />
        )}

        {/* Tab 4: Delivery Issues */}
        {activeTab === 'issues' && (
          <DataTable<Order>
            columns={issueColumns}
            data={filteredIssues}
            keyExtractor={(item) => item.orderId || item.id || ''}
            isLoading={isLoading}
            emptyTitle="Zero Exceptions Reported"
            emptyDescription="No cancelled or delayed delivery assignments detected."
          />
        )}
      </div>

      {/* =================== RIDER 360 DETAIL MODAL =================== */}
      <Modal
        isOpen={isRiderModalOpen}
        onClose={() => setIsRiderModalOpen(false)}
        title="Delivery Partner Profile"
        description={selectedRider ? `Rider RD-${selectedRider.id} • ${selectedRider.name}` : ''}
        size="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsRiderModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedRider && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Contact details */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <Phone size={14} color="var(--slate-500)" />
                <span style={{ color: 'var(--slate-600)' }}>Phone:</span>
                <strong>{selectedRider.phone}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <Mail size={14} color="var(--slate-500)" />
                <span style={{ color: 'var(--slate-600)' }}>Email:</span>
                <strong>{selectedRider.email}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <Calendar size={14} color="var(--slate-500)" />
                <span style={{ color: 'var(--slate-600)' }}>Onboarded:</span>
                <span>{formatDate(selectedRider.joinedAt)}</span>
              </div>
            </div>

            {/* Performance metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Lifetime Deliveries</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', marginTop: '4px' }}>
                  {selectedRider.lifetimeDeliveries}
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
                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Total Payout Accumulated</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
                  {formatCurrency(selectedRider.totalEarnings)}
                </div>
              </div>
            </div>

            {/* Active order badge */}
            <div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '6px' }}>
                Current Dispatch Status
              </div>
              {selectedRider.currentActiveOrderId ? (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--brand-surface)',
                    border: '1px solid var(--brand-primary)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                  }}
                >
                  <Navigation size={16} />
                  Out for delivery with Order #{selectedRider.currentActiveOrderId}
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: 'var(--slate-500)',
                  }}
                >
                  Standby — No active order assigned
                </div>
              )}
            </div>

            {/* Account Status */}
            <div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '4px' }}>
                Account Security State
              </div>
              <Badge variant={selectedRider.blocked ? 'danger' : 'success'} withDot size="sm">
                {selectedRider.blocked ? 'Suspended / Restricted' : 'Active Duty Verified'}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* =================== ORDER DETAIL MODAL =================== */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Live Dispatch Details"
        description={selectedOrder ? `Order #${selectedOrder.orderId || selectedOrder.id}` : ''}
        size="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsOrderModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Restaurant:</span>{' '}
                <strong>{selectedOrder.restaurant?.name || '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Sector:</span>{' '}
                <Badge variant="neutral" size="sm">{selectedOrder.businessSector || 'FOOD'}</Badge>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Rider:</span>{' '}
                <strong>{selectedOrder.riderName || '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Phone:</span>{' '}
                <strong>{selectedOrder.riderPhone || '—'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Amount:</span>{' '}
                <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Status:</span>{' '}
                <Badge variant="brand" size="sm">{selectedOrder.status}</Badge>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--slate-500)' }}>Delivery Address:</span>
              <div style={{ marginTop: '4px', padding: '8px 12px', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                {selectedOrder.deliveryAddress}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
