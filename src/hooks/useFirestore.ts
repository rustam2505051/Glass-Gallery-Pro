// Enhanced Firestore Hooks for RestArtuz
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types
interface FirestoreState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

interface PaginatedState<T> extends FirestoreState<T> {
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Convert Firestore document to typed object
function convertDoc<T>(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): T & { id: string } {
  const data = doc.data();
  if (!data) return { id: doc.id } as T & { id: string };
  
  // Convert Firestore Timestamps to Date objects
  const converted = Object.entries(data).reduce((acc, [key, value]) => {
    if (value instanceof Timestamp) {
      acc[key] = value.toDate();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested objects that might contain timestamps
      acc[key] = Object.entries(value).reduce((nestedAcc, [nestedKey, nestedValue]) => {
        if (nestedValue instanceof Timestamp) {
          nestedAcc[nestedKey] = nestedValue.toDate();
        } else {
          nestedAcc[nestedKey] = nestedValue;
        }
        return nestedAcc;
      }, {} as any);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
  
  return { ...converted, id: doc.id } as T & { id: string };
}

/**
 * Real-time Firestore Collection Hook
 * Subscribes to collection changes and updates in real-time
 */
export function useFirestoreCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  enabled: boolean = true
): FirestoreState<T> {
  const [state, setState] = useState<FirestoreState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !db) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const collectionRef = collection(db, collectionName);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : query(collectionRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(doc => convertDoc<T>(doc));
          setState({ data: items, loading: false, error: null });
        },
        (error) => {
          console.error(`Firestore error in ${collectionName}:`, error);
          setState(prev => ({ ...prev, loading: false, error: error as Error }));
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error(`Firestore setup error in ${collectionName}:`, error);
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
    }
  }, [collectionName, enabled, JSON.stringify(constraints.map(c => c.toString()))]);

  return state;
}

/**
 * Single Document Hook with Real-time Updates
 */
export function useFirestoreDoc<T>(
  collectionName: string,
  docId: string | undefined,
  enabled: boolean = true
): { data: T | null; loading: boolean; error: Error | null } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: Error | null }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !docId || !db) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const docRef = doc(db, collectionName, docId);
      
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const item = convertDoc<T>(snapshot);
            setState({ data: item, loading: false, error: null });
          } else {
            setState({ data: null, loading: false, error: null });
          }
        },
        (error) => {
          console.error(`Firestore doc error:`, error);
          setState(prev => ({ ...prev, loading: false, error: error as Error }));
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error(`Firestore doc setup error:`, error);
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
    }
  }, [collectionName, docId, enabled]);

  return state;
}

/**
 * Paginated Firestore Collection Hook
 * Supports infinite scroll with load more functionality
 */
export function usePaginatedFirestore<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  pageSize: number = 20,
  enabled: boolean = true
): PaginatedState<T> {
  const [state, setState] = useState<FirestoreState<T>>({
    data: [],
    loading: true,
    error: null,
  });
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const isLoadingMore = useRef(false);

  const loadInitial = useCallback(async () => {
    if (!enabled || !db) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    lastDocRef.current = null;

    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...constraints, limit(pageSize));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => convertDoc<T>(doc));
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
      setHasMore(snapshot.docs.length >= pageSize);
      setState({ data: items, loading: false, error: null });
    } catch (error) {
      console.error(`Paginated firestore error:`, error);
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
    }
  }, [collectionName, enabled, pageSize, JSON.stringify(constraints.map(c => c.toString()))]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore.current || !lastDocRef.current || !db) return;

    isLoadingMore.current = true;

    try {
      const collectionRef = collection(db, collectionName);
      const q = query(
        collectionRef,
        ...constraints,
        startAfter(lastDocRef.current),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => convertDoc<T>(doc));
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || lastDocRef.current;
      setHasMore(snapshot.docs.length >= pageSize);
      setState(prev => ({ ...prev, data: [...prev.data, ...items] }));
    } catch (error) {
      console.error(`Load more error:`, error);
      setState(prev => ({ ...prev, error: error as Error }));
    } finally {
      isLoadingMore.current = false;
    }
  }, [collectionName, constraints, hasMore, pageSize]);

  const refresh = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return { ...state, hasMore, loadMore, refresh };
}

/**
 * Hook to fetch Home Page sections dynamically
 */
export function useHomeSections() {
  return useFirestoreCollection<{
    id: string;
    title: { uz: string; ru: string; en: string };
    type: string;
    categoryId?: string;
    order: number;
    limit: number;
    icon: string;
    isActive: boolean;
    showSeeAll: boolean;
  }>('homeSections', [
    where('isActive', '==', true),
    orderBy('order', 'asc'),
  ]);
}

/**
 * Hook to fetch Banners
 */
export function useBanners() {
  return useFirestoreCollection<{
    id: string;
    imageUrl: string;
    title?: { uz: string; ru: string; en: string };
    subtitle?: { uz: string; ru: string; en: string };
    linkType: string;
    linkId?: string;
    linkUrl?: string;
    order: number;
    isActive: boolean;
  }>('banners', [
    where('isActive', '==', true),
    orderBy('order', 'asc'),
  ]);
}

/**
 * Hook to fetch App Settings
 */
export function useAppSettings() {
  return useFirestoreDoc<{
    companyName: { uz: string; ru: string; en: string };
    companyDescription?: { uz: string; ru: string; en: string };
    whatsappNumber: string;
    whatsappLink: string;
    telegramUsername: string;
    telegramLink: string;
    phoneNumbers: string[];
    email: string;
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    enablePricing: boolean;
    enableSharing: boolean;
    enableFavorites: boolean;
  }>('settings', 'app');
}

export default {
  useFirestoreCollection,
  useFirestoreDoc,
  usePaginatedFirestore,
  useHomeSections,
  useBanners,
  useAppSettings,
};
