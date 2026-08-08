# 🌿 Balcony Aroma

A full-featured **React Native** food ordering app built with **Expo**, supporting dual roles — **Admin** and **Customer** — with real-time Firebase backend, push notifications, error tracking via **Sentry**, and product analytics via **PostHog**.

---

## 📱 Screenshots

> _Add your app screenshots here_

---

## ✨ Features

### Customer
- Browse menu items with images
- Add items to cart and manage quantities
- Save favourites
- Place orders and track order status in real-time
- View full order history
- Push notification updates on order status changes
- Profile management with image picker

### Admin
- Secure admin login
- Dashboard overview
- Full menu management (add, edit, delete items)
- View and manage incoming orders
- Update order status with real-time push notifications to customers
- Add orders manually

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) ~54.0.0 |
| Navigation | [React Navigation](https://reactnavigation.org/) v7 (Stack + Bottom Tabs) |
| Backend / DB | [Firebase](https://firebase.google.com/) (Firestore + Auth) |
| State Management | React Context API (Cart, Favourites) |
| Push Notifications | [expo-notifications](https://docs.expo.dev/versions/v56.0.0/sdk/notifications/) |
| Media | expo-av, expo-image-picker |
| Error Tracking | [Sentry](https://sentry.io/) |
| Analytics | [PostHog](https://posthog.com/) |
| Persistence | AsyncStorage |

---

## 🏗 Project Structure

```
balcony-aroma/
├── App.js                        # Root component, auth listener, notification setup
├── app.json                      # Expo config
├── firebase.js                   # Firebase initialization
├── index.js                      # Entry point
├── assets/                       # Icons, images
└── src/
    ├── navigation/
    │   └── AppNavigator.js       # Role-based navigation (admin vs customer)
    ├── screens/
    │   ├── admin/
    │   │   ├── DashboardScreen.js
    │   │   ├── LoginScreen.js
    │   │   ├── MenuManagementScreen.js
    │   │   ├── AddMenuItemScreen.js
    │   │   ├── OrdersScreen.js
    │   │   ├── OrderDetailScreen.js
    │   │   └── AddOrderScreen.js
    │   └── customer/
    │       ├── CustomerAuthScreen.js
    │       ├── MenuScreen.js
    │       ├── CartScreen.js
    │       ├── CheckoutScreen.js
    │       ├── OrderHistoryScreen.js
    │       ├── TrackOrderScreen.js
    │       └── ProfileScreen.js
    ├── components/
    │   ├── HomeScreen.js
    │   └── OrderCard.js
    ├── context/
    │   ├── CartContext.js        # Global cart state
    │   └── FavouritesContext.js  # Global favourites state
    └── theme.js                  # App-wide colors and styles
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your phone (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/ankit79600/Balcony-aroma-app.git
cd Balcony-aroma-app

# Install dependencies
npm install
```

### Environment Setup

Create a `firebase.js` file in the root (already included — replace with your own Firebase config if forking):

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### Run the App

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

---

## 🔥 Firebase Setup

This app uses the following Firebase services:

- **Firebase Authentication** — Email/password login for both admin and customer roles
- **Firestore** — Real-time database for users, menu items, and orders

### Firestore Collections

| Collection | Description |
|---|---|
| `users` | User profiles with role (`admin` / `customer`) and push token |
| `menuItems` | Menu items with name, price, image, category |
| `orders` | Orders with items, status, timestamps, and user reference |

---

## 📊 Analytics — PostHog

[PostHog](https://posthog.com/) is integrated for product analytics:

- Track screen views and user flows
- Monitor key events (order placed, item added to cart, checkout started)
- Understand customer behaviour and funnel drop-offs

---

## 🐛 Error Tracking — Sentry

[Sentry](https://sentry.io/) is integrated for real-time error monitoring:

- Automatic crash reporting on both iOS and Android
- Performance tracing
- Source map support for readable stack traces

---

## 🔔 Push Notifications

Push notifications are powered by **Expo Notifications**:

- On login, the device's Expo push token is saved to Firestore under the user's document
- When an admin updates an order status, a push notification is sent to the customer
- Android uses a dedicated `orders` notification channel with MAX importance

---

## 👥 Role-Based Access

| Feature | Admin | Customer |
|---|---|---|
| View Menu | ✅ | ✅ |
| Manage Menu | ✅ | ❌ |
| Place Orders | ✅ (manual) | ✅ |
| View All Orders | ✅ | ❌ |
| View Own Orders | ❌ | ✅ |
| Update Order Status | ✅ | ❌ |
| Profile Management | ❌ | ✅ |

---

## 📦 Key Dependencies

```json
{
  "expo": "~54.0.0",
  "firebase": "^12.15.0",
  "react-navigation": "^7.x",
  "expo-notifications": "~0.32.17",
  "expo-image-picker": "~17.0.11",
  "expo-av": "~16.0.8",
  "@react-native-async-storage/async-storage": "2.2.0"
}
```

---

## 📄 License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.

---

## 🙋‍♂️ Author

**Ankit Patel** — [@ankit79600](https://github.com/ankit79600)
