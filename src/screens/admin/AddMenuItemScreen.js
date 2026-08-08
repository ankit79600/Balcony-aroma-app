import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { colors } from '../../theme';

const CATEGORIES = ['Snacks', 'Main Course', 'Beverages', 'Combos', 'Desserts'];

export default function AddMenuItemScreen({ route, navigation }) {
  const existing = route.params?.item;
  const [form, setForm] = useState({
    name: existing?.name || '',
    emoji: existing?.emoji || '',
    category: existing?.category || '',
    price: existing?.price?.toString() || '',
    description: existing?.description || '',
    available: existing?.available !== undefined ? existing.available : true,
  });
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl || '');
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.category) {
      Alert.alert('Missing Fields', 'Please fill in the name, category, and price.');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        emoji: form.emoji.trim() || '🍽️',
        category: form.category,
        price,
        description: form.description.trim(),
        available: form.available,
        imageUrl: imageUrl.trim(),
      };

      if (existing) {
        await updateDoc(doc(db, 'menu', existing.id), { ...payload, updatedAt: serverTimestamp() });
        Alert.alert('Updated!', `"${payload.name}" has been updated.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'menu'), payload);
        Alert.alert('Added!', `"${payload.name}" is now on the menu.`, [
          { text: 'Add Another', onPress: () => { setForm({ name: '', emoji: '', category: '', price: '', description: '', available: true }); setImageUrl(''); } },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Field label="Food Image URL (optional)">
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://... (paste image link from Imgur etc.)"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="url"
          />
          {!!imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              onError={() => {}}
            />
          )}
        </Field>

        <Field label="Item Name *">
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={v => set('name', v)}
            placeholder="e.g. Vada Pav"
            placeholderTextColor={colors.textLight}
          />
        </Field>

        <Field label="Emoji (shown if no photo)">
          <TextInput
            style={styles.input}
            value={form.emoji}
            onChangeText={v => set('emoji', v)}
            placeholder="🥪"
            placeholderTextColor={colors.textLight}
          />
        </Field>

        <Field label="Category *">
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, form.category === cat && styles.catChipActive]}
                onPress={() => set('category', cat)}
              >
                <Text style={[styles.catChipText, form.category === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={form.category}
            onChangeText={v => set('category', v)}
            placeholder="Or type a custom category..."
            placeholderTextColor={colors.textLight}
          />
        </Field>

        <Field label="Price (₹) *">
          <TextInput
            style={styles.input}
            value={form.price}
            onChangeText={v => set('price', v)}
            placeholder="0.00"
            placeholderTextColor={colors.textLight}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Description">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.description}
            onChangeText={v => set('description', v)}
            placeholder="Short description (optional)"
            placeholderTextColor={colors.textLight}
            multiline
          />
        </Field>

        <View style={styles.availableRow}>
          <View>
            <Text style={styles.availableLabel}>Available Now</Text>
            <Text style={styles.availableSub}>Show this item to customers</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, form.available && styles.toggleOn]}
            onPress={() => set('available', !form.available)}
          >
            <View style={[styles.toggleDot, form.available && styles.toggleDotOn]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.saveBtnText}>{existing ? 'Update Item' : 'Add to Menu'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, fontSize: 15, color: colors.text,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  previewImage: { width: '100%', height: 160, resizeMode: 'cover', borderRadius: 10, marginTop: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 13, color: colors.textLight, fontWeight: '500' },
  catChipTextActive: { color: colors.white, fontWeight: '700' },
  availableRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 20,
  },
  availableLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  availableSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  toggle: {
    width: 48, height: 26, borderRadius: 13,
    backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: colors.success },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  toggleDotOn: { alignSelf: 'flex-end' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 17, alignItems: 'center', marginBottom: 48,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
});
