// Analytics Utilities (for Phase 2 expansion)
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';

export class AnalyticsService {
  /**
   * Track product view
   */
  static async trackProductView(productId: string, userId?: string) {
    if (!db) return;
    
    try {
      // Increment product view count
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        viewCount: increment(1),
        lastViewedAt: serverTimestamp(),
      });

      // Track in recently viewed (if user exists)
      if (userId) {
        await addDoc(collection(db, 'recentlyViewed'), {
          userId,
          productId,
          viewedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }

  /**
   * Track search query
   */
  static async trackSearch(query: string, resultsCount: number, language: string) {
    if (!db) return;
    
    try {
      await addDoc(collection(db, 'searchQueries'), {
        query: query.toLowerCase(),
        resultsCount,
        language,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }

  /**
   * Track product share
   */
  static async trackProductShare(productId: string) {
    if (!db) return;
    
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        shareCount: increment(1),
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  }

  /**
   * Track favorite toggle
   */
  static async trackFavoriteToggle(productId: string, isAdding: boolean) {
    if (!db) return;
    
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        favoriteCount: increment(isAdding ? 1 : -1),
      });
    } catch (error) {
      console.error('Failed to track favorite:', error);
    }
  }
}
