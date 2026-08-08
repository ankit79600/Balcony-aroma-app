import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { useCart } from '../../context/CartContext';
import { colors, STATUS_COLORS, STATUS_LABELS } from '../../theme';

const STATUS_ICONS = {
  pending: '⏳', processing: '👨‍🍳', shipped: '🛵', delivered: '✅', cancelled: '❌',
};

function getETA(createdAt, status) {
  if (!createdAt || status === 'delivered' || status === 'cancelled') return null;
  const eta = new Date(createdAt.toDate().getTime() + 30 * 60 * 1000);
  const diffMin = Math.ceil((eta - new Date()) / 60000);
  if (diffMin <= 0) return 'Arriving soon';
  return `ETA ~${diffMin} min`;
}

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addReorderItems } = useCart();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, 'orders'), where('customerUid', '==', user.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(data);
      setLoading(false);
    });
  }, [user?.uid]);

  const handleReorder = (order) => {
    if (!Array.isArray(order.items) || order.items.length === 0) return;
    Alert.alert(
      'Reorder',
      `Add ${order.items.length} item${order.items.length > 1 ? 's' : ''} from ${order.orderNumber} to cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            addReorderItems(order.items);
            navigation.navigate('CartTab');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>Sign in to view your orders</Text>
        <Text style={styles.lockSub}>Track your orders, reorder favourites and more!</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('CustomerAuth')}>
          <Text style={styles.signInBtnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />;

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🛵</Text>
        <Text style={styles.emptyTitle}>No orders yet!</Text>
        <Text style={styles.emptySub}>Your past orders will appear here.</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('MenuTab')}>
          <Text style={styles.menuBtnText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrder = ({ item }) => {
    const date = item.createdAt?.toDate().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const itemsText = Array.isArray(item.items)
      ? item.items.map(i => `${i.name} ×${i.qty}`).join(', ')
      : item.items;
    const statusColor = STATUS_COLORS[item.status] || colors.textLight;
    const eta = getETA(item.createdAt, item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNum}>{item.orderNumber}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_ICONS[item.status]} {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.orderItems} numberOfLines={2}>{itemsText}</Text>
        {!!eta && (
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>🕐 {eta}</Text>
          </View>
        )}
        <View style={styles.orderFooter}>
          <Text style={styles.orderDate}>{date}</Text>
          <Text style={styles.orderAmount}>₹{Number(item.totalAmount).toFixed(2)}</Text>
        </View>
        {item.status !== 'cancelled' && Array.isArray(item.items) && item.items.length > 0 && (
          <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(item)}>
            <Text style={styles.reorderBtnText}>🔁 Reorder</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSub}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.background },
  lockIcon: { fontSize: 56 },
  lockTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16 },
  lockSub: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  signInBtn: {
    marginTop: 24, backgroundColor: colors.primary,
    paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12,
  },
  signInBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 6 },
  menuBtn: {
    marginTop: 24, borderWidth: 2, borderColor: colors.primary,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12,
  },
  menuBtnText: { color: colors.primary, fontSize: 15, fontWeight: 'bold' },
  header: {
    backgroundColor: colors.primary, paddingHorizontal: 16,
    paddingTop: 50, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.white },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  list: { padding: 12 },
  orderCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNum: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1.5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  orderItems: { fontSize: 13, color: colors.textLight, marginBottom: 8, lineHeight: 18 },
  etaBadge: {
    backgroundColor: '#FFF3CD', borderRadius: 6, paddingHorizontal: 10,
    paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8,
  },
  etaText: { fontSize: 12, color: '#856404', fontWeight: '600' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: 12, color: colors.textLight },
  orderAmount: { fontSize: 15, fontWeight: 'bold', color: colors.primary },
  reorderBtn: {
    marginTop: 10, borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: 8, paddingVertical: 7, alignItems: 'center',
  },
  reorderBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
