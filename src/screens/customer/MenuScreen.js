import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useCart } from '../../context/CartContext';
import { useFavourites } from '../../context/FavouritesContext';
import { colors } from '../../theme';

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { items, totalItems, totalAmount, addItem, removeItem } = useCart();
  const { isFavourite, toggleFavourite } = useFavourites();

  useEffect(() => {
    const q = query(collection(db, 'menu'), where('available', '==', true));
    return onSnapshot(q, (snap) => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const categories = ['All', 'Favourites', ...new Set(menuItems.map(i => i.category).filter(Boolean))];

  const filtered = menuItems.filter(item => {
    if (selectedCategory === 'Favourites') return isFavourite(item.id);
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const renderItem = ({ item }) => {
    const qty = items[item.id]?.qty || 0;
    const fav = isFavourite(item.id);
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemImageBox}>
          {item.imageUrl
            ? <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            : <Text style={styles.itemEmojiText}>{item.emoji || '🍽️'}</Text>
          }
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleFavourite(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 18 }}>{fav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
          {!!item.description && (
            <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
          )}
          <View style={styles.itemFooter}>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
            {qty === 0 ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item)} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>+ ADD</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.id)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem(item)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerTitle}>🍴 Balcony Aroma</Text>
          <Text style={styles.bannerSub}>Street Food & Snacks • 20–30 min</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ 4.5</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search for dishes..."
        placeholderTextColor={colors.textLight}
        clearButtonMode="while-editing"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catRow}
        contentContainerStyle={styles.catContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
              {cat === 'Favourites' ? '❤️ Favourites' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>
            {selectedCategory === 'Favourites' ? '❤️' : menuItems.length === 0 ? '🍽️' : '🔍'}
          </Text>
          <Text style={styles.emptyTitle}>
            {selectedCategory === 'Favourites'
              ? 'No favourites yet'
              : menuItems.length === 0 ? 'Menu coming soon!' : 'No items found'}
          </Text>
          <Text style={styles.emptySub}>
            {selectedCategory === 'Favourites'
              ? 'Tap ❤️ on any item to save it here'
              : menuItems.length === 0
                ? 'The admin is setting up the menu. Check back soon!'
                : 'Try a different search or category'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarCount}>{totalItems} item{totalItems > 1 ? 's' : ''} added</Text>
            <Text style={styles.cartBarAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <Text style={styles.cartBarCta}>View Cart →</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  bannerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.white },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  ratingBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  ratingText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  search: {
    margin: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  catRow: { maxHeight: 48 },
  catContent: { paddingHorizontal: 12, gap: 8, paddingVertical: 4 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, fontWeight: '500', color: colors.textLight },
  catTextActive: { color: colors.white, fontWeight: '700' },
  list: { padding: 12, paddingBottom: 90 },
  itemCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', gap: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  itemImageBox: {
    width: 64, height: 64, borderRadius: 12,
    backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: { width: 64, height: 64 },
  itemEmojiText: { fontSize: 34 },
  itemInfo: { flex: 1 },
  itemNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  itemDesc: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  addBtn: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8, overflow: 'hidden',
  },
  qtyBtn: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5 },
  qtyBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  qtyText: { paddingHorizontal: 12, fontWeight: '700', color: colors.text, fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.primary, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  cartBarCount: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  cartBarAmount: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  cartBarCta: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
