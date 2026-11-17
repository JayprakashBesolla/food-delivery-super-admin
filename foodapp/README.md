# 🛵 Swiggy-Type Multi-Sector Super-App Delivery Backend (`foodapp`)

Production-ready, Spring Boot 3 multi-sector delivery aggregator platform inspired by **Swiggy One / Dunzo / Instamart**. It powers unified consumer mobile apps (React Native / Flutter) and web portals across **Food Delivery**, **Instamart Grocery**, **Pharmacy**, and **Meat & Seafood**, with isolated sector catalogs, dedicated store admins, and platform-wide governance.

---

## 🌟 Architecture: Multi-Sector Super-App

Unlike single-vertical food delivery apps or white-label single-tenant systems (`RRbackend`), `foodapp` operates as a **Unified Multi-Sector Super-App**:

```
                       📱 React Native / Flutter Consumer App
             ┌─────────────────┬─────────────────┬──────────────────┐
             │ 🍔 Food Delivery│ 🛒 Instamart    │ 💊 24/7 Pharmacy │
             └────────┬────────┴────────┬────────┴──────────┬───────┘
                      │                 │                   │
                      ▼                 ▼                   ▼
             [GET /api/restaurants?sector=FOOD | GROCERY | PHARMACY]
                                        │
             ┌──────────────────────────┴───────────────────────────┐
             │       🛡️ Sector & Store Cart Guard (HTTP 409)        │
             │   (Prevents mixing Hot Food with Dark Store Groceries) │
             └──────────────────────────┬───────────────────────────┘
                                        │
┌──────────────────────────┬────────────┴─────────────┬────────────────────────────┐
│   🏪 Restaurant Partner  │    🏬 Dark Store Admin   │    💊 Pharmacy Merchant    │
│  • Kitchen Rush (+15m)   │  • Live Stock Inventory  │  • Rx Prescription Verify  │
│  • KDS Kitchen Stepper   │  • MRP & Discount Tags   │  • Drug License Compliance │
└──────────────────────────┴──────────────────────────┴────────────────────────────┘
                                        │
                         👑 Platform Super Admin (HQ)
           • Sector Switchboard • Platform GMV • Disputes & Refunds
```

### Supported Business Sectors (`BusinessSector` Enum)
1. **`FOOD`** — Restaurants, cloud kitchens, cafes, bakeries (25-35 mins).
2. **`GROCERY`** — Swiggy Instamart-style 10-15 min quick-commerce dark stores (milks, fresh veggies, snacks, FMCG).
3. **`PHARMACY`** — 24/7 licensed pharmacies, health supplements, and prescription drugs with digital Rx verification.
4. **`MEAT_FISH`** — Hygienic butcher shops, fresh cuts, and marinated meats.
5. **`PET_SUPPLIES`** — Pet food, accessories, and grooming essentials.

---

## 🌟 How This Differs from `RRbackend`

| Feature | `RRbackend` (SaaS Multi-Tenant) | `foodapp` (Swiggy Super-App) |
| :--- | :--- | :--- |
| **Model** | White-label SaaS per Restaurant | Single Unified Multi-Sector Marketplace |
| **Routing** | Subdomain / Custom Domain (`X-Tenant-Domain`) | Single Unified API endpoints (`/api/*`) |
| **User Accounts** | Isolated per restaurant tenant | Single Swiggy customer account across all sectors |
| **Discovery** | Isolated per domain | Browse all stores, filter by **Sector**, cuisine, rating, veg/non-veg |
| **Global Search** | Scoped to 1 tenant | Search stores & products across all sectors or scoped to active sector |
| **Cart Enforcement** | N/A (1 store at a time) | **Swiggy Cart Guard**: Detects cross-store & cross-sector additions (`HTTP 409 Conflict`) |
| **Checkout** | Restaurant-specific | Unified checkout with dynamic delivery fee, surge pricing, Rx upload, coupons |
| **Portals** | Separate tenant admin subdomains | Customer (`/api/*`), Partner (`/api/partner/*`), Store Admin (`/api/store-admin/*`), Super Admin (`/api/superadmin/*`), Rider (`/api/rider/*`) |

---

## 🚀 Quick Start

### 1. Requirements
- **Java 17+**
- **MySQL Server** (running locally on port `3306`)

### 2. Configure Database
Configure your database connection in `src/main/resources/application.properties` or via environment variables (reference `application-example.properties`):
```properties
spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:swiggy_foodapp}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
server.port=${SERVER_PORT:8080}
```

### 3. Run the Application
Run using the included Maven wrapper:
```bash
./mvnw spring-boot:run
```
*(On Windows PowerShell: `.\mvnw.cmd spring-boot:run`)*

---

## 🔑 Pre-Seeded Default Accounts (`DataInitializer`)

When the application boots for the first time, it automatically creates sample accounts across all sectors:

| Role | Sector | Email | Password | Phone |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Platform HQ | `admin@swiggy.com` | `Password123!` | `9999900000` |
| **Customer** | All Sectors | `customer@swiggy.com` | `Password123!` | `9876543210` |
| **Restaurant Partner** | `FOOD` | `partner@biryani.com` | `Password123!` | `9123456780` |
| **Grocery Partner** | `GROCERY` | `partner.grocery@instamart.com` | `Password123!` | `9123456781` |
| **Pharmacy Partner** | `PHARMACY` | `partner.pharma@apollo.com` | `Password123!` | `9123456782` |
| **Meat Partner** | `MEAT_FISH` | `partner.meat@freshcut.com` | `Password123!` | `9123456783` |

### Pre-Seeded Stores & Dark Stores
1. **Royal Biryani House** (`FOOD` — Hyderabadi Biryani, Kebabs)
2. **Pizza Paradise** (`FOOD` — Italian Pizzas & Pastas)
3. **Swiggy Instamart - Madhapur Dark Store** (`GROCERY` — Amul Taaza 500ml, Modern White Bread 400g, Farm Fresh Eggs, Lays chips, Red Bull)
4. **Apollo Pharmacy 24/7** (`PHARMACY` — Dolo 650, Dettol Antiseptic, Augmentin 625 [Rx required])
5. **Fresh Cut Meat & Seafood Co.** (`MEAT_FISH` — Fresh Tender Chicken Curry Cut 500g, Mutton Biryani Cut 500g)

---

## 📡 Complete Multi-Sector API Reference

### 🌐 1. Sectors Switcher (`/api/sectors`)
* `GET /api/sectors` — List all active platform business sectors with display names, delivery badges (e.g. `10-15 MINS`), hero banners, and live store counts. Used by mobile apps to render the top category switcher tabs.

### 🔐 2. Customer Authentication & OTP (`/api/auth`)
* `POST /api/auth/register` — Register new customer or sector partner.
* `POST /api/auth/login` — Login with email/phone & password. Returns JWT token.
* `GET /api/auth/me` — Get current logged-in user profile.
* `POST /api/auth/send-otp` — Generates 6-digit OTP for password reset.
* `POST /api/auth/verify-otp` — Verifies OTP validity.
* `POST /api/auth/reset-password` — Resets password using verified OTP.

### 🏪 3. Store Discovery & Menus (`/api/restaurants`)
* `GET /api/restaurants` — List all stores. Supports query params:
  * `?sector=FOOD | GROCERY | PHARMACY | MEAT_FISH | PET_SUPPLIES` *(Sector filtering)*
  * `?city=Hyderabad`
  * `?cuisine=Biryani`
  * `?isVeg=true`
  * `?minRating=4.0`
  * `?sortBy=rating | cost_low | cost_high | delivery_time`
* `GET /api/restaurants/{id}` — Get detailed store information (including `businessSector`, `isQuickCommerce`, `drugLicenseNumber`).
* `GET /api/restaurants/slug/{slug}` — Get store by slug.
* `GET /api/restaurants/{id}/menu` — Get store menu grouped by categories, exposing product attributes (`mrp`, `unit`, `brand`, `stockQuantity`, `prescriptionRequired`, `barcode`).

### 🔍 4. Sector-Aware Global Search (`/api/search`)
* `GET /api/search?q=milk&sector=GROCERY` — Searches stores and items filtered by sector.
* `GET /api/search?q=dolo&sector=PHARMACY` — Searches pharmacy medicines by name, brand, or description.
* `GET /api/search?q=biryani` — Searches across all sectors when `sector` is omitted.

### 🛒 5. Swiggy Cart with Sector & Store Conflict Guard (`/api/cart`)
* `GET /api/cart` — View current active cart, items, dynamic bill breakdown, and active sector.
* `POST /api/cart/add` — Add item/dish to cart:
  ```json
  {
    "dishId": 5,
    "quantity": 2,
    "forceReplaceCart": false
  }
  ```
  > **Swiggy Cross-Store & Cross-Sector Guard**: If the cart already contains items from another store or sector, the backend returns `HTTP 409 Conflict`:
  > ```json
  > {
  >   "conflict": true,
  >   "message": "Cart contains items from 'Royal Biryani House' (FOOD). Replace cart with items from 'Swiggy Instamart - Madhapur Dark Store' (GROCERY)?",
  >   "existingRestaurantId": 1,
  >   "existingRestaurantName": "Royal Biryani House",
  >   "existingSector": "FOOD",
  >   "newRestaurantId": 3,
  >   "newRestaurantName": "Swiggy Instamart - Madhapur Dark Store",
  >   "newSector": "GROCERY"
  > }
  > ```
  > Set `"forceReplaceCart": true` to discard and switch stores/sectors!
* `PUT /api/cart/items/{itemId}` — Update quantity (`{"quantity": 2}`). Setting `0` removes item.
* `DELETE /api/cart/items/{itemId}` — Remove item from cart.
* `DELETE /api/cart/clear` — Clear entire cart.

### 📦 6. Checkout, Orders & Pharmacy Prescriptions (`/api/orders`)
* `POST /api/orders/place` — Place an order:
  ```json
  {
    "orderType": "DELIVERY",
    "paymentMethod": "CASH_ON_DELIVERY",
    "addressId": 1,
    "couponCode": "INSTA20",
    "prescriptionImageUrl": "https://storage.swiggy.com/prescriptions/rx_123.jpg",
    "specialInstructions": "Leave at door"
  }
  ```
  > **Pharmacy Prescription Rule**: If any cart item has `prescriptionRequired: true`, `prescriptionImageUrl` is mandatory. The order is placed in `prescriptionVerificationStatus: "PENDING_REVIEW"`.
* `GET /api/orders/user` — List user's order history with sector badges and Rx statuses.
* `GET /api/orders/{orderId}` — Live order tracking status.
* `GET /api/orders/{orderId}/receipt` — View formatted printable tax invoice / receipt (HTML).
* `POST /api/orders/{orderId}/cancel` — Request order cancellation before preparation starts.

### 💳 7. Razorpay Payment Gateway (`/api/payment`)
* `POST /api/payment/create-order?orderId={orderId}` — Generates Razorpay transaction order.
* `POST /api/payment/verify-payment` — Cryptographic HMAC-SHA256 signature verification.
* `POST /api/payment/webhook` — Webhook listener for payment capture events.

### 🎁 8. Loyalty Points System (`/api/loyalty`)
* `GET /api/loyalty/balance` — Check customer loyalty points balance.
* *Note: Points are automatically awarded upon order delivery (1 point per ₹100 spent, 1 point = ₹1).*

### 🎟️ 9. Coupons with Usage Limits (`/api/coupons`)
* `GET /api/coupons` — List all active platform-wide coupons.
* `GET /api/coupons/restaurant/{restaurantId}` — List store-specific coupons.
* `POST /api/coupons/validate?code=...&restaurantId=...&itemTotal=...` — Real-time coupon validation with per-user limit check (`CouponUsage`).

### 🛵 10. Delivery Partner (Rider) Portal (`/api/rider`)
* `GET /api/rider/available-orders` — View orders awaiting delivery pickup.
* `POST /api/rider/orders/{orderId}/accept` — Accept delivery run.
* `POST /api/rider/orders/{orderId}/location` — Broadcast live rider GPS coordinates via WebSocket.
* `PATCH /api/rider/orders/{orderId}/delivered` — Mark order delivered (triggers loyalty reward & customer alert).

### 🏪 11. Store & Catalog Management (`/api/partner`)
* `POST /api/upload` — Upload product photos to disk storage.
* `POST /api/partner/restaurants/{restaurantId}/dishes` — Add item to catalog with quick-commerce fields:
  * Multipart fields: `name`, `price`, `mrp`, `unit` (e.g. `500 ml`, `1 kg`), `brand` (e.g. `Amul`), `stockQuantity` (e.g. `150`), `prescriptionRequired` (`true`/`false`), `barcode`, `image`.
* `POST /api/partner/dishes/{dishId}/variants` — Add portion size (Regular, Medium, Large).
* `POST /api/partner/dishes/{dishId}/addons` — Add customization add-ons.
* `POST /api/partner/categories` — Add menu / aisle category (e.g., Dairy & Bread, Cold Drinks, Antibiotics).
* `PATCH /api/partner/restaurants/{restaurantId}/toggle-open` — Open / close store toggle.
* `PATCH /api/partner/dishes/{dishId}/toggle-stock` — In-stock / out-of-stock toggle.
* `POST /api/partner/kyc/{restaurantId}` — Submit merchant KYC documents (GSTIN, FSSAI, Drug License, PAN, Bank account).
* `GET /api/partner/analytics/{restaurantId}` — Partner cockpit revenue & order velocity metrics.

### 🏬 12. Detailed Store Admin (`/api/store-admin`)
* `GET /api/store-admin/cockpit/{restaurantId}` — Store analytics (gross sales, net earnings, AOV, top items, hourly heatmap).
* `GET /api/store-admin/branches/{restaurantId}` — List physical dark stores / branch outlets.
* `POST /api/store-admin/branches/{restaurantId}` — Add new physical dark store or outlet.
* `DELETE /api/store-admin/branches/{branchId}` — Delete outlet.
* `GET /api/store-admin/staff/{restaurantId}` — List store staff (`MANAGER`, `CHEF`, `CASHIER`).
* `POST /api/store-admin/staff/{restaurantId}` — Add store staff member.
* `DELETE /api/store-admin/staff/{staffId}` — Remove staff member.
* `PATCH /api/store-admin/operations/{restaurantId}` — Store operational controls & rush hour mode (`+15m` prep buffer).
* `GET /api/store-admin/orders/live/{restaurantId}` — Active orders stream for kitchen/dispatch display systems.
* `POST /api/store-admin/orders/{orderId}/cancellation-response` — Approve or decline customer cancellation requests.
* `PATCH /api/store-admin/orders/{orderId}/verify-prescription` — **Pharmacy Store Admin Rx Verification**:
  ```json
  {
    "approved": true,
    "notes": "Verified by Registered Pharmacist (Reg #TS-98421)"
  }
  ```

### 👑 13. Super Admin Platform HQ & Stripe Engine (`/api/superadmin`)
Complete administrative suite organized across 14 functional areas:

* **📊 1. Dashboard**:
  * `GET /api/superadmin/dashboard` — Platform GMV, net revenue, active/delivered orders, sector revenue breakdown, orders last 60 mins.
* **🏪 2. Restaurants & Stores**:
  * `GET /api/superadmin/restaurants/applications` — Review pending store onboarding requests.
  * `GET /api/superadmin/restaurants/active` — Active stores across all sectors.
  * `GET /api/superadmin/restaurants/suspended` — Suspended/blacklisted stores.
  * `GET /api/superadmin/restaurants/{id}/details` — 360° store profile (GMV, lifetime orders, staff, branches, KYC).
  * `POST /api/superadmin/restaurants/{id}/approve` & `/reject` — Application decisions.
  * `POST /api/superadmin/restaurants/{id}/suspend` & `/unsuspend` — Store policy actions.
  * `GET /api/superadmin/restaurants/{id}/documents` & `GET /api/superadmin/restaurants/kyc/pending`.
* **📦 3. Orders**:
  * `GET /api/superadmin/orders` — Filterable by sector, status, store.
  * `GET /api/superadmin/orders/live` — Active fulfillment stepper stream.
  * `GET /api/superadmin/orders/cancelled` — Cancelled orders with diagnostics.
  * `GET /api/superadmin/orders/failed` — Gateway failures & timeouts.
  * `GET /api/superadmin/orders/disputes` — Orders with open disputes.
* **💳 4. Payments (Stripe & Multi-Gateway)**:
  * `GET /api/superadmin/payments/transactions` — Multi-gateway unified ledger.
  * `GET /api/superadmin/payments/successful` & `/failed`.
  * `GET /api/superadmin/payments/refunds`.
  * `POST /api/superadmin/payments/{id}/refund` — Automated Stripe/Razorpay refund triggers.
  * `POST /api/payment/stripe/webhook` — Stripe webhook event listener.
* **🏦 5. Settlements & Stripe Connect**:
  * `GET /api/superadmin/settlements/pending`, `/processing`, `/paid`, `/failed`, `/history`.
  * `POST /api/superadmin/settlements/generate-batch` — Calculate settlement statements.
  * `POST /api/superadmin/settlements/{id}/payout` — Disburse automated payout via **Stripe Connect Transfers** (`tr_...`) or manual bank UTR.
* **📈 6. Commission**:
  * `GET & PUT /api/superadmin/commission/global` — Platform default take rate (e.g. 15.0%).
  * `GET & PATCH /api/superadmin/commission/restaurants/{id}` — Negotiated custom restaurant rate.
  * `GET /api/superadmin/commission/delivery` — Platform vs rider delivery cut.
* **🛵 7. Delivery (Riders)**:
  * `GET /api/superadmin/delivery/partners` — Rider fleet directory, phone, vehicle, earnings.
  * `GET /api/superadmin/delivery/live` — Active rider GPS coordinates and runs.
  * `GET /api/superadmin/delivery/earnings` — Rider pay, bonuses & tips.
  * `GET /api/superadmin/delivery/issues` — Delayed and unassigned deliveries.
* **👥 8. Customers & Fraud Prevention**:
  * `GET /api/superadmin/customers/users` — Customer directory with lifetime GMV.
  * `GET /api/superadmin/customers/blocked` — Fraud blacklist.
  * `PATCH /api/superadmin/customers/{id}/block` & `/unblock` — Fraud mitigation controls.
  * `GET /api/superadmin/customers/wallets` & `POST /api/superadmin/customers/{id}/wallet-adjust`.
  * `GET /api/superadmin/customers/complaints`.
* **🎟️ 9. Coupons**:
  * `GET & POST /api/superadmin/coupons/platform` — Platform-wide discount vouchers.
  * `GET /api/superadmin/coupons/restaurant` & `/api/superadmin/coupons/campaigns`.
* **💰 10. Finance & Tax**:
  * `GET /api/superadmin/finance/revenue` — Platform GMV vs Net Platform Earnings.
  * `GET /api/superadmin/finance/commission` — Realized commission ledger.
  * `GET /api/superadmin/finance/tax` — GST/TDS tax collections.
  * `GET /api/superadmin/finance/refunds` — Total refund losses.
  * `GET /api/superadmin/finance/reports` — Comprehensive exportable financial statement.
* **🎧 11. Support**:
  * `GET /api/superadmin/support/complaints` & `/support/disputes`.
  * `GET /api/superadmin/support/tickets` — Ticket queue.
  * `POST /api/superadmin/support/tickets/{id}/reply` — Two-way support message thread.
* **📢 12. Notifications**:
  * `POST /api/superadmin/notifications/broadcast` — Broadcast push announcements.
  * `GET /api/superadmin/notifications/history` — Campaign archives.
* **⚙️ 13. Settings & Dynamic Surge**:
  * `GET & PUT /api/superadmin/settings` — Platform maintenance mode, announcement banner.
  * `GET & PATCH /api/superadmin/surge` — Rain mode & late-night surge multipliers.
* **📜 14. Audit Logs**:
  * `GET /api/superadmin/audit-logs` — Immutable audit log recording every admin action, actor, target entity, IP address, and timestamp.

### ⚡ 14. Real-Time WebSocket Updates (`/ws`)
* Subscribe to `/topic/order/{orderId}` to receive instant delivery updates as the store, pharmacy, and rider progress the order.
* Subscribe to `/topic/restaurant/{restaurantId}` to receive instant audio chime notifications when a new customer order is placed.

---

## 📱 Mobile App (React Native / Flutter) Integration Guide

Building a Swiggy-style multi-sector frontend in React Native or Flutter is seamless with this API structure:

### 1. Top Sector Switcher (Food vs. Instamart vs. Pharmacy)
Call `GET /api/sectors` on app startup to render the horizontal category pills:
```dart
// Flutter example
final response = await http.get(Uri.parse('$baseUrl/api/sectors'));
// Response: [{ sector: "FOOD", displayName: "Food Delivery", deliveryBadge: "25-35 MINS" },
//            { sector: "GROCERY", displayName: "Instamart", deliveryBadge: "10-15 MINS" }, ...]
```

### 2. Toggling Categories
When the user taps on **Instamart**:
1. Update mobile UI state: `activeSector = "GROCERY"`.
2. Fetch grocery dark stores: `GET /api/restaurants?sector=GROCERY&city=Hyderabad`.
3. Feed search bar with sector query: `GET /api/search?q=${query}&sector=GROCERY`.

### 3. Handling Swiggy Cart Guard (HTTP 409)
When a user adds an item from an Instamart dark store while already having Biryani in their cart:
1. `POST /api/cart/add` returns `HTTP 409 Conflict`.
2. Show a bottom sheet modal:
   > *"You have items from Royal Biryani House (Food Delivery) in your cart. Would you like to discard them and add items from Swiggy Instamart?"*
3. If user taps **"Yes, Discard Cart"**, repeat request with `"forceReplaceCart": true`.

### 4. Pharmacy Orders with Prescription
If any item in the cart has `prescriptionRequired == true`:
1. The checkout screen shows an **"Upload Doctor's Prescription"** stepper.
2. Customer uploads prescription via `POST /api/upload`.
3. Pass `prescriptionImageUrl` into `POST /api/orders/place`.
4. Order screen shows status banner: *"Prescription under review by pharmacist"*.
