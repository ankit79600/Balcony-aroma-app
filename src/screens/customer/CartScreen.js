import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { auth } from '../../../firebase';
import { useCart } from '../../context/CartContext';
import { colors } from '../../theme';

export default function CartScreen({ navigation }) {
  const { items, cartList, totalAmount, addItem, removeItem, updateSpecialRequest } = useCart();
  const [editingId, setEditingId] = useState(null);

  if (cartList.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add items from the menu to get started!</Text>
      </View>
    );
  }

  const handleCheckout = () => {
    if (!auth.currentUser) {
      navigation.navigate('CustomerAuth');
      return;
    }
    navigation.navigate('Checkout');
  };

  const deliveryFee = totalAmount >= 200 ? 0 : 30;
  const grandTotal = totalAmount + deliveryFee;

  const renderItem = ({ item }) => (
    <View style={styles.itemWrapper}>
      <View style={styles.cartItem}>
        <Text style={styles.cartEmoji}>{item.emoji || '🍽️'}</Text>
        <View style={styles.cartInfo}>
          <Text style={styles.cartName}>{item.name}</Text>
          <Text style={styles.cartPrice}>₹{item.price} × {item.qty}</Text>
        </View>
        <View style={styles.qtyControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.id)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem(item)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtotal}>₹{(item.price * item.qty).toFixed(0)}</Text>
        <TouchableOpacity
          onPress={() => setEditingId(editingId === item.id ? null : item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 16 }}>✏️</Text>
        </TouchableOpacity>
      </View>
      {editingId === item.id && (
        <TextInput
          style={styles.noteInput}
          value={items[item.id]?.specialRequest || ''}
          onChangeText={text => updateSpecialRequest(item.id, text)}
          placeholder="Special request (e.g. no onions, extra spicy)..."
          placeholderTextColor={colors.textLight}
          onBlur={() => setEditingId(null)}
          autoFocus
        />
      )}
      {editingId !== item.id && !!items[item.id]?.specialRequest && (
        <Text style={styles.notePreview}>📝 {items[item.id].specialRequest}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.itemCount}>{cartList.length} item{cartList.length > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={cartList}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        extraData={items}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bill}>
        <Text style={styles.billTitle}>Bill Details</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Total</Text>
          <Text style={styles.billValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <Text style={[styles.billValue, deliveryFee === 0 && { color: colors.success }]}>
            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
          </Text>
        </View>
        {deliveryFee > 0 && (
          <Text style={styles.freeDeliveryHint}>
            Add ₹{(200 - totalAmount).toFixed(0)} more for free delivery
          </Text>
        )}
        <View style={[styles.billRow, styles.billTotal]}>
          <Text style={styles.totalLabel}>To Pay</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
        <Text style={styles.checkoutBtnText}>
          {auth.currentUser ? 'Proceed to Checkout' : 'Sign In to Checkout'}
        </Text>
        <Text style={styles.checkoutAmount}>₹{grandTotal.toFixed(2)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.background },
  emptyIcon: { fontSize: 72 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 6 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: colors.primary,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.white },
  itemCount: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  list: { padding: 12 },
  itemWrapper: { marginBottom: 8 },
  cartItem: {
    backgroundColor: colors.white, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  cartEmoji: { fontSize: 28 },
  cartInfo: { flex: 1 },
  cartName: { fontSize: 15, fontWeight: '600', color: colors.text },
  cartPrice: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8, overflow: 'hidden',
  },
  qtyBtn: { backgroundColor: colors.primary, paddingHorizontal: 9, paddingVertical: 4 },
  qtyBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  qtyText: { paddingHorizontal: 10, fontWeight: '700', color: colors.text, fontSize: 13 },
  subtotal: { fontSize: 15, fontWeight: 'bold', color: colors.text, minWidth: 42, textAlign: 'right' },
  noteInput: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13, color: colors.text, marginTop: 4,
  },
  notePreview: { fontSize: 12, color: colors.textLight, marginTop: 4, paddingLeft: 4 },
  bill: {
    backgroundColor: colors.white, margin: 12, borderRadius: 14, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  billTitle: { fontSize: 13, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billLabel: { fontSize: 14, color: colors.text },
  billValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  freeDeliveryHint: { fontSize: 12, color: colors.secondary, marginBottom: 6 },
  billTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  checkoutBtn: {
    backgroundColor: colors.primary, margin: 12, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  checkoutBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  checkoutAmount: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
});
