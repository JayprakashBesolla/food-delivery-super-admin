'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Percent,
  Settings,
  DollarSign,
  Truck,
  Building2,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Edit2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Restaurant,
  CommissionSplitDTO,
  fetchGlobalCommission,
  updateGlobalCommission,
  fetchDeliveryCommissionSplit,
  fetchRestaurants,
  updateRestaurantCommission,
  ApiError,
} from '@/lib/api';

export default function CommissionPage() {
  const [globalRate, setGlobalRate] = useState<number>(15.0);
  const [deliverySplit, setDeliverySplit] = useState<CommissionSplitDTO>({
    platformTakePercentage: 20.0,
    riderSharePercentage: 80.0,
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Global Commission Modal
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [newGlobalRate, setNewGlobalRate] = useState<string>('15.0');
  const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);

  // Restaurant Commission Override Modal
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [newRestaurantRate, setNewRestaurantRate] = useState<string>('15.0');
  const [isSubmittingRestaurant, setIsSubmittingRestaurant] = useState(false);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [restaurantSuccess, setRestaurantSuccess] = useState<string | null>(null);
  const [showRestaurantConfirm, setShowRestaurantConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [gRes, dRes, rList] = await Promise.all([
        fetchGlobalCommission(),
        fetchDeliveryCommissionSplit(),
        fetchRestaurants(),
      ]);

      const gVal = Number(gRes.globalCommissionPercentage) || 15.0;
      setGlobalRate(gVal);
      setNewGlobalRate(String(gVal));

      if (dRes) {
        setDeliverySplit(dRes);
      }

      setRestaurants(Array.isArray(rList) ? rList : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load commission parameters';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save Global Commission
  const handleSaveGlobalCommission = async () => {
    const rate = parseFloat(newGlobalRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setGlobalError('Please specify a valid percentage between 0% and 100%.');
      return;
    }

    if (!showGlobalConfirm) {
      setShowGlobalConfirm(true);
      return;
    }

    setIsSubmittingGlobal(true);
    setGlobalError(null);
    try {
      const res = await updateGlobalCommission(rate);
      const updatedVal = Number(res.globalCommissionPercentage) || rate;
      setGlobalRate(updatedVal);
      setGlobalSuccess(`Global platform take rate successfully updated to ${updatedVal}%.`);
      setTimeout(() => {
        setIsGlobalModalOpen(false);
        setGlobalSuccess(null);
        setShowGlobalConfirm(false);
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update global commission';
      setGlobalError(msg);
      setShowGlobalConfirm(false);
    } finally {
      setIsSubmittingGlobal(false);
    }
  };

  // Open Edit Restaurant Commission
  const handleOpenRestaurantModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    const current = Number(restaurant.commissionRate) || globalRate;
    setNewRestaurantRate(String(current));
    setRestaurantError(null);
    setRestaurantSuccess(null);
    setShowRestaurantConfirm(false);
    setIsRestaurantModalOpen(true);
  };

  // Handle Save Restaurant Commission
  const handleSaveRestaurantCommission = async () => {
    if (!selectedRestaurant) return;
    const rate = parseFloat(newRestaurantRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setRestaurantError('Please specify a valid percentage between 0% and 100%.');
      return;
    }

    if (!showRestaurantConfirm) {
      setShowRestaurantConfirm(true);
      return;
    }

    setIsSubmittingRestaurant(true);
    setRestaurantError(null);
    try {
      const updated = await updateRestaurantCommission(selectedRestaurant.id, rate);
      setRestaurantSuccess(`Commission for ${updated.name} updated to ${rate}%.`);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, commissionRate: rate } : r))
      );
      setTimeout(() => {
        setIsRestaurantModalOpen(false);
        setRestaurantSuccess(null);
        setShowRestaurantConfirm(false);
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update restaurant commission';
      setRestaurantError(msg);
      setShowRestaurantConfirm(false);
    } finally {
      setIsSubmittingRestaurant(false);
    }
  };

  // Filter restaurants by search term
  const filteredRestaurants = restaurants.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.city && r.city.toLowerCase().includes(term)) ||
      (r.businessSector && r.businessSector.toLowerCase().includes(term)) ||
      String(r.id).includes(term)
    );
  });

  const customOverrideCount = restaurants.filter(
    (r) => Number(r.commissionRate) > 0 && Number(r.commissionRate) !== globalRate
  ).length;

  const columns: Column<Restaurant>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px' }}>#{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Restaurant & Sector',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.name}</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <Badge variant="neutral" size="sm">{item.businessSector || 'FOOD'}</Badge>
            <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>{item.city}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'commissionRate',
      header: 'Take Rate (%)',
      align: 'right',
      render: (item) => {
        const rate = Number(item.commissionRate) || globalRate;
        const isCustom = Number(item.commissionRate) > 0 && Number(item.commissionRate) !== globalRate;
        return (
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontWeight: 700,
                color: isCustom ? 'var(--brand-primary)' : 'var(--slate-800)',
                fontSize: '13px',
              }}
            >
              {rate.toFixed(1)}%
            </span>
            {isCustom && (
              <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--info)' }}>
                Custom Override
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const variantMap = {
          ACTIVE: 'success' as const,
          PENDING_APPROVAL: 'warning' as const,
          SUSPENDED: 'danger' as const,
          REJECTED: 'neutral' as const,
        };
        return (
          <Badge variant={variantMap[item.status] || 'neutral'} withDot size="sm">
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      width: '120px',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Edit2 size={12} />}
          onClick={() => handleOpenRestaurantModal(item)}
        >
          Edit Rate
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Commission Switchboard & Take Rates"
        subtitle="Configure dynamic baseline take rates, delivery fee revenue splits, and individual merchant overrides."
        breadcrumbs={[{ label: 'Financials' }, { label: 'Commission' }]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Percent size={14} />}
              onClick={() => {
                setNewGlobalRate(String(globalRate));
                setGlobalError(null);
                setGlobalSuccess(null);
                setShowGlobalConfirm(false);
                setIsGlobalModalOpen(true);
              }}
            >
              Configure Global Rate
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <StatCard
          title="Global Baseline Rate"
          value={`${globalRate.toFixed(1)}%`}
          icon={Percent}
          iconColor="var(--brand-primary)"
          badge="Default Take Rate"
        />
        <StatCard
          title="Delivery Fee - Rider Share"
          value={`${deliverySplit.riderSharePercentage}%`}
          icon={Truck}
          iconColor="var(--success)"
          badge="Delivery Payout"
        />
        <StatCard
          title="Delivery Fee - Platform Take"
          value={`${deliverySplit.platformTakePercentage}%`}
          icon={DollarSign}
          iconColor="var(--info)"
          badge="Platform Logistics Fee"
        />
        <StatCard
          title="Custom Merchant Overrides"
          value={String(customOverrideCount)}
          icon={Settings}
          iconColor="#8b5cf6"
          badge={`out of ${restaurants.length} merchants`}
        />
      </div>

      {/* Error Message */}
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

      {/* Delivery Fee Policy Card */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Truck size={20} color="var(--brand-primary)" />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Delivery Fee Revenue Split Policy
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
              Platform fee distribution between logistics fleet and enterprise operations
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Rider Payout Allocation</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
              {deliverySplit.riderSharePercentage}% of total delivery charges
            </div>
            <span style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '4px', display: 'block' }}>
              Directly credited to rider earnings per completed fulfillment.
            </span>
          </div>

          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Platform Logistics Take</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--info)', marginTop: '4px' }}>
              {deliverySplit.platformTakePercentage}% retention
            </div>
            <span style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '4px', display: 'block' }}>
              Retained for GPS routing, insurance, and fleet operations infrastructure.
            </span>
          </div>
        </div>
      </div>

      {/* Restaurant Commission Rates Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Individual Merchant Take Rates
            </h3>
            <Badge variant="neutral" size="sm">{filteredRestaurants.length} Merchants</Badge>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 12px',
              height: '36px',
              width: '280px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--slate-50)',
            }}
          >
            <Search size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search merchant or city..."
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
        </div>

        <DataTable<Restaurant>
          columns={columns}
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Merchants Found"
          emptyDescription="No restaurants or dark stores match the search query."
        />
      </div>

      {/* =================== CONFIGURE GLOBAL COMMISSION MODAL =================== */}
      <Modal
        isOpen={isGlobalModalOpen}
        onClose={() => {
          if (!isSubmittingGlobal) {
            setIsGlobalModalOpen(false);
            setShowGlobalConfirm(false);
          }
        }}
        title="Configure Global Platform Take Rate"
        description="This baseline percentage will apply to all merchants without an explicit custom override."
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsGlobalModalOpen(false);
                setShowGlobalConfirm(false);
              }}
              disabled={isSubmittingGlobal}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveGlobalCommission}
              isLoading={isSubmittingGlobal}
              disabled={isSubmittingGlobal || !!globalSuccess}
            >
              {showGlobalConfirm ? 'Confirm & Apply' : 'Update Global Rate'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {globalSuccess && (
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
              {globalSuccess}
            </div>
          )}

          {globalError && (
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
              {globalError}
            </div>
          )}

          {showGlobalConfirm && !globalSuccess && (
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
              <strong>⚠️ Confirmation Required:</strong> You are about to update the platform baseline commission from <strong>{globalRate}%</strong> to <strong>{newGlobalRate}%</strong>. This immediately impacts merchant gross deductions on upcoming orders.
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
              Global Commission Rate (%) *
            </label>
            <input
              suppressHydrationWarning
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={newGlobalRate}
              onChange={(e) => {
                setNewGlobalRate(e.target.value);
                setShowGlobalConfirm(false);
                setGlobalError(null);
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
              disabled={isSubmittingGlobal || !!globalSuccess}
            />
            <span style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '4px', display: 'block' }}>
              Standard industry benchmark: 15% - 25% depending on logistics model.
            </span>
          </div>
        </div>
      </Modal>

      {/* =================== RESTAURANT COMMISSION OVERRIDE MODAL =================== */}
      <Modal
        isOpen={isRestaurantModalOpen}
        onClose={() => {
          if (!isSubmittingRestaurant) {
            setIsRestaurantModalOpen(false);
            setShowRestaurantConfirm(false);
          }
        }}
        title="Custom Merchant Commission Override"
        description={selectedRestaurant ? `Configure specific contractual take rate for ${selectedRestaurant.name}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRestaurantModalOpen(false);
                setShowRestaurantConfirm(false);
              }}
              disabled={isSubmittingRestaurant}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRestaurantCommission}
              isLoading={isSubmittingRestaurant}
              disabled={isSubmittingRestaurant || !!restaurantSuccess}
            >
              {showRestaurantConfirm ? 'Confirm Override' : 'Save Rate'}
            </Button>
          </div>
        }
      >
        {selectedRestaurant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {restaurantSuccess && (
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
                {restaurantSuccess}
              </div>
            )}

            {restaurantError && (
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
                {restaurantError}
              </div>
            )}

            {showRestaurantConfirm && !restaurantSuccess && (
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
                <strong>⚠️ Confirmation:</strong> Set custom commission rate for <strong>{selectedRestaurant.name}</strong> to <strong>{newRestaurantRate}%</strong>?
              </div>
            )}

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Merchant:</span>{' '}
                <strong>{selectedRestaurant.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>City:</span>{' '}
                <strong>{selectedRestaurant.city}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Current Rate:</span>{' '}
                <strong>{Number(selectedRestaurant.commissionRate || globalRate).toFixed(1)}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Global Baseline:</span>{' '}
                <strong>{globalRate.toFixed(1)}%</strong>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                New Custom Take Rate (%) *
              </label>
              <input
                suppressHydrationWarning
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={newRestaurantRate}
                onChange={(e) => {
                  setNewRestaurantRate(e.target.value);
                  setShowRestaurantConfirm(false);
                  setRestaurantError(null);
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
                disabled={isSubmittingRestaurant || !!restaurantSuccess}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
