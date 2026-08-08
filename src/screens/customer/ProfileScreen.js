import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { colors } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
    });
  }, [user?.uid]);

  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.guestContent}>
        <Text style={styles.guestLogo}>🍴</Text>
        <Text style={styles.guestBrand}>Balcony Aroma</Text>
        <Text style={styles.guestSub}>Sign in to track orders & save your address</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CustomerAuth')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Sign In / Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('TrackOrder')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>📦 Track Order by Number</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('AdminLogin')}
          style={styles.adminLink}
        >
          <Text style={styles.adminLinkText}>Admin Login</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{profile?.name || 'Customer'}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        {!!profile?.phone && <Text style={styles.profilePhone}>📱 {profile.phone}</Text>}
      </View>

      <View style={styles.menu}>
        <MenuItem
          icon="📋"
          label="My Orders"
          onPress={() => navigation.navigate('OrdersTab')}
        />
        <MenuItem
          icon="📦"
          label="Track Order by Number"
          onPress={() => navigation.navigate('TrackOrder')}
        />
        <MenuItem
          icon="📍"
          label="Saved Address"
          subtitle={profile?.savedAddress || 'Not set'}
          onPress={() => {}}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ icon, label, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        {!!subtitle && <Text style={styles.menuSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  guestContent: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  guestLogo: { fontSize: 64 },
  guestBrand: { fontSize: 26, fontWeight: 'bold', color: colors.primary, marginTop: 12 },
  guestSub: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  primaryBtn: {
    marginTop: 32, backgroundColor: colors.primary,
    paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: {
    marginTop: 12, borderWidth: 2, borderColor: colors.primary,
    paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center',
  },
  secondaryBtnText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  adminLink: { marginTop: 48 },
  adminLinkText: { color: colors.textLight, fontSize: 13, textDecorationLine: 'underline' },
  profileHeader: {
    backgroundColor: colors.primary, alignItems: 'center',
    paddingTop: 50, paddingBottom: 28, paddingHorizontal: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  profileName: { fontSize: 22, fontWeight: 'bold', color: colors.white },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  profilePhone: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  menu: { backgroundColor: colors.white, margin: 16, borderRadius: 14, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  menuSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  menuArrow: { fontSize: 22, color: colors.textLight },
  logoutBtn: {
    marginHorizontal: 16, marginBottom: 32, borderWidth: 1.5, borderColor: '#E74C3C',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  logoutBtnText: { color: '#E74C3C', fontSize: 16, fontWeight: '700' },
});
