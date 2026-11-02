'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  Smartphone,
  Mail,
  RefreshCw,
  Search,
  Eye,
  AlertTriangle,
  Users,
  Building2,
  Truck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  PlatformNotification,
  BroadcastNotificationRequest,
  BusinessSector,
  broadcastNotification,
  fetchBroadcastHistory,
  ApiError,
} from '@/lib/api';

const TEMPLATES = [
  {
    name: 'Weekend Surge Incentive (Riders)',
    title: 'Weekend Rush: Earn 1.5x on Peak Deliveries!',
    message: 'High customer order volume expected between 7 PM - 11 PM. Earn an additional ₹35 per fulfilled trip tonight.',
    target: 'RIDERS',
    sector: 'FOOD',
  },
  {
    name: 'Monsoon Flash Voucher (Customers)',
    title: 'Hot Biryani Weather: Use Code MONSOON30!',
    message: 'Craving comfort food? Enjoy 30% discount up to ₹75 on top biryani orders today.',
    target: 'CUSTOMERS',
    sector: 'FOOD',
  },
  {
    name: 'Inventory Restock Reminder (Merchants)',
    title: 'Merchant Alert: Prepare for Evening Order Peak',
    message: 'Dark stores and restaurant partners: please ensure inventory levels and kitchen prep times are updated in your merchant portal.',
    target: 'RESTAURANT_PARTNERS',
    sector: 'GROCERY',
  },
  {
    name: 'Critical Platform Maintenance (Universal)',
    title: 'Scheduled System Maintenance Notice',
    message: 'The FoodApp platform will undergo routine database optimization on Tuesday between 3:00 AM and 4:00 AM IST.',
    target: 'ALL',
    sector: undefined,
  },
];

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

export default function NotificationsPage() {
  const [history, setHistory] = useState<PlatformNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL');

  // Broadcast Compose Modal
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState<BroadcastNotificationRequest>({
    title: '',
    message: '',
    targetAudience: 'ALL',
    sector: undefined,
    actionUrl: '',
  });
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // View Details Modal
  const [selectedNotification, setSelectedNotification] = useState<PlatformNotification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBroadcastHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load broadcast history';
      setError(msg);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Aggregate Stats
  const totalBroadcasts = history.length;
  const customerTargeted = history.filter((n) => n.targetAudience === 'CUSTOMERS' || n.targetAudience === 'ALL').length;
  const riderTargeted = history.filter((n) => n.targetAudience === 'RIDERS' || n.targetAudience === 'ALL').length;
  const merchantTargeted = history.filter((n) => n.targetAudience === 'RESTAURANT_PARTNERS' || n.targetAudience === 'ALL').length;

  // Filter Logic
  const filteredHistory = history.filter((item) => {
    if (audienceFilter !== 'ALL' && item.targetAudience !== audienceFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.message.toLowerCase().includes(term) ||
      item.targetAudience.toLowerCase().includes(term) ||
      (item.sentByAdminEmail && item.sentByAdminEmail.toLowerCase().includes(term)) ||
      String(item.id).includes(term)
    );
  });

  // Apply Quick Template
  const handleApplyTemplate = (tpl: typeof TEMPLATES[number]) => {
    setBroadcastForm({
      title: tpl.title,
      message: tpl.message,
      targetAudience: tpl.target,
      sector: tpl.sector as BusinessSector | undefined,
      actionUrl: '',
    });
  };

  // Submit Broadcast
  const handleSubmitBroadcast = async () => {
    if (!broadcastForm.title.trim()) {
      setBroadcastError('Notification title is required.');
      return;
    }
    if (!broadcastForm.message.trim()) {
      setBroadcastError('Notification message body is required.');
      return;
    }

    setIsSubmittingBroadcast(true);
    setBroadcastError(null);
    try {
      const created = await broadcastNotification(broadcastForm);
      setBroadcastSuccess(`Broadcast '${created.title}' dispatched successfully.`);
      setHistory((prev) => [created, ...prev]);
      setTimeout(() => {
        setIsComposeModalOpen(false);
        setBroadcastSuccess(null);
        setBroadcastForm({
          title: '',
          message: '',
          targetAudience: 'ALL',
          sector: undefined,
          actionUrl: '',
        });
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to send broadcast alert';
      setBroadcastError(msg);
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const columns: Column<PlatformNotification>[] = [
    {
      key: 'id',
      header: 'Broadcast ID',
      width: '110px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px' }}>BRD-{item.id}</span>,
    },
    {
      key: 'title',
      header: 'Campaign & Headline',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.title}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.message}
          </div>
        </div>
      ),
    },
    {
      key: 'targetAudience',
      header: 'Target Segment',
      render: (item) => {
        const variantMap: Record<string, 'brand' | 'success' | 'warning' | 'neutral'> = {
          ALL: 'brand',
          CUSTOMERS: 'success',
          RIDERS: 'warning',
          RESTAURANT_PARTNERS: 'neutral',
        };
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Badge variant={variantMap[item.targetAudience] || 'neutral'} size="sm">
              {item.targetAudience}
            </Badge>
            {item.sector && <Badge variant="neutral" size="sm">{item.sector}</Badge>}
          </div>
        );
      },
    },
    {
      key: 'sentByAdminEmail',
      header: 'Dispatched By',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-700)' }}>
          {item.sentByAdminEmail || 'Super Admin'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Delivery Status',
      render: () => (
        <Badge variant="success" withDot size="sm">
          DISPATCHED
        </Badge>
      ),
    },
    {
      key: 'sentAt',
      header: 'Dispatched At',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatDate(item.sentAt)}
        </span>
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
            setSelectedNotification(item);
            setIsViewModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="System Notifications & Broadcast Engine"
        subtitle="Push alerts across WebSocket & FCM channels, sector-targeted announcements, and real-time fleet broadcasts."
        breadcrumbs={[{ label: 'Marketing & Support' }, { label: 'Notifications' }]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={loadHistory}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={() => {
                setBroadcastError(null);
                setBroadcastSuccess(null);
                setIsComposeModalOpen(true);
              }}
            >
              Compose Broadcast
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <StatCard
          title="Total Broadcasts Dispatched"
          value={String(totalBroadcasts)}
          icon={Bell}
          iconColor="var(--brand-primary)"
          badge="Audit Logged"
        />
        <StatCard
          title="Customer Dispatches"
          value={String(customerTargeted)}
          icon={Users}
          iconColor="var(--success)"
          badge="Universal / Consumer"
        />
        <StatCard
          title="Fleet Logistics Alerts"
          value={String(riderTargeted)}
          icon={Truck}
          iconColor="var(--info)"
          badge="Rider App Broadcast"
        />
        <StatCard
          title="Merchant Alerts"
          value={String(merchantTargeted)}
          icon={Building2}
          iconColor="#8b5cf6"
          badge="Store Operations"
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
        {/* Filter and Search Bar */}
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
              placeholder="Search announcements, subjects, admins..."
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

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['ALL', 'CUSTOMERS', 'RIDERS', 'RESTAURANT_PARTNERS'] as const).map((aud) => (
              <button
                key={aud}
                onClick={() => setAudienceFilter(aud)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: audienceFilter === aud ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  backgroundColor: audienceFilter === aud ? 'var(--brand-primary-light)' : 'white',
                  color: audienceFilter === aud ? 'var(--brand-primary)' : 'var(--slate-600)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {aud.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <DataTable<PlatformNotification>
          columns={columns}
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Broadcast Records"
          emptyDescription="No platform-wide push announcements have been sent matching this query."
        />
      </div>

      {/* =================== COMPOSE BROADCAST MODAL =================== */}
      <Modal
        isOpen={isComposeModalOpen}
        onClose={() => {
          if (!isSubmittingBroadcast) setIsComposeModalOpen(false);
        }}
        title="Compose Platform Push Broadcast"
        description="Dispatch instant WebSocket and push alerts across selected target user cohorts."
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsComposeModalOpen(false)}
              disabled={isSubmittingBroadcast}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={handleSubmitBroadcast}
              isLoading={isSubmittingBroadcast}
              disabled={isSubmittingBroadcast || !!broadcastSuccess}
            >
              Send Broadcast Now
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {broadcastSuccess && (
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
              {broadcastSuccess}
            </div>
          )}

          {broadcastError && (
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
              {broadcastError}
            </div>
          )}

          {/* Preset Templates */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '8px' }}>
              <Sparkles size={14} color="var(--brand-primary)" /> Quick Announcement Templates:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--slate-50)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-100)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                >
                  <strong style={{ color: 'var(--slate-800)', display: 'block' }}>{tpl.name}</strong>
                  <span style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Audience: {tpl.target}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience & Sector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
                Target Cohort *
              </label>
              <select
                value={broadcastForm.targetAudience}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  backgroundColor: 'white',
                }}
              >
                <option value="ALL">ALL (Universal Broadcast)</option>
                <option value="CUSTOMERS">CUSTOMERS (Consumer App Users)</option>
                <option value="RIDERS">RIDERS (Delivery Logistics Partners)</option>
                <option value="RESTAURANT_PARTNERS">RESTAURANT_PARTNERS (Merchant Portal)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
                Sector Filter (Optional)
              </label>
              <select
                value={broadcastForm.sector || ''}
                onChange={(e) =>
                  setBroadcastForm({
                    ...broadcastForm,
                    sector: (e.target.value as BusinessSector) || undefined,
                  })
                }
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  backgroundColor: 'white',
                }}
              >
                <option value="">All Business Sectors</option>
                <option value="FOOD">Food Delivery</option>
                <option value="GROCERY">Insta Grocery (Quick Commerce)</option>
                <option value="PHARMACY">Pharma Care</option>
                <option value="MEAT_FISH">Meat & Fresh Fish</option>
                <option value="PET_SUPPLIES">Pet Supplies</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
              Broadcast Title *
            </label>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="e.g. Flash Surge Active — High Demand Tonight!"
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Message Body */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
              Message Body *
            </label>
            <textarea
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              placeholder="Enter push notification content..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Action Deep-link URL */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
              Action Deep-link URL (Optional)
            </label>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="e.g. /offers/monsoon or swiggy://promotions/50"
              value={broadcastForm.actionUrl || ''}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, actionUrl: e.target.value })}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* =================== VIEW DETAILS MODAL =================== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Broadcast Notification Details"
        description={selectedNotification ? `BRD-${selectedNotification.id} • Dispatched ${formatDate(selectedNotification.sentAt)}` : ''}
        size="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedNotification && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Target Segment</span>
                <Badge variant="brand" size="sm">{selectedNotification.targetAudience}</Badge>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Sector</span>
                <Badge variant="neutral" size="sm">{selectedNotification.sector || 'Platform Wide'}</Badge>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Dispatched By</span>
                <strong>{selectedNotification.sentByAdminEmail || 'Super Admin'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Delivery Rail</span>
                <strong style={{ color: 'var(--success)' }}>FCM & WebSocket</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>
                Notification Headline:
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                {selectedNotification.title}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>
                Full Message Payload:
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', lineHeight: '1.5' }}>
                {selectedNotification.message}
              </div>
            </div>

            {selectedNotification.actionUrl && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>
                  Target Action URL:
                </div>
                <div style={{ padding: '6px 10px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '12px' }}>
                  {selectedNotification.actionUrl}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
