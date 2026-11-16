# 👑 Super Admin Platform HQ: Web Portal Developer Guide

> **Target Audience**: Full-Stack / Web Frontend Developers building the Super Admin Web Console (Next.js / React / Angular / Vue)  
> **Backend Architecture**: Spring Boot 3 Multi-Sector Delivery Aggregator Platform (`foodapp`)  
> **Default Super Admin Credentials**:  
> • **Email**: `admin@swiggy.com`  
> • **Password**: `Password123!`  
> • **Role**: `SUPER_ADMIN`  
> **Base URL**: `http://localhost:8080` (or staging/production backend domain)  
> **Security Protocol**: JWT Bearer Token (`Authorization: Bearer <jwt_token>`)

--- 

## 1. 🏛️ Platform HQ Architecture & Role-Based Governance

The Super Admin Console is the central control tower for the entire multi-sector delivery aggregator platform. It governs:
1. **Multi-Sector Operations**: Food Delivery, Instamart Grocery Dark Stores, 24/7 Pharmacies, Meat & Fish, and Pet Supplies.
2. **Merchant Lifecycle & Compliance**: Merchant onboarding, automated and manual KYC verification, suspensions, store policy enforcement.
3. **Financial Settlement Engine**: Gross Merchandise Value (GMV) aggregation, take-rate commissions, GST/TDS tax records, automated **Stripe Connect Transfers**, and manual bank UTR disbursements.
4. **Order Live Stepper & Dispute Resolution**: Platform-wide real-time order monitoring, cancellation reviews, pharmacy Rx verifications, and customer refund disputes.
5. **Dynamic Surge Multipliers**: Platform rain mode, late-night surge multipliers, maintenance banners.
6. **Departmental Work Queues (Four-Eyes Maker-Checker Principle)**: Concurrency-safe queues for Finance, Operations, and Customer Support teams with strict Maker != Checker authorization.
7. **Immutable Audit Trails**: Every state change, KYC decision, refund, and commission edit is recorded with actor email, role, IP address, and timestamp.

```
                                👑 Platform Super Admin Console
       ┌──────────────────────────────┬───────────────────────────────┐
       ▼                              ▼                               ▼
📊 Executive Cockpit           🏪 Merchant Lifecycle           📦 Live Order Stream
(GMV, Revenue, Velocity)      (Onboarding, KYC, Suspensions)  (All Sectors, Live Stepper)
       │                              │                               │
       ├──────────────────────────────┼───────────────────────────────┤
       ▼                              ▼                               ▼
💳 Multi-Gateway Ledger        🏦 Settlements & Payouts        📈 Commission Switchboard
(Stripe & Razorpay Logs)      (Stripe Connect, Bank UTR)      (Global & Custom Store Rates)
       │                              │                               │
       ├──────────────────────────────┼───────────────────────────────┤
       ▼                              ▼                               ▼
🛵 Fleet & Live Riders         👥 Customer Governance          ⚖️ Support & Disputes
(Live Runs, Earnings, Issues)  (GMV, Wallets, Fraud Blacklist) (Tickets, Dispute Refunds)
       │                              │                               │
       └──────────────────────────────┴───────────────────────────────┘
                                      │
                     ⚙️ System Config, Surge & Audit Trail
                     (Rain Mode, Maintenance, Immutable Logs)
```

---

## 2. 🔐 Authentication & Session Flow

### 2.1 Super Admin Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request**:
```json
{
  "usernameOrEmailOrPhone": "admin@swiggy.com",
  "password": "Password123!"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "name": "Super Admin",
  "email": "admin@swiggy.com",
  "phone": "9999900000",
  "role": "SUPER_ADMIN"
}
```

### 2.2 Security Middleware & Interceptor
All `/api/superadmin/**`, `/api/admin/**`, and `/api/work-queues/**` endpoints require `Role.SUPER_ADMIN` (or departmental staff permissions).
Store the JWT token securely (in HTTP-only cookies or encrypted local storage) and attach it to every outgoing request:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 3. 📊 Module 1: Platform Executive Cockpit & Dashboard

### 3.1 Real-Time Platform Metrics
* **Endpoint**: `GET /api/superadmin/dashboard` (or `GET /api/superadmin/cockpit`)
* **Access**: `SUPER_ADMIN`
* **Sample Response (`200 OK`)**:
```json
{
  "platformGmv": 4825900.50,
  "platformCommissionRevenue": 723885.08,
  "totalRestaurants": 48,
  "activeRestaurants": 42,
  "totalCustomers": 12840,
  "totalRiders": 320,
  "totalOrders": 19420,
  "activeOrders": 142,
  "deliveredOrders": 18210,
  "openDisputes": 6,
  "totalRefundsIssued": 42350.00,
  "totalSettlementsPaid": 3894200.00,
  "ordersLast60Mins": 84,
  "ordersByCity": {
    "Hyderabad": 11200,
    "Bangalore": 5420,
    "Mumbai": 2800
  },
  "ordersBySector": {
    "FOOD": 12100,
    "GROCERY": 5400,
    "PHARMACY": 1200,
    "MEAT_FISH": 620,
    "PET_SUPPLIES": 100
  },
  "revenueBySector": {
    "FOOD": 3100000.00,
    "GROCERY": 1200500.50,
    "PHARMACY": 380400.00,
    "MEAT_FISH": 125000.00,
    "PET_SUPPLIES": 20000.00
  }
}
```

### 3.2 Recommended UI Components
1. **Top Metric Cards**:
   * **Gross Merchandise Value (GMV)** (₹): Formatted with Indian currency notation (e.g. `₹48,25,900.50`).
   * **Platform Commission Net Earnings** (₹).
   * **Live Orders (Fulfillment in progress)** with pulse indicator.
   * **Orders in Last 60 Mins** (Real-time order velocity).
2. **Sector Revenue Breakdown**: Donut or Pie chart showing GMV share across Food, Grocery, Pharmacy, Meat, and Pet Supplies.
3. **Geographic Distribution**: Table or bar chart displaying top cities by order volume.

---

## 4. 🏪 Module 2: Restaurant & Dark Store Lifecycle Management

### 4.1 Filter Stores by Lifecycle Status
* **List Stores**: `GET /api/superadmin/restaurants?status=PENDING_APPROVAL | ACTIVE | SUSPENDED`
* **Application Queue**: `GET /api/superadmin/restaurants/applications`
* **Active Stores**: `GET /api/superadmin/restaurants/active`
* **Suspended Stores**: `GET /api/superadmin/restaurants/suspended`

### 4.2 360° Store Inspection Profile
* **Endpoint**: `GET /api/superadmin/restaurants/{id}/details`
* **Sample Response**:
```json
{
  "id": 1,
  "name": "Royal Biryani House",
  "slug": "royal-biryani-house",
  "businessSector": "FOOD",
  "status": "ACTIVE",
  "email": "partner@biryani.com",
  "phone": "9123456780",
  "address": "Road No 36, Jubilee Hills",
  "city": "Hyderabad",
  "commissionRate": 15.0,
  "stripeAccountId": "acct_1OuX89KzY...",
  "fssaiNumber": "13622011000492",
  "gstin": "36AAACH7409R1ZZ",
  "panNumber": "AAACH7409R",
  "bankAccountNumber": "918239019283",
  "bankIfscCode": "HDFC0001824",
  "avgRating": 4.5,
  "totalOrders": 3280,
  "lifetimeSales": 1420800.00,
  "branchCount": 3,
  "staffCount": 12,
  "createdAt": "2026-01-15T10:00:00"
}
```

### 4.3 Approve / Reject Merchant Application
* **Approve Store**: `POST /api/superadmin/restaurants/{id}/approve`
* **Reject Store**: `POST /api/superadmin/restaurants/{id}/reject`
  ```json
  { "reason": "FSSAI license number is invalid or unverified on FoSCoS portal" }
  ```

### 4.4 Suspend / Unsuspend Store (Policy Enforcement)
* **Suspend Store**: `POST /api/superadmin/restaurants/{id}/suspend`
  ```json
  { "reason": "Repeated hygiene complaints and delayed dispatch" }
  ```
* **Unsuspend Store**: `POST /api/superadmin/restaurants/{id}/unsuspend`

### 4.5 Inspect Uploaded Merchant Documents
* **Endpoint**: `GET /api/superadmin/restaurants/{id}/documents`
* **Returns**: URLs and metadata for FSSAI Certificate, GSTIN Certificate, Drug License, Canceled Cheque, Kitchen Photos.

---

## 5. 📑 Module 3: Merchant KYC Verification Engine

* **Pending KYC Queue**: `GET /api/superadmin/restaurants/kyc/pending`
* **Submit KYC Decision**: `PATCH /api/superadmin/restaurants/kyc/{kycId}/decision`
* **Request Body**:
```json
{
  "approved": true,
  "reason": "All tax documents, bank proof, and drug licenses validated against MCA database"
}
```
> **Automatic Activation**: Approving KYC automatically updates the restaurant status to `ACTIVE` and creates an audit log entry. If rejected, the reason is emailed to the merchant.

---

## 6. 📦 Module 4: Platform-Wide Orders & Live Fulfillment Stepper

### 6.1 Filter Orders Globally
* **Endpoint**: `GET /api/superadmin/orders`
* **Query Parameters**:
  * `sector`: `FOOD` | `GROCERY` | `PHARMACY` | `MEAT_FISH` | `PET_SUPPLIES`
  * `status`: `PLACED` | `ACCEPTED` | `PREPARING` | `READY_FOR_PICKUP` | `OUT_FOR_DELIVERY` | `DELIVERED` | `CANCELLED`
  * `restaurantId`: Filter orders by store ID.

### 6.2 Specialized Fulfillment Queues
* **Active Orders Stream**: `GET /api/superadmin/orders/live` (Orders currently in kitchen, dark store packing, or rider transit).
* **Cancelled Orders**: `GET /api/superadmin/orders/cancelled` (Review order cancellations and merchant decline reasons).
* **Payment Failures**: `GET /api/superadmin/orders/failed` (Payment gateway timeout or drops).
* **Open Disputes**: `GET /api/superadmin/orders/disputes` (Customer complaints requesting refunds).

---

## 7. 💳 Module 5: Multi-Gateway Payments & Automated Refunds

The backend unifies **Stripe** and **Razorpay** transactions into a single consolidated financial ledger.

### 7.1 Unified Payment Ledger
* **All Transactions**: `GET /api/superadmin/payments/transactions`
* **Successful Transactions**: `GET /api/superadmin/payments/successful`
* **Failed Transactions**: `GET /api/superadmin/payments/failed`
* **Refunded Transactions**: `GET /api/superadmin/payments/refunds`
* **Disputed Transactions**: `GET /api/superadmin/payments/disputes`

### 7.2 Trigger Automated Customer Refund
* **Endpoint**: `POST /api/superadmin/payments/{transactionId}/refund`
* **Request Body**:
```json
{
  "amount": 450.00,
  "reason": "Customer reported missing item in delivered parcel"
}
```
* **Process**: Automatically executes refund on Stripe or Razorpay, updates order payment status to `REFUNDED`, credits customer ledger, and logs the action to Audit Log.

---

## 8. 🏦 Module 6: Merchant Settlements & Payouts Engine

Merchant settlement statements calculate:
$$\text{Net Payout} = \text{Gross Sales} - \text{Platform Commission} - \text{TDS/GST} - \text{Refund Deductions}$$

### 8.1 Settlement Queues
* `GET /api/superadmin/settlements/pending` — Statements generated awaiting disbursal approval.
* `GET /api/superadmin/settlements/processing` — In transit via payment rail.
* `GET /api/superadmin/settlements/paid` — Successfully paid out.
* `GET /api/superadmin/settlements/failed` — Failed due to bank IFSC mismatch or Stripe Connect account error.
* `GET /api/superadmin/settlements/history` — Historical settlement statements.

### 8.2 Generate Periodic Settlement Batch
* **Endpoint**: `POST /api/superadmin/settlements/generate-batch`
* **Usage**: Generates settlement records for all stores for the current billing cycle.

### 8.3 Disburse Payout
* **Endpoint**: `POST /api/superadmin/settlements/{id}/payout`
* **Request Body**:
```json
{
  "provider": "STRIPE",
  "utrNumber": null,
  "notes": "Weekly settlement automated transfer"
}
```
*(For manual bank transfers, supply `"provider": "MANUAL_BANK"` and provide the `"utrNumber": "HDFC1092830198"`).*

---

## 9. 📈 Module 7: Commission & Take-Rate Switchboard

### 9.1 Platform Default Commission
* **Get Default Rate**: `GET /api/superadmin/commission/global`  
  Response: `{"globalCommissionPercentage": 15.0}`
* **Update Default Rate**: `PUT /api/superadmin/commission/global`  
  Request: `{"commissionRate": 16.5}`

### 9.2 Custom Store Negotiated Commission
* **Get Store Rate**: `GET /api/superadmin/commission/restaurants/{id}`
* **Update Store Rate**: `PATCH /api/superadmin/commission/restaurants/{id}`  
  Request: `{"commissionRate": 12.0}` (e.g. enterprise discount for large national chain).

### 9.3 Delivery Fee Split
* **Get Delivery Fee Split**: `GET /api/superadmin/commission/delivery`  
  Returns platform take vs rider earnings distribution.

---

## 10. 🛵 Module 8: Delivery Fleet & Live Rider Operations

### 10.1 Rider Directory & Earnings
* **Rider Directory**: `GET /api/superadmin/delivery/partners`
  ```json
  [
    {
      "id": 14,
      "name": "Ramesh Kumar",
      "email": "rider.ramesh@swiggy.com",
      "phone": "9812345678",
      "blocked": false,
      "lifetimeDeliveries": 482,
      "totalEarnings": 48200.00,
      "currentActiveOrderId": "ORD-548192",
      "joinedAt": "2026-02-01T08:30:00"
    }
  ]
  ```
* **Rider Earnings Breakdown**: `GET /api/superadmin/delivery/earnings`

### 10.2 Live Rider Map & Operations
* **Live Fleet Stream**: `GET /api/superadmin/delivery/live` (Active orders and live rider assignments).
* **Delivery Bottlenecks & Delays**: `GET /api/superadmin/delivery/issues` (Orders unassigned for >10 mins or delayed in transit).

---

## 11. 👥 Module 9: Customer Directory & Fraud Mitigation

### 11.1 Customer Explorer & Lifetime Value (LTV)
* **Endpoint**: `GET /api/superadmin/customers/users`
* **Response**:
```json
[
  {
    "id": 2,
    "name": "Jane Customer",
    "email": "customer@swiggy.com",
    "phone": "9876543210",
    "blocked": false,
    "walletBalance": 120.00,
    "loyaltyPoints": 450,
    "totalOrders": 38,
    "totalSpent": 15420.00,
    "joinedAt": "2026-01-10T12:00:00"
  }
]
```

### 11.2 Block / Unblock Fraudulent Customers
* **Blocked Users**: `GET /api/superadmin/customers/blocked`
* **Block User**: `PATCH /api/superadmin/customers/{id}/block`  
  Request: `{"reason": "Abusive behavior towards delivery partners and fraudulent COD rejections"}`
* **Unblock User**: `PATCH /api/superadmin/customers/{id}/unblock`

### 11.3 Manual Customer Wallet Adjustment
* **Endpoint**: `POST /api/superadmin/customers/{id}/wallet-adjust`
* **Request**:
```json
{
  "amount": 200.00,
  "reason": "Compensation for delayed delivery on order ORD-1234"
}
```
*(Negative amount deducts from wallet; positive amount credits wallet).*

---

## 12. 🎟️ Module 10: Platform Promotional Campaigns & Coupons

### 12.1 Platform-Wide Coupons
* **List Platform Coupons**: `GET /api/superadmin/coupons/platform`
* **Create Platform Coupon**: `POST /api/superadmin/coupons/platform`
* **Request**:
```json
{
  "code": "MEGAFEST50",
  "description": "50% off up to ₹150 on all orders above ₹299",
  "discountType": "PERCENTAGE",
  "discountValue": 50.0,
  "maxDiscountAmount": 150.00,
  "minOrderAmount": 299.00,
  "usageLimit": 5000,
  "perUserLimit": 2,
  "startDate": "2026-10-01T00:00:00",
  "endDate": "2026-10-15T23:59:59",
  "active": true
}
```

### 12.2 Store Coupons & Campaigns
* **Store Coupons**: `GET /api/superadmin/coupons/restaurant`
* **Promotional Campaigns**: `GET /api/superadmin/coupons/campaigns`

---

## 13. 💰 Module 11: Finance, Accounting & Tax Reports

* **Financial Summary & GMV**: `GET /api/superadmin/finance/revenue`
* **Realized Commission Ledger**: `GET /api/superadmin/finance/commission`
* **Tax Collections (GST/TDS)**: `GET /api/superadmin/finance/tax`
* **Refund Losses**: `GET /api/superadmin/finance/refunds`
* **Master Financial Statement**: `GET /api/superadmin/finance/reports`

### Master Financial Statement DTO:
```json
{
  "totalGrossMerchandiseValue": 4825900.50,
  "platformCommissionEarned": 723885.08,
  "totalTaxCollected": 241295.03,
  "totalDeliveryFeesCollected": 194200.00,
  "totalPackagingFeesCollected": 97100.00,
  "totalRefundsIssued": 42350.00,
  "netPlatformEarnings": 681535.08,
  "totalTransactions": 19420,
  "successfulTransactions": 19120,
  "refundedTransactions": 140,
  "gmvBySector": {
    "FOOD": 3100000.00,
    "GROCERY": 1200500.50,
    "PHARMACY": 380400.00,
    "MEAT_FISH": 125000.00,
    "PET_SUPPLIES": 20000.00
  }
}
```

---

## 14. 🎧 Module 12: Customer Support & Dispute Arbitration

### 14.1 Support Ticket Queue
* **List Tickets**: `GET /api/superadmin/support/tickets?status=OPEN&category=DELIVERY`
* **Reply to Ticket**: `POST /api/superadmin/support/tickets/{id}/reply`
```json
{
  "message": "We have escalated this issue with the store manager and initiated a full refund.",
  "newStatus": "RESOLVED"
}
```

### 14.2 Order Dispute Resolution
* **List Disputes**: `GET /api/superadmin/support/disputes`
* **Get Dispute Details**: `GET /api/superadmin/support/disputes/{disputeId}`
* **Resolve Dispute**: `POST /api/superadmin/disputes/{disputeId}/resolve`
```json
{
  "approved": true,
  "refundAmount": 320.00,
  "adminNotes": "Verified photo proof showing damaged item packaging."
}
```

---

## 15. 📢 Module 13: Push Notification Console & Marketing Engine

* **Send Broadcast Push Notification**: `POST /api/superadmin/notifications/broadcast`
* **Request**:
```json
{
  "title": "⚡ Flash Sale on Instamart!",
  "message": "Get fresh fruits and dairy delivered in 10 mins with flat ₹100 off!",
  "targetAudience": "CUSTOMERS",
  "sector": "GROCERY",
  "actionUrl": "swiggy://sector/GROCERY"
}
```
* **Broadcast History**: `GET /api/superadmin/notifications/history`

---

## 16. ⚙️ Module 14: System Configuration, Maintenance & Dynamic Surge

### 16.1 System Config & Global Banner
* **Get Config**: `GET /api/superadmin/settings`
* **Update Config**: `PUT /api/superadmin/settings`
```json
{
  "defaultCommissionRate": 15.0,
  "maintenanceMode": false,
  "maintenanceMessage": "System undergoing scheduled upgrade from 2 AM to 4 AM IST.",
  "globalAnnouncementBanner": "Heavy rain alert in Hyderabad: Deliveries may take 10-15 mins longer.",
  "bannerActive": true,
  "supportPhone": "+91 800-400-5000",
  "supportEmail": "support@swiggy.com"
}
```

### 16.2 Dynamic Surge Pricing (Rain Mode & Night Rush)
* **Get Surge Status**: `GET /api/superadmin/surge`
* **Update Surge Pricing**: `PATCH /api/superadmin/surge`
```json
{
  "rainSurgeActive": true,
  "rainSurgeMultiplier": 1.5,
  "nightSurgeActive": false,
  "nightSurgeMultiplier": 1.25
}
```

---

## 17. 📜 Module 15: Immutable Audit Logs

* **Endpoint**: `GET /api/superadmin/audit-logs`
* **Query Parameters**:
  * `actorEmail`: e.g. `admin@swiggy.com`
  * `action`: e.g. `APPROVE_RESTAURANT`, `TRIGGER_REFUND`, `UPDATE_COMMISSION`, `BLOCK_CUSTOMER`
  * `targetEntityType`: e.g. `RESTAURANT`, `PAYMENT`, `USER`, `SETTLEMENT`
* **Sample Log Record**:
```json
{
  "id": 842,
  "actorEmail": "admin@swiggy.com",
  "actorRole": "SUPER_ADMIN",
  "action": "TRIGGER_REFUND",
  "targetEntityType": "PAYMENT",
  "targetEntityId": "TXN-98412",
  "details": "Refunded ₹450.00 for order ORD-548192. Reason: Customer missing item",
  "clientIp": "192.168.1.45",
  "timestamp": "2026-09-29T22:35:10"
}
```

---

## 18. 🏢 Module 16: Departmental Work Queues (Maker-Checker 4-Eyes Principle)

For enterprise governance, tasks requiring financial disbursals or critical store actions follow a **Maker-Checker (4-Eyes)** workflow:

1. **Queue Summary by Department**:  
   `GET /api/work-queues/{department}/summary` (`FINANCE`, `OPERATIONS`, `SUPPORT`).
2. **List Department Tasks**:  
   `GET /api/work-queues/{department}?status=PENDING | CLAIMED | IN_REVIEW | COMPLETED`
3. **Atomic Task Claiming**:  
   `POST /api/work-queues/{taskId}/claim` (Prevents duplicate processing by multiple agents).
4. **Maker Review Submission (Step 1)**:  
   `POST /api/work-queues/{taskId}/maker-review`  
   Body: `{"reviewNotes": "Verified bank statement and invoice numbers."}`
5. **Checker Approval (Step 2)**:  
   `POST /api/work-queues/{taskId}/checker-approve`  
   Body: `{"approved": true, "checkerNotes": "Approved for settlement payout."}`  
   > *Backend Enforces: Checker must NOT be the same employee as Maker!*
6. **SLA Monitoring**:  
   `GET /api/work-queues/sla-breached` & `POST /api/work-queues/escalate-overdue`.
7. **Admin Staff Onboarding**:  
   `GET /api/work-queues/staff` & `POST /api/work-queues/staff`.

---

## 19. 💻 Complete TypeScript Types for Admin Dashboard

Save this file as `types/superadmin.ts` in your frontend project:

```typescript
export type BusinessSector = 'FOOD' | 'GROCERY' | 'PHARMACY' | 'MEAT_FISH' | 'PET_SUPPLIES';
export type RestaurantStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type Department = 'FINANCE' | 'OPERATIONS' | 'SUPPORT';

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
  ordersBySector: Record<BusinessSector, number>;
  revenueBySector: Record<BusinessSector, number>;
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

export interface PlatformSystemConfig {
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

export interface AuditLog {
  id: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  details: string;
  clientIp: string;
  timestamp: string;
}
```

---

## 20. 🧭 Recommended Admin Sidebar Navigation Structure

```
├── 📊 Executive Dashboard (/dashboard)
├── 🏪 Stores & Dark Stores
│   ├── All Stores (/restaurants)
│   ├── Applications Queue (/restaurants/applications)
│   ├── KYC Verification (/restaurants/kyc)
│   └── Suspended Stores (/restaurants/suspended)
├── 📦 Orders & Dispatch
│   ├── Live Stepper Stream (/orders/live)
│   ├── Global Orders Ledger (/orders)
│   └── Dispute Queue (/orders/disputes)
├── 💳 Payments & Refunds
│   ├── Transaction Ledger (/payments/transactions)
│   └── Refund Execution (/payments/refunds)
├── 🏦 Settlements & Stripe Connect
│   ├── Pending Settlements (/settlements/pending)
│   ├── Batch Generation (/settlements/batch)
│   └── Disbursal History (/settlements/history)
├── 📈 Commission Switchboard (/commission)
├── 🛵 Rider Fleet (/riders)
├── 👥 Customers & Fraud (/customers)
├── 🎟️ Coupons & Campaigns (/coupons)
├── 💰 Finance & Tax Reports (/finance)
├── 🎧 Support Tickets (/support)
├── 📢 Broadcast Push Console (/notifications)
├── ⚙️ System Settings & Surge (/settings)
└── 📜 Audit Trail Explorer (/audit-logs)
```
