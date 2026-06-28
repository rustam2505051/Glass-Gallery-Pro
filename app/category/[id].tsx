// RestArtuz - Premium Category Products Screen
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLanguage, useMLText } from '@/src/contexts/LanguageContext';
import { useFavorites } from '@/src/hooks/useFavorites';
import { usePaginatedFirestore, useFirestoreCollection } from '@/src/hooks/useFirestore';
import { Product, Category } from '@/src/types';
import { ProductCard } from '@/src/components/ProductCard';
import { Loading } from '@/src/components/Loading';
import { EmptyState } from '@/src/components/EmptyState';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/src/constants/theme';
import { where } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const numColumns = 2;

export default function CategoryProductsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const getMLText = useMLText();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');

  // Load category from Firebase ONLY - no demo fallback
  const { data: categories } = useFirestoreCollection<Category>('categories', []);
  const category = categories.find((c) => c.id === id);

  // Load products - simple query without orderBy to avoid composite index requirement
  // Sort client-side instead
  const { data: rawProducts, loading, hasMore, loadMore, refresh } = usePaginatedFirestore<Product>(
    'products',
    [
      where('categoryId', '==', id),
    ],
    50 // Load more at once since we sort client-side
  );

  // Sort by createdAt descending client-side
  const products = useMemo(() => {
    return [...rawProducts].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawProducts]);

  // Use ONLY Firebase data - filter active manually
  const displayProducts = products.filter(p => p.isActive !== false);

  // Filter by search
  const filteredProducts = searchQuery
    ? displayProducts.filter((p) => {
        const name = getMLText(p.name).toLowerCase();
        const code = p.code.toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || code.includes(query);
      })
    : displayProducts;

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity 
        style={styles.loadMoreButton} 
        onPress={loadMore} 
        disabled={loading}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[Colors.surfaceLight, Colors.surface]}
          style={styles.loadMoreGradient}
        >
          <Text style={styles.loadMoreText}>
            {loading ? 'Loading...' : 'Load More'}
          </Text>
          {!loading && <Ionicons name="chevron-down" size={18} color={Colors.primary} />}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Category Hero */}
      {category && (
        <View style={styles.heroContainer}>
          {category.imageUrl && (
            <Image
              source={{ uri: category.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          )}
          <LinearGradient
            colors={['rgba(5, 5, 5, 0.3)', 'rgba(5, 5, 5, 0.7)', 'rgba(5, 5, 5, 0.95)']}
            locations={[0, 0.5, 1]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <View style={styles.goldAccent} />
            <Text style={styles.heroTitle}>{getMLText(category.name)}</Text>
            {category.description && (
              <Text style={styles.heroDescription}>{getMLText(category.description)}</Text>
            )}
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Ionicons name="cube-outline" size={16} color={Colors.primary} />
                <Text style={styles.heroStatText}>
                  {filteredProducts.length} Products
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIconBg}>
            <Ionicons name="search" size={18} color={Colors.primary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchProducts')}
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results info */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          {searchQuery && ` matching "${searchQuery}"`}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
            <HeaderContent 
              router={router} 
              title={category ? getMLText(category.name) : t('products')} 
            />
          </BlurView>
        ) : (
          <View style={[styles.headerBlur, styles.headerAndroid]}>
            <HeaderContent 
              router={router} 
              title={category ? getMLText(category.name) : t('products')} 
            />
          </View>
        )}
      </Animated.View>

      {loading && displayProducts.length === 0 ? (
        <View style={{ paddingTop: insets.top + 60 }}>
          <Loading message={t('loading')} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={{ paddingTop: insets.top + 60 }}>
          <EmptyState
            icon={searchQuery ? 'search-outline' : 'cube-outline'}
            title={searchQuery ? t('noResults') : 'No products'}
            message={searchQuery ? 'Try a different search term' : 'Products will appear here'}
          />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
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
          contentContainerStyle={[styles.list, { paddingTop: insets.top + 60 }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// Header Content Component
function HeaderContent({ router, title }: { router: any; title: string }) {
  return (
    <View style={styles.headerContent}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    overflow: 'hidden',
  },
  headerAndroid: {
    backgroundColor: Colors.glass,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  heroContainer: {
    height: 220,
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  goldAccent: {
    width: 40,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  heroDescription: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  heroStatText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    ...Typography.body1,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  resultsRow: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginBottom: 0,
  },
  loadMoreButton: {
    marginVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  loadMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  loadMoreText: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '600',
  },
});
