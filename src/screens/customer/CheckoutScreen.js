import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit, doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { useCart } from '../../context/CartContext';
import { colors } from '../../theme';

const COUPONS = {
  WELCOME10: { type: 'percent', value: 10, label: '10% off applied!' },
  SAVE20: { type: 'flat', value: 20, label: '₹20 off applied!' },
  BALCONY15: { type: 'percent', value: 15, label: '15% off applied!' },
  FREE: { type: 'delivery', label: 'Free delivery applied!' },
};

export default function CheckoutScreen({ navigation }) {
  const { cartList, totalAmount, clearCart } = useCart();
  const [profile, setProfile] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const deliveryFee = totalAmount >= 200 ? 0 : 30;

  const discount = (() => {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return Math.round(totalAmount * coupon.value / 100);
    if (coupon.type === 'flat') return Math.min(coupon.value, totalAmount);
    if (coupon.type === 'delivery') return deliveryFee;
    return 0;
  })();

  const grandTotal = totalAmount + deliveryFee - discount;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        if (data.savedAddress) setAddress(data.savedAddress);
      }
    });
  }, []);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (COUPONS[code]) {
      setCoupon({ code, ...COUPONS[code] });
      setCouponError('');
    } else {
      setCoupon(null);
      setCouponError('Invalid coupon code. Try WELCOME10, SAVE20, BALCONY15 or FREE.');
    }
  };

  const nextOrderNumber = async () => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return 'BA-0001';
    const last = snap.docs[0].data().orderNumber || 'BA-0000';
    const num = parseInt(last.split('-')[1] || '0') + 1;
    return `BA-${String(num).padStart(4, '0')}`;
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter your delivery address.');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid || !profile) return;

    setLoading(true);
    try {
      const orderNumber = await nextOrderNumber();
      await addDoc(collection(db, 'orders'), {
        customerUid: uid,
        customerName: profile.name,
        customerPhone: profile.phone,
        customerAddress: address.trim(),
        items: cartList.map(i => ({
          id: i.id, name: i.name, price: i.price, qty: i.qty,
          emoji: i.emoji || '', specialRequest: i.specialRequest || '',
        })),
        totalAmount: grandTotal,
        deliveryFee: coupon?.type === 'delivery' ? 0 : deliveryFee,
        discount,
        couponCode: coupon?.code || '',
        notes: notes.trim(),
        orderNumber,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', uid), { savedAddress: address.trim() });

      clearCart();
      Alert.alert(
        'Order Placed! 🎉',
        `Your order ${orderNumber} has been placed.\nWe'll start preparing it right away!`,
        [{ text: 'Track Order', onPress: () => navigation.navigate('OrdersTab') }],
      );
    } catch {
      Alert.alert('Error', 'Could not place your order. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivering to</Text>
          <View style={styles.card}>
            <Text style={styles.customerName}>{profile?.name || '...'}</Text>
            <Text style={styles.customerPhone}>{profile?.phone}</Text>
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter full delivery address..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            {cartList.map(item => (
              <View key={item.id}>
                <View style={styles.orderRow}>
                  <Text style={styles.orderEmoji}>{item.emoji || '🍽️'}</Text>
                  <Text style={styles.orderName}>{item.name} × {item.qty}</Text>
                  <Text style={styles.orderPrice}>₹{(item.price * item.qty).toFixed(0)}</Text>
                </View>
                {!!item.specialRequest && (
                  <Text style={styles.specialReq}>📝 {item.specialRequest}</Text>
                )}
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.orderRow}>
              <Text style={{ flex: 1 }} />
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={{ flex: 1 }} />
              <Text style={styles.billLabel}>Delivery</Text>
              <Text style={[styles.billValue, deliveryFee === 0 && { color: colors.success }]}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.orderRow}>
                <Text style={{ flex: 1 }} />
                <Text style={[styles.billLabel, { color: colors.success }]}>Discount ({coupon.code})</Text>
                <Text style={[styles.billValue, { color: colors.success }]}>−₹{discount}</Text>
              </View>
            )}
            <View style={[styles.orderRow, styles.totalRow]}>
              <Text style={{ flex: 1 }} />
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              value={couponInput}
              onChangeText={text => { setCouponInput(text); setCouponError(''); if (!text) setCoupon(null); }}
              placeholder="Enter code (e.g. WELCOME10)"
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.couponBtn} onPress={applyCoupon}>
              <Text style={styles.couponBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
          {!!coupon && <Text style={styles.couponSuccess}>✅ {coupon.label}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Doorbell notes, allergies, gate code..."
            placeholderTextColor={colors.textLight}
            multiline
          />
        </View>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentIcon}>💵</Text>
          <Text style={styles.paymentText}>Cash on Delivery</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeBtn, loading && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <>
                <Text style={styles.placeBtnText}>Place Order</Text>
                <Text style={styles.placeBtnAmount}>₹{grandTotal.toFixed(2)}</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textLight,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  customerName: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  customerPhone: { fontSize: 14, color: colors.textLight, marginTop: 2, marginBottom: 10 },
  addressInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: colors.text,
    textAlignVertical: 'top', minHeight: 70,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  orderEmoji: { fontSize: 18, marginRight: 8 },
  orderName: { flex: 1, fontSize: 14, color: colors.text },
  orderPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
  specialReq: { fontSize: 11, color: colors.textLight, marginLeft: 26, marginTop: -4, marginBottom: 6 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  billLabel: { fontSize: 13, color: colors.textLight, marginRight: 16 },
  billValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginRight: 16 },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  couponRow: { flexDirection: 'row', gap: 10 },
  couponInput: {
    flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 12, fontSize: 14, color: colors.text,
  },
  couponBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 18, borderRadius: 12,
    justifyContent: 'center',
  },
  couponBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  couponError: { fontSize: 12, color: '#E74C3C', marginTop: 6 },
  couponSuccess: { fontSize: 13, color: colors.success, marginTop: 6, fontWeight: '600' },
  notesInput: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, fontSize: 14, color: colors.text,
    textAlignVertical: 'top', minHeight: 70,
  },
  paymentInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, backgroundColor: colors.white,
    borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: colors.accent,
  },
  paymentIcon: { fontSize: 20 },
  paymentText: { fontSize: 14, fontWeight: '600', color: colors.text },
  placeBtn: {
    backgroundColor: colors.primary, margin: 16, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18,
    marginBottom: 40,
  },
  placeBtnDisabled: { opacity: 0.65 },
  placeBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  placeBtnAmount: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '700' },
});
