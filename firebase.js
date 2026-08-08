import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB4rUsug37OoxqNq5ezfHxm3v85PZiuX64',
  authDomain: 'balcony-aroma.firebaseapp.com',
  projectId: 'balcony-aroma',
  storageBucket: 'balcony-aroma.firebasestorage.app',
  messagingSenderId: '16729871689',
  appId: '1:16729871689:web:77cf4ccd3927474510b698',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
