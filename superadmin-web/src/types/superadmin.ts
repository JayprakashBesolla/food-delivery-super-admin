/**
 * Super Admin & Multi-Sector Platform Unified TypeScript Types
 * Generated from FoodApp Spring Boot backend contracts & architecture specifications.
 */

// ============================================================================
// 1. Core Enumerations & Literals
// ============================================================================

export type BusinessSector = 'FOOD' | 'GROCERY' | 'PHARMACY' | 'MEAT_FISH' | 'PET_SUPPLIES';

export type RestaurantStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type Department = 'FINANCE' | 'OPERATIONS' | 'SUPPORT';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'CANCEL_REQUESTED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'DISPUTED';

export type PaymentMethod = 'COD' | 'ONLINE_RAZORPAY' | 'ONLINE_STRIPE' | 'WALLET';

export type SettlementStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export type TaskStatus = 'PENDING' | 'CLAIMED' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type DisputeStatus = 'OPEN' | 'RESOLVED' | 'REJECTED';

export type CouponDiscountType = 'PERCENTAGE' | 'FLAT';

export type TargetAudience = 'CUSTOMERS' | 'MERCHANTS' | 'RIDERS' | 'ALL';

export type Role =
  | 'CUSTOMER'
  | 'RESTAURANT_PARTNER'
  | 'DELIVERY_PARTNER'
  | 'SUPER_ADMIN'
  | 'FINANCE_MANAGER'
  | 'FINANCE_OFFICER'
  | 'OPERATIONS_MANAGER'
  | 'OPERATIONS_OFFICER'
  | 'SUPPORT_MANAGER'
  | 'SUPPORT_AGENT';

// ============================================================================
// 2. Authentication & User Entities
// ============================================================================

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: Role | string;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: Role | string;
}

export interface LoginPayload {
  usernameOrEmailOrPhone: string;
  password: string;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role | string;
  blocked?: boolean;
}

// ============================================================================
// 3. Platform Cockpit & Dashboard (Module 1)
// ============================================================================

export interface PlatformCockpitDTO {
  platformGmv: number;
  platformCommissionRevenue: number;
  totalRestaurants: number;
  activeRestaurants: number;
  totalCustomers: number;
  totalRiders: number;
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  openDisputes: number;
  totalRefundsIssued: number;
  totalSettlementsPaid: number;
  ordersLast60Mins: number;
  ordersByCity: Record<string, number>;
  ordersBySector: Record<BusinessSector | string, number>;
  revenueBySector: Record<BusinessSector | string, number>;
}

// ============================================================================
// 4. Restaurant & Dark Store Lifecycle (Modules 2 & 3)
// ============================================================================

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  businessSector: BusinessSector;
  status: RestaurantStatus;
  email: string;
  phone: string;
  address: string;
  city: string;
  area?: string;
  commissionRate: number;
  stripeAccountId?: string;
  fssaiNumber?: string;
  gstin?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  avgRating: number;
  totalRatings: number;
  isOpen: boolean;
  isKitchenBusy: boolean;
  rushExtraMinutes: number;
  openingTime?: string;
  closingTime?: string;
  imageUrl?: string;
  bannerUrl?: string;
  createdAt: string;
}

export interface RestaurantDetailSuperAdminDTO {
  id: number;
  name: string;
  slug: string;
  businessSector: BusinessSector;
  status: RestaurantStatus;
  email: string;
  phone: string;
  address: string;
  city: string;
  commissionRate: number;
  stripeAccountId?: string;
  fssaiNumber?: string;
  gstin?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  avgRating: number;
  totalOrders: number;
  lifetimeSales: number;
  branchCount: number;
  staffCount: number;
  createdAt: string;
}

export interface MerchantKycRecord {
  id: number;
  restaurant?: Restaurant;
  restaurantId?: number;
  restaurantName?: string;
  businessName?: string;
  fssaiLicense?: string;
  fssaiDocumentUrl?: string;
  gstin?: string;
  gstinDocumentUrl?: string;
  drugLicenseDocumentUrl?: string;
  panNumber?: string;
  panCardUrl?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankProofUrl?: string;
  status?: string;
  verified?: boolean;
  verifiedBy?: string;
  rejectionReason?: string;
  verificationNotes?: string;
  submittedAt: string;
  verifiedAt?: string;
}

// ============================================================================
// 5. Orders & Dispatch Stepper (Module 4)
// ============================================================================

export interface OrderItem {
  id?: number;
  dishId?: number;
  dishName: string;
  quantity: number;
  pricePerUnit?: number;
  unitPrice?: number;
  totalPrice: number;
  selectedVariant?: string;
  selectedAddons?: string;
  variantName?: string;
}

export interface Order {
  id?: string;
  orderId?: string;
  customer?: UserSummary;
  user?: UserSummary;
  restaurant?: Restaurant;
  orderType?: string;
  sector?: BusinessSector;
  businessSector?: BusinessSector;
  status: OrderStatus;
  itemTotal: number;
  deliveryFee: number;
  packagingFee?: number;
  tax?: number;
  taxAmount?: number;
  surgeFee?: number;
  discount?: number;
  discountAmount?: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  cancelReason?: string;
  estimatedDeliveryMinutes?: number;
  prescriptionImageUrl?: string;
  rxPrescriptionUrl?: string;
  rxApproved?: boolean;
  rider?: UserSummary;
  riderName?: string;
  riderPhone?: string;
  createdAt: string;
  orderItems: OrderItem[];
}

// ============================================================================
// 6. Payments, Refunds & Settlements (Modules 5 & 6)
// ============================================================================

export interface PaymentTransaction {
  id: number;
  transactionReference: string;
  order?: Order;
  user?: UserSummary;
  amount: number;
  currency: string;
  provider: string; // STRIPE, RAZORPAY, COD, WALLET
  status: string; // SUCCESS, FAILED, PENDING, REFUNDED
  paymentMethodType?: string; // CARD, UPI, NET_BANKING, WALLET, CASH
  gatewayFee?: number;
  refundAmount?: number;
  refundReference?: string;
  failureReason?: string;
  disputeStatus?: string; // NONE, NEEDS_RESPONSE, UNDER_REVIEW, WON, LOST
  createdAt: string;
  updatedAt?: string;
}

export interface RefundExecutionRequest {
  amount: number;
  reason: string;
}

export interface SettlementRecord {
  id: number;
  restaurant: Restaurant;
  grossSales: number;
  platformCommissionPercentage: number;
  platformCommissionAmount: number;
  taxDeducted: number;
  netPayoutAmount: number;
  status: string; // PENDING, PROCESSING, PAID, FAILED
  payoutProvider: string; // STRIPE, MANUAL_BANK, RAZORPAY_X
  stripeTransferId?: string;
  failureReason?: string;
  utrNumber?: string;
  requiresFourEyes: boolean;
  makerEmployeeEmail?: string;
  checkerManagerEmail?: string;
  version?: number;
  processedAt: string;
  paidAt?: string;
}

export interface PayoutExecutionRequest {
  provider: 'STRIPE' | 'MANUAL_BANK';
  utrNumber?: string;
  notes?: string;
}

// ============================================================================
// 7. Commission Switchboard (Module 7)
// ============================================================================

export interface CommissionSplitDTO {
  platformTakePercentage: number;
  riderSharePercentage: number;
}

// ============================================================================
// 8. Delivery Partners & Customer Governance (Modules 8 & 9)
// ============================================================================

export interface RiderAdminDTO {
  id: number;
  name: string;
  email: string;
  phone: string;
  blocked: boolean;
  lifetimeDeliveries: number;
  totalEarnings: number;
  currentActiveOrderId?: string;
  joinedAt: string;
}

export interface CustomerAdminDTO {
  id: number;
  name: string;
  email: string;
  phone: string;
  blocked: boolean;
  walletBalance: number;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
}

export interface WalletAdjustmentRequest {
  amount: number;
  reason: string;
}

// ============================================================================
// 9. Coupons & Promotional Campaigns (Module 10)
// ============================================================================

export interface Coupon {
  id: number;
  code: string;
  title?: string;
  description?: string;
  discountPercentage?: number;
  discountType?: CouponDiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
  flatDiscountAmount?: number;
  minOrderAmount?: number;
  validUntil?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  isActive?: boolean;
  usageLimitPerUser?: number;
  totalUsageLimit?: number;
  usageLimit?: number;
  perUserLimit?: number;
  sectorSpecific?: boolean;
  targetSector?: BusinessSector;
  restaurantId?: number;
  isPlatformWide?: boolean;
}

export interface CreateCouponPayload {
  code: string;
  title?: string;
  description?: string;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  flatDiscountAmount?: number;
  minOrderAmount?: number;
  validUntil?: string;
  usageLimitPerUser?: number;
  totalUsageLimit?: number;
  discountType?: CouponDiscountType;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  sectorSpecific?: boolean;
  targetSector?: BusinessSector;
  isPlatformWide?: boolean;
}

// ============================================================================
// 10. Finance, Accounting & Tax Reports (Module 11)
// ============================================================================

export interface FinanceReportDTO {
  totalGrossMerchandiseValue: number;
  platformCommissionEarned: number;
  totalTaxCollected: number;
  totalDeliveryFeesCollected: number;
  totalPackagingFeesCollected: number;
  totalRefundsIssued: number;
  netPlatformEarnings: number;
  totalTransactions: number;
  successfulTransactions: number;
  refundedTransactions: number;
  gmvBySector: Record<string, number>;
}

// ============================================================================
// 11. Support Desk & Disputes Arbitration (Module 12)
// ============================================================================

export interface SupportTicket {
  id: number;
  ticketNumber?: string;
  ticketReference?: string;
  user?: UserSummary;
  order?: Order;
  orderId?: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  conversationLog?: string;
  assignedAdminEmail?: string;
  adminReply?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketReplyRequest {
  message: string;
  newStatus?: string;
}

export interface OrderDispute {
  id: number;
  order?: Order;
  orderId?: string;
  user?: UserSummary;
  restaurant?: Restaurant;
  disputeReason: string;
  disputeDetails?: string;
  photoProofUrl?: string;
  evidenceImageUrl?: string;
  requestedRefundAmount?: number;
  status: string;
  approved?: boolean;
  refundAmount?: number;
  refundedAmount?: number;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DisputeResolutionRequest {
  approved: boolean;
  refundAmount?: number;
  adminNotes: string;
}

// ============================================================================
// 12. Push Notification Console (Module 13)
// ============================================================================

export interface PlatformNotification {
  id: number;
  title: string;
  message: string;
  targetAudience: string;
  sector?: BusinessSector;
  actionUrl?: string;
  sentBy?: string;
  sentByAdminEmail?: string;
  sentAt: string;
}

export interface BroadcastNotificationRequest {
  title: string;
  message: string;
  targetAudience: string;
  sector?: BusinessSector;
  actionUrl?: string;
}

// ============================================================================
// 13. System Settings & Dynamic Surge (Module 14)
// ============================================================================

export interface PlatformSystemConfig {
  id?: number;
  defaultCommissionRate: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  globalAnnouncementBanner: string;
  bannerActive: boolean;
  supportPhone: string;
  supportEmail: string;
  rainSurgeActive: boolean;
  rainSurgeMultiplier: number;
  nightSurgeActive: boolean;
  nightSurgeMultiplier: number;
}

export interface SurgePricingUpdateRequest {
  rainSurgeActive?: boolean;
  rainSurgeMultiplier?: number;
  nightSurgeActive?: boolean;
  nightSurgeMultiplier?: number;
}

export interface SystemConfigUpdateRequest {
  defaultCommissionRate?: number;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  globalAnnouncementBanner?: string;
  bannerActive?: boolean;
  supportPhone?: string;
  supportEmail?: string;
}

// ============================================================================
// 14. Audit Logs (Module 15)
// ============================================================================

export interface AuditLog {
  id: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  details: string;
  ipAddress?: string;
  clientIp?: string;
  timestamp: string;
}

// ============================================================================
// 15. Departmental Work Queues - Maker-Checker (Module 16)
// ============================================================================

export interface OperationalTask {
  id: number;
  taskNumber?: string;
  department: Department;
  taskType?: string;
  title?: string;
  description: string;
  status: string;
  priority: string;
  entityType?: string;
  entityId?: string;
  entityAmount?: number;
  city?: string;
  assignedTo?: UserSummary;
  claimedBy?: UserSummary;
  makerUser?: UserSummary;
  maker?: UserSummary;
  makerNotes?: string;
  checkerUser?: UserSummary;
  checker?: UserSummary;
  checkerNotes?: string;
  requiresFourEyesApproval?: boolean;
  resolutionNotes?: string;
  slaMinutes?: number;
  slaDeadline?: string;
  slaBreached?: boolean;
  isEscalated?: boolean;
  escalationReason?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface DepartmentQueueSummaryDTO {
  department: Department;
  pendingCount: number;
  claimedCount: number;
  inReviewCount: number;
  completedCount: number;
  slaBreachedCount: number;
}

export interface CreateTaskRequest {
  department: Department;
  taskType?: string;
  title?: string;
  description: string;
  priority?: string;
  entityType?: string;
  entityId?: string;
  amount?: number;
  city?: string;
  slaMinutes?: number;
  requiresFourEyes?: boolean;
  targetEntityType?: string;
  targetEntityId?: string;
}

export interface MakerReviewRequest {
  reviewNotes: string;
}

export interface CheckerApproveRequest {
  approved: boolean;
  checkerNotes: string;
}

export interface AdminUserResponseDTO {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  department?: Department;
  active: boolean;
}

export interface CreateAdminUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  department?: Department;
}

