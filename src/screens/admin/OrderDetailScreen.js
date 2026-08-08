import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { colors, STATUS_COLORS, STATUS_LABELS } from '../../theme';

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_ICONS = {
  pending: '⏳', processing: '👨‍🍳', shipped: '🛵', delivered: '✅', cancelled: '❌',
};

const PUSH_MESSAGES = {
  processing: 'is being prepared by our kitchen 👨‍🍳',
  shipped: 'is out for delivery 🛵',
  delivered: 'has been delivered! Enjoy your meal 😋',
  cancelled: 'has been cancelled ❌',
};

async function sendPushNotification(token, orderNumber, newStatus) {
  const message = PUSH_MESSAGES[newStatus];
  if (!token || !message) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: `Order ${orderNumber} Update`,
        body: `Your order ${message}`,
        sound: 'default',
        priority: 'high',
      }),
    });
  } catch {}
}

export default function OrderDetailScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, 'orders', orderId), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
    });
  }, [orderId]);

  const changeStatus = (newStatus) => {
    if (newStatus === order.status) return;
    Alert.alert(
      'Update Status',
      `Change to "${STATUS_LABELS[newStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdating(true);
            await updateDoc(doc(db, 'orders', orderId), {
              status: newStatus,
              updatedAt: serverTimestamp(),
            });
            if (order.customerUid) {
              try {
                const userSnap = await getDoc(doc(db, 'users', order.customerUid));
                const token = userSnap.data()?.expoPushToken;
                if (token) await sendPushNotification(token, order.orderNumber, newStatus);
              } catch {}
            }
            setUpdating(false);
          },
        },
      ],
    );
  };

  if (!order) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const itemsText = Array.isArray(order.items)
    ? order.items.map(i => {
        const req = i.specialRequest ? ` (${i.specialRequest})` : '';
        return `${i.emoji || ''} ${i.name} ×${i.qty}  ₹${(i.price * i.qty).toFixed(0)}${req}`;
      }).join('\n')
    : order.items;

  const createdDate = order.createdAt?.toDate().toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <View style={[styles.badge, {
            backgroundColor: STATUS_COLORS[order.status] + '25',
            borderColor: STATUS_COLORS[order.status],
          }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLORS[order.status] }]}>
              {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
            </Text>
          </View>
        </View>
        {!!createdDate && <Text style={styles.dateText}>Placed: {createdDate}</Text>}
      </View>

      <InfoSection title="Customer">
        <InfoRow icon="👤" label="Name" value={order.customerName} />
        <InfoRow icon="📱" label="Phone" value={order.customerPhone} />
        {!!order.customerAddress && <InfoRow icon="📍" label="Address" value={order.customerAddress} />}
      </InfoSection>

      <InfoSection title="Order Items">
        <Text style={styles.itemsText}>{itemsText}</Text>
        <View style={styles.totalRow}>
          {order.discount > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>Coupon ({order.couponCode})</Text>
              <Text style={styles.discountValue}>−₹{order.discount}</Text>
            </View>
          )}
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{Number(order.totalAmount).toFixed(2)}</Text>
        </View>
        {!!order.notes && <InfoRow icon="📝" label="Instructions" value={order.notes} />}
      </InfoSection>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <Text style={styles.pushNote}>📲 Customer gets a push notification on each update</Text>
        {updating && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        {STATUS_FLOW.map(s => {
          const isActive = order.status === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn, { borderColor: STATUS_COLORS[s] }, isActive && { backgroundColor: STATUS_COLORS[s] }]}
              onPress={() => changeStatus(s)}
              disabled={isActive || updating}
              activeOpacity={0.75}
            >
              <Text style={styles.statusBtnIcon}>{STATUS_ICONS[s]}</Text>
              <Text style={[styles.statusBtnText, { color: isActive ? colors.white : STATUS_COLORS[s] }]}>
                {STATUS_LABELS[s]}
              </Text>
              {isActive && <Text style={styles.currentTag}>Current</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function InfoSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 4,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  badgeText: { fontWeight: '700', fontSize: 13 },
  dateText: { color: colors.textLight, marginTop: 4, fontSize: 13 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textLight,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
  },
  pushNote: { fontSize: 12, color: colors.textLight, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoIcon: { fontSize: 18, marginRight: 12, marginTop: 2 },
  infoLabel: { fontSize: 11, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '500', marginTop: 2 },
  itemsText: { fontSize: 14, color: colors.text, lineHeight: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 8 },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  discountLabel: { fontSize: 12, color: colors.success },
  discountValue: { fontSize: 12, color: colors.success, fontWeight: '600' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  spinner: { marginBottom: 8 },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 2, marginBottom: 8, backgroundColor: colors.white, gap: 10,
  },
  statusBtnIcon: { fontSize: 20 },
  statusBtnText: { fontSize: 16, fontWeight: '600', flex: 1 },
  currentTag: {
    backgroundColor: 'rgba(255,255,255,0.3)', color: colors.white,
    fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
});
