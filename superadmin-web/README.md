# 🚀 Food Delivery Super Admin Web Portal (`superadmin-web`)

Comprehensive administrative command center for the Multi-Sector Delivery Aggregator Platform. Built with **Next.js 16**, **React 19**, and **TypeScript**, providing platform-wide governance, real-time dispatch, financial auditing, and departmental work queues across all business sectors (**FOOD**, **GROCERY**, **PHARMACY**, **MEAT_FISH**, and **PET_SUPPLIES**).

---

## 🌟 Features & Modules

- **Command Center & Real-Time Monitoring:** Live GMV, active/completed order velocity, and sector distribution.
- **Merchant Governance & KYC:** Store onboarding, document inspection, approval/rejection workflows, and suspension controls.
- **Menu & Catalog Oversight:** Multi-sector category management, stock quantity monitoring, and pricing.
- **Payment & Settlement Ledger:** Multi-gateway transaction ledger, refund processing, and automated merchant payouts.
- **Delivery Fleet Operations:** Real-time rider tracking, assignment status, bottleneck diagnostics, and delivery split configuration.
- **Customer Care & Fraud Mitigation:** Account governance, wallet adjustments, and dispute arbitration.
- **Maker-Checker Work Queues:** Four-eyes security principle ensuring critical financial adjustments require peer sign-off.
- **Dynamic Surge & System Settings:** Real-time rain mode, late-night multipliers, and platform maintenance toggles.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.18+ or v20+)
- **npm** (or yarn / pnpm)
- Running **Backend Service** (Spring Boot on port `8080`)

### 2. Configure Environment
Create a `.env.local` file in the `superadmin-web` directory with the following variables:

```env
# Backend REST API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Build Optimizations
NEXT_DISABLE_VERSION_CHECK=1
NEXT_TELEMETRY_DISABLED=1
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```
