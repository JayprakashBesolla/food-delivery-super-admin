'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Inbox, CheckCircle2, AlertCircle, Clock, ShieldCheck, 
  UserCheck, PlusCircle, RefreshCw, AlertTriangle,
  Filter, ShieldAlert
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingState';
import { 
  fetchDepartmentQueue, 
  fetchDepartmentQueueSummary, 
  createWorkQueueTask, 
  claimWorkQueueTask, 
  submitMakerReview, 
  approveChecker, 
  completeWorkQueueTask, 
  fetchMyClaimedTasks, 
  fetchSlaBreachedTasks, 
  triggerSlaEscalation 
} from '@/lib/api';
import { Department, OperationalTask, DepartmentQueueSummaryDTO, CreateTaskRequest, TaskStatus } from '@/types/superadmin';

export default function WorkQueuesPage() {
  const [selectedDept, setSelectedDept] = useState<Department>('FINANCE');
  const [viewTab, setViewTab] = useState<'QUEUE' | 'MY_CLAIMED' | 'SLA_BREACHED'>('QUEUE');
  
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [summary, setSummary] = useState<DepartmentQueueSummaryDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Filter for Queue view
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [makerModalTask, setMakerModalTask] = useState<OperationalTask | null>(null);
  const [makerNotes, setMakerNotes] = useState('');
  
  const [checkerModalTask, setCheckerModalTask] = useState<OperationalTask | null>(null);
  const [checkerNotes, setCheckerNotes] = useState('');
  
  const [completeModalTask, setCompleteModalTask] = useState<OperationalTask | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  // Create Task Form State
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    department: 'FINANCE',
    taskType: 'SETTLEMENT_REVIEW',
    priority: 'HIGH',
    entityType: 'SETTLEMENT',
    entityId: '',
    amount: 0,
    city: 'Hyderabad',
    description: '',
    slaMinutes: 120,
    requiresFourEyes: true,
  });

  const loadQueueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Department KPI summary
      const sum = await fetchDepartmentQueueSummary(selectedDept);
      setSummary(sum);

      // Load task list based on active view tab
      let list: OperationalTask[] = [];
      if (viewTab === 'QUEUE') {
        const statusParam = statusFilter === 'ALL' ? undefined : (statusFilter as TaskStatus);
        list = await fetchDepartmentQueue(selectedDept, statusParam);
      } else if (viewTab === 'MY_CLAIMED') {
        list = await fetchMyClaimedTasks();
      } else if (viewTab === 'SLA_BREACHED') {
        list = await fetchSlaBreachedTasks();
      }
      setTasks(list || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load departmental work queue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, viewTab, statusFilter]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Handle Task Claiming
  const handleClaim = async (taskId: number) => {
    try {
      setActionLoading(true);
      setError(null);
      await claimWorkQueueTask(taskId);
      setSuccessMsg(`Task #${taskId} claimed successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadQueueData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim task');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Maker Submission
  const handleSubmitMaker = async () => {
    if (!makerModalTask) return;
    if (!makerNotes.trim()) {
      setError('Maker review notes are required before submitting for Checker signoff.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await submitMakerReview(makerModalTask.id, { reviewNotes: makerNotes.trim() });
      setSuccessMsg(`Task #${makerModalTask.id} Maker Review submitted for Checker signoff.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setMakerModalTask(null);
      setMakerNotes('');
      loadQueueData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit Maker review');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Checker Decision
  const handleCheckerDecision = async (approved: boolean) => {
    if (!checkerModalTask) return;
    if (!approved && !checkerNotes.trim()) {
      setError('A mandatory rejection reason is required to reject a task.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await approveChecker(checkerModalTask.id, { approved, checkerNotes: checkerNotes.trim() });
      setSuccessMsg(`Task #${checkerModalTask.id} has been ${approved ? 'APPROVED' : 'REJECTED'} by Checker.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setCheckerModalTask(null);
      setCheckerNotes('');
      loadQueueData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checker decision rejected by backend rule');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Normal Task Completion
  const handleCompleteTask = async () => {
    if (!completeModalTask) return;
    try {
      setActionLoading(true);
      setError(null);
      await completeWorkQueueTask(completeModalTask.id, { resolutionNotes: resolutionNotes.trim() || undefined });
      setSuccessMsg(`Task #${completeModalTask.id} marked COMPLETED.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setCompleteModalTask(null);
      setResolutionNotes('');
      loadQueueData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.description.trim()) {
      setError('Task description is mandatory');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await createWorkQueueTask({
        ...newTask,
        department: selectedDept,
      });
      setSuccessMsg('Operational task created and routed to departmental queue.');
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsCreateModalOpen(false);
      setNewTask({
        department: selectedDept,
        taskType: 'SETTLEMENT_REVIEW',
        priority: 'HIGH',
        entityType: 'SETTLEMENT',
        entityId: '',
        amount: 0,
        city: 'Hyderabad',
        description: '',
        slaMinutes: 120,
        requiresFourEyes: true,
      });
      loadQueueData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Escalation
  const handleTriggerEscalation = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await triggerSlaEscalation();
      setSuccessMsg(`SLA Auto-escalation run completed. ${JSON.stringify(res)}`);
      setTimeout(() => setSuccessMsg(null), 5000);
      loadQueueData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to trigger SLA escalation');
    } finally {
      setActionLoading(false);
    }
  };

  const priorityBadgeVariant = (p: string): BadgeVariant => {
    switch (p?.toUpperCase()) {
      case 'URGENT':
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'brand';
      case 'LOW': return 'neutral';
      default: return 'neutral';
    }
  };

  const statusBadgeVariant = (s: string): BadgeVariant => {
    switch (s?.toUpperCase()) {
      case 'PENDING': return 'warning';
      case 'CLAIMED': return 'brand';
      case 'IN_REVIEW': return 'info';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  };

  const columns: Column<OperationalTask>[] = [
    {
      key: 'taskNumber',
      header: 'Task #',
      width: '110px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-900)' }}>
          {item.taskNumber || `#${item.id}`}
        </span>
      ),
    },
    {
      key: 'taskType',
      header: 'Task Type & Details',
      render: (item) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: '13px' }}>
              {item.taskType || item.title || 'OPERATIONAL_EXCEPTION'}
            </span>
            {item.requiresFourEyesApproval && (
              <Badge variant="info" size="sm" style={{ fontWeight: 700 }}>
                Four-Eyes Required
              </Badge>
            )}
            {item.slaBreached && (
              <Badge variant="danger" size="sm">
                SLA Breached
              </Badge>
            )}
          </div>
          <div 
            style={{ 
              fontSize: '12px', 
              color: 'var(--slate-600)', 
              marginTop: '4px',
              maxWidth: '320px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={item.description}
          >
            {item.description}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '90px',
      render: (item) => (
        <Badge variant={priorityBadgeVariant(item.priority)} size="sm">
          {item.priority}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entity / City',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-800)' }}>
            {item.entityType || 'GLOBAL'} {item.entityId ? `#${item.entityId}` : ''}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            {item.city || 'All Cities'} {item.entityAmount ? `• ₹${Number(item.entityAmount).toLocaleString()}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status & Governance',
      render: (item) => (
        <div>
          <Badge variant={statusBadgeVariant(item.status)} size="sm">
            {item.status}
          </Badge>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '4px' }}>
            {item.status === 'PENDING' && 'Unassigned'}
            {item.status === 'CLAIMED' && `Claimed: ${item.makerUser?.name || item.claimedBy?.name || 'Staff'}`}
            {item.status === 'IN_REVIEW' && `Maker: ${item.makerUser?.name || 'Submitted'} → Awaiting Checker`}
            {item.status === 'COMPLETED' && `Approved by: ${item.checkerUser?.name || 'Admin'}`}
            {item.status === 'REJECTED' && `Rejected by: ${item.checkerUser?.name || 'Admin'}`}
          </div>
        </div>
      ),
    },
    {
      key: 'sla',
      header: 'SLA Window',
      width: '120px',
      render: (item) => (
        <div style={{ fontSize: '11px', color: 'var(--slate-600)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} style={{ color: item.slaBreached ? 'var(--danger)' : 'var(--slate-400)' }} />
            <span>{item.slaMinutes || 120} mins</span>
          </div>
          {item.slaDeadline && (
            <div style={{ color: item.slaBreached ? 'var(--danger)' : 'var(--slate-500)', marginTop: '2px' }}>
              {new Date(item.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Workflow Action',
      align: 'right',
      render: (item) => {
        if (item.status === 'PENDING') {
          return (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleClaim(item.id)}
              disabled={actionLoading}
            >
              Claim Task
            </Button>
          );
        }

        if (item.status === 'CLAIMED') {
          if (item.requiresFourEyesApproval) {
            return (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => {
                  setMakerModalTask(item);
                  setMakerNotes(item.makerNotes || '');
                }}
                disabled={actionLoading}
              >
                Submit Maker Review
              </Button>
            );
          } else {
            return (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  setCompleteModalTask(item);
                  setResolutionNotes('');
                }}
                disabled={actionLoading}
              >
                Complete
              </Button>
            );
          }
        }

        if (item.status === 'IN_REVIEW') {
          return (
            <Button 
              variant="secondary" 
              size="sm" 
              style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
              onClick={() => {
                setCheckerModalTask(item);
                setCheckerNotes('');
              }}
              disabled={actionLoading}
            >
              Checker Decision
            </Button>
          );
        }

        return (
          <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
            Closed
          </span>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Departmental Work Queues – Maker-Checker"
        subtitle="Transactional operational queues enforcing dual-authorization (Four-Eyes principle) and SLA tracking."
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Maker-Checker Work Queues' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<Clock size={14} />}
              onClick={handleTriggerEscalation}
              disabled={actionLoading}
              title="Run automated SLA breach evaluator"
            >
              Escalate Overdue
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={loadQueueData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              leftIcon={<PlusCircle size={14} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Task
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
          <strong>Queue Error:</strong> {error}
        </div>
      )}

      {successMsg && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#DCFCE7', 
          border: '1px solid #4ADE80', 
          borderRadius: '8px', 
          color: '#166534', 
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Department Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        {(['FINANCE', 'OPERATIONS', 'SUPPORT'] as Department[]).map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: selectedDept === dept ? 'var(--brand-primary)' : 'transparent',
              color: selectedDept === dept ? '#ffffff' : 'var(--slate-600)',
              transition: 'all 0.2s',
            }}
          >
            {dept === 'FINANCE' && '💰 Finance & Settlements'}
            {dept === 'OPERATIONS' && '⚡ Fleet & Merchant Operations'}
            {dept === 'SUPPORT' && '🎧 Customer Dispute Support'}
          </button>
        ))}
      </div>

      {/* KPI Cards from Summary */}
      <div className="dashboard-grid">
        <StatCard
          title="Pending in Queue"
          value={summary?.pendingCount ?? 0}
          icon={Inbox}
          iconColor="var(--warning)"
          badge="Unclaimed"
        />
        <StatCard
          title="Claimed / In-Progress"
          value={summary?.claimedCount ?? 0}
          icon={UserCheck}
          iconColor="var(--brand-primary)"
          badge="Maker Stage"
        />
        <StatCard
          title="In Review (Checker)"
          value={summary?.inReviewCount ?? 0}
          icon={ShieldCheck}
          iconColor="#8B5CF6"
          badge="Dual Signoff"
        />
        <StatCard
          title="SLA Breached"
          value={summary?.slaBreachedCount ?? 0}
          icon={AlertCircle}
          iconColor="var(--danger)"
          badge="Critical"
        />
      </div>

      {/* View Tabs & Status Filters */}
      <div className="admin-card" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setViewTab('QUEUE')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              backgroundColor: viewTab === 'QUEUE' ? 'var(--slate-900)' : '#ffffff',
              color: viewTab === 'QUEUE' ? '#ffffff' : 'var(--slate-700)',
            }}
          >
            All Department Tasks
          </button>
          <button
            onClick={() => setViewTab('MY_CLAIMED')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              backgroundColor: viewTab === 'MY_CLAIMED' ? 'var(--slate-900)' : '#ffffff',
              color: viewTab === 'MY_CLAIMED' ? '#ffffff' : 'var(--slate-700)',
            }}
          >
            My Claimed Tasks
          </button>
          <button
            onClick={() => setViewTab('SLA_BREACHED')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              backgroundColor: viewTab === 'SLA_BREACHED' ? '#EF4444' : '#ffffff',
              color: viewTab === 'SLA_BREACHED' ? '#ffffff' : 'var(--danger)',
            }}
          >
            SLA Breached Tasks
          </button>
        </div>

        {viewTab === 'QUEUE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} style={{ color: 'var(--slate-500)' }} />
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '32px', fontSize: '12px', minWidth: '140px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Unassigned)</option>
              <option value="CLAIMED">Claimed (In Progress)</option>
              <option value="IN_REVIEW">In Review (Awaiting Checker)</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Task Table */}
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
              {selectedDept} Operational Queue
            </h3>
            <Badge variant="neutral" size="sm">{tasks.length} Items</Badge>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
            Maker-Checker Isolation Enforced
          </span>
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching live department tasks..." />
        ) : (
          <DataTable<OperationalTask>
            columns={columns}
            data={tasks}
            keyExtractor={(item) => String(item.id)}
            emptyTitle="No Tasks in Queue"
            emptyDescription="There are currently no open exception tasks matching this departmental filter."
          />
        )}
      </div>

      {/* Modal 1: Create Task */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={`Create Operational Exception Task (${selectedDept})`}
          size="md"
        >
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Task Type</label>
              <select
                className="input-field"
                value={newTask.taskType}
                onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}
                required
              >
                <option value="SETTLEMENT_REVIEW">SETTLEMENT_REVIEW (High-Value Merchant Payout)</option>
                <option value="PAYMENT_FAILURE">PAYMENT_FAILURE (Gateway Transaction Drop)</option>
                <option value="REFUND_DISPUTE">REFUND_DISPUTE (Customer Bank Chargeback)</option>
                <option value="KYC_ESCALATION">KYC_ESCALATION (Merchant Document Verification)</option>
                <option value="RIDER_BOTTLENECK">RIDER_BOTTLENECK (Unassigned Delivery Escalation)</option>
                <option value="FRAUD_ALERT">FRAUD_ALERT (Suspicious Account Activity)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Priority</label>
                <select
                  className="input-field"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>SLA Window (Mins)</label>
                <input
                  type="number"
                  className="input-field"
                  value={newTask.slaMinutes}
                  onChange={(e) => setNewTask({ ...newTask, slaMinutes: Number(e.target.value) })}
                  min={15}
                  max={1440}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Target Entity Type</label>
                <select
                  className="input-field"
                  value={newTask.entityType}
                  onChange={(e) => setNewTask({ ...newTask, entityType: e.target.value })}
                >
                  <option value="SETTLEMENT">SETTLEMENT</option>
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="ORDER">ORDER</option>
                  <option value="RESTAURANT">RESTAURANT</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="RIDER">RIDER</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Target Entity ID</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 101 or pi_stripe_..."
                  value={newTask.entityId}
                  onChange={(e) => setNewTask({ ...newTask, entityId: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Amount (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={newTask.amount || ''}
                  onChange={(e) => setNewTask({ ...newTask, amount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Operating City</label>
                <input
                  type="text"
                  className="input-field"
                  value={newTask.city}
                  onChange={(e) => setNewTask({ ...newTask, city: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Description & Operational Details</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Explain the anomaly or exception requiring departmental review..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'var(--slate-50)', borderRadius: '6px' }}>
              <input
                type="checkbox"
                id="fourEyesToggle"
                checked={newTask.requiresFourEyes}
                onChange={(e) => setNewTask({ ...newTask, requiresFourEyes: e.target.checked })}
              />
              <label htmlFor="fourEyesToggle" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
                Enforce Maker-Checker (Four-Eyes Approval)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={actionLoading}>
                {actionLoading ? 'Creating...' : 'Create & Route Task'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Maker Review Submission */}
      {makerModalTask && (
        <Modal
          isOpen={!!makerModalTask}
          onClose={() => setMakerModalTask(null)}
          title={`Maker Review for Task #${makerModalTask.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{makerModalTask.taskType}</div>
              <div style={{ color: 'var(--slate-600)', marginTop: '4px' }}>{makerModalTask.description}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Maker Investigation & Recommendation Notes (Mandatory)
              </label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Document your findings, verified KYC/bank records, calculations, or reason for recommending approval..."
                value={makerNotes}
                onChange={(e) => setMakerNotes(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setMakerModalTask(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmitMaker}
                disabled={actionLoading || !makerNotes.trim()}
              >
                {actionLoading ? 'Submitting...' : 'Submit to Checker for Signoff'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: Checker Decision (Approve / Reject) */}
      {checkerModalTask && (
        <Modal
          isOpen={!!checkerModalTask}
          onClose={() => setCheckerModalTask(null)}
          title={`Checker Signoff for Task #${checkerModalTask.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{checkerModalTask.taskType}</div>
              <div style={{ color: 'var(--slate-600)', marginTop: '4px' }}>{checkerModalTask.description}</div>
              <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#EFF6FF', borderRadius: '4px', borderLeft: '3px solid #3B82F6' }}>
                <span style={{ fontWeight: 600, fontSize: '11px', color: '#1D4ED8', textTransform: 'uppercase' }}>
                  Maker Notes ({checkerModalTask.makerUser?.name || 'Maker'}):
                </span>
                <div style={{ marginTop: '2px', color: '#1E3A8A' }}>
                  {checkerModalTask.makerNotes || 'No notes attached.'}
                </div>
              </div>
            </div>

            <div style={{ padding: '10px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', color: '#92400E', fontSize: '12px' }}>
              <ShieldAlert size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              <strong>Maker-Checker Isolation:</strong> You are evaluating as Checker. The backend will enforce that you cannot approve this task if you were the Maker who submitted it.
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Checker Signoff / Rejection Reason
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Enter signoff confirmation or mandatory rejection reason..."
                value={checkerNotes}
                onChange={(e) => setCheckerNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setCheckerModalTask(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleCheckerDecision(false)}
                disabled={actionLoading}
              >
                Reject Task
              </Button>
              <Button 
                variant="primary" 
                style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                onClick={() => handleCheckerDecision(true)}
                disabled={actionLoading}
              >
                Approve & Execute
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 4: Complete Normal Task */}
      {completeModalTask && (
        <Modal
          isOpen={!!completeModalTask}
          onClose={() => setCompleteModalTask(null)}
          title={`Complete Task #${completeModalTask.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600 }}>{completeModalTask.taskType}</div>
              <div style={{ color: 'var(--slate-600)', marginTop: '4px' }}>{completeModalTask.description}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Resolution Notes (Optional)
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Describe how this task was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setCompleteModalTask(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCompleteTask}
                disabled={actionLoading}
              >
                {actionLoading ? 'Completing...' : 'Mark Completed'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
