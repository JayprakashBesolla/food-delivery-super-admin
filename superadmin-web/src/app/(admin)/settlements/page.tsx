'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Search,
  Eye,
  BanknoteIcon,
  RefreshCw,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  SettlementRecord,
  fetchPendingSettlements,
  fetchProcessingSettlements,
  fetchPaidSettlements,
  fetchFailedSettlements,
  fetchSettlementHistory,
  generateSettlementBatch,
  executePayout,
  ApiError,
} from '@/lib/api';

type SettlementTab = 'pending' | 'processing' | 'paid' | 'failed' | 'history';

const TABS: { key: SettlementTab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'paid', label: 'Paid' },
  { key: 'failed', label: 'Failed' },
  { key: 'history', label: 'All History' },
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

function getSettlementStatusBadge(status: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'brand'> = {
    PENDING: 'warning',
    PROCESSING: 'brand',
    PAID: 'success',
    FAILED: 'danger',
  };
  return (
    <Badge variant={map[status] || 'neutral'} withDot size="sm">
      {status}
    </Badge>
  );
}

export default function SettlementsPage() {
  const [activeTab, setActiveTab] = useState<SettlementTab>('pending');
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Detail modal
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Generate batch modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Payout modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutSettlement, setPayoutSettlement] = useState<SettlementRecord | null>(null);
  const [payoutProvider, setPayoutProvider] = useState<'STRIPE' | 'MANUAL_BANK'>('MANUAL_BANK');
  const [payoutUtr, setPayoutUtr] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [showPayoutConfirm, setShowPayoutConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: SettlementRecord[];
      switch (activeTab) {
        case 'processing':
          data = await fetchProcessingSettlements();
          break;
        case 'paid':
          data = await fetchPaidSettlements();
          break;
        case 'failed':
          data = await fetchFailedSettlements();
          break;
        case 'history':
          data = await fetchSettlementHistory();
          break;
        default:
          data = await fetchPendingSettlements();
      }
      setSettlements(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load settlements';
      setError(msg);
      setSettlements([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalPending = settlements.filter((s) => s.status === 'PENDING').length;
  const totalNetPayout = settlements.reduce((sum, s) => sum + (Number(s.netPayoutAmount) || 0), 0);
  const totalGross = settlements.reduce((sum, s) => sum + (Number(s.grossSales) || 0), 0);
  const totalCommission = settlements.reduce((sum, s) => sum + (Number(s.platformCommissionAmount) || 0), 0);
  const paidCount = settlements.filter((s) => s.status === 'PAID').length;
  const failedCount = settlements.filter((s) => s.status === 'FAILED').length;

  // Search filter
  const filtered = settlements.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(s.id).includes(term) ||
      (s.restaurant?.name ?? '').toLowerCase().includes(term) ||
      (s.restaurant?.city ?? '').toLowerCase().includes(term) ||
      (s.utrNumber ?? '').toLowerCase().includes(term) ||
      (s.payoutProvider ?? '').toLowerCase().includes(term)
    );
  });

  // Generate settlement batch
  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setGenerateResult(null);
    try {
      const result = await generateSettlementBatch();
      const count = Array.isArray(result) ? result.length : 0;
      setGenerateResult(`Settlement batch generated successfully. ${count} settlement record(s) created.`);
      setTimeout(() => {
        setShowGenerateModal(false);
        setGenerateResult(null);
        fetchData();
      }, 2500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to generate settlement batch';
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Payout handler
  const handleOpenPayout = (settlement: SettlementRecord) => {
    setPayoutSettlement(settlement);
    setPayoutProvider(
      (settlement.payoutProvider === 'STRIPE' || settlement.restaurant?.stripeAccountId)
        ? 'STRIPE'
        : 'MANUAL_BANK'
    );
    setPayoutUtr('');
    setPayoutNotes('');
    setPayoutError(null);
    setPayoutSuccess(null);
    setShowPayoutConfirm(false);
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async () => {
    if (!payoutSettlement) return;

    if (payoutProvider === 'MANUAL_BANK' && !payoutUtr.trim()) {
      setPayoutError('UTR number is required for manual bank transfers.');
      return;
    }

    if (!showPayoutConfirm) {
      setShowPayoutConfirm(true);
      return;
    }

    setIsSubmittingPayout(true);
    setPayoutError(null);
    try {
      await executePayout(payoutSettlement.id, {
        provider: payoutProvider,
        utrNumber: payoutProvider === 'MANUAL_BANK' ? payoutUtr.trim() : undefined,
        notes: payoutNotes.trim() || undefined,
      });
      setPayoutSuccess(
        `Payout of ${formatCurrency(payoutSettlement.netPayoutAmount)} executed successfully for ${payoutSettlement.restaurant?.name || `Settlement #${payoutSettlement.id}`}.`
      );
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccess(null);
        fetchData();
      }, 2000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Payout execution failed. Please try again.';
      setPayoutError(msg);
      setShowPayoutConfirm(false);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const columns: Column<SettlementRecord>[] = [
    {
      key: 'id',
      header: 'Settlement ID',
      width: '120px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>
          STL-{item.id}
        </span>
      ),
    },
    {
      key: 'restaurant',
      header: 'Merchant',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--slate-800)' }}>
            {item.restaurant?.name || '—'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            {item.restaurant?.city || ''}{item.restaurant?.businessSector ? ` • ${item.restaurant.businessSector}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'grossSales',
      header: 'Gross Sales',
      align: 'right',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--slate-700)' }}>
          {formatCurrency(item.grossSales)}
        </span>
      ),
    },
    {
      key: 'platformCommissionAmount',
      header: 'Commission',
      align: 'right',
      render: (item) => (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--danger)' }}>
            -{formatCurrency(item.platformCommissionAmount)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
            {Number(item.platformCommissionPercentage) || 0}%
          </div>
        </div>
      ),
    },
    {
      key: 'taxDeducted',
      header: 'TDS',
      align: 'right',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
          -{formatCurrency(item.taxDeducted)}
        </span>
      ),
    },
    {
      key: 'netPayoutAmount',
      header: 'Net Payout',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '13px' }}>
          {formatCurrency(item.netPayoutAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {getSettlementStatusBadge(item.status)}
          {item.requiresFourEyes && (
            <Badge variant="warning" size="sm">4-Eyes Required</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'utrNumber',
      header: 'UTR / Ref',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
          {item.utrNumber || item.stripeTransferId || '—'}
        </span>
      ),
    },
    {
      key: 'processedAt',
      header: 'Date',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatDate(item.paidAt || item.processedAt)}
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
              setSelectedSettlement(item);
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
          {(item.status === 'PENDING' || item.status === 'PROCESSING') && (
            <button
              onClick={() => handleOpenPayout(item)}
              title="Execute Payout"
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
                e.currentTarget.style.backgroundColor = 'var(--success-surface)';
                e.currentTarget.style.color = 'var(--success)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--slate-500)';
              }}
            >
              <BanknoteIcon size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Merchant Settlements & Payouts"
        subtitle="Settlement lifecycle, commission deductions, TDS, payout execution, and bank reconciliation."
        breadcrumbs={[{ label: 'Financials' }, { label: 'Settlements' }]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={fetchData}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Layers size={14} />}
              onClick={() => {
                setGenerateError(null);
                setGenerateResult(null);
                setShowGenerateModal(true);
              }}
            >
              Generate Batch
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="dashboard-grid">
        <StatCard
          title="Pending Disbursals"
          value={formatCurrency(totalNetPayout)}
          icon={Landmark}
          iconColor="var(--warning)"
          badge={`${totalPending} pending`}
        />
        <StatCard
          title="Gross Sales (View)"
          value={formatCurrency(totalGross)}
          icon={ArrowUpRight}
          iconColor="var(--brand-primary)"
          badge="Current View"
        />
        <StatCard
          title="Commission Earned"
          value={formatCurrency(totalCommission)}
          icon={CheckCircle2}
          iconColor="var(--success)"
          badge="Platform Revenue"
        />
        <StatCard
          title="Failed Payouts"
          value={String(failedCount)}
          icon={AlertTriangle}
          iconColor="var(--danger)"
          badge={`${paidCount} paid`}
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

      {/* Tabs + Search + Table */}
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

        {/* Search */}
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
              placeholder="Search by settlement ID, merchant name, city, UTR..."
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

        {/* Table */}
        <DataTable<SettlementRecord>
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Settlements Found"
          emptyDescription={
            activeTab === 'history'
              ? 'No settlement records found in history.'
              : `No ${activeTab} settlements at this time.`
          }
        />
      </div>

      {/* =================== DETAIL MODAL =================== */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Settlement Details"
        description={selectedSettlement ? `Settlement STL-${selectedSettlement.id}` : ''}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedSettlement && (selectedSettlement.status === 'PENDING' || selectedSettlement.status === 'PROCESSING') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<BanknoteIcon size={14} />}
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenPayout(selectedSettlement);
                }}
              >
                Execute Payout
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedSettlement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Merchant Info */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Merchant Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <DetailRow label="Restaurant" value={selectedSettlement.restaurant?.name || '—'} />
                <DetailRow label="City" value={selectedSettlement.restaurant?.city || '—'} />
                <DetailRow label="Sector" value={selectedSettlement.restaurant?.businessSector || '—'} />
                <DetailRow label="IFSC" value={selectedSettlement.restaurant?.bankIfscCode || '—'} mono />
                <DetailRow label="Bank Account" value={selectedSettlement.restaurant?.bankAccountNumber ? `****${selectedSettlement.restaurant.bankAccountNumber.slice(-4)}` : '—'} mono />
                <DetailRow label="Commission Rate" value={`${Number(selectedSettlement.platformCommissionPercentage) || 0}%`} />
              </div>
            </div>

            {/* Financial Breakdown */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Financial Breakdown
              </h4>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <FinanceRow label="Gross Sales (GMV)" value={formatCurrency(selectedSettlement.grossSales)} />
                  <FinanceRow
                    label={`Platform Commission (${Number(selectedSettlement.platformCommissionPercentage) || 0}%)`}
                    value={`-${formatCurrency(selectedSettlement.platformCommissionAmount)}`}
                    color="var(--danger)"
                  />
                  <FinanceRow label="TDS Deducted" value={`-${formatCurrency(selectedSettlement.taxDeducted)}`} color="var(--slate-600)" />
                  <div style={{ borderTop: '2px solid var(--border-light)', margin: '4px 0' }} />
                  <FinanceRow label="Net Payout" value={formatCurrency(selectedSettlement.netPayoutAmount)} color="var(--success)" bold />
                </div>
              </div>
            </div>

            {/* Settlement Status */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Payout Status
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <DetailRow label="Status" value={getSettlementStatusBadge(selectedSettlement.status)} />
                <DetailRow label="Payout Provider" value={selectedSettlement.payoutProvider || '—'} />
                <DetailRow label="UTR Number" value={selectedSettlement.utrNumber || '—'} mono />
                <DetailRow label="Stripe Transfer" value={selectedSettlement.stripeTransferId || '—'} mono />
                <DetailRow label="Processed At" value={formatDate(selectedSettlement.processedAt)} />
                <DetailRow label="Paid At" value={formatDate(selectedSettlement.paidAt)} />
              </div>
            </div>

            {/* Four-Eyes / Maker-Checker */}
            {selectedSettlement.requiresFourEyes && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--warning-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--warning)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning)', marginBottom: '6px' }}>
                  🔒 Four-Eyes (Maker-Checker) Required
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--slate-500)' }}>Maker:</span>{' '}
                    <strong>{selectedSettlement.makerEmployeeEmail || 'Not assigned'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)' }}>Checker:</span>{' '}
                    <strong>{selectedSettlement.checkerManagerEmail || 'Not assigned'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Failure Reason */}
            {selectedSettlement.failureReason && (
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
                  {selectedSettlement.failureReason}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* =================== GENERATE BATCH MODAL =================== */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          if (!isGenerating) setShowGenerateModal(false);
        }}
        title="Generate Settlement Batch"
        description="Calculate and create settlement records for all eligible merchants based on recent completed orders."
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGenerateModal(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Layers size={14} />}
              onClick={handleGenerateBatch}
              isLoading={isGenerating}
              disabled={isGenerating || !!generateResult}
            >
              Generate Batch
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {generateResult && (
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
              {generateResult}
            </div>
          )}

          {generateError && (
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
              {generateError}
            </div>
          )}

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: '13px',
              color: 'var(--slate-700)',
              lineHeight: '1.6',
            }}
          >
            <p style={{ margin: '0 0 8px 0' }}>This action will:</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Scan all delivered orders with unpaid settlements</li>
              <li>Calculate commission, TDS deductions, and net payout for each merchant</li>
              <li>Create settlement records in PENDING status</li>
              <li>Flag high-value settlements for Maker-Checker approval</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* =================== PAYOUT EXECUTION MODAL =================== */}
      <Modal
        isOpen={showPayoutModal}
        onClose={() => {
          if (!isSubmittingPayout) {
            setShowPayoutModal(false);
            setShowPayoutConfirm(false);
          }
        }}
        title="Execute Payout"
        description={
          payoutSettlement
            ? `Payout for ${payoutSettlement.restaurant?.name || `STL-${payoutSettlement.id}`} — Net: ${formatCurrency(payoutSettlement.netPayoutAmount)}`
            : ''
        }
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPayoutModal(false);
                setShowPayoutConfirm(false);
              }}
              disabled={isSubmittingPayout}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<BanknoteIcon size={14} />}
              onClick={handleSubmitPayout}
              isLoading={isSubmittingPayout}
              disabled={isSubmittingPayout || !!payoutSuccess}
            >
              {showPayoutConfirm ? 'Confirm Payout' : 'Execute Payout'}
            </Button>
          </div>
        }
      >
        {payoutSettlement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Success */}
            {payoutSuccess && (
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
                {payoutSuccess}
              </div>
            )}

            {/* Error */}
            {payoutError && (
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
                {payoutError}
              </div>
            )}

            {/* Confirmation Banner */}
            {showPayoutConfirm && !payoutSuccess && (
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
                <strong>⚠️ Please confirm:</strong> You are about to transfer{' '}
                <strong>{formatCurrency(payoutSettlement.netPayoutAmount)}</strong> to{' '}
                <strong>{payoutSettlement.restaurant?.name || 'merchant'}</strong> via{' '}
                <strong>{payoutProvider === 'STRIPE' ? 'Stripe Connect' : 'Manual Bank Transfer'}</strong>.
                {payoutProvider === 'MANUAL_BANK' && payoutUtr && (
                  <> UTR: <strong>{payoutUtr}</strong>.</>
                )}
              </div>
            )}

            {/* Payout summary */}
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
                  <span style={{ color: 'var(--slate-500)' }}>Merchant:</span>{' '}
                  <strong>{payoutSettlement.restaurant?.name || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Net Payout:</span>{' '}
                  <strong style={{ color: 'var(--success)' }}>{formatCurrency(payoutSettlement.netPayoutAmount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Bank IFSC:</span>{' '}
                  <strong className="font-mono">{payoutSettlement.restaurant?.bankIfscCode || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Account:</span>{' '}
                  <strong className="font-mono">
                    {payoutSettlement.restaurant?.bankAccountNumber
                      ? `****${payoutSettlement.restaurant.bankAccountNumber.slice(-4)}`
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Payout Provider */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Payout Provider *
              </label>
              <select
                value={payoutProvider}
                onChange={(e) => {
                  setPayoutProvider(e.target.value as 'STRIPE' | 'MANUAL_BANK');
                  setShowPayoutConfirm(false);
                  setPayoutError(null);
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  backgroundColor: 'white',
                }}
                disabled={isSubmittingPayout || !!payoutSuccess}
              >
                <option value="MANUAL_BANK">Manual Bank Transfer (NEFT/IMPS)</option>
                <option value="STRIPE">Stripe Connect</option>
              </select>
            </div>

            {/* UTR (required for manual bank) */}
            {payoutProvider === 'MANUAL_BANK' && (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                  UTR Number *
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Enter bank transaction reference (UTR)"
                  value={payoutUtr}
                  onChange={(e) => {
                    setPayoutUtr(e.target.value);
                    setShowPayoutConfirm(false);
                    setPayoutError(null);
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                  disabled={isSubmittingPayout || !!payoutSuccess}
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Notes (optional)
              </label>
              <textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Add any notes about this payout (e.g., manual override reason)"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
                disabled={isSubmittingPayout || !!payoutSuccess}
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
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
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
          fontWeight: 500,
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================================
// Finance breakdown row
// ============================================================================

function FinanceRow({
  label,
  value,
  color,
  bold = false,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: 'var(--slate-600)' }}>{label}</span>
      <span
        style={{
          fontSize: bold ? '15px' : '13px',
          fontWeight: bold ? 700 : 600,
          color: color || 'var(--slate-800)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
