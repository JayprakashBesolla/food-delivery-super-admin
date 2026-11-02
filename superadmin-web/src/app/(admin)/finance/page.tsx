'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Download,
  Calendar,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Landmark,
  Layers,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FinanceReportDTO,
  PaymentTransaction,
  SettlementRecord,
  fetchFinanceFullReport,
  fetchAllTransactions,
  fetchSettlementHistory,
  ApiError,
} from '@/lib/api';

interface FinancialJournalEntry {
  id: string;
  reference: string;
  category: 'REVENUE' | 'TAX' | 'SETTLEMENT' | 'REFUND' | 'DELIVERY';
  description: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: string;
  date: string;
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

export default function FinancePage() {
  const [report, setReport] = useState<FinanceReportDTO | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TRANSACTIONS' | 'SETTLEMENTS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadFinancialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rep, txns, stls] = await Promise.all([
        fetchFinanceFullReport(),
        fetchAllTransactions().catch(() => [] as PaymentTransaction[]),
        fetchSettlementHistory().catch(() => [] as SettlementRecord[]),
      ]);
      setReport(rep);
      setTransactions(Array.isArray(txns) ? txns : []);
      setSettlements(Array.isArray(stls) ? stls : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to compile financial ledger';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Build Journal Entries from Real Backend Records
  const journalEntries: FinancialJournalEntry[] = [];

  // 1. Transactions
  transactions.forEach((t) => {
    const isRefund = t.status === 'REFUNDED' || (Number(t.refundAmount) || 0) > 0;
    journalEntries.push({
      id: `TXN-${t.id}`,
      reference: t.transactionReference || `TXN-${t.id}`,
      category: isRefund ? 'REFUND' : 'REVENUE',
      description: `Customer Payment • Order #${t.order?.orderId || t.order?.id || '—'} (${t.provider})`,
      grossAmount: Number(t.amount) || 0,
      deductions: Number(t.gatewayFee) || 0,
      netAmount: (Number(t.amount) || 0) - (Number(t.gatewayFee) || 0),
      status: t.status,
      date: t.createdAt,
    });
  });

  // 2. Settlements
  settlements.forEach((s) => {
    journalEntries.push({
      id: `STL-${s.id}`,
      reference: s.utrNumber || `STL-${s.id}`,
      category: 'SETTLEMENT',
      description: `Merchant Disbursal • ${s.restaurant?.name || 'Merchant'} (Commission: ${s.platformCommissionPercentage}%)`,
      grossAmount: Number(s.grossSales) || 0,
      deductions: (Number(s.platformCommissionAmount) || 0) + (Number(s.taxDeducted) || 0),
      netAmount: Number(s.netPayoutAmount) || 0,
      status: s.status,
      date: s.paidAt || s.processedAt,
    });
  });

  // Filtered Journal
  const filteredJournal = journalEntries.filter((entry) => {
    if (categoryFilter === 'TRANSACTIONS' && entry.category === 'SETTLEMENT') return false;
    if (categoryFilter === 'SETTLEMENTS' && entry.category !== 'SETTLEMENT') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.reference.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term) ||
      entry.category.toLowerCase().includes(term) ||
      entry.status.toLowerCase().includes(term)
    );
  });

  // CSV Export
  const handleExportCSV = () => {
    if (filteredJournal.length === 0) return;
    const headers = ['Entry ID', 'Reference', 'Category', 'Description', 'Gross Amount (INR)', 'Deductions (INR)', 'Net Amount (INR)', 'Status', 'Date'];
    const rows = filteredJournal.map((j) => [
      j.id,
      j.reference,
      j.category,
      `"${j.description.replace(/"/g, '""')}"`,
      j.grossAmount.toFixed(2),
      j.deductions.toFixed(2),
      j.netAmount.toFixed(2),
      j.status,
      j.date,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FoodApp_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<FinancialJournalEntry>[] = [
    {
      key: 'id',
      header: 'Entry #',
      width: '110px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>{item.id}</span>,
    },
    {
      key: 'description',
      header: 'Accounting Head & Description',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.description}</div>
          <div className="font-mono" style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            Ref: {item.reference}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Classification',
      render: (item) => {
        const variantMap = {
          REVENUE: 'success' as const,
          SETTLEMENT: 'brand' as const,
          REFUND: 'danger' as const,
          TAX: 'warning' as const,
          DELIVERY: 'info' as const,
        };
        return (
          <Badge variant={variantMap[item.category] || 'neutral'} size="sm">
            {item.category}
          </Badge>
        );
      },
    },
    {
      key: 'grossAmount',
      header: 'Gross (GMV)',
      align: 'right',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--slate-800)', fontWeight: 500 }}>
          {formatCurrency(item.grossAmount)}
        </span>
      ),
    },
    {
      key: 'deductions',
      header: 'Fees / Withholding',
      align: 'right',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--danger)' }}>
          {item.deductions > 0 ? `-${formatCurrency(item.deductions)}` : '₹0.00'}
        </span>
      ),
    },
    {
      key: 'netAmount',
      header: 'Net Realized',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13px' }}>
          {formatCurrency(item.netAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const variantMap = {
          SUCCESS: 'success' as const,
          PAID: 'success' as const,
          PENDING: 'warning' as const,
          PROCESSING: 'brand' as const,
          FAILED: 'danger' as const,
          REFUNDED: 'danger' as const,
        };
        return (
          <Badge variant={variantMap[item.status as keyof typeof variantMap] || 'neutral'} withDot size="sm">
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'date',
      header: 'Timestamp',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatDate(item.date)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Financial Ledger & Revenue Reporting"
        subtitle="Ground-truth revenue analytics, commission realization, tax withholdings, and double-entry merchant journals."
        breadcrumbs={[{ label: 'Financials' }, { label: 'Finance Reports' }]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={loadFinancialData}
              disabled={isLoading}
            >
              Refresh Ledger
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleExportCSV}
              disabled={filteredJournal.length === 0}
            >
              Export Financial CSV
            </Button>
          </div>
        }
      />

      {/* Primary KPI Grid */}
      <div className="dashboard-grid">
        <StatCard
          title="Gross Merchandise Value (GMV)"
          value={formatCurrency(report?.totalGrossMerchandiseValue)}
          icon={TrendingUp}
          iconColor="var(--brand-primary)"
          badge="Delivered Orders"
        />
        <StatCard
          title="Platform Commission Revenue"
          value={formatCurrency(report?.platformCommissionEarned)}
          icon={DollarSign}
          iconColor="var(--success)"
          badge="Merchant Take Rate"
        />
        <StatCard
          title="Tax / GST Accrual"
          value={formatCurrency(report?.totalTaxCollected)}
          icon={PieChart}
          iconColor="var(--warning)"
          badge="Collected Tax"
        />
        <StatCard
          title="Net Platform Earnings"
          value={formatCurrency(report?.netPlatformEarnings)}
          icon={FileSpreadsheet}
          iconColor="#8b5cf6"
          badge="Post-Refund Margins"
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

      {/* Financial Health Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Logistics & Packaging Income */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Layers size={18} color="var(--info)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Operational Fee Collection
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--slate-600)' }}>Delivery Fees Collected:</span>
              <strong>{formatCurrency(report?.totalDeliveryFeesCollected)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--slate-600)' }}>Packaging Fees Collected:</span>
              <strong>{formatCurrency(report?.totalPackagingFeesCollected)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--slate-600)' }}>Refunds & Disputes Deducted:</span>
              <strong style={{ color: 'var(--danger)' }}>
                -{formatCurrency(report?.totalRefundsIssued)}
              </strong>
            </div>
          </div>
        </div>

        {/* Transaction Volume Summary */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldCheck size={18} color="var(--success)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Gateway Reconciliation Summary
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--slate-600)' }}>Total Payment Invocations:</span>
              <strong>{report?.totalTransactions ?? 0} transactions</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--slate-600)' }}>Successfully Captured:</span>
              <strong style={{ color: 'var(--success)' }}>
                {report?.successfulTransactions ?? 0} successful
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--slate-600)' }}>Refund Invocations:</span>
              <strong style={{ color: 'var(--danger)' }}>
                {report?.refundedTransactions ?? 0} refunded
              </strong>
            </div>
          </div>
        </div>

        {/* Sector Gross Merchandise Value */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Landmark size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Gross Volume by Sector
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
            {report?.gmvBySector && Object.keys(report.gmvBySector).length > 0 ? (
              Object.entries(report.gmvBySector).map(([sec, gmvVal]) => (
                <div key={sec} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant="neutral" size="sm">{sec}</Badge>
                  <strong style={{ color: 'var(--slate-900)' }}>{formatCurrency(gmvVal)}</strong>
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--slate-500)', fontSize: '12px' }}>
                No sectoral GMV transactions recorded yet.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unified Transaction & Settlement Journal */}
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
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Audited Financial Journal
            </h3>
            <Badge variant="neutral" size="sm">{filteredJournal.length} Entries</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search */}
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
                placeholder="Filter by ref, order, counterparty..."
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

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ALL', 'TRANSACTIONS', 'SETTLEMENTS'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: categoryFilter === cat ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    backgroundColor: categoryFilter === cat ? 'var(--brand-primary-light)' : 'white',
                    color: categoryFilter === cat ? 'var(--brand-primary)' : 'var(--slate-600)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DataTable<FinancialJournalEntry>
          columns={columns}
          data={filteredJournal}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Financial Entries"
          emptyDescription="There are currently no transactions or settlement records matching the filter."
        />
      </div>
    </div>
  );
}
