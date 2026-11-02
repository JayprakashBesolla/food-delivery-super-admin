'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Headphones,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Eye,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  User,
  ShoppingBag,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  SupportTicket,
  OrderDispute,
  fetchSupportTickets,
  replyToSupportTicket,
  fetchSupportDisputes,
  resolveDispute,
  ApiError,
} from '@/lib/api';

type SupportTab = 'tickets' | 'disputes';

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

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<SupportTab>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Ticket Reply & Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [newTicketStatus, setNewTicketStatus] = useState<string>('IN_PROGRESS');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [ticketActionError, setTicketActionError] = useState<string | null>(null);
  const [ticketActionSuccess, setTicketActionSuccess] = useState<string | null>(null);

  // Dispute Resolution Modal
  const [selectedDispute, setSelectedDispute] = useState<OrderDispute | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeDecision, setDisputeDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [disputeRefundAmount, setDisputeRefundAmount] = useState<string>('');
  const [disputeAdminNotes, setDisputeAdminNotes] = useState<string>('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);
  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tList, dList] = await Promise.all([
        fetchSupportTickets(),
        fetchSupportDisputes(),
      ]);
      setTickets(Array.isArray(tList) ? tList : []);
      setDisputes(Array.isArray(dList) ? dList : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load support records';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate Stats
  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;
  const criticalTickets = tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const pendingDisputes = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length;
  const resolvedToday = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(term)) ||
      (t.subject && t.subject.toLowerCase().includes(term)) ||
      (t.category && t.category.toLowerCase().includes(term)) ||
      (t.user?.name && t.user.name.toLowerCase().includes(term)) ||
      (t.user?.email && t.user.email.toLowerCase().includes(term)) ||
      (t.order?.orderId && t.order.orderId.toLowerCase().includes(term)) ||
      String(t.id).includes(term)
    );
  });

  // Filtered Disputes
  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (d.disputeReason && d.disputeReason.toLowerCase().includes(term)) ||
      (d.order?.orderId && d.order.orderId.toLowerCase().includes(term)) ||
      (d.user?.name && d.user.name.toLowerCase().includes(term)) ||
      (d.restaurant?.name && d.restaurant.name.toLowerCase().includes(term)) ||
      String(d.id).includes(term)
    );
  });

  // Open Ticket Reply
  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setNewTicketStatus(ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status);
    setTicketActionError(null);
    setTicketActionSuccess(null);
    setIsTicketModalOpen(true);
  };

  // Submit Ticket Reply
  const handleSubmitTicketReply = async () => {
    if (!selectedTicket) return;
    if (!replyMessage.trim()) {
      setTicketActionError('Please enter a response message.');
      return;
    }

    setIsSubmittingReply(true);
    setTicketActionError(null);
    try {
      const updated = await replyToSupportTicket(selectedTicket.id, {
        message: replyMessage.trim(),
        newStatus: newTicketStatus,
      });
      setTicketActionSuccess('Response logged and ticket updated.');
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setTimeout(() => {
        setIsTicketModalOpen(false);
        setTicketActionSuccess(null);
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to reply to ticket';
      setTicketActionError(msg);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Open Dispute Resolution Modal
  const handleOpenDispute = (dispute: OrderDispute) => {
    setSelectedDispute(dispute);
    setDisputeDecision('APPROVE');
    const fullOrderVal = dispute.order?.totalAmount ?? 0;
    setDisputeRefundAmount(String(dispute.refundAmount || fullOrderVal));
    setDisputeAdminNotes('');
    setDisputeError(null);
    setDisputeSuccess(null);
    setShowDisputeConfirm(false);
    setIsDisputeModalOpen(true);
  };

  // Submit Dispute Resolution
  const handleSubmitDispute = async () => {
    if (!selectedDispute) return;

    if (!disputeAdminNotes.trim()) {
      setDisputeError('Admin resolution notes are mandatory for auditing.');
      return;
    }

    const isApprove = disputeDecision === 'APPROVE';
    const refundAmt = isApprove ? parseFloat(disputeRefundAmount) : 0;

    if (isApprove && (isNaN(refundAmt) || refundAmt <= 0)) {
      setDisputeError('Specify a valid refund amount greater than ₹0.');
      return;
    }

    if (!showDisputeConfirm) {
      setShowDisputeConfirm(true);
      return;
    }

    setIsSubmittingDispute(true);
    setDisputeError(null);
    try {
      const updated = await resolveDispute(selectedDispute.id, {
        approved: isApprove,
        refundAmount: isApprove ? refundAmt : 0,
        adminNotes: disputeAdminNotes.trim(),
      });

      setDisputeSuccess(
        isApprove
          ? `Dispute approved. Refund of ${formatCurrency(refundAmt)} processed to customer.`
          : 'Dispute rejected. Order status maintained.'
      );

      setDisputes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

      setTimeout(() => {
        setIsDisputeModalOpen(false);
        setDisputeSuccess(null);
        setShowDisputeConfirm(false);
      }, 1800);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to resolve dispute';
      setDisputeError(msg);
      setShowDisputeConfirm(false);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Ticket columns
  const ticketColumns: Column<SupportTicket>[] = [
    {
      key: 'id',
      header: 'Ticket #',
      width: '110px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>
          {item.ticketNumber || `TCK-${item.id}`}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Incident',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.subject}</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <Badge variant="neutral" size="sm">{item.category}</Badge>
            {item.order && (
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                Order #{item.order.orderId || item.order.id}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Requester',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: '12.5px' }}>
            {item.user?.name || 'Customer'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            {item.user?.email || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => {
        const variantMap: Record<string, 'danger' | 'warning' | 'neutral' | 'brand'> = {
          URGENT: 'danger',
          HIGH: 'danger',
          MEDIUM: 'warning',
          LOW: 'neutral',
        };
        return (
          <Badge variant={variantMap[item.priority] || 'neutral'} size="sm">
            {item.priority}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const variantMap: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = {
          OPEN: 'danger',
          IN_PROGRESS: 'warning',
          RESOLVED: 'success',
          CLOSED: 'neutral',
        };
        return (
          <Badge variant={variantMap[item.status] || 'neutral'} withDot size="sm">
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Logged',
      render: (item) => (
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '90px',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<MessageSquare size={13} />}
          onClick={() => handleOpenTicket(item)}
        >
          Reply
        </Button>
      ),
    },
  ];

  // Dispute columns
  const disputeColumns: Column<OrderDispute>[] = [
    {
      key: 'id',
      header: 'Dispute #',
      width: '110px',
      render: (item) => (
        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>
          DSP-{item.id}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order Reference',
      render: (item) => (
        <div>
          <span className="font-mono" style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
            #{item.order?.orderId || item.order?.id || '—'}
          </span>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
            Merchant: {item.restaurant?.name || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'disputeReason',
      header: 'Dispute Claim',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--danger)' }}>
            {item.disputeReason.replace('_', ' ')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-600)', maxWidth: '260px' }}>
            {item.disputeDetails || 'Customer filed claim for refund'}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Customer',
      render: (item) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-800)' }}>
          {item.user?.name || 'Customer'}
        </span>
      ),
    },
    {
      key: 'refundAmount',
      header: 'Refund Amount',
      align: 'right',
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13px' }}>
          {formatCurrency(item.refundAmount || item.order?.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Arbitration Status',
      render: (item) => {
        const variantMap: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = {
          OPEN: 'danger',
          UNDER_REVIEW: 'warning',
          RESOLVED_REFUNDED: 'success',
          REJECTED: 'neutral',
        };
        return (
          <Badge variant={variantMap[item.status] || 'neutral'} withDot size="sm">
            {item.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ShieldCheck size={13} />}
          onClick={() => handleOpenDispute(item)}
        >
          Arbitrate
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Support Incident Desk & Dispute Arbitration"
        subtitle="Customer inquiries, delivery quality disputes, merchant claim arbitrations, and authorized refund executions."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Support & Disputes' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={loadData}
            disabled={isLoading}
          >
            Refresh
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <StatCard
          title="Open Support Tickets"
          value={String(openTickets)}
          icon={Headphones}
          iconColor="var(--info)"
          badge="Awaiting Reply"
        />
        <StatCard
          title="Critical Escalations"
          value={String(criticalTickets)}
          icon={AlertCircle}
          iconColor="var(--danger)"
          badge="High Priority"
        />
        <StatCard
          title="Pending Disputes"
          value={String(pendingDisputes)}
          icon={ShieldAlert}
          iconColor="var(--warning)"
          badge="Requires Arbitration"
        />
        <StatCard
          title="Resolved Tickets"
          value={String(resolvedToday)}
          icon={CheckCircle2}
          iconColor="var(--success)"
          badge="Total Closed"
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
        {/* Navigation Tabs */}
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
          {[
            { key: 'tickets' as const, label: `Support Tickets (${tickets.length})` },
            { key: 'disputes' as const, label: `Order Disputes & Claims (${disputes.length})` },
          ].map((tab) => (
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

        {/* Filter and Search Bar */}
        <div
          style={{
            padding: '12px 20px',
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
              placeholder="Search by ticket #, order #, subject, customer..."
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
            {activeTab === 'tickets' ? (
              (['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: statusFilter === st ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    backgroundColor: statusFilter === st ? 'var(--brand-primary-light)' : 'white',
                    color: statusFilter === st ? 'var(--brand-primary)' : 'var(--slate-600)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))
            ) : (
              (['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUNDED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: statusFilter === st ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    backgroundColor: statusFilter === st ? 'var(--brand-primary-light)' : 'white',
                    color: statusFilter === st ? 'var(--brand-primary)' : 'var(--slate-600)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tab 1: Support Tickets Table */}
        {activeTab === 'tickets' && (
          <DataTable<SupportTicket>
            columns={ticketColumns}
            data={filteredTickets}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyTitle="No Support Incidents"
            emptyDescription="No support tickets found matching the search criteria."
          />
        )}

        {/* Tab 2: Order Disputes Table */}
        {activeTab === 'disputes' && (
          <DataTable<OrderDispute>
            columns={disputeColumns}
            data={filteredDisputes}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyTitle="No Disputes in Queue"
            emptyDescription="All customer disputes and claim arbitrations have been addressed."
          />
        )}
      </div>

      {/* =================== TICKET REPLY & DETAIL MODAL =================== */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => {
          if (!isSubmittingReply) setIsTicketModalOpen(false);
        }}
        title="Support Ticket Incident Thread"
        description={selectedTicket ? `Ticket ${selectedTicket.ticketNumber || `#${selectedTicket.id}`} • ${selectedTicket.subject}` : ''}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTicketModalOpen(false)}
              disabled={isSubmittingReply}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send size={13} />}
              onClick={handleSubmitTicketReply}
              isLoading={isSubmittingReply}
              disabled={isSubmittingReply || !!ticketActionSuccess}
            >
              Post Admin Reply
            </Button>
          </div>
        }
      >
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ticketActionSuccess && (
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
                <CheckCircle2 size={16} />
                {ticketActionSuccess}
              </div>
            )}

            {ticketActionError && (
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
                {ticketActionError}
              </div>
            )}

            {/* Ticket Metadata Bar */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '12.5px',
              }}
            >
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Requester</span>
                <strong>{selectedTicket.user?.name || 'Customer'}</strong> ({selectedTicket.user?.phone || '—'})
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Category & Priority</span>
                <span style={{ fontWeight: 600 }}>{selectedTicket.category}</span> • <span style={{ color: 'var(--danger)' }}>{selectedTicket.priority}</span>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Order Reference</span>
                <span className="font-mono">#{selectedTicket.order?.orderId || selectedTicket.order?.id || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '11px' }}>Status</span>
                <Badge variant={selectedTicket.status === 'RESOLVED' ? 'success' : 'danger'} size="sm">
                  {selectedTicket.status}
                </Badge>
              </div>
            </div>

            {/* Initial Description */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>
                Incident Description:
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'white',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: 'var(--slate-800)',
                }}
              >
                {selectedTicket.description}
              </div>
            </div>

            {/* Conversation Log Trail */}
            {selectedTicket.conversationLog && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>
                  Conversation Audit Trail:
                </div>
                <pre
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: 'var(--slate-700)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    fontFamily: 'inherit',
                  }}
                >
                  {selectedTicket.conversationLog}
                </pre>
              </div>
            )}

            {/* Admin Response Box */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
                Admin Resolution Reply *
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Compose a resolution note to the customer..."
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

            {/* New Status Select */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
                Update Ticket Status
              </label>
              <select
                value={newTicketStatus}
                onChange={(e) => setNewTicketStatus(e.target.value)}
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
                <option value="IN_PROGRESS">IN_PROGRESS (Under investigation)</option>
                <option value="RESOLVED">RESOLVED (Issue addressed & closed)</option>
                <option value="CLOSED">CLOSED (Archived without action)</option>
                <option value="OPEN">OPEN (Reopen ticket)</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* =================== DISPUTE ARBITRATION MODAL =================== */}
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => {
          if (!isSubmittingDispute) {
            setIsDisputeModalOpen(false);
            setShowDisputeConfirm(false);
          }
        }}
        title="Order Dispute Arbitration"
        description={selectedDispute ? `Dispute DSP-${selectedDispute.id} • Order #${selectedDispute.order?.orderId || selectedDispute.order?.id}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDisputeModalOpen(false);
                setShowDisputeConfirm(false);
              }}
              disabled={isSubmittingDispute}
            >
              Cancel
            </Button>
            <Button
              variant={disputeDecision === 'APPROVE' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleSubmitDispute}
              isLoading={isSubmittingDispute}
              disabled={isSubmittingDispute || !!disputeSuccess}
            >
              {showDisputeConfirm
                ? disputeDecision === 'APPROVE'
                  ? 'Confirm Refund Execution'
                  : 'Confirm Rejection'
                : disputeDecision === 'APPROVE'
                ? 'Approve & Issue Refund'
                : 'Reject Dispute'}
            </Button>
          </div>
        }
      >
        {selectedDispute && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {disputeSuccess && (
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
                <CheckCircle2 size={16} />
                {disputeSuccess}
              </div>
            )}

            {disputeError && (
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
                {disputeError}
              </div>
            )}

            {showDisputeConfirm && !disputeSuccess && (
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
                <strong>⚠️ Confirmation Required:</strong>{' '}
                {disputeDecision === 'APPROVE' ? (
                  <>
                    You are about to issue an authorized refund of{' '}
                    <strong>{formatCurrency(parseFloat(disputeRefundAmount))}</strong> to customer{' '}
                    <strong>{selectedDispute.user?.name}</strong>. The order payment status will be marked as REFUNDED.
                  </>
                ) : (
                  <>You are about to reject this claim. No funds will be reversed.</>
                )}
              </div>
            )}

            {/* Dispute Summary Details */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12.5px',
              }}
            >
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Customer:</span>{' '}
                <strong>{selectedDispute.user?.name || 'Customer'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Merchant:</span>{' '}
                <strong>{selectedDispute.restaurant?.name || 'Restaurant'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Order Total:</span>{' '}
                <strong>{formatCurrency(selectedDispute.order?.totalAmount)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Claim Reason:</span>{' '}
                <strong style={{ color: 'var(--danger)' }}>{selectedDispute.disputeReason}</strong>
              </div>
            </div>

            {/* Decision Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-700)' }}>
                Arbitration Decision *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDisputeDecision('APPROVE');
                    setShowDisputeConfirm(false);
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: disputeDecision === 'APPROVE' ? '2px solid var(--danger)' : '1px solid var(--border-light)',
                    backgroundColor: disputeDecision === 'APPROVE' ? 'var(--danger-surface)' : 'white',
                    color: disputeDecision === 'APPROVE' ? 'var(--danger)' : 'var(--slate-700)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Approve (Issue Refund)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisputeDecision('REJECT');
                    setShowDisputeConfirm(false);
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: disputeDecision === 'REJECT' ? '2px solid var(--slate-700)' : '1px solid var(--border-light)',
                    backgroundColor: disputeDecision === 'REJECT' ? 'var(--slate-100)' : 'white',
                    color: disputeDecision === 'REJECT' ? 'var(--slate-900)' : 'var(--slate-700)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Reject Claim
                </button>
              </div>
            </div>

            {/* Refund Amount (if approved) */}
            {disputeDecision === 'APPROVE' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
                  Refund Amount (₹) *
                </label>
                <input
                  suppressHydrationWarning
                  type="number"
                  min="1"
                  max={selectedDispute.order?.totalAmount ?? 99999}
                  step="0.01"
                  value={disputeRefundAmount}
                  onChange={(e) => {
                    setDisputeRefundAmount(e.target.value);
                    setShowDisputeConfirm(false);
                    setDisputeError(null);
                  }}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                />
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--slate-700)' }}>
                Arbitration Audit Notes *
              </label>
              <textarea
                value={disputeAdminNotes}
                onChange={(e) => {
                  setDisputeAdminNotes(e.target.value);
                  setShowDisputeConfirm(false);
                  setDisputeError(null);
                }}
                placeholder="Reasoning for decision (e.g. valid photographic evidence submitted, rider delivery delay verified)"
                rows={2}
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
          </div>
        )}
      </Modal>
    </div>
  );
}
