// Recently Viewed Products Hook
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

const RECENTLY_VIEWED_KEY = '@restartuz_recently_viewed';
const MAX_RECENT_ITEMS = 20;

interface RecentItem {
  productId: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        const items: RecentItem[] = JSON.parse(stored);
        // Sort by most recent and extract IDs
        const ids = items
          .sort((a, b) => b.viewedAt - a.viewedAt)
          .map(item => item.productId);
        setRecentIds(ids);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecentlyViewed = useCallback(async (productId: string) => {
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      let items: RecentItem[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists
      items = items.filter(item => item.productId !== productId);

      // Add to beginning
      items.unshift({
        productId,
        viewedAt: Date.now(),
      });

      // Keep only MAX_RECENT_ITEMS
      items = items.slice(0, MAX_RECENT_ITEMS);

      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
      setRecentIds(items.map(item => item.productId));
    } catch (error) {
      console.error('Error adding recently viewed:', error);
    }
  }, []);

  const clearRecentlyViewed = async () => {
    try {
      await AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
      setRecentIds([]);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  };

  return {
    recentIds,
    loading,
    addRecentlyViewed,
    clearRecentlyViewed,
  };
}
