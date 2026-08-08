<div align="center">

# 🌿 Balcony Aroma

### A production-grade food ordering app built with React Native & Expo

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.15.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Enabled-362D59?logo=sentry&logoColor=white)](https://sentry.io/)
[![PostHog](https://img.shields.io/badge/PostHog-Analytics-F54E00?logo=posthog&logoColor=white)](https://posthog.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

A full-featured, dual-role food ordering platform with real-time Firestore sync, push notifications, error monitoring via **Sentry**, and product analytics via **PostHog**.

</div>

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Navigation Flow](#navigation-flow)
- [Order Lifecycle](#order-lifecycle)
- [Data Flow](#data-flow)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Firebase Setup](#firebase-setup)
- [Sentry — Error Tracking](#sentry--error-tracking)
- [PostHog — Analytics](#posthog--analytics)
- [CI/CD Pipeline](#cicd-pipeline)
- [Role-Based Access Control](#role-based-access-control)
- [Coupon System](#coupon-system)
- [Push Notifications](#push-notifications)
- [Contributing](#contributing)

---

## Overview

**Balcony Aroma** is a restaurant-grade mobile ordering app that supports two distinct user roles — **Admin** and **Customer** — each with their own navigation stack and permission set. Orders are stored in Firestore in real time, push notifications keep customers updated at every order stage, and the app is fully instrumented with **Sentry** for crash reporting and **PostHog** for behavioural analytics.

---

## System Architecture

```mermaid
graph TB
    subgraph Client["📱 Mobile App (Expo / React Native)"]
        direction TB
        UI["UI Layer\n(Screens + Components)"]
        NAV["Navigation\n(React Navigation v7)"]
        CTX["State Layer\n(CartContext · FavouritesContext)"]
        UI --> NAV
        UI --> CTX
    end

    subgraph Observability["🔭 Observability"]
        SENTRY["Sentry\nCrash Reporting & Traces"]
        POSTHOG["PostHog\nProduct Analytics"]
    end

    subgraph Firebase["🔥 Firebase Backend"]
        AUTH["Firebase Auth\n(Email / Password)"]
        FS["Cloud Firestore\n(Real-time Database)"]
        STORAGE["Firebase Storage\n(Menu Images)"]
    end

    subgraph Notifications["🔔 Push Notifications"]
        EPN["Expo Push Service"]
        FCM["FCM (Android)"]
        APNS["APNs (iOS)"]
    end

    subgraph Storage_Local["💾 Local Storage"]
        AS["AsyncStorage\n(Favourites · Auth Session)"]
    end

    Client -->|"Auth / Firestore reads & writes"| Firebase
    Client -->|"Errors & Performance"| Sentry
    Client -->|"Events & Screen Views"| PostHog
    Client -->|"Register / Receive tokens"| Notifications
    Client -->|"Persist favourites & session"| Storage_Local
    EPN --> FCM
    EPN --> APNS
    FCM -->|"Deliver to Android"| Client
    APNS -->|"Deliver to iOS"| Client
```

---

## Navigation Flow

```mermaid
flowchart TD
    Start([App Launch]) --> AuthCheck{Firebase\nAuth State}

    AuthCheck -->|"No user"| GUEST["Guest Stack"]
    AuthCheck -->|"role = customer"| CUST["Customer Stack"]
    AuthCheck -->|"role = admin"| ADMIN["Admin Stack"]

    GUEST --> G1["🍱 Menu Tab\n(browse only)"]
    GUEST --> G2["🛒 Cart Tab"]
    GUEST --> G3["👤 Sign In Tab"]
    G3 --> LOGIN["CustomerAuthScreen\n(Login / Register)"]
    LOGIN -->|"Auth success"| CUST
    GUEST --> ALOG["AdminLogin Screen"]
    ALOG -->|"Admin credentials"| ADMIN

    CUST --> C1["🍱 Menu Tab"]
    CUST --> C2["🛒 Cart Tab"]
    CUST --> C3["📋 My Orders Tab"]
    CUST --> C4["👤 Profile Tab"]
    C2 --> CHECKOUT["Checkout Screen"]
    C3 --> TRACK["Track Order Screen"]

    ADMIN --> A1["📊 Dashboard Tab"]
    ADMIN --> A2["📦 All Orders Tab"]
    ADMIN --> A3["🍱 Menu Management Tab"]
    A2 --> DETAIL["Order Detail Screen"]
    A3 --> ADDITEM["Add Menu Item Screen"]
```

---

## Order Lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pending : Customer places order
    pending --> processing : Admin confirms
    processing --> shipped : Out for delivery
    shipped --> delivered : Delivered to customer
    pending --> cancelled : Admin / Customer cancels
    processing --> cancelled : Admin cancels

    note right of pending
        Push notification sent:
        "Order Placed ✅"
    end note
    note right of processing
        Push notification sent:
        "We're preparing your order 🍳"
    end note
    note right of shipped
        Push notification sent:
        "Your order is on the way 🛵"
    end note
    note right of delivered
        Push notification sent:
        "Order Delivered 🎉"
    end note
```

---

## Data Flow

```mermaid
sequenceDiagram
    actor Customer
    participant App as React Native App
    participant Firestore as Cloud Firestore
    participant PushSvc as Expo Push Service
    actor Admin

    Customer->>App: Browse menu & add to cart
    App->>Firestore: getDocs(menuItems)
    Firestore-->>App: Menu items list

    Customer->>App: Checkout (address + coupon)
    App->>Firestore: addDoc(orders, { status: "pending" })
    App->>Firestore: updateDoc(users, { savedAddress })

    Admin->>App: Views new order in Orders tab
    App->>Firestore: onSnapshot(orders)
    Firestore-->>App: Real-time order stream

    Admin->>App: Updates order status → "processing"
    App->>Firestore: updateDoc(orders, { status })
    App->>PushSvc: Send push to customer's expoPushToken
    PushSvc-->>Customer: Push notification delivered
```

---

## Features

### Customer
| Feature | Details |
|---|---|
| Menu Browsing | Real-time menu with emoji, name, price, category |
| Cart Management | Add / remove items, special requests per item, quantity badge |
| Reorder | One-tap reorder from order history |
| Favourites | Locally persisted with AsyncStorage |
| Checkout | Delivery address, coupon codes, delivery fee logic, order notes |
| Cash on Delivery | Single payment method clearly indicated |
| Order Tracking | Live status updates with colour-coded stages |
| Order History | Full history with timestamps and order numbers |
| Profile | Name, phone, saved delivery address, profile image via ImagePicker |
| Push Notifications | Status updates at every order stage |

### Admin
| Feature | Details |
|---|---|
| Dashboard | Overview of order stats |
| Order Management | Real-time feed of all orders, filterable by status |
| Order Detail | Full order view, status update controls |
| Menu Management | View, add, edit, and delete menu items with images |
| Manual Orders | Place orders on behalf of customers |
| Push Triggers | Automatic push sent to customer on every status change |

---

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Expo | ~54.0.0 |
| Language | React / React Native | 19.1.0 / 0.81.5 |
| Navigation | React Navigation (Stack + Bottom Tabs) | ^7.x |
| Backend | Firebase (Auth + Firestore) | ^12.15.0 |
| Push Notifications | expo-notifications | ~0.32.17 |
| Media | expo-image-picker, expo-av | ~17.x / ~16.x |
| Error Tracking | Sentry | — |
| Analytics | PostHog | — |
| Local Persistence | AsyncStorage | 2.2.0 |
| State Management | React Context API | built-in |

---

## Project Structure

```
balcony-aroma/
├── App.js                          # Root — auth listener, notification bootstrap
├── app.json                        # Expo config (icons, orientation, plugins)
├── firebase.js                     # Firebase app, Firestore, Auth initialization
├── index.js                        # Expo entry point
├── assets/
│   ├── icon.png
│   ├── android-icon-foreground.png
│   ├── android-icon-background.png
│   ├── android-icon-monochrome.png
│   └── favicon.png
└── src/
    ├── theme.js                    # Colors, status color/label maps
    ├── navigation/
    │   └── AppNavigator.js         # Role-based stack (Guest / Customer / Admin)
    ├── context/
    │   ├── CartContext.js          # Cart state: add, remove, reorder, special requests
    │   └── FavouritesContext.js    # Favourites persisted to AsyncStorage
    ├── components/
    │   ├── HomeScreen.js
    │   └── OrderCard.js            # Shared order card component
    └── screens/
        ├── admin/
        │   ├── LoginScreen.js      # Admin email/password login
        │   ├── DashboardScreen.js  # Stats overview
        │   ├── OrdersScreen.js     # Real-time order list
        │   ├── OrderDetailScreen.js # Status management + push trigger
        │   ├── MenuManagementScreen.js
        │   ├── AddMenuItemScreen.js
        │   └── AddOrderScreen.js   # Manual order placement
        └── customer/
            ├── CustomerAuthScreen.js # Register / login
            ├── MenuScreen.js         # Browse + favourites
            ├── CartScreen.js         # Cart review + quantity controls
            ├── CheckoutScreen.js     # Address, coupon, billing, place order
            ├── OrderHistoryScreen.js # Past orders + reorder
            ├── TrackOrderScreen.js   # Live status tracker
            └── ProfileScreen.js      # Profile + image picker
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) on your physical device, or an Android/iOS simulator

### Install

```bash
git clone https://github.com/ankit79600/Balcony-aroma-app.git
cd Balcony-aroma-app
npm install
```

### Run

```bash
npm start          # Open Expo dev tools
npm run android    # Launch on Android
npm run ios        # Launch on iOS
npm run web        # Launch in browser
```

---

## Firebase Setup

### Services Used

| Service | Purpose |
|---|---|
| Firebase Auth | Email/password authentication for admin and customer |
| Cloud Firestore | Real-time NoSQL database for all app data |

### Firestore Schema

#### `users/{uid}`
```json
{
  "name": "Ankit Patel",
  "phone": "+91 98765 43210",
  "email": "user@example.com",
  "role": "customer",
  "savedAddress": "123 Main St, Apartment 4B",
  "profileImage": "https://...",
  "expoPushToken": "ExponentPushToken[...]"
}
```

#### `menuItems/{itemId}`
```json
{
  "name": "Paneer Tikka",
  "price": 180,
  "emoji": "🍢",
  "category": "Starters",
  "imageUrl": "https://...",
  "available": true
}
```

#### `orders/{orderId}`
```json
{
  "orderNumber": "BA-0042",
  "customerUid": "uid_abc123",
  "customerName": "Ankit Patel",
  "customerPhone": "+91 98765 43210",
  "customerAddress": "123 Main St",
  "items": [
    { "id": "item_1", "name": "Paneer Tikka", "price": 180, "qty": 2, "emoji": "🍢", "specialRequest": "Extra spicy" }
  ],
  "totalAmount": 390,
  "deliveryFee": 0,
  "discount": 0,
  "couponCode": "WELCOME10",
  "notes": "Ring the doorbell twice",
  "status": "pending",
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>"
}
```

### Order Status Colors

| Status | Label | Color |
|---|---|---|
| `pending` | Order Placed | `#F39C12` |
| `processing` | Preparing | `#3498DB` |
| `shipped` | Out for Delivery | `#9B59B6` |
| `delivered` | Delivered | `#27AE60` |
| `cancelled` | Cancelled | `#E74C3C` |

---

## Sentry — Error Tracking

[Sentry](https://sentry.io/) provides real-time error monitoring across all platforms:

- **Automatic crash reports** on iOS and Android with full stack traces
- **Performance monitoring** — traces for key user flows (checkout, order placement)
- **Source maps** — minified JS mapped back to readable source for easier debugging
- **Breadcrumbs** — action trail leading up to any crash
- **Release tracking** — link errors to specific app versions

> Configure your Sentry DSN in your environment before building for production.

---

## PostHog — Analytics

[PostHog](https://posthog.com/) is integrated for product and behavioural analytics:

- **Screen tracking** — knows which screens users visit and for how long
- **Event capture** — key funnel events: `item_added_to_cart`, `checkout_started`, `order_placed`, `coupon_applied`
- **Funnel analysis** — identify where customers drop off between Menu → Cart → Checkout → Confirmation
- **Feature flags** (optional) — ship features to a subset of users for A/B testing
- **Session recording** (optional) — replay user sessions to identify UX friction

---

## CI/CD Pipeline

```mermaid
flowchart TD
    DEV["👨‍💻 Developer\npushes to GitHub"] --> GHA["GitHub Actions\nWorkflow triggered"]

    GHA --> LINT["Lint & Type Check\n(ESLint / TypeScript)"]
    GHA --> TEST["Unit Tests\n(Jest)"]

    LINT --> BUILD_CHECK{All checks\npassed?}
    TEST --> BUILD_CHECK

    BUILD_CHECK -->|"❌ Fail"| NOTIFY_FAIL["Notify developer\nPR blocked"]
    BUILD_CHECK -->|"✅ Pass"| EAS_BUILD["EAS Build\n(Expo Application Services)"]

    EAS_BUILD --> PREVIEW["Preview / Internal\nDistribution Build"]
    PREVIEW --> QA["QA Testing\non physical devices"]

    QA -->|"✅ Approved"| EAS_PROD["EAS Build\nProduction"]
    QA -->|"❌ Issues found"| DEV

    EAS_PROD --> STORES["App Stores"]
    STORES --> ANDROID["Google Play Store\n(Android AAB)"]
    STORES --> IOS["Apple App Store\n(iOS IPA)"]

    EAS_PROD --> SENTRY_UPLOAD["Upload Source Maps\nto Sentry"]
    EAS_PROD --> POSTHOG_RELEASE["Tag Release\nin PostHog"]
```

### Branch Strategy

| Branch | Purpose | Auto Build |
|---|---|---|
| `main` | Production-ready code | Production EAS build |
| `develop` | Active development | Preview build |
| `feature/*` | Feature branches | Lint + test only |
| `hotfix/*` | Urgent production fixes | Production EAS build |

---

## Role-Based Access Control

```mermaid
flowchart LR
    subgraph Firestore
        USERS["users/{uid}\nrole: admin | customer"]
    end

    subgraph AppNavigator
        AUTH_CHECK["onAuthStateChanged\nreads role from Firestore"]
        AUTH_CHECK -->|"role = admin"| ADMIN_NAV["Admin Stack\nDashboard · Orders · Menu Mgmt"]
        AUTH_CHECK -->|"role = customer"| CUST_NAV["Customer Stack\nMenu · Cart · Orders · Profile"]
        AUTH_CHECK -->|"no user"| GUEST_NAV["Guest Stack\nMenu · Cart · Sign In"]
    end

    USERS --> AUTH_CHECK
```

| Feature | Guest | Customer | Admin |
|---|---|---|---|
| Browse Menu | ✅ | ✅ | ✅ |
| Add to Cart | ✅ | ✅ | — |
| Place Orders | — | ✅ | ✅ (manual) |
| Order History | — | ✅ (own) | ✅ (all) |
| Track Orders | ✅ (by ID) | ✅ | — |
| Update Order Status | — | — | ✅ |
| Manage Menu Items | — | — | ✅ |
| View Dashboard | — | — | ✅ |
| Profile Management | — | ✅ | — |
| Favourites | — | ✅ | — |

---

## Coupon System

The app supports four built-in coupon codes at checkout:

| Code | Type | Value |
|---|---|---|
| `WELCOME10` | Percentage | 10% off order total |
| `SAVE20` | Flat discount | ₹20 off order total |
| `BALCONY15` | Percentage | 15% off order total |
| `FREE` | Delivery waiver | Free delivery |

**Delivery fee:** ₹30 flat, automatically waived on orders ≥ ₹200.  
**Payment method:** Cash on Delivery.  
**Order number format:** `BA-0001`, `BA-0002`, … (auto-incremented from Firestore).

---

## Push Notifications

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant FS as Firestore
    participant EPS as Expo Push Service
    participant Device as Customer Device

    Note over App: On customer login
    App->>EPS: requestPermissionsAsync()
    EPS-->>App: Push token
    App->>FS: updateDoc(users/{uid}, { expoPushToken })

    Note over App: Admin updates order status
    App->>FS: updateDoc(orders/{id}, { status: "shipped" })
    App->>EPS: POST /send { to: expoPushToken, title, body }
    EPS->>Device: FCM / APNs delivery
    Device-->>App: Notification received & displayed
```

**Android:** Uses a dedicated `orders` notification channel with `MAX` importance and default sound.  
**iOS:** Standard APNs delivery via Expo infrastructure.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

Built by **Ankit Patel** · [@ankit79600](https://github.com/ankit79600)

</div>
