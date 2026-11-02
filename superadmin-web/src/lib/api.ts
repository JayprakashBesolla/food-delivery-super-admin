/**
 * Centralized Typed API Client for FoodApp Super Admin Portal
 * Connects directly to the Spring Boot backend (`/api/superadmin/*`, `/api/auth/*`, `/api/work-queues/*`)
 */

import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  PlatformCockpitDTO,
  Restaurant,
  RestaurantDetailSuperAdminDTO,
  MerchantKycRecord,
  RestaurantStatus,
  BusinessSector,
  Order,
  OrderStatus,
  PaymentTransaction,
  RefundExecutionRequest,
  SettlementRecord,
  PayoutExecutionRequest,
  CommissionSplitDTO,
  RiderAdminDTO,
  CustomerAdminDTO,
  WalletAdjustmentRequest,
  Coupon,
  CreateCouponPayload,
  FinanceReportDTO,
  SupportTicket,
  TicketReplyRequest,
  OrderDispute,
  DisputeResolutionRequest,
  PlatformNotification,
  BroadcastNotificationRequest,
  PlatformSystemConfig,
  SurgePricingUpdateRequest,
  SystemConfigUpdateRequest,
  AuditLog,
  Department,
  TaskStatus,
  OperationalTask,
  DepartmentQueueSummaryDTO,
  CreateTaskRequest,
  MakerReviewRequest,
  CheckerApproveRequest,
  AdminUserResponseDTO,
  CreateAdminUserRequest,
} from '@/types/superadmin';

// Re-export shared types for backward compatibility across existing pages
export * from '@/types/superadmin';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ============================================================================
// Error Handling
// ============================================================================

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ============================================================================
// Auth Session Management
// ============================================================================

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('foodapp_superadmin_token');
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('foodapp_superadmin_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('foodapp_superadmin_token', token);
  localStorage.setItem('foodapp_superadmin_user', JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('foodapp_superadmin_token');
  localStorage.removeItem('foodapp_superadmin_user');
}

// ============================================================================
// Internal HTTP Helpers
// ============================================================================

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw new ApiError(
      response.status === 403
        ? 'Access forbidden: Insufficient privileges. Requires ROLE_SUPER_ADMIN or staff authorization.'
        : 'Session expired or unauthenticated. Please sign in again.',
      response.status
    );
  }

  if (!response.ok) {
    let errorDetails = `Request failed with status ${response.status}`;
    let errBody: unknown = null;
    try {
      errBody = await response.json();
      if (errBody && typeof errBody === 'object') {
        const bodyObj = errBody as Record<string, unknown>;
        if (typeof bodyObj.error === 'string') errorDetails = bodyObj.error;
        else if (typeof bodyObj.message === 'string') errorDetails = bodyObj.message;
      }
    } catch {
      // not JSON
    }
    throw new ApiError(errorDetails, response.status, errBody);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}

// ============================================================================
// 1. Authentication
// ============================================================================

export async function loginSuperAdmin(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = 'Invalid credentials';
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.error) errorMessage = errorBody.error;
    } catch {
      errorMessage = `Authentication failed with status ${response.status}`;
    }
    throw new ApiError(errorMessage, response.status);
  }

  const data: AuthResponse = await response.json();

  if (data.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      `Access Denied: Account role is '${data.role}', but Super Admin portal strictly requires 'SUPER_ADMIN'.`,
      403
    );
  }

  setAuthSession(data.token, {
    userId: data.userId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
  });

  return data;
}

// ============================================================================
// 2. Executive Dashboard (Module 1)
// ============================================================================

export async function fetchPlatformCockpit(): Promise<PlatformCockpitDTO> {
  return authFetch<PlatformCockpitDTO>('/api/superadmin/dashboard');
}

// ============================================================================
// 3. Restaurant Lifecycle & Merchant KYC (Modules 2 & 3)
// ============================================================================

export async function fetchRestaurants(status?: RestaurantStatus): Promise<Restaurant[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return authFetch<Restaurant[]>(`/api/superadmin/restaurants${query}`);
}

export async function fetchRestaurantApplications(): Promise<Restaurant[]> {
  return authFetch<Restaurant[]>('/api/superadmin/restaurants/applications');
}

export async function fetchActiveRestaurants(): Promise<Restaurant[]> {
  return authFetch<Restaurant[]>('/api/superadmin/restaurants/active');
}

export async function fetchSuspendedRestaurants(): Promise<Restaurant[]> {
  return authFetch<Restaurant[]>('/api/superadmin/restaurants/suspended');
}

export async function fetchRestaurantDetails(id: number): Promise<RestaurantDetailSuperAdminDTO> {
  return authFetch<RestaurantDetailSuperAdminDTO>(`/api/superadmin/restaurants/${id}/details`);
}

export async function approveRestaurant(id: number): Promise<Restaurant> {
  return authFetch<Restaurant>(`/api/superadmin/restaurants/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectRestaurant(id: number, reason: string): Promise<Restaurant> {
  return authFetch<Restaurant>(`/api/superadmin/restaurants/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function suspendRestaurant(id: number, reason: string): Promise<Restaurant> {
  return authFetch<Restaurant>(`/api/superadmin/restaurants/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function unsuspendRestaurant(id: number): Promise<Restaurant> {
  return authFetch<Restaurant>(`/api/superadmin/restaurants/${id}/unsuspend`, {
    method: 'POST',
  });
}

export async function fetchRestaurantDocuments(id: number): Promise<Record<string, unknown>> {
  return authFetch<Record<string, unknown>>(`/api/superadmin/restaurants/${id}/documents`);
}

export async function fetchPendingKyc(): Promise<MerchantKycRecord[]> {
  return authFetch<MerchantKycRecord[]>('/api/superadmin/restaurants/kyc/pending');
}

export async function reviewKyc(kycId: number, approved: boolean, reason?: string): Promise<MerchantKycRecord> {
  return authFetch<MerchantKycRecord>(`/api/superadmin/restaurants/kyc/${kycId}/decision`, {
    method: 'PATCH',
    body: JSON.stringify({ approved, reason: reason || (approved ? 'Approved by Admin' : 'Rejected by Admin') }),
  });
}

// ============================================================================
// 4. Platform Orders & Dispatch Stepper (Module 4)
// ============================================================================

export async function fetchOrders(params?: {
  sector?: BusinessSector;
  status?: OrderStatus;
  restaurantId?: number;
}): Promise<Order[]> {
  const searchParams = new URLSearchParams();
  if (params?.sector) searchParams.set('sector', params.sector);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.restaurantId) searchParams.set('restaurantId', String(params.restaurantId));

  const qs = searchParams.toString();
  return authFetch<Order[]>(`/api/superadmin/orders${qs ? `?${qs}` : ''}`);
}

export async function fetchLiveOrders(): Promise<Order[]> {
  return authFetch<Order[]>('/api/superadmin/orders/live');
}

export async function fetchCancelledOrders(): Promise<Order[]> {
  return authFetch<Order[]>('/api/superadmin/orders/cancelled');
}

export async function fetchFailedOrders(): Promise<Order[]> {
  return authFetch<Order[]>('/api/superadmin/orders/failed');
}

export async function fetchOrderDisputes(): Promise<OrderDispute[]> {
  return authFetch<OrderDispute[]>('/api/superadmin/orders/disputes');
}

// ============================================================================
// 5. Multi-Gateway Payments & Automated Refunds (Module 5)
// ============================================================================

export async function fetchAllTransactions(): Promise<PaymentTransaction[]> {
  return authFetch<PaymentTransaction[]>('/api/superadmin/payments/transactions');
}

export async function fetchSuccessfulTransactions(): Promise<PaymentTransaction[]> {
  return authFetch<PaymentTransaction[]>('/api/superadmin/payments/successful');
}

export async function fetchFailedTransactions(): Promise<PaymentTransaction[]> {
  return authFetch<PaymentTransaction[]>('/api/superadmin/payments/failed');
}

export async function fetchRefundedTransactions(): Promise<PaymentTransaction[]> {
  return authFetch<PaymentTransaction[]>('/api/superadmin/payments/refunds');
}

export async function fetchPaymentDisputes(): Promise<PaymentTransaction[]> {
  return authFetch<PaymentTransaction[]>('/api/superadmin/payments/disputes');
}

export async function triggerPaymentRefund(
  transactionId: number,
  payload: RefundExecutionRequest
): Promise<PaymentTransaction> {
  return authFetch<PaymentTransaction>(`/api/superadmin/payments/${transactionId}/refund`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// 6. Merchant Settlements & Payouts Engine (Module 6)
// ============================================================================

export async function fetchPendingSettlements(): Promise<SettlementRecord[]> {
  return authFetch<SettlementRecord[]>('/api/superadmin/settlements/pending');
}

export async function fetchProcessingSettlements(): Promise<SettlementRecord[]> {
  return authFetch<SettlementRecord[]>('/api/superadmin/settlements/processing');
}

export async function fetchPaidSettlements(): Promise<SettlementRecord[]> {
  return authFetch<SettlementRecord[]>('/api/superadmin/settlements/paid');
}

export async function fetchFailedSettlements(): Promise<SettlementRecord[]> {
  return authFetch<SettlementRecord[]>('/api/superadmin/settlements/failed');
}

export async function fetchSettlementHistory(): Promise<SettlementRecord[]> {
  return authFetch<SettlementRecord[]>('/api/superadmin/settlements/history');
}

export async function generateSettlementBatch(): Promise<SettlementRecord[]> {
  return authFetch<SettlementRecord[]>('/api/superadmin/settlements/generate-batch', {
    method: 'POST',
  });
}

export async function executePayout(
  settlementId: number,
  payload: PayoutExecutionRequest
): Promise<SettlementRecord> {
  return authFetch<SettlementRecord>(`/api/superadmin/settlements/${settlementId}/payout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// 7. Commission Switchboard (Module 7)
// ============================================================================

export async function fetchGlobalCommission(): Promise<{ globalCommissionPercentage: number }> {
  const res = await authFetch<Record<string, number>>('/api/superadmin/commission/global');
  return { globalCommissionPercentage: res.globalCommissionPercentage ?? 15.0 };
}

export async function updateGlobalCommission(
  commissionRate: number
): Promise<{ globalCommissionPercentage: number }> {
  return authFetch<{ globalCommissionPercentage: number }>('/api/superadmin/commission/global', {
    method: 'PUT',
    body: JSON.stringify({ commissionRate }),
  });
}

export async function fetchRestaurantCommission(restaurantId: number): Promise<{ commissionRate: number }> {
  const res = await authFetch<Record<string, number>>(`/api/superadmin/commission/restaurants/${restaurantId}`);
  return { commissionRate: res.restaurantCommissionPercentage ?? res.commissionRate ?? 15.0 };
}

export async function updateRestaurantCommission(
  restaurantId: number,
  commissionRate: number
): Promise<Restaurant> {
  return authFetch<Restaurant>(`/api/superadmin/commission/restaurants/${restaurantId}`, {
    method: 'PATCH',
    body: JSON.stringify({ commissionRate }),
  });
}

export async function fetchDeliveryCommissionSplit(): Promise<CommissionSplitDTO> {
  const res = await authFetch<Record<string, number>>('/api/superadmin/commission/delivery');
  return {
    platformTakePercentage: res.platformDeliverySharePercentage ?? res.platformTakePercentage ?? 20.0,
    riderSharePercentage: res.riderDeliverySharePercentage ?? res.riderSharePercentage ?? 80.0,
  };
}

// ============================================================================
// 8. Delivery Fleet Operations (Module 8)
// ============================================================================

export async function fetchDeliveryPartners(): Promise<RiderAdminDTO[]> {
  return authFetch<RiderAdminDTO[]>('/api/superadmin/delivery/partners');
}

export async function fetchLiveDeliveries(): Promise<Order[]> {
  return authFetch<Order[]>('/api/superadmin/delivery/live');
}

export async function fetchPartnerEarnings(): Promise<Record<string, unknown>[]> {
  return authFetch<Record<string, unknown>[]>('/api/superadmin/delivery/earnings');
}

export async function fetchDeliveryIssues(): Promise<Order[]> {
  return authFetch<Order[]>('/api/superadmin/delivery/issues');
}

// ============================================================================
// 9. Customer Governance & Fraud Mitigation (Module 9)
// ============================================================================

export async function fetchCustomers(): Promise<CustomerAdminDTO[]> {
  return authFetch<CustomerAdminDTO[]>('/api/superadmin/customers/users');
}

export async function fetchBlockedCustomers(): Promise<CustomerAdminDTO[]> {
  return authFetch<CustomerAdminDTO[]>('/api/superadmin/customers/blocked');
}

export async function blockCustomer(userId: number, reason: string): Promise<Record<string, unknown>> {
  return authFetch<Record<string, unknown>>(`/api/superadmin/customers/${userId}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function unblockCustomer(userId: number): Promise<Record<string, unknown>> {
  return authFetch<Record<string, unknown>>(`/api/superadmin/customers/${userId}/unblock`, {
    method: 'PATCH',
  });
}

export async function fetchCustomerWallets(): Promise<Record<string, unknown>[]> {
  return authFetch<Record<string, unknown>[]>('/api/superadmin/customers/wallets');
}

export async function adjustCustomerWallet(
  userId: number,
  payload: WalletAdjustmentRequest
): Promise<Record<string, unknown>> {
  return authFetch<Record<string, unknown>>(`/api/superadmin/customers/${userId}/wallet-adjust`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// 10. Platform Promotional Coupons (Module 10)
// ============================================================================

export async function fetchAllCoupons(): Promise<Coupon[]> {
  return authFetch<Coupon[]>('/api/superadmin/coupons');
}

export async function fetchPlatformCoupons(): Promise<Coupon[]> {
  return authFetch<Coupon[]>('/api/superadmin/coupons/platform');
}

export async function createPlatformCoupon(payload: CreateCouponPayload): Promise<Coupon> {
  return authFetch<Coupon>('/api/superadmin/coupons/platform', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleCouponStatus(id: number): Promise<Coupon> {
  return authFetch<Coupon>(`/api/superadmin/coupons/${id}/toggle`, {
    method: 'PATCH',
  });
}

export async function updateCoupon(id: number, payload: Partial<Coupon>): Promise<Coupon> {
  return authFetch<Coupon>(`/api/superadmin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCoupon(id: number): Promise<void> {
  return authFetch<void>(`/api/superadmin/coupons/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchRestaurantCoupons(): Promise<Coupon[]> {
  return authFetch<Coupon[]>('/api/superadmin/coupons/restaurant');
}

export async function fetchCampaignCoupons(): Promise<Coupon[]> {
  return authFetch<Coupon[]>('/api/superadmin/coupons/campaigns');
}

// ============================================================================
// 11. Finance, Accounting & Tax Reports (Module 11)
// ============================================================================

export async function fetchFinanceRevenue(): Promise<Record<string, unknown>> {
  return authFetch<Record<string, unknown>>('/api/superadmin/finance/revenue');
}

export async function fetchFinanceCommission(): Promise<Record<string, number>> {
  return authFetch<Record<string, number>>('/api/superadmin/finance/commission');
}

export async function fetchFinanceTax(): Promise<Record<string, number>> {
  return authFetch<Record<string, number>>('/api/superadmin/finance/tax');
}

export async function fetchFinanceRefunds(): Promise<Record<string, number>> {
  return authFetch<Record<string, number>>('/api/superadmin/finance/refunds');
}

export async function fetchFinanceFullReport(): Promise<FinanceReportDTO> {
  return authFetch<FinanceReportDTO>('/api/superadmin/finance/reports');
}

// ============================================================================
// 12. Support & Dispute Arbitration (Module 12)
// ============================================================================

export async function fetchSupportTickets(params?: {
  status?: string;
  category?: string;
}): Promise<SupportTicket[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.category) searchParams.set('category', params.category);
  const qs = searchParams.toString();
  return authFetch<SupportTicket[]>(`/api/superadmin/support/tickets${qs ? `?${qs}` : ''}`);
}

export async function replyToSupportTicket(
  ticketId: number,
  payload: TicketReplyRequest
): Promise<SupportTicket> {
  return authFetch<SupportTicket>(`/api/superadmin/support/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchSupportDisputes(): Promise<OrderDispute[]> {
  return authFetch<OrderDispute[]>('/api/superadmin/support/disputes');
}

export async function fetchDisputeDetails(disputeId: number): Promise<OrderDispute> {
  return authFetch<OrderDispute>(`/api/superadmin/support/disputes/${disputeId}`);
}

export async function resolveDispute(
  disputeId: number,
  payload: DisputeResolutionRequest
): Promise<OrderDispute> {
  return authFetch<OrderDispute>(`/api/superadmin/disputes/${disputeId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// 13. Push Notification Console (Module 13)
// ============================================================================

export async function broadcastNotification(
  payload: BroadcastNotificationRequest
): Promise<PlatformNotification> {
  return authFetch<PlatformNotification>('/api/superadmin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchBroadcastHistory(): Promise<PlatformNotification[]> {
  return authFetch<PlatformNotification[]>('/api/superadmin/notifications/history');
}

// ============================================================================
// 14. System Configuration & Dynamic Surge (Module 14)
// ============================================================================

export async function fetchSystemConfig(): Promise<PlatformSystemConfig> {
  return authFetch<PlatformSystemConfig>('/api/superadmin/settings');
}

export async function updateSystemConfig(
  payload: SystemConfigUpdateRequest
): Promise<PlatformSystemConfig> {
  return authFetch<PlatformSystemConfig>('/api/superadmin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchSurgeStatus(): Promise<PlatformSystemConfig> {
  return authFetch<PlatformSystemConfig>('/api/superadmin/surge');
}

export async function updateSurgePricing(
  payload: SurgePricingUpdateRequest
): Promise<PlatformSystemConfig> {
  return authFetch<PlatformSystemConfig>('/api/superadmin/surge', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// 15. Audit Logs (Module 15)
// ============================================================================

export async function fetchAuditLogs(params?: {
  actorEmail?: string;
  action?: string;
  targetEntityType?: string;
}): Promise<AuditLog[]> {
  const searchParams = new URLSearchParams();
  if (params?.actorEmail) searchParams.set('actorEmail', params.actorEmail);
  if (params?.action) searchParams.set('action', params.action);
  if (params?.targetEntityType) searchParams.set('targetEntityType', params.targetEntityType);
  const qs = searchParams.toString();
  return authFetch<AuditLog[]>(`/api/superadmin/audit-logs${qs ? `?${qs}` : ''}`);
}

// ============================================================================
// 16. Departmental Work Queues - Maker-Checker Principle (Module 16)
// ============================================================================

export async function fetchDepartmentQueue(
  department: Department,
  status?: TaskStatus
): Promise<OperationalTask[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return authFetch<OperationalTask[]>(`/api/work-queues/${department}${query}`);
}

export async function fetchDepartmentQueueSummary(
  department: Department
): Promise<DepartmentQueueSummaryDTO> {
  return authFetch<DepartmentQueueSummaryDTO>(`/api/work-queues/${department}/summary`);
}

export async function createWorkQueueTask(payload: CreateTaskRequest): Promise<OperationalTask> {
  return authFetch<OperationalTask>('/api/work-queues/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function claimWorkQueueTask(taskId: number): Promise<OperationalTask> {
  return authFetch<OperationalTask>(`/api/work-queues/${taskId}/claim`, {
    method: 'POST',
  });
}

export async function completeWorkQueueTask(
  taskId: number,
  payload?: { resolutionNotes?: string }
): Promise<OperationalTask> {
  return authFetch<OperationalTask>(`/api/work-queues/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function submitMakerReview(
  taskId: number,
  payload: MakerReviewRequest
): Promise<OperationalTask> {
  return authFetch<OperationalTask>(`/api/work-queues/${taskId}/maker-review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approveChecker(
  taskId: number,
  payload: CheckerApproveRequest
): Promise<OperationalTask> {
  return authFetch<OperationalTask>(`/api/work-queues/${taskId}/checker-approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMyClaimedTasks(): Promise<OperationalTask[]> {
  return authFetch<OperationalTask[]>('/api/work-queues/tasks/claimed');
}

export async function fetchSlaBreachedTasks(): Promise<OperationalTask[]> {
  return authFetch<OperationalTask[]>('/api/work-queues/sla-breached');
}

export async function triggerSlaEscalation(): Promise<Record<string, unknown>> {
  return authFetch<Record<string, unknown>>('/api/work-queues/escalate-overdue', {
    method: 'POST',
  });
}

export async function listStaffUsers(): Promise<AdminUserResponseDTO[]> {
  return authFetch<AdminUserResponseDTO[]>('/api/work-queues/staff');
}

export async function createStaffUser(payload: CreateAdminUserRequest): Promise<AdminUserResponseDTO> {
  return authFetch<AdminUserResponseDTO>('/api/work-queues/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
