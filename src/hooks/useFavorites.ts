// Enhanced Favorites Hook with Firestore sync
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AnalyticsService } from '../utils/analytics';

const FAVORITES_KEY = '@restartuz_favorites';

export function useFavorites(userId?: string) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      // Load from local storage first
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }

      // If user is logged in and Firebase is available, sync from Firestore
      if (userId && db) {
        const q = query(
          collection(db, 'favorites'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const cloudFavorites = snapshot.docs.map((doc) => doc.data().productId);
        
        // Merge with local favorites
        const merged = Array.from(new Set([...cloudFavorites, ...(stored ? JSON.parse(stored) : [])]));
        setFavorites(merged);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (productId: string) => {
    try {
      const isCurrentlyFavorite = favorites.includes(productId);
      const newFavorites = isCurrentlyFavorite
        ? favorites.filter((id) => id !== productId)
        : [...favorites, productId];

      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));

      // Sync to Firestore if user is logged in
      if (db) {
        if (isCurrentlyFavorite) {
          // Remove from Firestore
          const q = query(
            collection(db, 'favorites'),
            where('productId', '==', productId),
            where('userId', '==', userId || 'anonymous')
          );
          const snapshot = await getDocs(q);
          snapshot.docs.forEach(async (docSnapshot) => {
            await deleteDoc(doc(db, 'favorites', docSnapshot.id));
          });
        } else {
          // Add to Firestore
          await addDoc(collection(db, 'favorites'), {
            userId: userId || 'anonymous',
            productId,
            createdAt: new Date(),
          });
        }

        // Track analytics
        await AnalyticsService.trackFavoriteToggle(productId, !isCurrentlyFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [favorites, userId]);

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  const clearFavorites = async () => {
    try {
      setFavorites([]);
      await AsyncStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}
