import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { theme } from '../../src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminTranslation } from '../../src/utils/adminTranslations';

interface DashboardStats {
  products: number;
  categories: number;
  banners: number;
  users: number;
  orders: number;
}

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  count?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useAdminTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    categories: 0,
    banners: 0,
    users: 0,
    orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [productsSnap, categoriesSnap, bannersSnap, usersSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'banners')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'orders')),
      ]);

      setStats({
        products: productsSnap.size,
        categories: categoriesSnap.size,
        banners: bannersSnap.size,
        users: usersSnap.size,
        orders: ordersSnap.size,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const menuItems: MenuItem[] = [
    { title: t('products'), icon: 'cube-outline', route: '/admin/products', color: '#4CAF50', count: stats.products },
    { title: t('categories'), icon: 'grid-outline', route: '/admin/categories', color: '#2196F3', count: stats.categories },
    { title: t('banners'), icon: 'images-outline', route: '/admin/banners', color: '#FF9800', count: stats.banners },
    { title: t('users'), icon: 'people-outline', route: '/admin/users', color: '#9C27B0', count: stats.users },
    { title: t('orders'), icon: 'receipt-outline', route: '/admin/orders', color: '#F44336', count: stats.orders },
    { title: 'Contacts', icon: 'call-outline', route: '/admin/contact-settings', color: '#00BCD4', count: undefined },
    { title: t('settings'), icon: 'settings-outline', route: '/admin/settings', color: '#607D8B', count: undefined },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>{t('overview')}</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#4CAF5020' }]}>
            <Ionicons name="cube" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.products}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#2196F320' }]}>
            <Ionicons name="grid" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.categories}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F4433620' }]}>
            <Ionicons name="receipt" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#9C27B020' }]}>
            <Ionicons name="people" size={32} color="#9C27B0" />
            <Text style={styles.statNumber}>{stats.users}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Management</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.count !== undefined && (
                <Text style={styles.menuCount}>{item.count} items</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Back to App */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/')}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
        <Text style={styles.backButtonText}>Back to App</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  menuContainer: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  menuCount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 8,
  },
});
