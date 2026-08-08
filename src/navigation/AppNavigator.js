import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useCart } from '../context/CartContext';
import { colors } from '../theme';

import MenuScreen from '../screens/customer/MenuScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import CustomerAuthScreen from '../screens/customer/CustomerAuthScreen';
import TrackOrderScreen from '../screens/customer/TrackOrderScreen';

import DashboardScreen from '../screens/admin/DashboardScreen';
import OrdersScreen from '../screens/admin/OrdersScreen';
import OrderDetailScreen from '../screens/admin/OrderDetailScreen';
import MenuManagementScreen from '../screens/admin/MenuManagementScreen';
import AddMenuItemScreen from '../screens/admin/AddMenuItemScreen';
import AdminLoginScreen from '../screens/admin/LoginScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: 'bold' },
};

function CartIcon({ focused }) {
  const { totalItems } = useCart();
  return (
    <View>
      <Text style={{ fontSize: 20 }}>🛒</Text>
      {totalItems > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: colors.primary, borderRadius: 8,
          minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
            {totalItems > 9 ? '9+' : totalItems}
          </Text>
        </View>
      )}
    </View>
  );
}

function GuestTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
    }}>
      <Tab.Screen name="MenuTab" component={MenuScreen}
        options={{ tabBarLabel: 'Menu', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🍱</Text> }} />
      <Tab.Screen name="CartTab" component={CartScreen}
        options={{ tabBarLabel: 'Cart', tabBarIcon: CartIcon }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen}
        options={{ tabBarLabel: 'Sign In', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
    }}>
      <Tab.Screen name="MenuTab" component={MenuScreen}
        options={{ tabBarLabel: 'Menu', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🍱</Text> }} />
      <Tab.Screen name="CartTab" component={CartScreen}
        options={{ tabBarLabel: 'Cart', tabBarIcon: CartIcon }} />
      <Tab.Screen name="OrdersTab" component={OrderHistoryScreen}
        options={{ tabBarLabel: 'My Orders', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ headerShown: false, tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }} />
      <Tab.Screen name="Orders" component={OrdersScreen}
        options={{ ...headerOpts, title: 'All Orders', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📦</Text> }} />
      <Tab.Screen name="MenuMgmt" component={MenuManagementScreen}
        options={{ ...headerOpts, title: 'Menu Items', tabBarLabel: 'Menu', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🍱</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user, role }) {
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="GuestTabs" component={GuestTabs} />
        <Stack.Screen name="CustomerAuth" component={CustomerAuthScreen}
          options={{ headerShown: true, ...headerOpts, title: 'Sign In / Register' }} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen}
          options={{ headerShown: true, ...headerOpts, title: 'Track Your Order' }} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen}
          options={{ headerShown: true, ...headerOpts, title: 'Admin Login' }} />
      </Stack.Navigator>
    );
  }

  if (role === 'admin') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen}
          options={{ headerShown: true, ...headerOpts, title: 'Order Details' }} />
        <Stack.Screen name="AddMenuItem" component={AddMenuItemScreen}
          options={{ headerShown: true, ...headerOpts, title: 'Add Menu Item' }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="Checkout" component={CheckoutScreen}
        options={{ headerShown: true, ...headerOpts, title: 'Place Order' }} />
      <Stack.Screen name="TrackOrder" component={TrackOrderScreen}
        options={{ headerShown: true, ...headerOpts, title: 'Track Your Order' }} />
    </Stack.Navigator>
  );
}
