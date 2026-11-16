# 📱 Swiggy Super-App: React Native Frontend Developer Integration Guide

> **Target Audience**: Mobile Application Developers (React Native / Expo / Bare Workflow)  
> **Backend Architecture**: Spring Boot 3 Multi-Sector Delivery Aggregator (`foodapp`)  
> **Backend Base URL (Local Dev)**:  
> • Android Emulator: `http://10.0.2.2:8080`  
> • iOS Simulator: `http://localhost:8080`  
> • Physical Device on LAN: `http://<your-machine-ip>:8080` (e.g. `http://192.168.1.100:8080`)  
> **Default Customer Test Account**: `customer@swiggy.com` / `Password123!` (Phone: `9876543210`)

---

## 1. 🏗️ High-Level Architecture & Multi-Sector Super-App Model

This platform is **not a single-vertical food app**. It is a **Unified Multi-Sector Super-App** (identical to Swiggy / Dunzo / Grab) that powers:
1. **`FOOD`** — Restaurants, cloud kitchens, cafes (25–35 min delivery).
2. **`GROCERY`** — Swiggy Instamart-style 10–15 min quick-commerce dark stores with live stock quantity and MRP discounts.
3. **`PHARMACY`** — 24/7 licensed chemists, prescription medicines with mandatory doctor prescription upload.
4. **`MEAT_FISH`** — Fresh cuts, marinades, seafood dark stores.
5. **`PET_SUPPLIES`** — Pet food, accessories, pet care products.

```
                      ┌─────────────────────────────────────────┐
                      │    📱 React Native Consumer Super-App   │
                      └────────────────────┬────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴─────┬──────────────────┐
         ▼                  ▼                    ▼                  ▼
    🍔 Food Delivery   🛒 Instamart Grocery  💊 24/7 Pharmacy   🥩 Fresh Meat
         │                  │                    │                  │
         └──────────────────┼────────────────────┴──────────────────┘
                            ▼
              [GET /api/sectors] -> Active Sector Switcher
                            │
                            ▼
        ┌───────────────────────────────────────────────────────────┐
        │          🛡️ Swiggy Cart Guard (HTTP 409 Conflict)          │
        │   Prevents mixing Restaurant Biryani with Dark Store Milk │
        └───────────────────────────┬───────────────────────────────┘
                                    ▼
       ┌────────────────────────────┴─────────────────────────────┐
       │      Unified Checkout + Razorpay / COD + Live Tracking    │
       └──────────────────────────────────────────────────────────┘
```

---

## 2. 🔐 Authentication & Token Management

All protected APIs require a **JWT Bearer Token** in the request headers:
```http
Authorization: Bearer <jwt_token_string>
Content-Type: application/json
```

### 2.1 Customer Registration
* **Endpoint**: `POST /api/auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "password": "Password123!",
  "role": "CUSTOMER"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 2,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "role": "CUSTOMER"
}
```

### 2.2 Customer Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request Body** (Supports email or phone):
```json
{
  "usernameOrEmailOrPhone": "customer@swiggy.com",
  "password": "Password123!"
}
```
* **Success Response (`200 OK`)**: Returns `AuthResponse` with JWT token.
* **Error Response (`400 Bad Request`)**:
```json
{
  "error": "Invalid email/phone or password"
}
```

### 2.3 Get Current User Profile
* **Endpoint**: `GET /api/auth/me`
* **Access**: Protected (`Bearer <token>`)
* **Success Response (`200 OK`)**:
```json
{
  "id": 2,
  "name": "Customer User",
  "email": "customer@swiggy.com",
  "phone": "9876543210",
  "role": "CUSTOMER"
}
```

### 2.4 Forgot Password & OTP Flow
1. **Send OTP**: `POST /api/auth/send-otp`  
   Body: `{"emailOrPhone": "customer@swiggy.com"}`  
   Response: `{"message": "OTP sent successfully", "otp": "482910"}`
2. **Verify OTP**: `POST /api/auth/verify-otp`  
   Body: `{"emailOrPhone": "customer@swiggy.com", "otp": "482910"}`  
   Response: `{"valid": true, "message": "OTP verified"}`
3. **Reset Password**: `POST /api/auth/reset-password`  
   Body: `{"emailOrPhone": "customer@swiggy.com", "otp": "482910", "newPassword": "NewStrongPassword123!"}`  
   Response: `{"message": "Password reset successfully. You can now login with your new password."}`

---

## 3. 🌐 Sector Switcher (Home Screen Architecture)

### 3.1 Fetch Available Sectors
* **Endpoint**: `GET /api/sectors`
* **Access**: Public
* **Usage**: Call on app startup to render the horizontal category selector tabs at the top of the Home Screen.
* **Sample Response (`200 OK`)**:
```json
[
  {
    "id": "FOOD",
    "name": "Food Delivery",
    "tagline": "Hot & fresh meals from top restaurants",
    "deliveryBadge": "25-35 MINS",
    "iconUrl": "https://img.icons8.com/color/96/hamburger.png",
    "bannerUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    "activeStoresCount": 2
  },
  {
    "id": "GROCERY",
    "name": "Instamart",
    "tagline": "Groceries & daily essentials in 10-15 mins",
    "deliveryBadge": "10-15 MINS",
    "iconUrl": "https://img.icons8.com/color/96/shopping-bag.png",
    "bannerUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e",
    "activeStoresCount": 1
  },
  {
    "id": "PHARMACY",
    "name": "24/7 Pharmacy",
    "tagline": "Medicines & wellness delivered with care",
    "deliveryBadge": "20-30 MINS",
    "iconUrl": "https://img.icons8.com/color/96/pill.png",
    "bannerUrl": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae",
    "activeStoresCount": 1
  },
  {
    "id": "MEAT_FISH",
    "name": "Meat & Seafood",
    "tagline": "Fresh tender cuts cleaned and delivered",
    "deliveryBadge": "30-45 MINS",
    "iconUrl": "https://img.icons8.com/color/96/steak.png",
    "bannerUrl": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f",
    "activeStoresCount": 1
  },
  {
    "id": "PET_SUPPLIES",
    "name": "Pet Care",
    "tagline": "Pet food, treats and essentials",
    "deliveryBadge": "25-40 MINS",
    "iconUrl": "https://img.icons8.com/color/96/dog.png",
    "bannerUrl": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e",
    "activeStoresCount": 0
  }
]
```

### 3.2 Mobile State Handling
Store `selectedSector` in global state (Zustand / Redux / Context). When the user taps a sector tab:
1. Update `selectedSector = sector.id`.
2. Reload store listing: `GET /api/restaurants?sector=${selectedSector}`.
3. Reload banners and search placeholder (e.g. *"Search for Dolo 650 or Bandages"* in Pharmacy vs *"Search for Biryani"* in Food).

---

## 4. 🏪 Store Discovery & Details

### 4.1 Browse Stores by Sector & Filters
* **Endpoint**: `GET /api/restaurants`
* **Access**: Public
* **Query Parameters**:
  * `sector`: `FOOD` | `GROCERY` | `PHARMACY` | `MEAT_FISH` | `PET_SUPPLIES` *(Optional, recommended)*
  * `city`: e.g. `Hyderabad` *(Optional)*
  * `cuisine`: e.g. `Biryani`, `North Indian`, `Italian` *(Optional)*
  * `isVeg`: `true` | `false` *(Veg-only toggle)*
  * `minRating`: e.g. `4.0` *(Filter 4.0+ rated)*
  * `sortBy`: `rating` | `cost_low` | `cost_high` | `delivery_time`
* **Sample Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "name": "Royal Biryani House",
    "slug": "royal-biryani-house",
    "description": "Authentic Hyderabadi Dum Biryani and Mughlai specialties",
    "cuisines": "Biryani, North Indian, Mughlai",
    "logoUrl": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200",
    "bannerUrl": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    "area": "Madhapur",
    "city": "Hyderabad",
    "open": true,
    "avgRating": 4.5,
    "totalRatings": 128,
    "deliveryTimeEstimate": "30-40 mins",
    "distanceKm": 3.2,
    "costForTwo": 450.00,
    "deliveryFee": 35.00,
    "freeDeliveryThreshold": 499.00,
    "pureVeg": false,
    "businessSector": "FOOD",
    "quickCommerce": false,
    "sectorDisplayName": "Food Delivery"
  }
]
```

### 4.2 Store Details
* **Endpoint**: `GET /api/restaurants/{id}` or `GET /api/restaurants/slug/{slug}`
* **Returns**: `RestaurantDetailDTO` which includes summary fields plus `address`, `phone`, `email`, `openingTime`, `closingTime`, `packagingFee`, `taxPercentage`, `fssaiNumber`, and `drugLicenseNumber` (for pharmacies).

---

## 5. 📜 Store Menu & Product Catalog

* **Endpoint**: `GET /api/restaurants/{id}/menu`
* **Access**: Public
* **Response**: Grouped list of categories, each containing its dishes/products (`CategoryWithDishesDTO[]`).

### 5.1 Product Attributes (Food vs Instamart Grocery vs Pharmacy)
The `DishDTO` contains unified fields for food and quick commerce items:

```json
[
  {
    "id": 10,
    "name": "Dairy & Breakfast",
    "dishes": [
      {
        "id": 101,
        "restaurantId": 3,
        "restaurantName": "Swiggy Instamart - Madhapur Dark Store",
        "categoryId": 10,
        "categoryName": "Dairy & Breakfast",
        "name": "Amul Taaza Homogenised Toned Milk",
        "description": "Pure pasteurised toned fresh milk",
        "price": 27.00,
        "mrp": 30.00,
        "unit": "500 ml",
        "brand": "Amul",
        "stockQuantity": 84,
        "imageUrl": "https://images.unsplash.com/photo-1550583724-b2692b85b150",
        "veg": true,
        "available": true,
        "bestseller": true,
        "prepTimeMinutes": 5,
        "prescriptionRequired": false,
        "barcode": "8901262010054",
        "variants": [],
        "addons": []
      }
    ]
  }
]
```

### 5.2 UI Rendering Tips for Mobile
1. **Discount Badge**: If `mrp > price`, display: `Math.round(((mrp - price) / mrp) * 100) + "% OFF"`.
2. **Unit Label**: If `unit` exists (e.g. `500 ml`, `1 kg`, `10 Tablets`), display it under the product title.
3. **Out of Stock**: If `available === false` or `stockQuantity <= 0`, disable the "ADD" button and show *"Out of Stock"*.
4. **Rx Required Badge**: If `prescriptionRequired === true`, show a medical tag: `Rx Required`.
5. **Variants & Addons**: If `variants.length > 0` or `addons.length > 0`, tapping **"ADD"** opens a customizable bottom sheet instead of directly adding to cart.

---

## 6. 🔍 Sector-Aware Global Search

* **Endpoint**: `GET /api/search`
* **Access**: Public
* **Query Parameters**:
  * `q`: Search keyword (e.g. `biryani`, `milk`, `dolo`)
  * `sector`: Filter search to current sector (`FOOD`, `GROCERY`, `PHARMACY`, etc.)
* **Response**:
```json
{
  "query": "milk",
  "restaurants": [
    { "id": 3, "name": "Swiggy Instamart - Madhapur Dark Store", ... }
  ],
  "dishes": [
    { "id": 101, "name": "Amul Taaza Homogenised Toned Milk", "price": 27.00, ... },
    { "id": 102, "name": "Nandini GoodLife Milk", "price": 32.00, ... }
  ]
}
```

---

## 7. 🛒 Cart Management & The Swiggy Cart Guard (Critical Flow)

Because customers can browse Restaurants and Dark Stores in the same app, the backend enforces the **Swiggy Single-Store Cart Rule**. You cannot mix items from two different stores.

### 7.1 View Active Cart
* **Endpoint**: `GET /api/cart`
* **Access**: Protected (`Bearer <token>`)
* **Response (`200 OK`)**:
```json
{
  "cartId": 5,
  "restaurantId": 1,
  "restaurantName": "Royal Biryani House",
  "restaurantArea": "Madhapur",
  "restaurantLogo": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200",
  "items": [
    {
      "itemId": 12,
      "dishId": 1,
      "dishName": "Chicken Dum Biryani",
      "imageUrl": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
      "veg": false,
      "quantity": 2,
      "selectedVariant": "Full",
      "selectedAddons": "Extra Raita, Salan",
      "unitPrice": 320.00,
      "totalPrice": 640.00
    }
  ],
  "bill": {
    "itemTotal": 640.00,
    "deliveryFee": 0.00,
    "packagingFee": 25.00,
    "taxAmount": 32.00,
    "discountAmount": 0.00,
    "grandTotal": 697.00,
    "freeDelivery": true,
    "freeDeliveryThreshold": 499.00
  }
}
```

### 7.2 Add Item to Cart
* **Endpoint**: `POST /api/cart/add`
* **Access**: Protected (`Bearer <token>`)
* **Request Body**:
```json
{
  "dishId": 101,
  "quantity": 1,
  "variantId": null,
  "addonIds": [],
  "forceReplaceCart": false
}
```

#### 🛡️ The Swiggy Cart Guard Flow (`HTTP 409 Conflict`)
If the cart already contains items from `Royal Biryani House` and the customer attempts to add `Amul Milk` from `Swiggy Instamart`, the backend returns `409 Conflict`:

```json
{
  "conflict": true,
  "message": "Cart contains items from 'Royal Biryani House' (FOOD). Replace cart with items from 'Swiggy Instamart - Madhapur Dark Store' (GROCERY)?",
  "existingRestaurantId": 1,
  "existingRestaurantName": "Royal Biryani House",
  "newRestaurantId": 3,
  "newRestaurantName": "Swiggy Instamart - Madhapur Dark Store"
}
```

#### 📱 Mobile UX Implementation Rule:
1. Intercept `409 Conflict` status code in your HTTP interceptor.
2. Present a Bottom Sheet Alert:
   > **Replace cart items?**  
   > *Your cart contains items from **Royal Biryani House**. Would you like to discard them and add items from **Swiggy Instamart**?*  
   > `[ No, Keep My Cart ]` `[ Discard & Add ]`
3. If user clicks **Discard & Add**:  
   Re-trigger the same request with `"forceReplaceCart": true`. The backend clears the old cart and adds the new item in a single atomic transaction!

### 7.3 Update Cart Item Quantity
* **Endpoint**: `PUT /api/cart/items/{itemId}`
* **Request Body**: `{"quantity": 3}` (setting `quantity: 0` removes the item).

### 7.4 Delete Cart Item & Clear Cart
* **Delete Item**: `DELETE /api/cart/items/{itemId}`
* **Clear Cart**: `DELETE /api/cart/clear`

---

## 8. 📍 Saved Delivery Addresses

* **List Addresses**: `GET /api/locations` (Protected)
* **Save New Address**: `POST /api/locations` (Protected)
```json
{
  "addressLine": "Flat 402, Sunshine Heights, Road No 36",
  "landmark": "Near Metro Pillar 1240",
  "city": "Hyderabad",
  "state": "Telangana",
  "pincode": "500081",
  "latitude": 17.4399,
  "longitude": 78.3918,
  "tag": "HOME",
  "isDefault": true
}
```
* **Delete Address**: `DELETE /api/locations/{id}`

---

## 9. 🎟️ Coupons & Loyalty Points

### 9.1 View Available Coupons
* **Platform Coupons**: `GET /api/coupons`
* **Store-Specific Coupons**: `GET /api/coupons/restaurant/{restaurantId}`

### 9.2 Real-Time Coupon Validation
* **Endpoint**: `POST /api/coupons/validate?code=SWIGGY50&restaurantId=1&itemTotal=640`
* **Response**:
```json
{
  "valid": true,
  "discountAmount": 100.00,
  "message": "Coupon applied: ₹100 saved!"
}
```

### 9.3 Check Loyalty Balance
* **Endpoint**: `GET /api/loyalty/balance` (Protected)
* **Response**:
```json
{
  "pointsBalance": 125,
  "lifetimeEarned": 250,
  "lifetimeRedeemed": 125,
  "rupeeEquivalent": 125
}
```
*(Points are automatically rewarded at 1 point per ₹100 spent upon delivery).*

---

## 10. 📁 File Upload (Prescriptions & Photos)

* **Endpoint**: `POST /api/upload`
* **Access**: Public / Authenticated
* **Content-Type**: `multipart/form-data`
* **Key**: `file` (File binary: JPG, PNG, WEBP, PDF)
* **Response (`200 OK`)**:
```json
{
  "url": "http://10.0.2.2:8080/uploads/rx_6891238472.jpg",
  "filename": "rx_6891238472.jpg",
  "size": 249120,
  "message": "File uploaded successfully"
}
```

---

## 11. 📦 Checkout & Order Placement

### 11.1 Place Order
* **Endpoint**: `POST /api/orders/place`
* **Access**: Protected (`Bearer <token>`)
* **Request Body**:
```json
{
  "orderType": "DELIVERY",
  "paymentMethod": "CASH_ON_DELIVERY",
  "addressId": 1,
  "customAddress": null,
  "latitude": 17.4399,
  "longitude": 78.3918,
  "couponCode": "SWIGGY50",
  "specialInstructions": "Please ring bell and leave parcel at doorstep",
  "prescriptionImageUrl": null
}
```

#### 💊 Pharmacy Prescription Mandate:
If any item in the user's cart has `prescriptionRequired === true`:
* The frontend **MUST** force the user to upload a prescription photo via `POST /api/upload`.
* Supply the resulting URL in `"prescriptionImageUrl"`.
* If omitted, the API will reject the request with `400 Bad Request`:  
  `{"error": "Doctor's prescription image is mandatory for this pharmacy order"}`.
* Order will be placed with `prescriptionVerificationStatus: "PENDING_REVIEW"`.

### 11.2 Order Response
```json
{
  "orderId": "ORD-548192",
  "restaurantId": 1,
  "restaurantName": "Royal Biryani House",
  "restaurantArea": "Madhapur",
  "restaurantLogo": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200",
  "orderType": "DELIVERY",
  "status": "PLACED",
  "paymentMethod": "CASH_ON_DELIVERY",
  "paymentStatus": "PENDING",
  "deliveryAddress": "Flat 402, Sunshine Heights, Madhapur, Hyderabad",
  "itemTotal": 640.00,
  "deliveryFee": 0.00,
  "packagingFee": 25.00,
  "taxAmount": 32.00,
  "discountAmount": 100.00,
  "totalAmount": 597.00,
  "riderName": null,
  "riderPhone": null,
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
```

---

## 12. 💳 Online Payments (Razorpay Integration)

If the customer selected `paymentMethod: "ONLINE_RAZORPAY"`:

### Step 1: Create Razorpay Order
* **Endpoint**: `POST /api/payment/create-order?orderId=ORD-548192`
* **Response**:
```json
{
  "orderId": "ORD-548192",
  "razorpayOrderId": "order_KzXy948192a",
  "amountInPaise": 59700,
  "currency": "INR",
  "keyId": "rzp_test_1234567890",
  "totalAmount": 597.00
}
```

### Step 2: Launch Razorpay React Native Checkout
```typescript
import RazorpayCheckout from 'react-native-razorpay';

const options = {
  description: `Order #${paymentData.orderId}`,
  image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
  currency: paymentData.currency,
  key: paymentData.keyId,
  amount: paymentData.amountInPaise,
  name: 'Swiggy Super-App',
  order_id: paymentData.razorpayOrderId,
  prefill: {
    email: user.email,
    contact: user.phone,
    name: user.name
  },
  theme: { color: '#FC8019' } // Swiggy Orange
};

RazorpayCheckout.open(options).then((data) => {
  // Step 3: Verify Payment Signature
  verifyPayment({
    orderId: paymentData.orderId,
    razorpayOrderId: data.razorpay_order_id,
    razorpayPaymentId: data.razorpay_payment_id,
    razorpaySignature: data.razorpay_signature
  });
}).catch((error) => {
  console.log('Payment dismissed or failed:', error);
});
```

### Step 3: Verify Payment Signature
* **Endpoint**: `POST /api/payment/verify-payment`
* **Request Body**:
```json
{
  "orderId": "ORD-548192",
  "razorpayOrderId": "order_KzXy948192a",
  "razorpayPaymentId": "pay_KzXz184918a",
  "razorpaySignature": "82f8a91c1094019bf9a4..."
}
```
* **Success Response**: Returns updated `OrderResponseDTO` with `paymentStatus: "PAID"`.

---

## 13. ⚡ Live Order Tracking & WebSocket Real-Time Updates

### 13.1 Order Lifecycle Statuses (`OrderStatus` Enum)
```
PLACED ➔ ACCEPTED ➔ PREPARING ➔ READY_FOR_PICKUP ➔ OUT_FOR_DELIVERY ➔ DELIVERED
   │          │          │
   └──────────┴──────────┴────➔ CANCEL_REQUESTED ➔ CANCELLED
```

### 13.2 Real-Time WebSocket Connection (STOMP + SockJS)
* **WebSocket Endpoint**: `ws://<backend-ip>:8080/ws`
* **Topic to Subscribe**: `/topic/order/{orderId}`
* When the store accepts, prepares, or when the rider updates their location or marks delivered, the server broadcasts the updated `OrderResponseDTO` to this topic in real-time.

#### React Native STOMP Client Example:
```typescript
import { Client } from '@stomp/stompjs';

export function subscribeToOrderUpdates(orderId: string, onUpdate: (order: any) => void) {
  const client = new Client({
    brokerURL: 'ws://10.0.2.2:8080/ws/websocket', // or your server URL
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.onConnect = () => {
    console.log('Connected to WebSocket!');
    client.subscribe(`/topic/order/${orderId}`, (message) => {
      const updatedOrder = JSON.parse(message.body);
      onUpdate(updatedOrder);
    });
  };

  client.activate();
  return () => client.deactivate();
}
```

---

## 14. 📜 Order History, Cancellation & Disputes

* **User Order History**: `GET /api/orders/user`
* **Live Order Details**: `GET /api/orders/{orderId}`
* **Tax Receipt / Invoice (HTML)**: `GET /api/orders/{orderId}/receipt` (Can be viewed in `react-native-webview` or downloaded as PDF).
* **Cancel Order**: `POST /api/orders/{orderId}/cancel`  
  Body: `{"reason": "Ordered by mistake"}`
* **Raise Order Dispute**: `POST /api/orders/{orderId}/dispute`  
  Body:
  ```json
  {
    "reason": "Missing Items",
    "details": "Only received 1 Biryani instead of 2",
    "evidenceImageUrl": "https://storage.swiggy.com/disputes/img_123.jpg"
  }
  ```

---

## 15. ⭐ Ratings & Feedback

* **Submit Rating**: `POST /api/ratings`
```json
{
  "restaurantId": 1,
  "dishId": 1,
  "orderId": "ORD-548192",
  "score": 5,
  "review": "Authentic aroma, tender chicken, and piping hot!"
}
```
* **Store Ratings**: `GET /api/ratings/restaurant/{restaurantId}`

---

## 16. 💡 Complete TypeScript Interfaces for React Native

Save this file as `src/types/api.ts` in your React Native project:

```typescript
export type BusinessSector = 'FOOD' | 'GROCERY' | 'PHARMACY' | 'MEAT_FISH' | 'PET_SUPPLIES';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'ONLINE_RAZORPAY' | 'STRIPE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface SectorDTO {
  id: BusinessSector;
  name: string;
  tagline: string;
  deliveryBadge: string;
  iconUrl: string;
  bannerUrl: string;
  activeStoresCount: number;
}

export interface RestaurantSummaryDTO {
  id: number;
  name: string;
  slug: string;
  description: string;
  cuisines: string;
  logoUrl: string;
  bannerUrl: string;
  area: string;
  city: string;
  open: boolean;
  avgRating: number;
  totalRatings: number;
  deliveryTimeEstimate: string;
  distanceKm: number;
  costForTwo: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  pureVeg: boolean;
  businessSector: BusinessSector;
  quickCommerce: boolean;
  sectorDisplayName: string;
}

export interface DishVariantDTO {
  id: number;
  variantName: string;
  price: number;
}

export interface DishAddonDTO {
  id: number;
  addonName: string;
  price: number;
}

export interface DishDTO {
  id: number;
  restaurantId: number;
  restaurantName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  unit?: string;
  brand?: string;
  stockQuantity?: number;
  imageUrl: string;
  veg: boolean;
  available: boolean;
  bestseller: boolean;
  prepTimeMinutes: number;
  prescriptionRequired: boolean;
  barcode?: string;
  variants: DishVariantDTO[];
  addons: DishAddonDTO[];
}

export interface CategoryWithDishesDTO {
  id: number;
  name: string;
  dishes: DishDTO[];
}

export interface CartItemDTO {
  itemId: number;
  dishId: number;
  dishName: string;
  imageUrl: string;
  veg: boolean;
  quantity: number;
  selectedVariant?: string;
  selectedAddons?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface BillSummaryDTO {
  itemTotal: number;
  deliveryFee: number;
  packagingFee: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  freeDelivery: boolean;
  freeDeliveryThreshold: number;
}

export interface CartResponseDTO {
  cartId: number;
  restaurantId: number;
  restaurantName: string;
  restaurantArea: string;
  restaurantLogo: string;
  items: CartItemDTO[];
  bill: BillSummaryDTO;
}

export interface CartConflictResponse {
  conflict: boolean;
  message: string;
  existingRestaurantId: number;
  existingRestaurantName: string;
  newRestaurantId: number;
  newRestaurantName: string;
}

export interface PlaceOrderRequest {
  orderType?: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
  paymentMethod?: PaymentMethod;
  addressId?: number;
  customAddress?: string;
  latitude?: number;
  longitude?: number;
  tableNumber?: string;
  specialInstructions?: string;
  couponCode?: string;
  prescriptionImageUrl?: string;
}

export interface OrderResponseDTO {
  orderId: string;
  restaurantId: number;
  restaurantName: string;
  restaurantArea: string;
  restaurantLogo: string;
  orderType: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  itemTotal: number;
  deliveryFee: number;
  packagingFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  riderName?: string;
  riderPhone?: string;
  estimatedDeliveryMinutes: number;
  createdAt: string;
  businessSector: BusinessSector;
  prescriptionImageUrl?: string;
  prescriptionVerificationStatus?: string;
  prescriptionNotes?: string;
  items: {
    dishId: number;
    dishName: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    selectedVariant?: string;
    selectedAddons?: string;
    imageUrl: string;
  }[];
}
```

---

## 17. 🛡️ Recommended Axios API Client Implementation

Save this file as `src/services/apiClient.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:8080'; // Change to match your dev environment

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor to auto-inject Bearer Token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for multipart file uploads
export async function uploadFile(fileUri: string, fileName: string, mimeType: string) {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const res = await apiClient.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.url as string;
}
```
