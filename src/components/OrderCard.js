import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, STATUS_COLORS, STATUS_LABELS } from '../theme';

const STATUS_ICONS = {
  pending: '⏳', processing: '👨‍🍳', shipped: '🛵', delivered: '✅', cancelled: '❌',
};

export default function OrderCard({ order, onPress }) {
  const date = order.createdAt?.toDate().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });

  const itemsText = Array.isArray(order.items)
    ? order.items.map(i => `${i.name} ×${i.qty}`).join(', ')
    : (order.items || '');

  const statusColor = STATUS_COLORS[order.status] || colors.textLight;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '25' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status] || order.status}
          </Text>
        </View>
      </View>
      <Text style={styles.name}>{order.customerName}</Text>
      <Text style={styles.items} numberOfLines={1}>{itemsText}</Text>
      <View style={styles.footer}>
        <Text style={styles.phone}>{order.customerPhone}</Text>
        <View style={styles.footerRight}>
          {order.totalAmount > 0 && (
            <Text style={styles.amount}>₹{Number(order.totalAmount).toFixed(2)}</Text>
          )}
          {date && <Text style={styles.date}>{date}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  name: { fontSize: 15, color: colors.text, fontWeight: '500', marginBottom: 3 },
  items: { fontSize: 13, color: colors.textLight, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phone: { fontSize: 13, color: colors.textLight },
  footerRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  amount: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  date: { fontSize: 12, color: colors.textLight },
});
