import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { collection, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { colors } from '../../theme';

export default function MenuManagementScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'menu'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      setItems(data);
      setLoading(false);
    });
  }, []);

  const toggleAvailable = async (item) => {
    await updateDoc(doc(db, 'menu', item.id), { available: !item.available });
  };

  const confirmDelete = (item) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from the menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDoc(doc(db, 'menu', item.id)),
        },
      ],
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{item.emoji || '🍽️'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>₹{item.price}  •  {item.category || 'Uncategorised'}</Text>
        {!!item.description && (
          <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <Switch
          value={!!item.available}
          onValueChange={() => toggleAvailable(item)}
          trackColor={{ false: colors.border, true: colors.success + '80' }}
          thumbColor={item.available ? colors.success : colors.textLight}
        />
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddMenuItem', { item })}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item)}>
          <Text style={styles.deleteBtn}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddMenuItem', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.addBtnText}>+ Add New Item</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>No menu items yet</Text>
          <Text style={styles.emptySub}>Tap "Add New Item" to start building your menu</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addBtn: {
    margin: 16, backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  addBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  emojiBox: {
    width: 50, height: 50, borderRadius: 10,
    backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  desc: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  actions: { alignItems: 'center', gap: 4 },
  editBtn: {
    borderWidth: 1, borderColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
  },
  editBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  deleteBtn: { fontSize: 18, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.textLight, textAlign: 'center', marginTop: 6 },
});
