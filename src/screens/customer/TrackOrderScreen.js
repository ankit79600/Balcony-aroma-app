import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { colors, STATUS_COLORS, STATUS_LABELS } from '../../theme';

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const STEP_ICONS = {
  pending: '⏳', processing: '🔄', shipped: '🚚', delivered: '✅',
};

const STEP_DESC = {
  pending: 'Order received, awaiting confirmation',
  processing: 'Your order is being prepared',
  shipped: 'Your order is on the way',
  delivered: 'Order successfully delivered',
};

function getETA(createdAt, status) {
  if (!createdAt || status === 'delivered' || status === 'cancelled') return null;
  const eta = new Date(createdAt.toDate().getTime() + 30 * 60 * 1000);
  const diffMin = Math.ceil((eta - new Date()) / 60000);
  if (diffMin <= 0) return 'Arriving very soon!';
  return `~${diffMin} min`;
}

export default function TrackOrderScreen() {
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  const trackOrder = async () => {
    const term = search.trim();
    if (!term) return;

    // Cancel any previous real-time listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      let snap = await getDocs(
        query(collection(db, 'orders'), where('orderNumber', '==', term.toUpperCase()))
      );

      if (snap.empty) {
        snap = await getDocs(
          query(collection(db, 'orders'), where('customerPhone', '==', term))
        );
      }

      if (snap.empty) {
        setError('No order found. Please check your order number (e.g. BA-0001) or phone number.');
        setLoading(false);
        return;
      }

      // Subscribe to real-time updates on this order document
      const orderId = snap.docs[0].id;
      unsubscribeRef.current = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      });
    } catch {
      setError('Something went wrong. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  const itemsText = Array.isArray(order?.items)
    ? order.items.map(i => `${i.emoji || ''} ${i.name} ×${i.qty}`).join('\n')
    : order?.items || '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Track Your Order</Text>
        <Text style={styles.subtitle}>
          Enter your order number (e.g. BA-0001) or the phone number you used when ordering.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="BA-0001 or phone number"
            placeholderTextColor={colors.textLight}
            autoCapitalize="characters"
            onSubmitEditing={trackOrder}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.trackBtn, loading && styles.trackBtnDisabled]}
            onPress={trackOrder}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.trackBtnText}>Track</Text>
            }
          </TouchableOpacity>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {order && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.orderNum}>{order.orderNumber}</Text>
              <Text style={styles.hello}>Hello, {order.customerName}! 👋</Text>
              {!!getETA(order.createdAt, order.status) && (
                <View style={styles.etaBox}>
                  <Text style={styles.etaText}>🕐 Estimated delivery: {getETA(order.createdAt, order.status)}</Text>
                </View>
              )}
              <View style={styles.liveBadge}>
                <Text style={styles.liveDot}>●</Text>
                <Text style={styles.liveText}>Live tracking</Text>
              </View>
            </View>

            {isCancelled ? (
              <View style={styles.cancelBox}>
                <Text style={styles.cancelIcon}>❌</Text>
                <Text style={styles.cancelTitle}>Order Cancelled</Text>
                <Text style={styles.cancelSub}>This order has been cancelled. Please contact us for help.</Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {STEPS.map((step, i) => {
                  const done = i < stepIndex;
                  const active = i === stepIndex;
                  return (
                    <View key={step} style={styles.stepRow}>
                      <View style={styles.stepTrack}>
                        <View style={[
                          styles.dot,
                          done && styles.dotDone,
                          active && styles.dotActive,
                          !done && !active && styles.dotPending,
                        ]}>
                          <Text style={styles.dotText}>{done ? '✓' : (i + 1).toString()}</Text>
                        </View>
                        {i < STEPS.length - 1 && (
                          <View style={[styles.line, (done || active) && styles.lineActive]} />
                        )}
                      </View>
                      <View style={styles.stepInfo}>
                        <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                          {STEP_ICONS[step]} {STATUS_LABELS[step]}
                        </Text>
                        {active && (
                          <Text style={styles.stepDesc}>{STEP_DESC[step]}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <Text style={styles.summaryItems}>{itemsText}</Text>
              {order.totalAmount > 0 && (
                <Text style={styles.summaryAmount}>
                  Total: ₹{Number(order.totalAmount).toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textLight, lineHeight: 20, marginBottom: 24 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: {
    flex: 1, backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, padding: 13,
    fontSize: 15, color: colors.text,
  },
  trackBtn: { backgroundColor: colors.primary, paddingHorizontal: 22, borderRadius: 12, justifyContent: 'center' },
  trackBtnDisabled: { opacity: 0.65 },
  trackBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  error: { color: '#E74C3C', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  resultCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, marginBottom: 32,
  },
  resultHeader: { marginBottom: 20 },
  orderNum: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  hello: { fontSize: 16, color: colors.textLight, marginTop: 4 },
  etaBox: {
    marginTop: 8, backgroundColor: '#FFF3CD', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  etaText: { fontSize: 13, color: '#856404', fontWeight: '600' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  liveDot: { color: colors.success, fontSize: 10 },
  liveText: { fontSize: 11, color: colors.success, fontWeight: '600' },
  cancelBox: { alignItems: 'center', paddingVertical: 24 },
  cancelIcon: { fontSize: 48, marginBottom: 10 },
  cancelTitle: { fontSize: 18, fontWeight: 'bold', color: '#E74C3C' },
  cancelSub: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 6 },
  timeline: { marginBottom: 20 },
  stepRow: { flexDirection: 'row' },
  stepTrack: { alignItems: 'center', width: 32, marginRight: 14 },
  dot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dotDone: { backgroundColor: colors.primary },
  dotActive: { backgroundColor: colors.primary },
  dotPending: { backgroundColor: colors.border },
  dotText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  line: { width: 2, flex: 1, minHeight: 24, marginVertical: 3, backgroundColor: colors.border },
  lineActive: { backgroundColor: colors.primary },
  stepInfo: { flex: 1, paddingBottom: 24 },
  stepLabel: { fontSize: 15, fontWeight: '500', color: colors.textLight },
  stepLabelActive: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  stepDesc: { fontSize: 13, color: colors.textLight, marginTop: 4, lineHeight: 18 },
  orderSummary: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  summaryItems: { fontSize: 14, color: colors.text, lineHeight: 22 },
  summaryAmount: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginTop: 6 },
});
