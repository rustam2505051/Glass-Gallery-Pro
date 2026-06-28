// RestArtuz - Premium Favorites Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useFavorites } from '@/src/hooks/useFavorites';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { Product } from '@/src/types';
import { ProductCard } from '@/src/components/ProductCard';
import { Loading } from '@/src/components/Loading';
import { EmptyState } from '@/src/components/EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/src/constants/theme';

const { width } = Dimensions.get('window');
const numColumns = 2;

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { favorites, loading: favLoading, toggleFavorite, isFavorite, clearFavorites } = useFavorites();
  const { data: allProducts } = useFirestoreCollection<Product>('products');

  // Use ONLY Firebase data - no demo fallbacks
  const favoriteProducts = allProducts.filter((p) => favorites.includes(p.id));

  if (favLoading) {
    return <Loading message={t('loading')} />;
  }

  const renderHeader = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Page Title */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>{t('favorites')}</Text>
            <Text style={styles.pageSubtitle}>Your saved products</Text>
          </View>
          {favoriteProducts.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearFavorites}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Card */}
      {favoriteProducts.length > 0 && (
        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsCard}
        >
          <LinearGradient
            colors={[Colors.surfaceLight, Colors.surface]}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <View style={styles.statIconBg}>
                <Ionicons name="heart" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{favoriteProducts.length}</Text>
              <Text style={styles.statLabel}>Saved Items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconBg}>
                <Ionicons name="grid" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>
                {[...new Set(favoriteProducts.map(p => p.categoryId))].length}
              </Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </Animated.View>
  );

  if (favoriteProducts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.headerTitle}>RestArtuz</Text>
          <View style={{ width: 40 }} />
        </View>

        <EmptyState
          icon="heart-outline"
          title={t('favorites')}
          message="Start adding products to your favorites to see them here"
          actionLabel="Browse Products"
          onAction={() => router.push('/(tabs)/categories')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <Text style={styles.headerTitle}>RestArtuz</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={favoriteProducts}
        renderItem={({ item, index }) => (
          <View style={styles.cardWrapper}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              onFavoritePress={() => toggleFavorite(item.id)}
              isFavorite={isFavorite(item.id)}
              index={index}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.background,
  },
  headerTitle: {
    flex: 1,
    ...Typography.h4,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontWeight: '700',
  },
  titleSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  pageSubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  clearText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  statsGradient: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginBottom: 0,
  },
});
