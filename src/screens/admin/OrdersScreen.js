import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
} from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { colors } from '../../theme';
import OrderCard from '../../components/OrderCard';

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const FILTER_LABELS = {
  All: 'All', Pending: 'Order Placed', Processing: 'Preparing',
  Shipped: 'Out for Delivery', Delivered: 'Delivered', Cancelled: 'Cancelled',
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filtered = orders.filter(order => {
    const term = search.toLowerCase();
    const matchSearch = !term
      || order.customerName?.toLowerCase().includes(term)
      || order.orderNumber?.toLowerCase().includes(term)
      || order.customerPhone?.includes(term);
    const matchStatus = statusFilter === 'All' || order.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name, order # or phone..."
        placeholderTextColor={colors.textLight}
        clearButtonMode="while-editing"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, statusFilter === f && styles.chipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.chipText, statusFilter === f && styles.chipTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.count}>{filtered.length} order{filtered.length !== 1 ? 's' : ''}</Text>
        {filtered.length === 0
          ? <Text style={styles.empty}>No orders match your search</Text>
          : filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            />
          ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    margin: 16, marginBottom: 8, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 12, fontSize: 15, color: colors.text,
  },
  filterRow: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '500', fontSize: 13 },
  chipTextActive: { color: colors.white },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  count: { fontSize: 13, color: colors.textLight, marginBottom: 8 },
  empty: { textAlign: 'center', color: colors.textLight, padding: 40 },
});
