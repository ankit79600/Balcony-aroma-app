import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState({});

  const addItem = (item) => {
    setItems(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        qty: (prev[item.id]?.qty || 0) + 1,
        specialRequest: prev[item.id]?.specialRequest || '',
      },
    }));
  };

  const removeItem = (itemId) => {
    setItems(prev => {
      if (!prev[itemId] || prev[itemId].qty <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...prev[itemId], qty: prev[itemId].qty - 1 } };
    });
  };

  const updateSpecialRequest = (itemId, text) => {
    setItems(prev =>
      prev[itemId] ? { ...prev, [itemId]: { ...prev[itemId], specialRequest: text } } : prev
    );
  };

  const addReorderItems = (orderItems) => {
    setItems(prev => {
      const next = { ...prev };
      orderItems.forEach(item => {
        next[item.id] = {
          ...item,
          qty: (next[item.id]?.qty || 0) + item.qty,
          specialRequest: next[item.id]?.specialRequest || '',
        };
      });
      return next;
    });
  };

  const clearCart = () => setItems({});

  const cartList = Object.values(items);
  const totalItems = cartList.reduce((s, i) => s + i.qty, 0);
  const totalAmount = cartList.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, cartList, totalItems, totalAmount,
      addItem, removeItem, clearCart, updateSpecialRequest, addReorderItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
