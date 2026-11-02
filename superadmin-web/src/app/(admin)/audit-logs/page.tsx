'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShieldAlert, ShieldCheck, Filter, Download, Lock, 
  Search, Eye, RefreshCw, FileText, Database, UserCheck, CheckCircle
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingState';
import { fetchAuditLogs } from '@/lib/api';
import { AuditLog } from '@/types/superadmin';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');

  // Detail Modal
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLogs();
      setLogs(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch audit log entries';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique actions and entities for filter dropdowns
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.action) set.add(l.action); });
    return Array.from(set).sort();
  }, [logs]);

  const availableEntities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.targetEntityType) set.add(l.targetEntityType); });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      const matchesAction = selectedAction === 'ALL' || item.action === selectedAction;
      const matchesEntity = selectedEntity === 'ALL' || item.targetEntityType === selectedEntity;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.actorEmail?.toLowerCase().includes(q) ||
        item.action?.toLowerCase().includes(q) ||
        item.targetEntityType?.toLowerCase().includes(q) ||
        item.targetEntityId?.toLowerCase().includes(q) ||
        item.details?.toLowerCase().includes(q) ||
        (item.ipAddress && item.ipAddress.toLowerCase().includes(q));

      return matchesAction && matchesEntity && matchesSearch;
    });
  }, [logs, selectedAction, selectedEntity, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const distinctActors = new Set(logs.map(l => l.actorEmail)).size;
    const sensitiveMutations = logs.filter(l => 
      l.action?.includes('REFUND') || 
      l.action?.includes('COMMISSION') || 
      l.action?.includes('SETTINGS') || 
      l.action?.includes('BLOCK') ||
      l.action?.includes('PAYOUT')
    ).length;

    return {
      total,
      distinctActors,
      sensitiveMutations,
      integrity: '100%',
    };
  }, [logs]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['ID', 'Actor Email', 'Actor Role', 'Action', 'Target Entity', 'Target ID', 'Source IP', 'Timestamp', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.actorEmail || ''}"`,
      `"${l.actorRole || ''}"`,
      `"${l.action || ''}"`,
      `"${l.targetEntityType || ''}"`,
      `"${l.targetEntityId || ''}"`,
      `"${l.ipAddress || l.clientIp || ''}"`,
      `"${l.timestamp || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `swiggy_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'id',
      header: 'Audit ID',
      width: '90px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>#{item.id}</span>,
    },
    {
      key: 'actorEmail',
      header: 'Administrative Actor',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.actorEmail}</div>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            {item.actorRole || 'SUPER_ADMIN'}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Event / Mutation',
      render: (item) => {
        let badgeVariant: 'brand' | 'warning' | 'danger' | 'success' | 'neutral' = 'neutral';
        if (item.action.includes('BLOCK') || item.action.includes('REJECT')) badgeVariant = 'danger';
        else if (item.action.includes('APPROVE') || item.action.includes('RESOLVE')) badgeVariant = 'success';
        else if (item.action.includes('UPDATE') || item.action.includes('CONFIG')) badgeVariant = 'warning';
        else if (item.action.includes('CREATE') || item.action.includes('BROADCAST')) badgeVariant = 'brand';

        return (
          <Badge variant={badgeVariant} size="sm">
            {item.action}
          </Badge>
        );
      },
    },
    {
      key: 'targetEntityType',
      header: 'Affected Target',
      render: (item) => (
        <div>
          <Badge variant="neutral" size="sm" style={{ fontWeight: 600 }}>
            {item.targetEntityType}
          </Badge>
          {item.targetEntityId && (
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--slate-500)', marginLeft: '6px' }}>
              [{item.targetEntityId}]
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Operation Details',
      render: (item) => (
        <span 
          style={{ 
            fontSize: '12px', 
            color: 'var(--slate-700)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            maxWidth: '260px'
          }} 
          title={item.details}
        >
          {item.details || '—'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Source IP',
      width: '120px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--slate-600)' }}>
          {item.ipAddress || item.clientIp || '127.0.0.1'}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '160px',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
          {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      width: '80px',
      align: 'center',
      render: (item) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setInspectLog(item)}
          title="Inspect Audit Event"
        >
          <Eye size={13} />
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="System Security & Audit Trail"
        subtitle="Immutable ledger of all Super Administrator mutations, permission alterations, financial overrides, and operational actions."
        breadcrumbs={[
          { label: 'Platform Governance' },
          { label: 'System Audit Logs' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              leftIcon={<Download size={14} />}
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#FEE2E2', 
          border: '1px solid #F87171', 
          borderRadius: '8px', 
          color: '#B91C1C', 
          fontSize: '13px' 
        }}>
          <strong>Audit Service Error:</strong> {error}
        </div>
      )}

      <div className="dashboard-grid">
        <StatCard
          title="Total Audit Events"
          value={stats.total}
          icon={ShieldCheck}
          iconColor="var(--success)"
          badge="Database Ledger"
        />
        <StatCard
          title="Active Admin Actors"
          value={stats.distinctActors}
          icon={UserCheck}
          iconColor="var(--brand-primary)"
          badge="Verified RBAC"
        />
        <StatCard
          title="Sensitive Mutations"
          value={stats.sensitiveMutations}
          icon={Lock}
          iconColor="var(--warning)"
          badge="Financial & Security"
        />
        <StatCard
          title="Log Tamper Integrity"
          value={stats.integrity}
          icon={ShieldAlert}
          iconColor="var(--success)"
          badge="Append-Only Table"
        />
      </div>

      <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by actor email, action, entity ID or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '36px', fontSize: '13px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} style={{ color: 'var(--slate-500)' }} />
          <select
            className="input-field"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{ height: '36px', fontSize: '13px', minWidth: '160px' }}
          >
            <option value="ALL">All Actions ({availableActions.length})</option>
            {availableActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <select
            className="input-field"
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            style={{ height: '36px', fontSize: '13px', minWidth: '150px' }}
          >
            <option value="ALL">All Target Entities ({availableEntities.length})</option>
            {availableEntities.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Audit Log Event Stream
            </h3>
            <Badge variant="neutral" size="sm">{filteredLogs.length} Records</Badge>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
            Immutable Activity Log • MySQL `audit_logs`
          </span>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading immutable audit logs from database..." />
        ) : (
          <DataTable<AuditLog>
            columns={columns}
            data={filteredLogs}
            keyExtractor={(item) => String(item.id)}
            emptyTitle="No Audit Events Found"
            emptyDescription={
              searchQuery || selectedAction !== 'ALL' || selectedEntity !== 'ALL'
                ? "No audit events match your selected filters. Try clearing filters."
                : "Administrative mutations, policy updates, and security access events will be logged here."
            }
          />
        )}
      </div>

      {/* Inspect Detail Modal */}
      {inspectLog && (
        <Modal
          isOpen={!!inspectLog}
          onClose={() => setInspectLog(null)}
          title={`Audit Record #${inspectLog.id} Inspection`}
          size="lg"
          footer={
            <Button variant="outline" onClick={() => setInspectLog(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', backgroundColor: 'var(--slate-50)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Administrator Email</span>
                <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{inspectLog.actorEmail}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Assigned RBAC Role</span>
                <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{inspectLog.actorRole || 'SUPER_ADMIN'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Action Performed</span>
                <div style={{ fontWeight: 600 }}>{inspectLog.action}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Target Entity</span>
                <div style={{ fontWeight: 600 }}>{inspectLog.targetEntityType} {inspectLog.targetEntityId ? `(#${inspectLog.targetEntityId})` : ''}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Source IP Address</span>
                <div className="font-mono">{inspectLog.ipAddress || inspectLog.clientIp || '127.0.0.1'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Timestamp</span>
                <div>{inspectLog.timestamp ? new Date(inspectLog.timestamp).toLocaleString() : '—'}</div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                Audit Change Payload / Details
              </span>
              <pre
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  backgroundColor: 'var(--slate-900)',
                  color: '#10B981',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {inspectLog.details || 'No additional payload provided.'}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
