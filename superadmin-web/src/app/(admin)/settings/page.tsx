'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Shield,
  Save,
  Layers,
  CloudRain,
  Moon,
  AlertTriangle,
  CheckCircle,
  Bell,
  Phone,
  Mail,
  RefreshCw,
  Power,
  Flame,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  PlatformSystemConfig,
  SystemConfigUpdateRequest,
  SurgePricingUpdateRequest,
  fetchSystemConfig,
  updateSystemConfig,
  updateSurgePricing,
  ApiError,
} from '@/lib/api';

export default function SettingsPage() {
  const [config, setConfig] = useState<PlatformSystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<SystemConfigUpdateRequest>({
    defaultCommissionRate: 15.0,
    maintenanceMode: false,
    maintenanceMessage: '',
    globalAnnouncementBanner: '',
    bannerActive: false,
    supportPhone: '',
    supportEmail: '',
  });

  // Surge State
  const [surgeForm, setSurgeForm] = useState<SurgePricingUpdateRequest>({
    rainSurgeActive: false,
    rainSurgeMultiplier: 1.25,
    nightSurgeActive: false,
    nightSurgeMultiplier: 1.20,
  });

  // Confirmation Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'CONFIG' | 'SURGE' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSystemConfig();
      setConfig(data);
      setForm({
        defaultCommissionRate: Number(data.defaultCommissionRate) || 15.0,
        maintenanceMode: !!data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage || '',
        globalAnnouncementBanner: data.globalAnnouncementBanner || '',
        bannerActive: !!data.bannerActive,
        supportPhone: data.supportPhone || '',
        supportEmail: data.supportEmail || '',
      });
      setSurgeForm({
        rainSurgeActive: !!data.rainSurgeActive,
        rainSurgeMultiplier: Number(data.rainSurgeMultiplier) || 1.25,
        nightSurgeActive: !!data.nightSurgeActive,
        nightSurgeMultiplier: Number(data.nightSurgeMultiplier) || 1.20,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load platform settings';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save General System Config
  const handleSaveConfig = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await updateSystemConfig(form);
      setConfig(updated);
      setSuccessMessage('System configuration saved and persisted across platform clusters.');
      setIsConfirmModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update system settings';
      setError(msg);
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Surge Pricing
  const handleSaveSurge = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await updateSurgePricing(surgeForm);
      setConfig(updated);
      setSuccessMessage('Dynamic surge multipliers updated and applied to customer dispatch pricing.');
      setIsConfirmModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update surge parameters';
      setError(msg);
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Platform & System Configurations"
        subtitle="Core cluster routing, dynamic surge engines, maintenance modes, and security policies."
        breadcrumbs={[{ label: 'Governance' }, { label: 'System Settings' }]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={loadSettings}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={() => {
                setConfirmAction('CONFIG');
                setIsConfirmModalOpen(true);
              }}
              disabled={isLoading || isSubmitting}
            >
              Save Configuration
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="dashboard-grid">
        <StatCard
          title="Cluster State"
          value={config?.maintenanceMode ? 'MAINTENANCE' : 'OPERATIONAL'}
          icon={Server}
          iconColor={config?.maintenanceMode ? 'var(--danger)' : 'var(--success)'}
          badge={config?.maintenanceMode ? 'Traffic Diverted' : 'All Routes Active'}
        />
        <StatCard
          title="Baseline Commission"
          value={`${Number(config?.defaultCommissionRate || 15).toFixed(1)}%`}
          icon={Layers}
          iconColor="var(--brand-primary)"
          badge="Platform Take Rate"
        />
        <StatCard
          title="Monsoon Rain Surge"
          value={config?.rainSurgeActive ? `${Number(config?.rainSurgeMultiplier || 1.25).toFixed(2)}x` : 'OFF'}
          icon={CloudRain}
          iconColor={config?.rainSurgeActive ? 'var(--info)' : 'var(--slate-400)'}
          badge={config?.rainSurgeActive ? 'Weather Multiplier' : 'Normal Traffic'}
        />
        <StatCard
          title="Late Night Surge"
          value={config?.nightSurgeActive ? `${Number(config?.nightSurgeMultiplier || 1.20).toFixed(2)}x` : 'OFF'}
          icon={Moon}
          iconColor={config?.nightSurgeActive ? '#8b5cf6' : 'var(--slate-400)'}
          badge={config?.nightSurgeActive ? 'Peak Night Hours' : 'Inactive'}
        />
      </div>

      {/* Success Notification */}
      {successMessage && (
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
          {successMessage}
        </div>
      )}

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

      {/* Settings Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Dynamic Surge Pricing Card */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={20} color="var(--brand-primary)" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  Dynamic Surge Pricing Multipliers
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                  Algorithmic delivery fee increases during severe weather, traffic peaks, or late night hours
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Save size={13} />}
              onClick={() => {
                setConfirmAction('SURGE');
                setIsConfirmModalOpen(true);
              }}
              disabled={isSubmitting}
            >
              Update Surge Engine
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Rain Surge */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CloudRain size={18} color="var(--info)" />
                  <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--slate-900)' }}>Rain Surge (Monsoon)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSurgeForm({ ...surgeForm, rainSurgeActive: !surgeForm.rainSurgeActive })}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: surgeForm.rainSurgeActive ? '1px solid var(--info)' : '1px solid var(--border-light)',
                    backgroundColor: surgeForm.rainSurgeActive ? 'var(--info)' : 'white',
                    color: surgeForm.rainSurgeActive ? 'white' : 'var(--slate-600)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {surgeForm.rainSurgeActive ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--slate-600)', marginBottom: '4px' }}>
                  Delivery Multiplier (e.g. 1.25 for +25% payout)
                </label>
                <input
                  suppressHydrationWarning
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="3.0"
                  value={surgeForm.rainSurgeMultiplier || 1.25}
                  onChange={(e) => setSurgeForm({ ...surgeForm, rainSurgeMultiplier: parseFloat(e.target.value) || 1.0 })}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Night Surge */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Moon size={18} color="#8b5cf6" />
                  <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--slate-900)' }}>Late Night Surge (Past 11 PM)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSurgeForm({ ...surgeForm, nightSurgeActive: !surgeForm.nightSurgeActive })}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: surgeForm.nightSurgeActive ? '1px solid #8b5cf6' : '1px solid var(--border-light)',
                    backgroundColor: surgeForm.nightSurgeActive ? '#8b5cf6' : 'white',
                    color: surgeForm.nightSurgeActive ? 'white' : 'var(--slate-600)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {surgeForm.nightSurgeActive ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--slate-600)', marginBottom: '4px' }}>
                  Delivery Multiplier (e.g. 1.20 for +20% payout)
                </label>
                <input
                  suppressHydrationWarning
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="3.0"
                  value={surgeForm.nightSurgeMultiplier || 1.20}
                  onChange={(e) => setSurgeForm({ ...surgeForm, nightSurgeMultiplier: parseFloat(e.target.value) || 1.0 })}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Maintenance & Safety Mode */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Power size={20} color="var(--danger)" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                Platform Maintenance Emergency Switch
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                Temporarily suspend consumer order placement during emergency upgrades or system downtime
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: form.maintenanceMode ? 'var(--danger-surface)' : 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${form.maintenanceMode ? 'var(--danger)' : 'var(--border-light)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: form.maintenanceMode ? 'var(--danger)' : 'var(--slate-800)' }}>
                  Maintenance Mode: {form.maintenanceMode ? 'ACTIVE (BLOCKING ORDERS)' : 'OFF (TRAFFIC NORMAL)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                  When active, customer cart checkouts will be gracefully rejected with the notice below.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: form.maintenanceMode ? '1px solid var(--danger)' : '1px solid var(--border-light)',
                  backgroundColor: form.maintenanceMode ? 'var(--danger)' : 'white',
                  color: form.maintenanceMode ? 'white' : 'var(--slate-700)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {form.maintenanceMode ? 'Deactivate Maintenance' : 'Activate Maintenance Mode'}
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
                Maintenance Message Displayed to Customers
              </label>
              <textarea
                value={form.maintenanceMessage || ''}
                onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'white',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </div>

        {/* Global Announcement Banner */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Bell size={20} color="var(--brand-primary)" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                Universal In-App Announcement Banner
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                Displays a prominent informational notice at the top of the customer ordering application
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, bannerActive: !form.bannerActive })}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: form.bannerActive ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  backgroundColor: form.bannerActive ? 'var(--brand-primary)' : 'white',
                  color: form.bannerActive ? 'white' : 'var(--slate-700)',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                {form.bannerActive ? 'Banner Active' : 'Banner Hidden'}
              </button>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                {form.bannerActive ? 'Notice will be visible to all mobile and web visitors.' : 'Banner is currently hidden.'}
              </span>
            </div>

            <input
              suppressHydrationWarning
              type="text"
              placeholder="e.g. Enjoy free delivery on all orders above ₹499 during our weekend celebration!"
              value={form.globalAnnouncementBanner || ''}
              onChange={(e) => setForm({ ...form, globalAnnouncementBanner: e.target.value })}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'white',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Support Helpdesk Contacts */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Phone size={20} color="var(--success)" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                Customer Helpdesk & Support Routing
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                Official customer contact coordinates listed across mobile order receipts and invoices
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Support Helpline Number
              </label>
              <input
                suppressHydrationWarning
                type="text"
                value={form.supportPhone || ''}
                onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'white',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Support Email Address
              </label>
              <input
                suppressHydrationWarning
                type="email"
                value={form.supportEmail || ''}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'white',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Multi-Sector Module Master Switches */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers size={20} color="var(--brand-primary)" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                Multi-Sector Operational Master Switches
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                Active consumer catalog categories in database registry
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'Food Delivery Module', desc: 'Full restaurant catalog, dine-in delivery & cloud kitchens', status: 'ACTIVE', sector: 'FOOD' },
              { name: 'Insta Grocery Module', desc: '10-minute dark store quick commerce & essentials', status: 'ACTIVE', sector: 'GROCERY' },
              { name: 'Pharma Care Module', desc: 'Online pharmacy and medical Rx prescription fulfillment', status: 'ACTIVE', sector: 'PHARMACY' },
              { name: 'Meat & Fresh Seafood', desc: 'Cold storage fresh meat and seafood dispatches', status: 'ACTIVE', sector: 'MEAT_FISH' },
              { name: 'Pet Supplies & Nutrition', desc: 'Pet food, healthcare products, and pet care accessories', status: 'ACTIVE', sector: 'PET_SUPPLIES' },
            ].map((sec, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--slate-800)' }}>{sec.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{sec.desc}</div>
                </div>
                <Badge variant="success" size="sm" withDot>
                  {sec.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =================== CONFIRMATION MODAL =================== */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsConfirmModalOpen(false);
        }}
        title="Confirm System Configuration Changes"
        description="Administrative changes immediately propagate across platform microservices and database records."
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmAction === 'CONFIG' ? handleSaveConfig : handleSaveSurge}
              isLoading={isSubmitting}
            >
              Confirm & Save
            </Button>
          </div>
        }
      >
        <div style={{ fontSize: '13px', color: 'var(--slate-700)', lineHeight: '1.5' }}>
          <p>
            Are you sure you want to apply these platform settings? All changes are audited and logged in the immutable security audit trail.
          </p>
        </div>
      </Modal>
    </div>
  );
}
