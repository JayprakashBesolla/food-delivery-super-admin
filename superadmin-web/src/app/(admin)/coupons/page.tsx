'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Trash2,
  Power,
  Calendar,
  Layers,
  Percent,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Coupon,
  CreateCouponPayload,
  fetchAllCoupons,
  fetchPlatformCoupons,
  fetchRestaurantCoupons,
  fetchCampaignCoupons,
  createPlatformCoupon,
  toggleCouponStatus,
  updateCoupon,
  deleteCoupon,
  ApiError,
} from '@/lib/api';

type CouponFilterTab = 'all' | 'platform' | 'restaurant' | 'campaign';

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState<CouponFilterTab>('all');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCouponPayload>({
    code: '',
    title: '',
    description: '',
    discountPercentage: 20,
    flatDiscountAmount: undefined,
    maxDiscountAmount: 100,
    minOrderAmount: 249,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimitPerUser: 2,
    totalUsageLimit: 1000,
  });
  const [discountKind, setDiscountKind] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Edit Modal
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Coupon>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // View Modal
  const [viewCoupon, setViewCoupon] = useState<Coupon | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Action Confirmation (Delete/Toggle)
  const [actionTarget, setActionTarget] = useState<Coupon | null>(null);
  const [actionType, setActionType] = useState<'TOGGLE' | 'DELETE' | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Coupon[];
      if (activeTab === 'platform') {
        data = await fetchPlatformCoupons();
      } else if (activeTab === 'restaurant') {
        data = await fetchRestaurantCoupons();
      } else if (activeTab === 'campaign') {
        data = await fetchCampaignCoupons();
      } else {
        data = await fetchAllCoupons().catch(() => fetchPlatformCoupons());
      }
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load promotional coupons';
      setError(msg);
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Aggregate Stats
  const totalCount = coupons.length;
  const activeCount = coupons.filter((c) => c.active !== false).length;
  const platformWideCount = coupons.filter((c) => !c.restaurantId).length;
  const avgDiscount =
    coupons.length > 0
      ? (
          coupons.reduce((sum, c) => sum + (Number(c.discountPercentage) || 0), 0) /
          (coupons.filter((c) => (c.discountPercentage || 0) > 0).length || 1)
        ).toFixed(0)
      : '0';

  // Filter Logic
  const filteredCoupons = coupons.filter((c) => {
    // Status filter
    if (statusFilter === 'ACTIVE' && c.active === false) return false;
    if (statusFilter === 'INACTIVE' && c.active !== false) return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(term) ||
      (c.title && c.title.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      String(c.id).includes(term)
    );
  });

  // Handle Create Coupon
  const handleCreateCoupon = async () => {
    if (!createForm.code.trim()) {
      setCreateError('Promo code is required.');
      return;
    }

    const payload: CreateCouponPayload = {
      ...createForm,
      code: createForm.code.trim().toUpperCase(),
      discountPercentage: discountKind === 'PERCENTAGE' ? Number(createForm.discountPercentage) || 0 : undefined,
      flatDiscountAmount: discountKind === 'FLAT' ? Number(createForm.flatDiscountAmount) || 0 : undefined,
    };

    if (discountKind === 'PERCENTAGE') {
      const pct = Number(payload.discountPercentage);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        setCreateError('Discount percentage must be between 1% and 100%.');
        return;
      }
    } else {
      const flat = Number(payload.flatDiscountAmount);
      if (isNaN(flat) || flat <= 0) {
        setCreateError('Flat discount amount must be greater than ₹0.');
        return;
      }
    }

    setIsSubmittingCreate(true);
    setCreateError(null);
    try {
      const created = await createPlatformCoupon(payload);
      setCreateSuccess(`Coupon ${created.code} successfully published.`);
      setCoupons((prev) => [created, ...prev]);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(null);
        setCreateForm({
          code: '',
          title: '',
          description: '',
          discountPercentage: 20,
          flatDiscountAmount: undefined,
          maxDiscountAmount: 100,
          minOrderAmount: 249,
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          usageLimitPerUser: 2,
          totalUsageLimit: 1000,
        });
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to publish coupon code';
      setCreateError(msg);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setEditForm({
      title: coupon.title || '',
      description: coupon.description || '',
      discountPercentage: coupon.discountPercentage,
      flatDiscountAmount: coupon.flatDiscountAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      validUntil: coupon.validUntil,
      usageLimitPerUser: coupon.usageLimitPerUser,
      totalUsageLimit: coupon.totalUsageLimit,
    });
    setEditError(null);
    setEditSuccess(null);
    setIsEditModalOpen(true);
  };

  // Handle Update Coupon
  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return;
    setIsSubmittingEdit(true);
    setEditError(null);
    try {
      const updated = await updateCoupon(selectedCoupon.id, editForm);
      setEditSuccess(`Coupon ${updated.code} parameters updated.`);
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess(null);
      }, 1400);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update coupon';
      setEditError(msg);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Toggle or Delete Action
  const handleConfirmAction = async () => {
    if (!actionTarget || !actionType) return;
    setIsActionRunning(true);
    setActionError(null);
    try {
      if (actionType === 'TOGGLE') {
        const updated = await toggleCouponStatus(actionTarget.id);
        setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else if (actionType === 'DELETE') {
        await deleteCoupon(actionTarget.id);
        setCoupons((prev) => prev.filter((c) => c.id !== actionTarget.id));
      }
      setIsConfirmModalOpen(false);
      setActionTarget(null);
      setActionType(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed. Please try again.';
      setActionError(msg);
    } finally {
      setIsActionRunning(false);
    }
  };

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Promo Code',
      width: '140px',
      render: (item) => (
        <span
          className="font-mono"
          style={{
            fontSize: '12.5px',
            fontWeight: 800,
            color: item.active !== false ? 'var(--brand-primary)' : 'var(--slate-500)',
            backgroundColor: item.active !== false ? 'var(--brand-primary-light)' : 'var(--slate-100)',
            padding: '3px 8px',
            borderRadius: '4px',
            border: `1px dashed ${item.active !== false ? 'var(--brand-primary-border)' : 'var(--border-light)'}`,
          }}
        >
          {item.code}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Campaign & Benefit',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
            {item.title || item.code}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            {item.description || 'Platform discount voucher'}
          </div>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      align: 'right',
      render: (item) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13px' }}>
            {item.discountPercentage ? `${item.discountPercentage}% OFF` : formatCurrency(item.flatDiscountAmount)}
          </span>
          {item.maxDiscountAmount && (
            <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
              Max: {formatCurrency(item.maxDiscountAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'minOrderAmount',
      header: 'Min Basket',
      align: 'right',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--slate-700)' }}>
          {formatCurrency(item.minOrderAmount)}
        </span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatDate(item.validUntil || item.endDate)}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.active !== false ? 'success' : 'neutral'} withDot size="sm">
          {item.active !== false ? 'ACTIVE' : 'INACTIVE'}
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
              setViewCoupon(item);
              setIsViewModalOpen(true);
            }}
            title="Inspect Coupon"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
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
            <Eye size={14} />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            title="Edit Parameters"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
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
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => {
              setActionTarget(item);
              setActionType('TOGGLE');
              setActionError(null);
              setIsConfirmModalOpen(true);
            }}
            title={item.active !== false ? 'Deactivate' : 'Activate'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: item.active !== false ? 'var(--warning)' : 'var(--success)',
              transition: 'all 120ms ease',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--slate-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Power size={14} />
          </button>
          <button
            onClick={() => {
              setActionTarget(item);
              setActionType('DELETE');
              setActionError(null);
              setIsConfirmModalOpen(true);
            }}
            title="Delete Coupon"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--danger)',
              transition: 'all 120ms ease',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Promotions, Coupons & Discount Engine"
        subtitle="Manage platform-wide promo vouchers, restaurant merchant discounts, and marketing campaigns."
        breadcrumbs={[{ label: 'Marketing' }, { label: 'Coupons' }]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={loadCoupons}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setCreateError(null);
                setCreateSuccess(null);
                setIsCreateModalOpen(true);
              }}
            >
              Create Promo Code
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="dashboard-grid">
        <StatCard
          title="Total Promo Codes"
          value={String(totalCount)}
          icon={Tag}
          iconColor="var(--brand-primary)"
          badge="In Directory"
        />
        <StatCard
          title="Active Campaigns"
          value={String(activeCount)}
          icon={CheckCircle}
          iconColor="var(--success)"
          badge="Live in App"
        />
        <StatCard
          title="Platform-Wide Vouchers"
          value={String(platformWideCount)}
          icon={Layers}
          iconColor="var(--info)"
          badge="Universal Checkout"
        />
        <StatCard
          title="Average Discount"
          value={`${avgDiscount}%`}
          icon={Percent}
          iconColor="#8b5cf6"
          badge="Active Offers"
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
            { key: 'all' as const, label: `All Vouchers (${coupons.length})` },
            { key: 'platform' as const, label: 'Platform Universal' },
            { key: 'restaurant' as const, label: 'Merchant Funded' },
            { key: 'campaign' as const, label: 'Seasonal Campaigns' },
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

        {/* Filter & Search Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 12px',
              height: '36px',
              width: '320px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--slate-50)',
            }}
          >
            <Search size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search by code, title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '13px',
                color: 'var(--slate-800)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: statusFilter === st ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  backgroundColor: statusFilter === st ? 'var(--brand-primary-light)' : 'white',
                  color: statusFilter === st ? 'var(--brand-primary)' : 'var(--slate-600)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <DataTable<Coupon>
          columns={columns}
          data={filteredCoupons}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Promotional Coupons"
          emptyDescription="No voucher codes matching the selected filter criteria."
        />
      </div>

      {/* =================== CREATE COUPON MODAL =================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmittingCreate) setIsCreateModalOpen(false);
        }}
        title="Publish Platform Promo Code"
        description="Launch a new enterprise promotional voucher code valid across consumer checkouts."
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmittingCreate}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCoupon}
              isLoading={isSubmittingCreate}
              disabled={isSubmittingCreate || !!createSuccess}
            >
              Publish Coupon
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {createSuccess && (
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
              {createSuccess}
            </div>
          )}

          {createError && (
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
              {createError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Voucher Code *
              </label>
              <input
                suppressHydrationWarning
                type="text"
                placeholder="e.g. WELCOME50"
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Campaign Title
              </label>
              <input
                suppressHydrationWarning
                type="text"
                placeholder="e.g. 50% Off First Feast"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Benefit Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDiscountKind('PERCENTAGE')}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  border: discountKind === 'PERCENTAGE' ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  backgroundColor: discountKind === 'PERCENTAGE' ? 'var(--brand-primary-light)' : 'white',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                Percentage Discount (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountKind('FLAT')}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  border: discountKind === 'FLAT' ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  backgroundColor: discountKind === 'FLAT' ? 'var(--brand-primary-light)' : 'white',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                Flat Amount Off (₹)
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {discountKind === 'PERCENTAGE' ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Discount Percentage (%) *
                  </label>
                  <input
                    suppressHydrationWarning
                    type="number"
                    min="1"
                    max="100"
                    value={createForm.discountPercentage || ''}
                    onChange={(e) => setCreateForm({ ...createForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Max Discount Cap (₹)
                  </label>
                  <input
                    suppressHydrationWarning
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={createForm.maxDiscountAmount || ''}
                    onChange={(e) => setCreateForm({ ...createForm, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Flat Discount Amount (₹) *
                </label>
                <input
                  suppressHydrationWarning
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={createForm.flatDiscountAmount || ''}
                  onChange={(e) => setCreateForm({ ...createForm, flatDiscountAmount: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '13px',
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Min Order Amount (₹)
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="0"
                value={createForm.minOrderAmount || ''}
                onChange={(e) => setCreateForm({ ...createForm, minOrderAmount: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Expiry Date *
              </label>
              <input
                suppressHydrationWarning
                type="date"
                value={createForm.validUntil}
                onChange={(e) => setCreateForm({ ...createForm, validUntil: e.target.value })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Per-Customer Limit
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="1"
                value={createForm.usageLimitPerUser || ''}
                onChange={(e) => setCreateForm({ ...createForm, usageLimitPerUser: parseInt(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Total Campaign Limit
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="1"
                value={createForm.totalUsageLimit || ''}
                onChange={(e) => setCreateForm({ ...createForm, totalUsageLimit: parseInt(e.target.value) || 1000 })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* =================== EDIT COUPON MODAL =================== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmittingEdit) setIsEditModalOpen(false);
        }}
        title="Edit Promo Parameters"
        description={selectedCoupon ? `Updating ${selectedCoupon.code}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmittingEdit}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateCoupon}
              isLoading={isSubmittingEdit}
              disabled={isSubmittingEdit || !!editSuccess}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {editSuccess && (
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
              {editSuccess}
            </div>
          )}

          {editError && (
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
              {editError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Title
            </label>
            <input
              suppressHydrationWarning
              type="text"
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Discount Percentage (%)
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="0"
                max="100"
                value={editForm.discountPercentage || ''}
                onChange={(e) => setEditForm({ ...editForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Max Discount Cap (₹)
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="0"
                value={editForm.maxDiscountAmount || ''}
                onChange={(e) => setEditForm({ ...editForm, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Min Order Amount (₹)
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="0"
                value={editForm.minOrderAmount || ''}
                onChange={(e) => setEditForm({ ...editForm, minOrderAmount: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Expiry Date
              </label>
              <input
                suppressHydrationWarning
                type="date"
                value={editForm.validUntil || ''}
                onChange={(e) => setEditForm({ ...editForm, validUntil: e.target.value })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* =================== VIEW DETAILS MODAL =================== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Coupon Campaign Overview"
        description={viewCoupon ? `Voucher Code: ${viewCoupon.code}` : ''}
        size="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {viewCoupon && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Voucher Code</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--brand-primary)' }}>
                  {viewCoupon.code}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Status</span>
                <Badge variant={viewCoupon.active !== false ? 'success' : 'neutral'} withDot size="sm">
                  {viewCoupon.active !== false ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Benefit</span>
                <strong>
                  {viewCoupon.discountPercentage
                    ? `${viewCoupon.discountPercentage}% OFF`
                    : formatCurrency(viewCoupon.flatDiscountAmount)}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Max Discount Cap</span>
                <strong>{viewCoupon.maxDiscountAmount ? formatCurrency(viewCoupon.maxDiscountAmount) : 'No Cap'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Min Order Requirement</span>
                <strong>{formatCurrency(viewCoupon.minOrderAmount)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Valid Until</span>
                <strong>{formatDate(viewCoupon.validUntil || viewCoupon.endDate)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Per-Customer Limit</span>
                <strong>{viewCoupon.usageLimitPerUser ?? 2} redemptions</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Total Campaign Cap</span>
                <strong>{viewCoupon.totalUsageLimit ?? 1000} redemptions</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* =================== CONFIRM ACTION MODAL =================== */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          if (!isActionRunning) setIsConfirmModalOpen(false);
        }}
        title={actionType === 'DELETE' ? 'Delete Promotional Coupon' : 'Toggle Coupon Status'}
        description={actionTarget ? `Promo Code: ${actionTarget.code}` : ''}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isActionRunning}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'DELETE' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirmAction}
              isLoading={isActionRunning}
            >
              {actionType === 'DELETE'
                ? 'Confirm Delete'
                : actionTarget?.active !== false
                ? 'Deactivate'
                : 'Activate'}
            </Button>
          </div>
        }
      >
        <div style={{ fontSize: '13px', color: 'var(--slate-700)', lineHeight: '1.5' }}>
          {actionError && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--danger-surface)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                marginBottom: '12px',
              }}
            >
              {actionError}
            </div>
          )}
          {actionType === 'DELETE' ? (
            <p>
              Are you sure you want to delete coupon <strong>{actionTarget?.code}</strong>? This action cannot be undone.
            </p>
          ) : (
            <p>
              Are you sure you want to {actionTarget?.active !== false ? 'deactivate' : 'activate'} coupon{' '}
              <strong>{actionTarget?.code}</strong>?
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
