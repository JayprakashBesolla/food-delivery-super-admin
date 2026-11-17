# 🍔 Food Delivery Super Admin Platform

A production-grade, multi-sector delivery aggregator and administrative governance platform inspired by **Swiggy One**, **Instamart**, and **Dunzo**. This monorepo contains both the unified Spring Boot 3 backend and the Next.js 16 Super Admin portal.

---

## 🌟 Ecosystem Architecture

The platform connects consumers, multi-sector merchants, delivery riders, and administrators through a unified API gateway:

```
                            🌐 Web & Mobile Clients
        ┌─────────────────────────────────────────────────────────────┐
        │   📱 Consumer Mobile App (Food • Grocery • Pharmacy • Meat) │
        │   💻 Super Admin Command Center (Next.js 16 Web Portal)     │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼  REST APIs & WebSocket (/ws)
        ┌─────────────────────────────────────────────────────────────┐
        │            ☕ Spring Boot 3.4.2 Aggregator Core             │
        │  • Swiggy Cart Guard (HTTP 409)  • Dynamic Surge & Zones    │
        │  • Multi-Gateway Payments        • Rx Prescription Review   │
        │  • Four-Eyes Maker-Checker       • Immutable Audit Logs     │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼  JPA / Hibernate
        ┌─────────────────────────────────────────────────────────────┐
        │                     🗄️ MySQL Database                       │
        │  (Restaurants, Dark Stores, Menus, Orders, Ledger, Audits)  │
        └─────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Supported Business Sectors

The platform implements sector-isolated catalogs, operational buffers, and business logic:

1. **`FOOD`** — Restaurants, cloud kitchens, cafes, and bakeries.
2. **`GROCERY`** — Quick-commerce dark stores with 10–15 minute SLA delivery.
3. **`PHARMACY`** — 24/7 licensed pharmacies with mandatory doctor prescription verification (Rx stepper).
4. **`MEAT_FISH`** — Cold-chain butcheries and fresh seafood cuts.
5. **`PET_SUPPLIES`** — Pet food, treats, and healthcare essentials.

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.4.2 | High-throughput REST API and business logic engine |
| **Frontend** | Next.js 16, React 19, TypeScript | Reactive, server-rendered Super Admin dashboard |
| **Database** | MySQL 8 | Relational data persistence with strict foreign key integrity |
| **Security** | Spring Security 6, JWT | Stateless token authentication with role-based access control |
| **Real-Time** | Spring WebSocket, STOMP | Live order tracking, rider GPS telemetry, and dispatch alerts |
| **Payments** | Razorpay, Stripe | Razorpay gateway verification & automated Stripe payouts |
| **Styling** | Tailwind CSS, Lucide Icons | Responsive modern enterprise interface |

---

## 👑 16 Super Admin Modules

The Super Admin web portal (`superadmin-web`) provides platform operations across 16 core administrative modules:

1. **Super Admin Command Center (`/dashboard`)** — Real-time GMV, active deliveries, order velocity, and sector distribution.
2. **Restaurant & Merchant Governance (`/restaurants`)** — Onboarding approvals, store profiles, operational hours, and suspensions.
3. **Merchant KYC & Compliance (`/restaurants`)** — Document inspection for GSTIN, FSSAI, PAN, and Drug Licenses.
4. **Payment Gateway Console (`/payments`)** — Multi-gateway transaction ledger, failed payment diagnostics, and refunds.
5. **Real-Time Order Dispatch (`/orders`)** — Fulfillment pipeline stepper, live delay tracking, and order cancellations.
6. **Merchant Settlements & Payouts (`/settlements`)** — Settlement calculation, automated payouts, and UTR reconciliation.
7. **Commission Switchboard (`/commission`)** — Global take-rates, negotiated restaurant commissions, and rider fee splits.
8. **Delivery Fleet Operations (`/delivery`)** — Rider directory, live delivery assignments, and bottleneck diagnostics.
9. **Customer Governance & Fraud Mitigation (`/customers`)** — Customer 360°, wallet balance adjustments, and account blocking.
10. **Coupons & Promotional Campaigns (`/coupons`)** — Sector vouchers, discount limits, and campaign performance analytics.
11. **Finance, Accounting & Tax Reports (`/finance`)** — Platform revenue, GST/TDS tax reporting, and balance sheets.
12. **Customer Support & Disputes (`/support`)** — Support ticket queues, resolution workflows, and dispute arbitration.
13. **Push Notification Console (`/notifications`)** — Broadcast announcements and segment messaging.
14. **System Settings & Dynamic Surge (`/settings`)** — Rain mode surge pricing, delivery fees, and maintenance mode controls.
15. **System Audit Logs (`/audit-logs`)** — Searchable, immutable event trail of all administrative operations.
16. **Departmental Work Queues (`/work-queues`)** — Four-eyes Maker-Checker sign-off pipeline for high-value transactions.

---

## 📂 Project Structure & Documentation

* [**`foodapp/`**](foodapp/) — Spring Boot Backend Source Code
  * [Backend Developer Guide](foodapp/README.md)
  * [React Native Frontend Integration Guide](foodapp/docs/FRONTEND_REACT_NATIVE_INTEGRATION_GUIDE.md)
  * [Store Admin App Developer Guide](foodapp/docs/STORE_ADMIN_APP_DEVELOPER_GUIDE.md)
  * [Super Admin Portal Developer Guide](foodapp/docs/SUPER_ADMIN_PORTAL_DEVELOPER_GUIDE.md)
* [**`superadmin-web/`**](superadmin-web/) — Next.js 16 Super Admin Frontend
  * [Frontend Developer Guide](superadmin-web/README.md)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Java 21+**
- **Node.js 18.18+ or 20+**
- **MySQL 8 Server** running on `localhost:3306`

### 2. Start the Backend
```bash
cd foodapp
./mvnw spring-boot:run
```
*(On Windows PowerShell: `.\mvnw.cmd spring-boot:run`)*

The backend initializes the database schema and sample data on `http://localhost:8080`.

### 3. Start the Frontend
```bash
cd superadmin-web
npm install
npm run dev
```

The frontend launches on `http://localhost:3000`.

### 4. Admin Access
* **Portal URL:** `http://localhost:3000/login`
* **Default Admin Email:** `admin@swiggy.com`
* **Default Admin Password:** `Password123!`

---

## 🔒 Security Best Practices

- Real database passwords, JWT private keys, and payment gateway tokens must never be hardcoded into source control.
- In production, inject configuration values via environment variables (`DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `STRIPE_API_KEY`).
- Reference [`foodapp/src/main/resources/application-example.properties`](foodapp/src/main/resources/application-example.properties) for template configuration.
