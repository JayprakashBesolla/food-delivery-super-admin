'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Store,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  Ban,
  RotateCcw,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Percent,
  Star,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Restaurant,
  RestaurantStatus,
  BusinessSector,
  RestaurantDetailSuperAdminDTO,
  MerchantKycRecord,
  fetchRestaurants,
  fetchRestaurantApplications,
  fetchActiveRestaurants,
  fetchSuspendedRestaurants,
  fetchRestaurantDetails,
  fetchRestaurantDocuments,
  approveRestaurant,
  rejectRestaurant,
  suspendRestaurant,
  unsuspendRestaurant,
  fetchPendingKyc,
  reviewKyc,
  ApiError,
} from '@/lib/api';

type TabType = 'all' | 'active' | 'applications' | 'suspended' | 'kyc';

export default function RestaurantsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [kycRecords, setKycRecords] = useState<MerchantKycRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // Mutation feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 360 Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<RestaurantDetailSuperAdminDTO | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action Modals state (Approve, Reject, Suspend, Unsuspend)
  const [actionTarget, setActionTarget] = useState<Restaurant | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'unsuspend' | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  // KYC Decision Modal state
  const [selectedKyc, setSelectedKyc] = useState<MerchantKycRecord | null>(null);
  const [kycDecisionType, setKycDecisionType] = useState<'approve' | 'reject' | null>(null);
  const [kycReasonInput, setKycReasonInput] = useState('');

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);
    try {
      if (activeTab === 'kyc') {
        const kycData = await fetchPendingKyc();
        setKycRecords(kycData || []);
      } else if (activeTab === 'applications') {
        const resData = await fetchRestaurantApplications();
        setRestaurants(resData || []);
      } else if (activeTab === 'active') {
        const resData = await fetchActiveRestaurants();
        setRestaurants(resData || []);
      } else if (activeTab === 'suspended') {
        const resData = await fetchSuspendedRestaurants();
        setRestaurants(resData || []);
      } else {
        const resData = await fetchRestaurants();
        setRestaurants(resData || []);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load merchant data from server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // ============================================================================
  // Inspections
  // ============================================================================

  const handleOpen360Details = async (restaurant: Restaurant) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setSelectedDetail(null);
    setSelectedDocs(null);
    try {
      const [details, docs] = await Promise.all([
        fetchRestaurantDetails(restaurant.id),
        fetchRestaurantDocuments(restaurant.id).catch(() => null),
      ]);
      setSelectedDetail(details);
      setSelectedDocs(docs);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch restaurant 360 details';
      setActionError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleExecuteRestaurantAction = async () => {
    if (!actionTarget || !actionType) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (actionType === 'approve') {
        await approveRestaurant(actionTarget.id);
        setActionSuccess(`Merchant "${actionTarget.name}" has been APPROVED and activated.`);
      } else if (actionType === 'reject') {
        if (!reasonInput.trim()) {
          setActionError('A rejection reason is required.');
          setIsSubmitting(false);
          return;
        }
        await rejectRestaurant(actionTarget.id, reasonInput.trim());
        setActionSuccess(`Merchant "${actionTarget.name}" application was rejected.`);
      } else if (actionType === 'suspend') {
        if (!reasonInput.trim()) {
          setActionError('A suspension reason is required.');
          setIsSubmitting(false);
          return;
        }
        await suspendRestaurant(actionTarget.id, reasonInput.trim());
        setActionSuccess(`Merchant "${actionTarget.name}" has been SUSPENDED.`);
      } else if (actionType === 'unsuspend') {
        await unsuspendRestaurant(actionTarget.id);
        setActionSuccess(`Merchant "${actionTarget.name}" has been unsuspended and restored to ACTIVE.`);
      }

      setActionTarget(null);
      setActionType(null);
      setReasonInput('');
      setDetailModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Action failed to execute.';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteKycDecision = async () => {
    if (!selectedKyc || !kycDecisionType) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const isApproved = kycDecisionType === 'approve';
      if (!isApproved && !kycReasonInput.trim()) {
        setActionError('Please provide a mandatory rejection reason for KYC compliance records.');
        setIsSubmitting(false);
        return;
      }

      await reviewKyc(selectedKyc.id, isApproved, kycReasonInput.trim());
      setActionSuccess(
        isApproved
          ? `KYC for ${selectedKyc.businessName || selectedKyc.restaurant?.name || 'merchant'} APPROVED. Store automatically activated!`
          : `KYC for ${selectedKyc.businessName || selectedKyc.restaurant?.name || 'merchant'} REJECTED.`
      );

      setSelectedKyc(null);
      setKycDecisionType(null);
      setKycReasonInput('');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to submit KYC decision.';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Filtering & Metrics Calculations
  // ============================================================================

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone?.includes(searchQuery) ||
        String(r.id) === searchQuery.trim();

      const matchesSector = selectedSector === 'ALL' || r.businessSector === selectedSector;
      return matchesSearch && matchesSector;
    });
  }, [restaurants, searchQuery, selectedSector]);

  const filteredKyc = useMemo(() => {
    return kycRecords.filter((k) => {
      const name = k.businessName || k.restaurant?.name || '';
      const gstin = k.gstin || '';
      const pan = k.panNumber || '';
      const fssai = k.fssaiLicense || '';
      const query = searchQuery.toLowerCase();

      return (
        searchQuery === '' ||
        name.toLowerCase().includes(query) ||
        gstin.toLowerCase().includes(query) ||
        pan.toLowerCase().includes(query) ||
        fssai.toLowerCase().includes(query)
      );
    });
  }, [kycRecords, searchQuery]);

  // Overall metric counts (from all loaded or derived)
  const totalCount = restaurants.length;
  const activeCount = restaurants.filter((r) => r.status === 'ACTIVE').length;
  const pendingCount = restaurants.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const suspendedCount = restaurants.filter((r) => r.status === 'SUSPENDED').length;

  // ============================================================================
  // Table Columns
  // ============================================================================

  const restaurantColumns: Column<Restaurant>[] = [
    {
      key: 'id',
      header: 'Store ID',
      width: '95px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700 }}>#{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Store Name & City',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13.5px' }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <MapPin size={11} /> {item.city || 'National'} {item.area ? `• ${item.area}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'businessSector',
      header: 'Sector',
      width: '130px',
      render: (item) => {
        const sectorColors: Record<BusinessSector, string> = {
          FOOD: 'var(--brand-primary)',
          GROCERY: 'var(--success)',
          PHARMACY: '#0284c7',
          MEAT_FISH: '#e11d48',
          PET_SUPPLIES: '#8b5cf6',
        };
        return (
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: `${sectorColors[item.businessSector] || '#64748b'}15`,
              color: sectorColors[item.businessSector] || '#64748b',
              border: `1px solid ${sectorColors[item.businessSector] || '#64748b'}30`,
            }}
          >
            {item.businessSector}
          </span>
        );
      },
    },
    {
      key: 'email',
      header: 'Merchant Contact',
      render: (item) => (
        <div style={{ fontSize: '12.5px' }}>
          <div style={{ color: 'var(--slate-800)', fontWeight: 500 }}>{item.email}</div>
          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>{item.phone || '--'}</div>
        </div>
      ),
    },
    {
      key: 'commissionRate',
      header: 'Take Rate',
      width: '100px',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '13px' }}>
          {item.commissionRate != null ? `${item.commissionRate}%` : '15%'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (item) => {
        const variantMap: Record<RestaurantStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
          ACTIVE: 'success',
          PENDING_APPROVAL: 'warning',
          SUSPENDED: 'danger',
          REJECTED: 'neutral',
        };
        return (
          <Badge variant={variantMap[item.status] || 'neutral'} withDot size="sm">
            {item.status === 'PENDING_APPROVAL' ? 'PENDING' : item.status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '170px',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye size={12} />}
            onClick={() => handleOpen360Details(item)}
            title="Inspect 360 Details"
          >
            View
          </Button>

          {item.status === 'PENDING_APPROVAL' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActionTarget(item);
                  setActionType('approve');
                }}
                title="Approve Merchant"
                style={{ backgroundColor: 'var(--success)', padding: '5px 8px' }}
              >
                <Check size={13} />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setActionTarget(item);
                  setActionType('reject');
                }}
                title="Reject Merchant"
                style={{ padding: '5px 8px' }}
              >
                <XCircle size={13} />
              </Button>
            </>
          )}

          {item.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionTarget(item);
                setActionType('suspend');
              }}
              title="Suspend Store"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
            >
              <Ban size={12} />
            </Button>
          )}

          {item.status === 'SUSPENDED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionTarget(item);
                setActionType('unsuspend');
              }}
              title="Unsuspend Store"
              style={{ color: 'var(--success)', borderColor: 'var(--success-border)' }}
            >
              <RotateCcw size={12} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const kycColumns: Column<MerchantKycRecord>[] = [
    {
      key: 'id',
      header: 'KYC ID',
      width: '80px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700 }}>#{item.id}</span>,
    },
    {
      key: 'businessName',
      header: 'Business & Store Name',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13.5px' }}>
            {item.businessName || item.restaurant?.name || 'Unnamed Partner'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
            Store Ref: #{item.restaurant?.id || item.restaurantId || '--'}
          </div>
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'Tax Identifiers',
      render: (item) => (
        <div style={{ fontSize: '12px' }}>
          <div><span style={{ color: 'var(--slate-500)' }}>GSTIN:</span> <span className="font-mono font-semibold">{item.gstin || item.restaurant?.gstin || '--'}</span></div>
          <div><span style={{ color: 'var(--slate-500)' }}>PAN:</span> <span className="font-mono font-semibold">{item.panNumber || item.restaurant?.panNumber || '--'}</span></div>
        </div>
      ),
    },
    {
      key: 'fssaiLicense',
      header: 'Licenses & Regulatory',
      render: (item) => (
        <div style={{ fontSize: '12px' }}>
          <div><span style={{ color: 'var(--slate-500)' }}>FSSAI:</span> <span className="font-mono font-semibold">{item.fssaiLicense || item.restaurant?.fssaiNumber || '--'}</span></div>
          <div><span style={{ color: 'var(--slate-500)' }}>IFSC:</span> <span className="font-mono font-semibold">{item.bankIfsc || item.restaurant?.bankIfscCode || '--'}</span></div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'KYC State',
      width: '120px',
      render: (item) => (
        <Badge variant={item.status === 'VERIFIED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'} size="sm" withDot>
          {item.status || 'PENDING'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Verification Decision',
      width: '180px',
      render: (item) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedKyc(item);
              setKycDecisionType('approve');
            }}
            style={{ backgroundColor: 'var(--success)' }}
            leftIcon={<Check size={12} />}
          >
            Verify
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setSelectedKyc(item);
              setKycDecisionType('reject');
            }}
            leftIcon={<XCircle size={12} />}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <PageHeader
        title="Merchant & Dark Store Lifecycle"
        subtitle="360° merchant governance, automated KYC verification, onboarding pipelines, and compliance."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Restaurants' }]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {actionSuccess && (
        <div
          className="admin-card"
          style={{
            backgroundColor: 'var(--success-bg)',
            borderColor: 'var(--success-border)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--success-text)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          className="admin-card"
          style={{
            backgroundColor: 'var(--danger-bg)',
            borderColor: 'var(--danger-border)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--danger-text)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="dashboard-grid">
        <StatCard
          title="Total Registered Merchants"
          value={totalCount}
          icon={Store}
          iconColor="var(--brand-primary)"
          badge="Platform Database"
        />
        <StatCard
          title="Active & Operating Stores"
          value={activeCount}
          icon={CheckCircle}
          iconColor="var(--success)"
          badge="Accepting Orders"
        />
        <StatCard
          title="Pending Applications"
          value={pendingCount}
          icon={Clock}
          iconColor="var(--warning)"
          badge="Awaiting Approval"
        />
        <StatCard
          title="Suspended Stores"
          value={suspendedCount}
          icon={AlertTriangle}
          iconColor="var(--danger)"
          badge="Policy Enforced"
        />
      </div>

      {/* Filter and Tab Section */}
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
            { id: 'all', label: 'All Stores', count: totalCount },
            { id: 'active', label: 'Active Stores', count: activeCount },
            { id: 'applications', label: 'Applications Queue', count: pendingCount },
            { id: 'suspended', label: 'Suspended Stores', count: suspendedCount },
            { id: 'kyc', label: 'KYC Document Verification', count: kycRecords.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
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
            </button>
          ))}
        </div>

        {/* Search & Sector Filter Bar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
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
                placeholder={activeTab === 'kyc' ? 'Search by business, GSTIN, PAN...' : 'Search store name, city, email...'}
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

            {activeTab !== 'kyc' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} color="var(--text-muted)" />
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
              </div>
            )}
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {activeTab === 'kyc' ? filteredKyc.length : filteredRestaurants.length}
            </strong>{' '}
            records
          </span>
        </div>

        {/* Data Table */}
        {error ? (
          <div style={{ padding: '36px' }}>
            <EmptyState
              title="Connection Error"
              description={error}
              action={
                <Button variant="primary" size="sm" onClick={loadData}>
                  Retry Request
                </Button>
              }
            />
          </div>
        ) : activeTab === 'kyc' ? (
          <DataTable<MerchantKycRecord>
            columns={kycColumns}
            data={filteredKyc}
            keyExtractor={(item) => String(item.id)}
            emptyTitle="No Pending KYC Submissions"
            emptyDescription="All merchant tax and regulatory documents have been reviewed."
          />
        ) : (
          <DataTable<Restaurant>
            columns={restaurantColumns}
            data={filteredRestaurants}
            keyExtractor={(item) => String(item.id)}
            emptyTitle="No Merchant Records Found"
            emptyDescription={
              searchQuery
                ? `No stores matching "${searchQuery}" in this view.`
                : 'No merchants found under this lifecycle category.'
            }
          />
        )}
      </div>

      {/* ======================================================================== */}
      {/* 360° Restaurant Detail Inspection Modal                                  */}
      {/* ======================================================================== */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedDetail ? selectedDetail.name : 'Store 360° Profile'}
        description="Comprehensive operational, regulatory, and financial profile of the merchant partner."
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div>
              {selectedDetail && (
                <Badge
                  variant={
                    selectedDetail.status === 'ACTIVE'
                      ? 'success'
                      : selectedDetail.status === 'PENDING_APPROVAL'
                      ? 'warning'
                      : 'danger'
                  }
                  withDot
                >
                  {selectedDetail.status}
                </Badge>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
              {selectedDetail?.status === 'PENDING_APPROVAL' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ backgroundColor: 'var(--success)' }}
                    onClick={() => {
                      setActionTarget(selectedDetail as unknown as Restaurant);
                      setActionType('approve');
                    }}
                  >
                    Approve Store
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setActionTarget(selectedDetail as unknown as Restaurant);
                      setActionType('reject');
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selectedDetail?.status === 'ACTIVE' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setActionTarget(selectedDetail as unknown as Restaurant);
                    setActionType('suspend');
                  }}
                >
                  Suspend Store
                </Button>
              )}
              {selectedDetail?.status === 'SUSPENDED' && (
                <Button
                  variant="primary"
                  size="sm"
                  style={{ backgroundColor: 'var(--success)' }}
                  onClick={() => {
                    setActionTarget(selectedDetail as unknown as Restaurant);
                    setActionType('unsuspend');
                  }}
                >
                  Unsuspend Store
                </Button>
              )}
            </div>
          </div>
        }
      >
        {detailLoading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading merchant profile and regulatory documents...</p>
          </div>
        ) : selectedDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Grid: Store Overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                padding: '14px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Business Sector
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedDetail.businessSector}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Negotiated Take Rate
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>
                  {selectedDetail.commissionRate}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Customer Rating
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#eab308',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '2px',
                  }}
                >
                  <Star size={13} fill="#eab308" />
                  <span>{selectedDetail.avgRating ? selectedDetail.avgRating.toFixed(1) : 'New'}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Lifetime Orders
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedDetail.totalOrders} Completed
                </div>
              </div>
            </div>

            {/* Contact & Location */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--slate-800)' }}>
                Contact & Physical Location
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-700)' }}>
                  <Mail size={14} color="var(--slate-400)" /> {selectedDetail.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-700)' }}>
                  <Phone size={14} color="var(--slate-400)" /> {selectedDetail.phone || 'No phone registered'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-700)', gridColumn: '1 / -1' }}>
                  <MapPin size={14} color="var(--slate-400)" /> {selectedDetail.address || 'Address unlisted'}, {selectedDetail.city}
                </div>
              </div>
            </div>

            {/* Compliance & Tax Identifiers */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--slate-800)' }}>
                Regulatory Compliance & Payout Banking
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  fontSize: '12.5px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>FSSAI License:</span>
                  <strong className="font-mono">{selectedDetail.fssaiNumber || 'Pending'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>GSTIN:</span>
                  <strong className="font-mono">{selectedDetail.gstin || 'Not Provided'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>PAN:</span>
                  <strong className="font-mono">{selectedDetail.panNumber || 'Not Provided'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Bank Account:</span>
                  <strong className="font-mono">{selectedDetail.bankAccountNumber ? `••••${selectedDetail.bankAccountNumber.slice(-4)}` : 'Unconfigured'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>IFSC Code:</span>
                  <strong className="font-mono">{selectedDetail.bankIfscCode || 'None'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Stripe Connect:</span>
                  <strong className="font-mono">{selectedDetail.stripeAccountId || 'Manual Rail'}</strong>
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            {selectedDocs && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--slate-800)' }}>
                  Merchant Regulatory Documents
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['fssaiNumber', 'gstin', 'drugLicenseNumber', 'panNumber'].map((key) => {
                    const val = selectedDocs[key];
                    return (
                      <div
                        key={key}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: val ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-muted)',
                          border: `1px solid ${val ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-light)'}`,
                          fontSize: '11.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <FileText size={13} color={val ? 'var(--success)' : 'var(--text-muted)'} />
                        <span style={{ fontWeight: 600 }}>{key}:</span>
                        <span className="font-mono">{String(val || 'Unverified')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ======================================================================== */}
      {/* Action Confirmation Modal (Approve, Reject, Suspend, Unsuspend)           */}
      {/* ======================================================================== */}
      <Modal
        isOpen={Boolean(actionTarget && actionType)}
        onClose={() => {
          setActionTarget(null);
          setActionType(null);
          setReasonInput('');
        }}
        title={
          actionType === 'approve'
            ? 'Approve Merchant Application'
            : actionType === 'reject'
            ? 'Reject Merchant Application'
            : actionType === 'suspend'
            ? 'Suspend Merchant Operations'
            : 'Unsuspend Merchant'
        }
        description={`Target store: ${actionTarget?.name} (#${actionTarget?.id})`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionTarget(null);
                setActionType(null);
                setReasonInput('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' || actionType === 'unsuspend' ? 'primary' : 'danger'}
              size="sm"
              onClick={handleExecuteRestaurantAction}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Confirm {actionType?.toUpperCase()}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--slate-600)', margin: 0 }}>
            {actionType === 'approve' && 'Approving will grant active operational status and enable order intake for this merchant.'}
            {actionType === 'reject' && 'Rejecting will decline this onboarding application. A mandatory notification reason must be supplied.'}
            {actionType === 'suspend' && 'Suspending immediately halts all customer order routing and flags the store across all sectors.'}
            {actionType === 'unsuspend' && 'Unsuspending restores the store to active marketplace listing.'}
          </p>

          {(actionType === 'reject' || actionType === 'suspend') && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Mandatory Reason / Notes
              </label>
              <textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Enter justification for policy enforcement or rejection..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ======================================================================== */}
      {/* KYC Decision Modal                                                       */}
      {/* ======================================================================== */}
      <Modal
        isOpen={Boolean(selectedKyc && kycDecisionType)}
        onClose={() => {
          setSelectedKyc(null);
          setKycDecisionType(null);
          setKycReasonInput('');
        }}
        title={kycDecisionType === 'approve' ? 'Verify & Approve Merchant KYC' : 'Reject Merchant KYC'}
        description={`Merchant: ${selectedKyc?.businessName || selectedKyc?.restaurant?.name || 'Partner'}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedKyc(null);
                setKycDecisionType(null);
                setKycReasonInput('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={kycDecisionType === 'approve' ? 'primary' : 'danger'}
              size="sm"
              onClick={handleExecuteKycDecision}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Confirm {kycDecisionType === 'approve' ? 'Verification & Activate' : 'Rejection'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--slate-600)', margin: 0 }}>
            {kycDecisionType === 'approve'
              ? 'Approving KYC automatically marks this restaurant ACTIVE on the backend platform.'
              : 'Rejecting KYC will record compliance failure. A reason must be recorded.'}
          </p>

          {kycDecisionType === 'reject' && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Rejection Reason
              </label>
              <textarea
                value={kycReasonInput}
                onChange={(e) => setKycReasonInput(e.target.value)}
                placeholder="e.g. Unverified FSSAI license or invalid GSTIN format on tax portal."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
