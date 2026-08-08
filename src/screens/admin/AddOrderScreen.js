import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { colors } from '../../theme';

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  items: '',
  totalAmount: '',
  notes: '',
};

export default function AddOrderScreen({ navigation }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const nextOrderNumber = async () => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return 'BA-0001';
    const last = snap.docs[0].data().orderNumber || 'BA-0000';
    const num = parseInt(last.split('-')[1] || '0') + 1;
    return `BA-${String(num).padStart(4, '0')}`;
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.items.trim()) {
      Alert.alert('Required Fields Missing', 'Please fill in customer name, phone, and items ordered.');
      return;
    }
    setLoading(true);
    try {
      const orderNumber = await nextOrderNumber();
      await addDoc(collection(db, 'orders'), {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerAddress: form.customerAddress.trim(),
        items: form.items.trim(),
        totalAmount: parseFloat(form.totalAmount) || 0,
        notes: form.notes.trim(),
        orderNumber,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Order Created! 🎉', `Order ${orderNumber} has been added.`, [
        {
          text: 'View Orders',
          onPress: () => {
            setForm(EMPTY_FORM);
            navigation.navigate('Orders');
          },
        },
        { text: 'Add Another', onPress: () => setForm(EMPTY_FORM) },
      ]);
    } catch {
      Alert.alert('Error', 'Could not create the order. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <SectionLabel>Customer Information</SectionLabel>

        <Field label="Customer Name *">
          <TextInput
            style={styles.input}
            value={form.customerName}
            onChangeText={v => set('customerName', v)}
            placeholder="Full name"
            placeholderTextColor={colors.textLight}
          />
        </Field>

        <Field label="Phone Number *">
          <TextInput
            style={styles.input}
            value={form.customerPhone}
            onChangeText={v => set('customerPhone', v)}
            placeholder="+91 XXXXX XXXXX"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Delivery Address">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.customerAddress}
            onChangeText={v => set('customerAddress', v)}
            placeholder="Street, City, PIN"
            placeholderTextColor={colors.textLight}
            multiline
          />
        </Field>

        <SectionLabel>Order Details</SectionLabel>

        <Field label="Items Ordered *">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.items}
            onChangeText={v => set('items', v)}
            placeholder="e.g. Rose plant x2, Jasmine x1, Lavender x3"
            placeholderTextColor={colors.textLight}
            multiline
          />
        </Field>

        <Field label="Total Amount (₹)">
          <TextInput
            style={styles.input}
            value={form.totalAmount}
            onChangeText={v => set('totalAmount', v)}
            placeholder="0.00"
            placeholderTextColor={colors.textLight}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Notes / Instructions">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.notes}
            onChangeText={v => set('notes', v)}
            placeholder="Payment method, special requests, etc."
            placeholderTextColor={colors.textLight}
            multiline
          />
        </Field>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.buttonText}>Create Order</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 5 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: colors.text,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 48,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
