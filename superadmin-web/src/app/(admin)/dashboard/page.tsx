'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Truck,
  ShoppingBag,
  IndianRupee,
  Percent,
  Server,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Activity,
  Layers,
  MapPin,
  Lock,
  Clock,
  ArrowRight,
  Headphones,
  Landmark,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton, LoadingSpinner } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchPlatformCockpit, PlatformCockpitDTO, getAuthToken, API_BASE_URL, ApiError } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<PlatformCockpitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboardMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError({
        status: 401,
        message: 'No active session token found. Please sign in with a Super Admin account.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await fetchPlatformCockpit();
      setData(result);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError({
          status: err.status,
          message: err.message,
        });
      } else if (err instanceof Error) {
        setError({
          status: 500,
          message: err.message,
        });
      } else {
        setError({
          status: 500,
          message: 'Failed to fetch dashboard metrics from backend API.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboardMetrics();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardMetrics]);

  // Format currency helper
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹ 0.00';
    return `₹ ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Sector visual color palette
  const sectorColors: Record<string, { bg: string; text: string; bar: string }> = {
    FOOD: { bg: '#fff7ed', text: '#ea580c', bar: '#ff5200' },
    GROCERY: { bg: '#ecfdf5', text: '#059669', bar: '#10b981' },
    PHARMACY: { bg: '#eff6ff', text: '#2563eb', bar: '#3b82f6' },
    MEAT: { bg: '#fff1f2', text: '#e11d48', bar: '#f43f5e' },
  };

  // Safe percentage helper
  const calculateShare = (count: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <PageHeader
        title="Platform Operations Cockpit"
        subtitle="Real-time multi-sector enterprise metrics aggregated across all live regional fulfillment nodes."
        badge={
          isLoading ? (
            <Badge variant="neutral">Connecting to backend...</Badge>
          ) : error ? (
            <Badge variant="danger" withDot>
              {error.status === 401 || error.status === 403 ? 'Authentication Required' : 'Connection Error'}
            </Badge>
          ) : (
            <Badge variant="success" withDot>
              Live Telemetry Active
            </Badge>
          )
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastUpdated && (
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <Clock size={12} />
                Synced: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadDashboardMetrics}
              disabled={isLoading}
            >
              Sync Metrics
            </Button>
            {error && (error.status === 401 || error.status === 403) && (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight size={13} />}
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            )}
          </div>
        }
      />

      {/* Unauthorized State (401 / 403) */}
      {!isLoading && error && (error.status === 401 || error.status === 403) && (
        <div
          className="admin-card"
          style={{
            borderColor: 'var(--danger-border)',
            backgroundColor: 'var(--danger-bg)',
            padding: '32px 24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={26} />
            </div>

            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--danger-text)', margin: 0 }}>
                Super Administrator Authentication Required
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '500px', marginTop: '6px', lineHeight: 1.5 }}>
                {error.message}
              </p>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Authorized Personnel Only &bull; Access Level: <code>SUPER_ADMIN</code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight size={14} />} onClick={() => router.push('/login')}>
                Super Admin Sign In
              </Button>
              <Button variant="outline" size="md" onClick={loadDashboardMetrics}>
                Retry Authorization
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Backend Communication Failure */}
      {!isLoading && error && error.status !== 401 && error.status !== 403 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--danger)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px' }}>Service Connection Notice</div>
            <div style={{ fontSize: '12.5px', marginTop: '2px', color: 'var(--text-secondary)' }}>
              Unable to establish a secure session with the operations gateway. Please ensure services are active and retry.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadDashboardMetrics}>
            Retry
          </Button>
        </div>
      )}

      {/* Section 1: Core Financials & Orders KPI Grid */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Platform Volume & Revenue
        </div>
        <div className="dashboard-grid">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : data ? (
            <>
              {/* Platform GMV */}
              <StatCard
                title="Gross Merchandise Value (GMV)"
                value={formatCurrency(data.platformGmv)}
                icon={IndianRupee}
                iconColor="var(--warning)"
                iconBgColor="rgba(245, 158, 11, 0.1)"
                badge="Lifetime Delivered"
                trend={{
                  label: 'Gross order volume across all merchants',
                }}
              />

              {/* Commission Revenue */}
              <StatCard
                title="Platform Commission Yield"
                value={formatCurrency(data.platformCommissionRevenue)}
                icon={Percent}
                iconColor="#8b5cf6"
                iconBgColor="rgba(139, 92, 246, 0.1)"
                badge="Net Platform Take"
                trend={{
                  label: 'Earned fee commission revenue',
                }}
              />

              {/* Total Platform Orders */}
              <StatCard
                title="Total Platform Orders"
                value={data.totalOrders}
                icon={ShoppingBag}
                iconColor="var(--brand-primary)"
                iconBgColor="rgba(255, 82, 0, 0.09)"
                badge={`${data.deliveredOrders} Delivered`}
                subtitle={`${data.activeOrders} active fulfillment in flight`}
              />

              {/* Order Velocity Last 60m */}
              <StatCard
                title="Recent Order Velocity"
                value={data.ordersLast60Mins}
                icon={TrendingUp}
                iconColor="var(--success)"
                iconBgColor="rgba(16, 185, 129, 0.1)"
                badge="Last 60 Minutes"
                trend={{
                  label: 'Dispatched orders in the trailing hour',
                }}
              />
            </>
          ) : null}
        </div>
      </div>

      {/* Section 2: Fleet, Partner Stores & Customers */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Ecosystem Entities & Fulfillment Fleet
        </div>
        <div className="dashboard-grid">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : data ? (
            <>
              {/* Partner Stores */}
              <StatCard
                title="Partner Restaurants"
                value={`${data.activeRestaurants} / ${data.totalRestaurants}`}
                icon={Store}
                iconColor="var(--brand-primary)"
                badge="Active / Enrolled"
                subtitle={`${data.totalRestaurants - data.activeRestaurants} inactive or onboarding`}
              />

              {/* Delivery Fleet */}
              <StatCard
                title="Delivery Fleet (Riders)"
                value={data.totalRiders}
                icon={Truck}
                iconColor="var(--info)"
                iconBgColor="rgba(59, 130, 246, 0.1)"
                badge="Fleet Network"
                trend={{
                  label: 'Registered active delivery couriers',
                }}
              />

              {/* Registered Customers */}
              <StatCard
                title="Registered Customers"
                value={data.totalCustomers}
                icon={Activity}
                iconColor="#06b6d4"
                iconBgColor="rgba(6, 182, 212, 0.1)"
                badge="Consumer Accounts"
                trend={{
                  label: 'User profiles registered on platform',
                }}
              />

              {/* Merchant Settlements Paid */}
              <StatCard
                title="Merchant Settlements Paid"
                value={formatCurrency(data.totalSettlementsPaid)}
                icon={Landmark}
                iconColor="#10b981"
                iconBgColor="rgba(16, 185, 129, 0.1)"
                badge="Disbursed Payouts"
                trend={{
                  label: 'Total vendor settlements settled',
                }}
              />
            </>
          ) : null}
        </div>
      </div>

      {/* Section 3: Risk, Disputes & System Contract Notice */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Open Disputes */}
          <div
            className="admin-card"
            style={{
              padding: '16px 20px',
              borderLeft: data.openDisputes > 0 ? '3px solid var(--danger)' : '3px solid var(--success)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Headphones size={14} color={data.openDisputes > 0 ? 'var(--danger)' : 'var(--success)'} />
                <span>Open Support Disputes</span>
              </div>
              <Badge variant={data.openDisputes > 0 ? 'danger' : 'success'} size="sm">
                {data.openDisputes > 0 ? 'Requires Action' : 'Clear Queue'}
              </Badge>
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 800, color: data.openDisputes > 0 ? 'var(--danger-text)' : 'var(--text-primary)', marginTop: '8px' }}>
              {data.openDisputes}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Active unresolved order escalation tickets
            </div>
          </div>

          {/* Refunds Issued */}
          <div className="admin-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <IndianRupee size={14} color="var(--slate-500)" />
                <span>Total Refunds Issued</span>
              </div>
              <Badge variant="neutral" size="sm">Settled</Badge>
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
              {formatCurrency(data.totalRefundsIssued)}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Cumulative payment reversals processed
            </div>
          </div>

          {/* System SLA Notice (Unprovided by backend - accurately labeled) */}
          <div className="admin-card" style={{ padding: '16px 20px', backgroundColor: 'var(--bg-surface-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <ShieldCheck size={14} color="var(--slate-400)" />
                <span>System SLA Status</span>
              </div>
              <Badge variant="neutral" size="sm">Uncalculated</Badge>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '8px' }}>
              Unavailable
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Not calculated by backend endpoint
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Multi-Sector & Geolocation Live Telemetry Panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Multi-Sector Operations Panel with Pure CSS Visual Segmented Bar */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 82, 0, 0.08)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Business Sector Breakdown
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Volume & revenue distribution across verticals
                </span>
              </div>
            </div>
            <Badge variant="brand" size="sm">Backend Feed</Badge>
          </div>

          {isLoading ? (
            <LoadingSpinner size="sm" label="Loading sector metrics..." />
          ) : data && data.ordersBySector ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Segmented Distribution Bar (CSS) */}
              {data.totalOrders > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--slate-100)',
                      marginBottom: '10px',
                    }}
                  >
                    {['FOOD', 'GROCERY', 'PHARMACY', 'MEAT'].map((sector) => {
                      const count = data.ordersBySector[sector] || 0;
                      const share = calculateShare(count, data.totalOrders);
                      if (share === 0) return null;
                      return (
                        <div
                          key={sector}
                          title={`${sector}: ${count} orders (${share}%)`}
                          style={{
                            width: `${share}%`,
                            backgroundColor: sectorColors[sector]?.bar || '#94a3b8',
                            transition: 'width 300ms ease',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sector Row List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['FOOD', 'GROCERY', 'PHARMACY', 'MEAT'].map((sector) => {
                  const count = data.ordersBySector[sector] || 0;
                  const rev = data.revenueBySector ? data.revenueBySector[sector] || 0 : 0;
                  const share = calculateShare(count, data.totalOrders);
                  const colorConfig = sectorColors[sector] || { bg: '#f1f5f9', text: '#475569', bar: '#94a3b8' };

                  return (
                    <div
                      key={sector}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: colorConfig.bar,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                            {sector}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Revenue: {formatCurrency(rev)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className="tabular-nums" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {count}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          orders ({share}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              title="Sector Data Unavailable"
              description="Awaiting active connection to backend API."
            />
          )}
        </div>

        {/* Fulfillment City Breakdown Panel */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  color: 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Orders By Fulfillment City
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Merchant geolocation distribution
                </span>
              </div>
            </div>
            <Badge variant="neutral" size="sm">Geo Aggregate</Badge>
          </div>

          {isLoading ? (
            <LoadingSpinner size="sm" label="Loading city distribution..." />
          ) : data && data.ordersByCity && Object.keys(data.ordersByCity).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(data.ordersByCity).map(([city, count]) => {
                const share = calculateShare(count, data.totalOrders);
                return (
                  <div
                    key={city}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color="var(--text-muted)" />
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {city}
                        </span>
                      </div>
                      <Badge variant="brand" size="sm">
                        {count} {count === 1 ? 'order' : 'orders'} ({share}%)
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--slate-200)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(share, 5)}%`,
                          height: '100%',
                          backgroundColor: 'var(--brand-primary)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              compact
              title="No City Data Yet"
              description="No active orders with merchant city information found in the backend database."
            />
          )}
        </div>
      </div>

      {/* Section 5: Order Pipeline Completion Status */}
      {data && (
        <div className="admin-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Order Fulfillment Pipeline
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Completed: <strong style={{ color: 'var(--text-primary)' }}>{data.deliveredOrders}</strong> / {data.totalOrders} Total Orders
            </span>
          </div>

          {/* Delivery Ratio Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--slate-100)',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: `${data.totalOrders > 0 ? (data.deliveredOrders / data.totalOrders) * 100 : 0}%`,
                backgroundColor: 'var(--success)',
              }}
              title={`Delivered: ${data.deliveredOrders}`}
            />
            <div
              style={{
                width: `${data.totalOrders > 0 ? (data.activeOrders / data.totalOrders) * 100 : 0}%`,
                backgroundColor: 'var(--brand-primary)',
              }}
              title={`Active In Flight: ${data.activeOrders}`}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              Delivered: {data.deliveredOrders}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
              Active in Transit: {data.activeOrders}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--info)' }} />
              Velocity: {data.ordersLast60Mins} orders / hour
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
