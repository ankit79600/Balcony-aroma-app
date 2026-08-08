import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavouritesContext = createContext(null);
const STORAGE_KEY = '@balcony_favourites';

export function FavouritesProvider({ children }) {
  const [favouriteIds, setFavouriteIds] = useState(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setFavouriteIds(new Set(JSON.parse(val)));
    });
  }, []);

  const toggleFavourite = (itemId) => {
    setFavouriteIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const isFavourite = (itemId) => favouriteIds.has(itemId);

  return (
    <FavouritesContext.Provider value={{ favouriteIds, toggleFavourite, isFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export const useFavourites = () => useContext(FavouritesContext);
