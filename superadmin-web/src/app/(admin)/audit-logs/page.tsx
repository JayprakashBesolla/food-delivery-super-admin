'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Filter, Download, Lock } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface AuditLogRow {
  id: string;
  actor: string;
  action: string;
  module: string;
  ipAddress: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  timestamp: string;
}

export default function AuditLogsPage() {
  const columns: Column<AuditLogRow>[] = [
    {
      key: 'id',
      header: 'Audit ID',
      width: '120px',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px' }}>{item.id}</span>,
    },
    {
      key: 'actor',
      header: 'Administrative Actor',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.actor}</div>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>ROLE_SUPERADMIN</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Event / Mutation',
      render: (item) => (
        <span
          className="font-mono"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--slate-800)',
            backgroundColor: 'var(--slate-100)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {item.action}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Affected Module',
      render: (item) => (
        <Badge variant="neutral" size="sm">
          {item.module}
        </Badge>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Source IP',
      render: (item) => <span className="font-mono" style={{ fontSize: '12px', color: 'var(--slate-600)' }}>{item.ipAddress}</span>,
    },
    {
      key: 'status',
      header: 'Execution Result',
      render: (item) => {
        const variantMap = {
          SUCCESS: 'success' as const,
          DENIED: 'danger' as const,
          FLAGGED: 'warning' as const,
        };
        return (
          <Badge variant={variantMap[item.status]} withDot size="sm">
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      render: (item) => <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{item.timestamp}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Security & Governance Audit Trail"
        subtitle="Immutable ledger of all Super Administrator mutations, permission alterations, and financial overrides."
        breadcrumbs={[
          { label: 'Governance' },
          { label: 'Audit Logs' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" size="sm" leftIcon={<Filter size={14} />}>
              Filter Module
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
              Export Immutable Audit
            </Button>
          </div>
        }
      />

      <div className="dashboard-grid">
        <StatCard
          title="Total Logged Events"
          value="--"
          icon={ShieldCheck}
          iconColor="var(--success)"
          badge="Audit Vault"
        />
        <StatCard
          title="Privileged Mutations"
          value="--"
          icon={Lock}
          iconColor="var(--brand-primary)"
          badge="Root Actions"
        />
        <StatCard
          title="Security Alerts"
          value="0"
          icon={ShieldAlert}
          iconColor="var(--danger)"
          badge="Zero Intrusions"
        />
        <StatCard
          title="Chain Integrity"
          value="100%"
          icon={ShieldCheck}
          iconColor="var(--success)"
          badge="Cryptographic"
        />
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
            <Badge variant="neutral" size="sm">0 Records</Badge>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
            Immutable Activity Log
          </span>
        </div>

        <DataTable<AuditLogRow>
          columns={columns}
          data={[]}
          keyExtractor={(item) => item.id}
          emptyTitle="No Audit Events Recorded"
          emptyDescription="Administrative mutations, policy updates, and security access events will be logged here."
        />
      </div>
    </div>
  );
}
