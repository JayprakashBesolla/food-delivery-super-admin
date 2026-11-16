# 🏪 Store Admin & Merchant Partner App: Developer Integration Guide

> **Target Audience**: Mobile / Tablet / Web Frontend Developers building the **Store Admin / Merchant Partner App** (React Native, Flutter, or React/Next.js Tablet POS / KDS)  
> **Backend Architecture**: Spring Boot 3 Multi-Sector Delivery Aggregator Platform (`foodapp`)  
> **App Types Supported**:  
> • 🍔 **Restaurant Partner App**: Kitchen Display System (KDS), Rush mode buffer, order dispatch.  
> • 🛒 **Dark Store Admin App (Instamart)**: Quick-commerce live inventory, barcode lookup, picker order stepper.  
> • 💊 **Pharmacy Merchant App**: Digital prescription (Rx) verification, drug license compliance.  
> • 🥩 **Meat & Butcher Admin App**: Fresh cuts inventory & immediate packaging stepper.  
> **Backend Base URL (Local Dev)**:  
> • Android Tablet / Emulator: `http://10.0.2.2:8080`  
> • iOS Simulator: `http://localhost:8080`  
> • Physical Tablet / Device on LAN: `http://<your-machine-ip>:8080` (e.g. `http://192.168.1.100:8080`)

---

## 🔑 Pre-Seeded Default Partner Accounts

| Sector | Store Name | Partner Email | Password | Restaurant ID |
| :--- | :--- | :--- | :--- | :--- |
| **FOOD** | Royal Biryani House | `partner@biryani.com` | `Password123!` | `1` |
| **FOOD** | Pizza Paradise | `partner.pizza@paradise.com` | `Password123!` | `2` |
| **GROCERY** | Swiggy Instamart - Madhapur | `partner.grocery@instamart.com` | `Password123!` | `3` |
| **PHARMACY** | Apollo Pharmacy 24/7 | `partner.pharma@apollo.com` | `Password123!` | `4` |
| **MEAT_FISH**| Fresh Cut Meat & Seafood Co.| `partner.meat@freshcut.com` | `Password123!` | `5` |

*(All partner accounts hold `Role.RESTAURANT_PARTNER`).*

---

## 1. 🏗️ Store Admin App Architecture & Flow

```
                      ┌──────────────────────────────────────────────┐
                      │    🏪 Store Admin App (Tablet / Mobile / Web)│
                      └──────────────────────┬───────────────────────┘
                                             │
      ┌──────────────────────┬───────────────┴──────────────┬───────────────────────┐
      ▼                      ▼                              ▼                       ▼
📊 Partner Cockpit     ⚡ Live Orders (KDS)          📦 Catalog & Live Stock   ⚙️ Operations & Rush
- Gross Sales & Payout - Real-time incoming chime    - Quick-commerce stock   - Rush mode (+15m buffer)
- Top selling dishes   - Kitchen fulfillment stepper - MRP & Discount pricing - Open / Close store toggle
- Hourly order heatmap - Rx prescription verify     - Variants & Add-ons     - Staff & Branch outlets
```

---

## 2. 🔐 Authentication & Session Handling

### 2.1 Partner Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request**:
```json
{
  "usernameOrEmailOrPhone": "partner@biryani.com",
  "password": "Password123!"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 3,
  "name": "Restaurant Partner",
  "email": "partner@biryani.com",
  "phone": "9123456780",
  "role": "RESTAURANT_PARTNER"
}
```

### 2.2 Security Headers
Include the JWT token in all API calls:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 3. 📊 Module 1: Partner Cockpit & Business Analytics

### 3.1 Fetch Store Cockpit Metrics
* **Endpoint**: `GET /api/store-admin/cockpit/{restaurantId}`
* **Access**: `RESTAURANT_PARTNER` or `SUPER_ADMIN`
* **Sample Response (`200 OK`)**:
```json
{
  "restaurantId": 1,
  "restaurantName": "Royal Biryani House",
  "open": true,
  "kitchenBusy": false,
  "rushExtraMinutes": 0,
  "grossSales": 142500.00,
  "platformCommissionDeducted": 21375.00,
  "netEarnings": 121125.00,
  "totalOrders": 420,
  "deliveredOrders": 395,
  "cancelledOrders": 12,
  "averageOrderValue": 360.75,
  "avgRating": 4.5,
  "totalRatings": 128,
  "topSellingDishes": [
    {
      "dishName": "Chicken Dum Biryani",
      "quantitySold": 240,
      "totalRevenue": 76800.00
    },
    {
      "dishName": "Mutton Biryani",
      "quantitySold": 110,
      "totalRevenue": 46200.00
    }
  ],
  "hourlyOrderHeatmap": {
    "12": 45,
    "13": 82,
    "14": 30,
    "19": 55,
    "20": 98,
    "21": 70
  }
}
```

### 3.2 Quick Operational Summary
* **Endpoint**: `GET /api/partner/analytics/{restaurantId}`  
  Returns high-level totals (`totalOrders`, `activeOrders`, `deliveredOrders`, `totalRevenue`, `isOpen`).

---

## 4. ⚡ Module 2: Live Kitchen Orders & Fulfillment Stepper (KDS)

This is the primary screen for cooks in the kitchen or pickers in an Instamart dark store.

### 4.1 Fetch Live Active Orders
* **Endpoint**: `GET /api/store-admin/orders/live/{restaurantId}`
* **Returns**: Active orders currently in fulfillment (excluding `DELIVERED` and `CANCELLED`).
* **Sample Response (`200 OK`)**:
```json
[
  {
    "orderId": "ORD-548192",
    "restaurantId": 1,
    "restaurantName": "Royal Biryani House",
    "orderType": "DELIVERY",
    "status": "PLACED",
    "paymentMethod": "ONLINE_RAZORPAY",
    "paymentStatus": "PAID",
    "deliveryAddress": "Flat 402, Sunshine Heights, Madhapur, Hyderabad",
    "itemTotal": 640.00,
    "totalAmount": 597.00,
    "riderName": "Ramesh Kumar (Swiggy Delivery)",
    "riderPhone": "+91 98765 43210",
    "estimatedDeliveryMinutes": 35,
    "businessSector": "FOOD",
    "createdAt": "2026-09-29T22:30:00",
    "items": [
      {
        "dishId": 1,
        "dishName": "Chicken Dum Biryani",
        "quantity": 2,
        "pricePerUnit": 320.00,
        "totalPrice": 640.00,
        "selectedVariant": "Full",
        "selectedAddons": "Extra Raita, Salan",
        "imageUrl": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8"
      }
    ]
  }
]
```

### 4.2 🔔 Real-Time Audio Chime Notification (WebSocket STOMP)
Whenever a customer places an order, the server broadcasts an event to the store's WebSocket channel.

* **WebSocket Endpoint**: `ws://<backend-ip>:8080/ws`
* **Topic to Subscribe**: `/topic/restaurant/{restaurantId}`
* **Incoming Broadcast Payload**:
```json
{
  "type": "NEW_ORDER",
  "orderId": "ORD-548192",
  "totalAmount": "597.00"
}
```

#### 🎵 Implementation Pattern for Tablet / Mobile:
1. When receiving `type === "NEW_ORDER"`, play a continuous ringing chime (e.g. Swiggy partner bell sound).
2. Show a full-screen **"NEW ORDER ACCEPTANCE"** modal displaying items, order amount, and countdown timer.
3. Automatically append the new order to the KDS order board.

### 4.3 Update Order Fulfillment Status Stepper
* **Endpoint**: `PATCH /api/partner/orders/{orderId}/status`
* **Request Body**:
```json
{
  "status": "ACCEPTED",
  "riderName": null,
  "riderPhone": null,
  "etaMinutes": 25
}
```

#### 🔄 Order Lifecycle Stepper:
1. **`PLACED` ➔ `ACCEPTED`**: Store acknowledges and accepts order (stops the audio chime).
2. **`ACCEPTED` ➔ `PREPARING`**: Kitchen starts cooking (or dark store picker begins bagging).
3. **`PREPARING` ➔ `READY_FOR_PICKUP`**: Food packed in tamper-proof bag, ready on the dispatch counter. Rider is alerted.
4. **`READY_FOR_PICKUP` ➔ `OUT_FOR_DELIVERY`**: Parcel handed over to delivery rider.

---

## 5. ❌ Module 3: Customer Cancellation Decision Engine

Customers can request cancellation before preparation starts (`CANCEL_REQUESTED`). The store admin has the authority to approve or reject the request:

* **Endpoint**: `POST /api/store-admin/orders/{orderId}/cancellation-response`
* **Approve Cancellation**:
```json
{
  "approve": true,
  "notes": "Food preparation was not yet started. Cancellation approved."
}
```
*(Status becomes `CANCELLED`. Customer is refunded).*

* **Decline Cancellation**:
```json
{
  "approve": false,
  "notes": "Dishes are already cooked and being packed. Cannot cancel."
}
```
*(Status reverts back to `PREPARING`. Customer is notified that cooking is underway).*

---

## 6. 💊 Module 4: Pharmacy Prescription (Rx) Verification

> **Applies To**: Pharmacy Sector (`BusinessSector.PHARMACY`)  
> When a customer orders prescription drugs (e.g., *Augmentin 625*, *Antibiotics*), the order is placed in `prescriptionVerificationStatus: "PENDING_REVIEW"`.

* **Endpoint**: `PATCH /api/store-admin/orders/{orderId}/verify-prescription`
* **Approve Prescription**:
```json
{
  "approve": true,
  "notes": "Verified by Registered Pharmacist (Reg #TS-98421). Valid doctor signature and date."
}
```
*(Order prescription status changes to `APPROVED`. Store proceeds to dispense medication).*

* **Reject Prescription**:
```json
{
  "approve": false,
  "notes": "Prescription date has expired / Doctor registration number missing."
}
```
*(Order is automatically cancelled and customer is alerted with the rejection reason).*

---

## 7. ⚙️ Module 5: Store Operational Controls & Rush Hour Mode

### 7.1 Fast Open / Close Store Toggle
* **Endpoint**: `PATCH /api/partner/restaurants/{restaurantId}/toggle-open`  
  Response: `{"isOpen": true, "message": "Store status updated to OPEN"}`

### 7.2 Kitchen Busy / Rush Hour Mode & Fees
When a restaurant is overwhelmed with orders, the manager can activate **Kitchen Rush Mode** to add an extra buffer to delivery estimates:

* **Endpoint**: `PATCH /api/store-admin/operations/{restaurantId}`
* **Request Body**:
```json
{
  "isOpen": true,
  "isKitchenBusy": true,
  "rushExtraMinutes": 15,
  "openingTime": "09:00:00",
  "closingTime": "23:00:00",
  "deliveryFee": 35.00,
  "packagingFee": 20.00,
  "freeDeliveryThreshold": 499.00
}
```
*(When `isKitchenBusy: true`, customer apps automatically see +15 mins added to estimated delivery times).*

---

## 8. 🍲 Module 6: Catalog & Live Stock Management

### 8.1 Menu Categories / Aisles
* **Add Category**: `POST /api/partner/restaurants/{restaurantId}/categories`  
  Body: `{"name": "Breads & Roti"}`
* **Delete Category**: `DELETE /api/partner/categories/{categoryId}`

### 8.2 Add Item / Dish to Catalog (Multipart Form Data)
* **Endpoint**: `POST /api/partner/restaurants/{restaurantId}/dishes`
* **Content-Type**: `multipart/form-data`
* **Form Fields**:

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `name` | String | Item name | `Amul Taaza Milk 500ml` |
| `price` | BigDecimal | Selling price | `27.00` |
| `mrp` | BigDecimal | Maximum retail price (for discount calc) | `30.00` |
| `description`| String | Description | `Pasteurised toned milk` |
| `categoryId` | Long | Category ID | `10` |
| `isVeg` | Boolean | Veg indicator | `true` |
| `isBestseller`| Boolean| Highlight tag | `true` |
| `prepTimeMinutes`| Integer| Prep / picking time | `5` |
| `unit` | String | Package size | `500 ml` or `1 kg` |
| `brand` | String | Brand name | `Amul` |
| `stockQuantity`| Integer| Live stock in inventory | `150` |
| `prescriptionRequired`| Boolean| Pharmacy Rx flag | `false` |
| `barcode` | String | EAN/UPC barcode for scanner | `8901262010054` |
| `image` | File | JPG / PNG product photo | *(file binary)* |

### 8.3 Live Stock Toggle (In-Stock / Out-of-Stock)
When an item sells out in the kitchen or dark store shelf:
* **Endpoint**: `PATCH /api/partner/dishes/{dishId}/toggle-stock`  
  Response: `{"isAvailable": false, "dishName": "Paneer Butter Masala"}`

### 8.4 Dish Variants (Portion Sizes)
* **Endpoint**: `POST /api/partner/dishes/{dishId}/variants`
* **Request Body**:
```json
{
  "variantName": "Full Handi (Serves 2-3)",
  "price": 380.00
}
```

### 8.5 Dish Add-ons & Customizations
* **Endpoint**: `POST /api/partner/dishes/{dishId}/addons`
* **Request Body**:
```json
{
  "addonName": "Extra Butter Roti",
  "price": 25.00
}
```

### 8.6 Delete Dish
* **Endpoint**: `DELETE /api/partner/dishes/{dishId}`

---

## 9. 🏬 Module 7: Multi-Branch & Dark Store Outlet Management

For enterprise merchants operating multiple dark stores or restaurant branches:

### 9.1 List Store Branches
* **Endpoint**: `GET /api/store-admin/branches/{restaurantId}`

### 9.2 Add New Physical Outlet / Dark Store
* **Endpoint**: `POST /api/store-admin/branches/{restaurantId}`
* **Request Body**:
```json
{
  "branchName": "Madhapur Dark Store Hub #2",
  "address": "Plot 18, Phase 2, Hitec City",
  "area": "Hitec City",
  "city": "Hyderabad",
  "phone": "+91 91234 56789",
  "managerName": "Sunil Varma",
  "latitude": 17.4435,
  "longitude": 78.3772,
  "isMainBranch": false,
  "allowsTakeaway": false
}
```

### 9.3 Remove Branch
* **Endpoint**: `DELETE /api/store-admin/branches/{branchId}`

---

## 10. 👨‍🍳 Module 8: In-Store Staff Directory & Roles

* **List Store Staff**: `GET /api/store-admin/staff/{restaurantId}`
* **Add Staff Member**: `POST /api/store-admin/staff/{restaurantId}`
```json
{
  "name": "Kishore Kumar",
  "email": "kishore.chef@biryani.com",
  "phone": "9811122233",
  "staffRole": "CHEF"
}
```
*(Supported roles: `MANAGER`, `CHEF`, `CASHIER`).*
* **Remove Staff**: `DELETE /api/store-admin/staff/{staffId}`

---

## 11. 📜 Module 9: Merchant KYC Compliance Submission

Merchants must upload regulatory documents before receiving payouts or platform approval:

### 11.1 Submit KYC Documents
* **Endpoint**: `POST /api/partner/kyc/{restaurantId}`
* **Request Body**:
```json
{
  "businessName": "Royal Biryani Foods Pvt Ltd",
  "gstin": "36AAACH7409R1ZZ",
  "fssaiLicense": "13622011000492",
  "panNumber": "AAACH7409R",
  "bankAccountNumber": "918239019283",
  "bankIfsc": "HDFC0001824"
}
```

### 11.2 Check KYC Verification Status
* **Endpoint**: `GET /api/partner/kyc/{restaurantId}`
* **Returns**: Current verification status (`PENDING`, `VERIFIED`, `REJECTED`) and notes.

---

## 12. 🧾 Module 10: Kitchen Order Ticket (KOT) & Receipt Printing

* **Endpoint**: `GET /api/orders/{orderId}/receipt`
* **Response**: Formatted printable HTML invoice / packing slip.
* **Usage in Tablet App**:
  * Render inside a hidden or modal Webview and trigger Android / iOS thermal printer Bluetooth integration (ESC/POS) to print kitchen order tickets instantly when an order arrives.

---

## 13. 🏦 Module 11: Merchant Settlement Statements & Payouts

Merchants can inspect weekly payout statements and bank transfer UTRs:

* **Endpoint**: `GET /api/admin/settlements/{restaurantId}`
* **Response (`200 OK`)**:
```json
[
  {
    "id": 18,
    "grossSales": 45000.00,
    "commissionDeducted": 6750.00,
    "netPayout": 38250.00,
    "payoutStatus": "PAID",
    "utrNumber": "HDFC9841289128",
    "notes": "Weekly settlement transfer",
    "processedAt": "2026-09-28T14:00:00"
  }
]
```

---

## 14. 💻 Complete TypeScript Types for Store Admin App

Save this file as `src/types/storeAdmin.ts`:

```typescript
export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED';

export type StaffRole = 'MANAGER' | 'CHEF' | 'CASHIER';

export interface TopDishDTO {
  dishName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface PartnerCockpitDTO {
  restaurantId: number;
  restaurantName: string;
  open: boolean;
  kitchenBusy: boolean;
  rushExtraMinutes: number;
  grossSales: number;
  platformCommissionDeducted: number;
  netEarnings: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  avgRating: number;
  totalRatings: number;
  topSellingDishes: TopDishDTO[];
  hourlyOrderHeatmap: Record<number, number>;
}

export interface StoreBranch {
  id: number;
  branchName: string;
  address: string;
  area: string;
  city: string;
  phone: string;
  managerName: string;
  latitude?: number;
  longitude?: number;
  isMainBranch: boolean;
  allowsTakeaway: boolean;
  active: boolean;
}

export interface RestaurantStaff {
  id: number;
  name: string;
  email: string;
  phone: string;
  staffRole: StaffRole;
}

export interface StoreOperationalUpdateRequest {
  isOpen?: boolean;
  isKitchenBusy?: boolean;
  rushExtraMinutes?: number;
  openingTime?: string;
  closingTime?: string;
  deliveryFee?: number;
  packagingFee?: number;
  freeDeliveryThreshold?: number;
}

export interface OrderItemSummaryDTO {
  dishId: number;
  dishName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  selectedVariant?: string;
  selectedAddons?: string;
  imageUrl?: string;
}

export interface LiveOrderDTO {
  orderId: string;
  restaurantId: number;
  restaurantName: string;
  orderType: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  itemTotal: number;
  totalAmount: number;
  riderName?: string;
  riderPhone?: string;
  estimatedDeliveryMinutes: number;
  businessSector: string;
  prescriptionImageUrl?: string;
  prescriptionVerificationStatus?: string;
  prescriptionNotes?: string;
  createdAt: string;
  items: OrderItemSummaryDTO[];
}
```

---

## 15. 🔔 WebSocket Client Hook for Real-Time Chimes

Save as `src/hooks/useStoreOrderChime.ts`:

```typescript
import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';

interface UseStoreOrderChimeProps {
  restaurantId: number;
  onNewOrder: (order: { orderId: string; totalAmount: string }) => void;
}

export function useStoreOrderChime({ restaurantId, onNewOrder }: UseStoreOrderChimeProps) {
  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://10.0.2.2:8080/ws/websocket', // or your server IP
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log(`Connected to restaurant #${restaurantId} socket!`);
      client.subscribe(`/topic/restaurant/${restaurantId}`, (message) => {
        const payload = JSON.parse(message.body);
        if (payload.type === 'NEW_ORDER') {
          onNewOrder(payload);
        }
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [restaurantId]);
}
```
