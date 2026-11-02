'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Truck,
  MapPin,
  CreditCard,
  User,
  Store,
  FileText,
  AlertCircle,
  ChevronRight,
  PackageCheck,
  ChefHat,
  Bike,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Order,
  OrderStatus,
  BusinessSector,
  OrderDispute,
  fetchOrders,
  fetchLiveOrders,
  fetchCancelledOrders,
  fetchFailedOrders,
  fetchOrderDisputes,
  ApiError,
} from '@/lib/api';

type OrderQueueTab = 'all' | 'live' | 'cancelled' | 'failed' | 'disputes';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderQueueTab>('live');
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'disputes') {
        const disputeData = await fetchOrderDisputes();
        setDisputes(disputeData || []);
      } else if (activeTab === 'live') {
        const liveData = await fetchLiveOrders();
        setOrders(liveData || []);
      } else if (activeTab === 'cancelled') {
        const cancelData = await fetchCancelledOrders();
        setOrders(cancelData || []);
      } else if (activeTab === 'failed') {
        const failData = await fetchFailedOrders();
        setOrders(failData || []);
      } else {
        const sectorParam = selectedSector !== 'ALL' ? (selectedSector as BusinessSector) : undefined;
        const statusParam = selectedStatus !== 'ALL' ? (selectedStatus as OrderStatus) : undefined;
        const allData = await fetchOrders({ sector: sectorParam, status: statusParam });
        setOrders(allData || []);
      }
      setLastSynced(new Date());
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch orders from server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedSector, selectedStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Optional 15-second live polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders]);

  // ============================================================================
  // Filter & Search Logic
  // ============================================================================

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const id = o.orderId || o.id || '';
      const customer = o.customer?.name || o.user?.name || o.customer?.phone || o.user?.phone || '';
      const restaurant = o.restaurant?.name || '';
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        query === '' ||
        id.toLowerCase().includes(query) ||
        customer.toLowerCase().includes(query) ||
        restaurant.toLowerCase().includes(query);

      const sector = o.businessSector || o.sector;
      const matchesSector = selectedSector === 'ALL' || sector === selectedSector;
      const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [orders, searchQuery, selectedSector, selectedStatus]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        q === '' ||
        d.orderId?.toLowerCase().includes(q) ||
        d.disputeReason?.toLowerCase().includes(q) ||
        String(d.id) === q
      );
    });
  }, [disputes, searchQuery]);

  // Metric summaries
  const liveCount = orders.filter((o) =>
    ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'CANCEL_REQUESTED').length;

  // ============================================================================
  // Order Stepper Helper
  // ============================================================================

  const renderStatusStepper = (status: OrderStatus) => {
    const isCancelled = status === 'CANCELLED' || status === 'CANCEL_REQUESTED';

    const steps = [
      { key: 'PLACED', label: 'Placed', icon: ShoppingBag },
      { key: 'ACCEPTED', label: 'Accepted', icon: Store },
      { key: 'PREPARING', label: 'In Kitchen', icon: ChefHat },
      { key: 'READY_FOR_PICKUP', label: 'Ready', icon: PackageCheck },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Bike },
      { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
    ];

    const statusWeights: Record<string, number> = {
      PLACED: 0,
      ACCEPTED: 1,
      PREPARING: 2,
      READY_FOR_PICKUP: 3,
      OUT_FOR_DELIVERY: 4,
      DELIVERED: 5,
    };

    const currentWeight = statusWeights[status] ?? 0;

    if (isCancelled) {
      return (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <XCircle size={22} color="var(--danger)" />
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--danger-text)' }}>
              Order {status === 'CANCEL_REQUESTED' ? 'Cancellation Requested' : 'Cancelled'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '2px' }}>
              {selectedOrder?.cancelReason || 'Order was terminated prior to delivery fulfillment.'}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '16px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {steps.map((step, idx) => {
            const isCompleted = currentWeight > idx;
            const isCurrent = currentWeight === idx;
            const IconComponent = step.icon;

            return (
              <div
                key={step.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 2,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? 'var(--success)'
                      : isCurrent
                      ? 'var(--brand-primary)'
                      : 'var(--bg-surface-muted)',
                    color: isCompleted || isCurrent ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${
                      isCompleted
                        ? 'var(--success)'
                        : isCurrent
                        ? 'var(--brand-primary)'
                        : 'var(--border-light)'
                    }`,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(255, 82, 0, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <IconComponent size={16} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent
                      ? 'var(--brand-primary)'
                      : isCompleted
                      ? 'var(--success-text)'
                      : 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================================
  // Table Columns
  // ============================================================================

  const orderColumns: Column<Order>[] = [
    {
      key: 'orderId',
      header: 'Order Reference',
      width: '140px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-900)' }}>
          {item.orderId || item.id || '--'}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (item) => {
        const u = item.customer || item.user;
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: '13px' }}>
              {u?.name || 'Customer'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>{u?.phone || u?.email || '--'}</div>
          </div>
        );
      },
    },
    {
      key: 'restaurant',
      header: 'Merchant & Sector',
      render: (item) => {
        const sector = item.businessSector || item.sector || 'FOOD';
        const sectorColors: Record<string, string> = {
          FOOD: 'var(--brand-primary)',
          GROCERY: 'var(--success)',
          PHARMACY: '#0284c7',
          MEAT_FISH: '#e11d48',
          PET_SUPPLIES: '#8b5cf6',
        };
        return (
          <div>
            <div style={{ color: 'var(--slate-900)', fontWeight: 600, fontSize: '13px' }}>
              {item.restaurant?.name || 'Store'}
            </div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '10.5px',
                fontWeight: 700,
                color: sectorColors[sector] || '#64748b',
                marginTop: '2px',
              }}
            >
              {sector}
            </span>
          </div>
        );
      },
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      width: '110px',
      render: (item) => (
        <span style={{ fontWeight: 800, color: 'var(--slate-900)', fontSize: '13.5px' }}>
          ₹{(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Rail',
      width: '130px',
      render: (item) => {
        const variant =
          item.paymentStatus === 'SUCCESS' || (item.paymentStatus as string) === 'PAID'
            ? ('success' as const)
            : item.paymentStatus === 'FAILED'
            ? ('danger' as const)
            : ('warning' as const);
        return (
          <div>
            <Badge variant={variant} size="sm">
              {item.paymentStatus}
            </Badge>
            <div style={{ fontSize: '10.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
              {item.paymentMethod || 'ONLINE'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Dispatch State',
      width: '140px',
      render: (item) => {
        const isLive = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(item.status);
        const isDelivered = item.status === 'DELIVERED';
        const isCancelled = item.status === 'CANCELLED' || item.status === 'CANCEL_REQUESTED';

        const variant = isDelivered ? 'success' : isCancelled ? 'danger' : isLive ? 'brand' : 'neutral';

        return (
          <Badge variant={variant as 'success' | 'danger' | 'brand' | 'neutral'} withDot size="sm">
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created At',
      width: '130px',
      render: (item) => (
        <span style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye size={12} />}
          onClick={() => {
            setSelectedOrder(item);
            setDetailModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const disputeColumns: Column<OrderDispute>[] = [
    {
      key: 'id',
      header: 'Dispute ID',
      width: '100px',
      render: (item) => <span className="font-mono font-bold">#{item.id}</span>,
    },
    {
      key: 'orderId',
      header: 'Order Reference',
      render: (item) => <span className="font-mono font-semibold">{item.orderId}</span>,
    },
    {
      key: 'disputeReason',
      header: 'Dispute Reason / Claim',
      render: (item) => <div style={{ fontSize: '12.5px', color: 'var(--slate-800)' }}>{item.disputeReason}</div>,
    },
    {
      key: 'requestedRefundAmount',
      header: 'Refund Claimed',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--danger-text)' }}>
          ₹{(item.requestedRefundAmount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'RESOLVED' ? 'success' : 'danger'} size="sm" withDot>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <PageHeader
        title="Live Orders & Dispatch Monitor"
        subtitle="End-to-end multi-sector order orchestration, fulfillment stepper, payment verification, and disputes."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Live Orders' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                backgroundColor: autoRefresh ? 'rgba(255, 82, 0, 0.08)' : 'var(--bg-surface)',
                border: `1px solid ${autoRefresh ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                padding: '5px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>15s Auto-Refresh</span>
            </label>

            {lastSynced && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Synced: {lastSynced.toLocaleTimeString()}
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadOrders}
              disabled={isLoading}
            >
              Refresh Stream
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="dashboard-grid">
        <StatCard
          title="Orders In Active Flow"
          value={liveCount}
          icon={ShoppingBag}
          iconColor="var(--brand-primary)"
          badge="Kitchen / Transit"
        />
        <StatCard
          title="Delivered Orders"
          value={deliveredCount}
          icon={CheckCircle2}
          iconColor="var(--success)"
          badge="Fulfilled"
        />
        <StatCard
          title="Cancelled / Failed"
          value={cancelledCount}
          icon={XCircle}
          iconColor="var(--danger)"
          badge="Exceptions"
        />
        <StatCard
          title="Open Customer Disputes"
          value={disputes.length}
          icon={AlertTriangle}
          iconColor="var(--warning)"
          badge="Arbitration"
        />
      </div>

      {/* Queue Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '0 16px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'live', label: 'Live Dispatch Stream', count: liveCount },
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'cancelled', label: 'Cancelled Orders', count: cancelledCount },
            { id: 'failed', label: 'Payment Failures', count: 0 },
            { id: 'disputes', label: 'Dispute Arbitration Queue', count: disputes.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OrderQueueTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 16px',
                border: 'none',
                background: 'none',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: activeTab === tab.id ? 'rgba(255, 82, 0, 0.12)' : 'var(--bg-surface-muted)',
                    color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search by Order ID, customer, store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px 0 34px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {activeTab !== 'disputes' && (
              <>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Sectors</option>
                  <option value="FOOD">Food Delivery</option>
                  <option value="GROCERY">Instamart Grocery</option>
                  <option value="PHARMACY">24/7 Pharmacy</option>
                  <option value="MEAT_FISH">Meat & Seafood</option>
                  <option value="PET_SUPPLIES">Pet Supplies</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Dispatch Statuses</option>
                  <option value="PLACED">Placed</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </>
            )}
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {activeTab === 'disputes' ? filteredDisputes.length : filteredOrders.length}
            </strong>{' '}
            orders
          </span>
        </div>

        {/* Orders Table */}
        {error ? (
          <div style={{ padding: '36px' }}>
            <EmptyState
              title="Failed to Load Orders"
              description={error}
              action={
                <Button variant="primary" size="sm" onClick={loadOrders}>
                  Retry Stream
                </Button>
              }
            />
          </div>
        ) : activeTab === 'disputes' ? (
          <DataTable<OrderDispute>
            columns={disputeColumns}
            data={filteredDisputes}
            keyExtractor={(item) => String(item.id)}
            emptyTitle="No Open Disputes"
            emptyDescription="All customer refund and dispute claims are resolved."
          />
        ) : (
          <DataTable<Order>
            columns={orderColumns}
            data={filteredOrders}
            keyExtractor={(item) => item.orderId || item.id || String(Math.random())}
            emptyTitle="No Orders in Queue"
            emptyDescription={
              searchQuery
                ? `No orders matching "${searchQuery}".`
                : 'No orders found matching the selected filter criteria.'
            }
          />
        )}
      </div>

      {/* ======================================================================== */}
      {/* 360° Order Details & Stepper Inspection Modal                            */}
      {/* ======================================================================== */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderId || selectedOrder?.id || ''}`}
        description="Real-time multi-sector order lifecycle, item inventory, and financial ledger."
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div>
              {selectedOrder && (
                <Badge
                  variant={
                    selectedOrder.status === 'DELIVERED'
                      ? 'success'
                      : selectedOrder.status === 'CANCELLED'
                      ? 'danger'
                      : 'brand'
                  }
                  withDot
                >
                  {selectedOrder.status}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Visual Status Stepper */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Fulfillment Stepper
              </div>
              {renderStatusStepper(selectedOrder.status)}
            </div>

            {/* Customer & Merchant Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Customer Card */}
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <User size={15} color="var(--brand-primary)" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Customer Information</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-800)' }}>
                  {selectedOrder.customer?.name || selectedOrder.user?.name || 'Customer'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                  {selectedOrder.customer?.phone || selectedOrder.user?.phone || 'No phone'}
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--slate-600)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px',
                    marginTop: '8px',
                  }}
                >
                  <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{selectedOrder.deliveryAddress || 'Address on file'}</span>
                </div>
              </div>

              {/* Merchant Card */}
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Store size={15} color="var(--success)" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Fulfillment Merchant</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-800)' }}>
                  {selectedOrder.restaurant?.name || 'Partner Merchant'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Sector: <strong>{selectedOrder.businessSector || selectedOrder.sector || 'FOOD'}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '8px' }}>
                  {selectedOrder.restaurant?.address ? `${selectedOrder.restaurant.address}, ` : ''}
                  {selectedOrder.restaurant?.city || ''}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--slate-800)' }}>
                Ordered Inventory Items
              </h4>
              <div
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Item Description</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, width: '80px' }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, width: '100px' }}>Rate</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, width: '110px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.orderItems || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.dishName}</div>
                          {item.selectedVariant && (
                            <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                              Variant: {item.selectedVariant}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                          {item.quantity}x
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--slate-600)' }}>
                          ₹{((item.pricePerUnit || item.unitPrice || 0)).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--slate-900)' }}>
                          ₹{(item.totalPrice || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {(!selectedOrder.orderItems || selectedOrder.orderItems.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No line items registered on this order record.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary Breakdown */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-600)' }}>
                <span>Item Subtotal:</span>
                <span>₹{(selectedOrder.itemTotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-600)' }}>
                <span>Delivery & Courier Fee:</span>
                <span>₹{(selectedOrder.deliveryFee || 0).toFixed(2)}</span>
              </div>
              {selectedOrder.packagingFee != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-600)' }}>
                  <span>Packaging Charges:</span>
                  <span>₹{selectedOrder.packagingFee.toFixed(2)}</span>
                </div>
              )}
              {selectedOrder.surgeFee != null && selectedOrder.surgeFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-primary)' }}>
                  <span>Dynamic Rain / Night Surge:</span>
                  <span>+₹{selectedOrder.surgeFee.toFixed(2)}</span>
                </div>
              )}
              {selectedOrder.discount != null && selectedOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-text)' }}>
                  <span>Platform Promo Discount:</span>
                  <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '8px',
                  fontWeight: 800,
                  fontSize: '14.5px',
                  color: 'var(--slate-900)',
                }}
              >
                <span>Grand Total Settled:</span>
                <span>₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Rx Prescription (Pharmacy Sector verification) */}
            {(selectedOrder.businessSector === 'PHARMACY' || selectedOrder.sector === 'PHARMACY') && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>
                  24/7 Pharmacy Sector: Prescription Verification
                </div>
                {selectedOrder.prescriptionImageUrl || selectedOrder.rxPrescriptionUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Prescription Document:</span>
                    <a
                      href={selectedOrder.prescriptionImageUrl || selectedOrder.rxPrescriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      Inspect Medical Rx File
                    </a>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Over-the-counter medication (no prescription required).</span>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
