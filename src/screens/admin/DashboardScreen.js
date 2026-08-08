import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { db, auth } from '../../../firebase';
import { colors } from '../../theme';
import OrderCard from '../../components/OrderCard';

function getLast7DaysRevenue(orders) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const revenue = orders
      .filter(o => {
        const t = o.createdAt?.toDate();
        return t && t >= d && t <= dayEnd && o.status !== 'cancelled';
      })
      .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue,
      isToday: i === 0,
    });
  }
  return days;
}

export default function DashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderBanner, setNewOrderBanner] = useState(false);
  const prevPendingRef = useRef(null);
  const bannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    today: orders.filter(o => o.createdAt?.toDate() >= todayStart).length,
    todayRevenue: orders
      .filter(o => o.createdAt?.toDate() >= todayStart && o.status !== 'cancelled')
      .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
  };

  useEffect(() => {
    if (prevPendingRef.current !== null && stats.pending > prevPendingRef.current) {
      setNewOrderBanner(true);
      Animated.sequence([
        Animated.timing(bannerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(bannerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setNewOrderBanner(false));

      Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 New Order!',
          body: 'A new order has been placed. Check it now!',
          sound: 'default',
        },
        trigger: null,
      }).catch(() => {});
    }
    prevPendingRef.current = stats.pending;
  }, [stats.pending]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const weekData = getLast7DaysRevenue(orders);
  const maxRevenue = Math.max(...weekData.map(d => d.revenue), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {newOrderBanner && (
        <Animated.View style={[styles.newOrderBanner, { opacity: bannerAnim }]}>
          <Text style={styles.newOrderBannerText}>🔔 New order just arrived!</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.brand}>Balcony Aroma</Text>
        </View>
        <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>Today's Revenue</Text>
        <Text style={styles.revenueAmount}>₹{stats.todayRevenue.toFixed(2)}</Text>
        <Text style={styles.revenueOrders}>{stats.today} order{stats.today !== 1 ? 's' : ''} today</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Pending" value={stats.pending} color="#F39C12" icon="⏳" />
        <StatCard label="Preparing" value={stats.preparing} color="#3498DB" icon="👨‍🍳" />
        <StatCard label="Delivered" value={stats.delivered} color={colors.success} icon="✅" />
        <StatCard label="Total Orders" value={stats.total} color={colors.primary} icon="📦" />
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Last 7 Days Revenue</Text>
        <View style={styles.chart}>
          {weekData.map((day, i) => (
            <View key={i} style={styles.barWrapper}>
              {day.revenue > 0 && (
                <Text style={styles.barAmount} numberOfLines={1}>
                  ₹{day.revenue >= 1000 ? `${(day.revenue / 1000).toFixed(1)}k` : day.revenue}
                </Text>
              )}
              <View style={styles.barTrack}>
                <View style={[
                  styles.bar,
                  { height: Math.max(4, (day.revenue / maxRevenue) * 80) },
                  day.isToday && styles.barToday,
                ]} />
              </View>
              <Text style={[styles.barLabel, day.isToday && styles.barLabelToday]}>
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>

        {loading && <Text style={styles.placeholder}>Loading orders...</Text>}

        {!loading && orders.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Customer orders will appear here in real-time</Text>
          </View>
        )}

        {orders.slice(0, 5).map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  newOrderBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: '#27AE60', paddingVertical: 12, paddingHorizontal: 20,
    alignItems: 'center',
  },
  newOrderBannerText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, padding: 20, paddingTop: 50,
  },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  brand: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: colors.white, fontWeight: '600' },
  revenueCard: {
    backgroundColor: colors.primary, marginHorizontal: 16, marginTop: -1,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8,
  },
  revenueLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  revenueAmount: { color: colors.white, fontSize: 36, fontWeight: 'bold' },
  revenueOrders: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: 12,
    padding: 16, borderLeftWidth: 4, elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  statIcon: { fontSize: 26, marginBottom: 8 },
  statValue: { fontSize: 30, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: colors.textLight, marginTop: 3 },
  chartSection: {
    backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 14, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, marginBottom: 8,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barAmount: { fontSize: 8, color: colors.textLight, marginBottom: 2, textAlign: 'center' },
  barTrack: { width: '60%', alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  bar: { width: '100%', backgroundColor: colors.border, borderRadius: 4 },
  barToday: { backgroundColor: colors.primary },
  barLabel: { fontSize: 10, color: colors.textLight, marginTop: 4 },
  barLabelToday: { color: colors.primary, fontWeight: '700' },
  section: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  seeAll: { color: colors.primary, fontWeight: '600' },
  placeholder: { color: colors.textLight, textAlign: 'center', padding: 20 },
  emptyBox: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  emptySubtext: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 4 },
});
