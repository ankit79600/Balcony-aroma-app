import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { auth, db } from './firebase';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { FavouritesProvider } from './src/context/FavouritesContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications(uid) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
      });
    }
  } catch {}
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [role, setRole] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          setRole(snap.exists() && snap.data().role === 'customer' ? 'customer' : 'admin');
        } catch {
          setRole('admin');
        }
        setUser(currentUser);
        registerForPushNotifications(currentUser.uid);
      } else {
        setUser(null);
        setRole(null);
      }
    });
  }, []);

  if (user === undefined) return null;

  return (
    <FavouritesProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator user={user} role={role} />
        </NavigationContainer>
      </CartProvider>
    </FavouritesProvider>
  );
}
