// RestArtuz - Premium Home Screen with Dynamic Firebase Data
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

import { useLanguage, useMLText } from '@/src/contexts/LanguageContext';
import { useFirestoreCollection, useBanners, useHomeSections } from '@/src/hooks/useFirestore';
import { useFavorites } from '@/src/hooks/useFavorites';
import { Category, Product, Banner } from '@/src/types';
import { ProductCard } from '@/src/components/ProductCard';
import { CategoryCard } from '@/src/components/CategoryCard';
import { BannerCarousel } from '@/src/components/BannerCarousel';
import { SearchBar } from '@/src/components/SearchBar';
import { SectionHeader } from '@/src/components/SectionHeader';
import { Loading } from '@/src/components/Loading';
import { EmptyState } from '@/src/components/EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/src/constants/theme';
import { orderBy, limit, where } from 'firebase/firestore';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const getMLText = useMLText();
  const [refreshing, setRefreshing] = useState(false);

  // Firebase data hooks - NO DEMO FALLBACKS
  const { data: banners, loading: bannersLoading } = useBanners();
  const { data: homeSections, loading: sectionsLoading } = useHomeSections();
  
  const { data: categories, loading: categoriesLoading } = useFirestoreCollection<Category>('categories', [
    orderBy('order', 'asc'),
    limit(8),
  ]);

  const { data: allProducts, loading: productsLoading } = useFirestoreCollection<Product>('products', []);

  const { toggleFavorite, isFavorite } = useFavorites();

  // Use ONLY Firebase data - filter active items manually
  const displayBanners = banners.filter(b => b.isActive !== false);
  const displayCategories = categories.filter(c => c.isActive !== false);
  const displayProducts = allProducts.filter(p => p.isActive !== false);
  
  // Filter products for different sections
  const featuredProducts = useMemo(() => 
    displayProducts.filter(p => p.isFeatured).slice(0, 6), 
    [displayProducts]
  );
  const newProducts = useMemo(() => 
    displayProducts.filter(p => p.isNew).slice(0, 6), 
    [displayProducts]
  );
  const popularProducts = useMemo(() => 
    [...displayProducts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 6), 
    [displayProducts]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleBannerPress = (banner: Banner) => {
    if (banner.linkType === 'category' && banner.linkId) {
      router.push(`/category/${banner.linkId}`);
    } else if (banner.linkType === 'product' && banner.linkId) {
      router.push(`/product/${banner.linkId}`);
    }
  };

  // Get products for a dynamic section
  const getProductsForSection = useCallback((section: any) => {
    switch (section.type) {
      case 'featured_products':
        return featuredProducts.slice(0, section.limit || 6);
      case 'new_arrivals':
        return newProducts.slice(0, section.limit || 6);
      case 'popular_products':
        return popularProducts.slice(0, section.limit || 6);
      case 'category_products':
        return displayProducts
          .filter(p => p.categoryId === section.categoryId)
          .slice(0, section.limit || 6);
      case 'custom_products':
        // For custom products, you would filter by specific IDs
        return displayProducts.slice(0, section.limit || 6);
      default:
        return [];
    }
  }, [featuredProducts, newProducts, popularProducts, displayProducts]);

  // Render dynamic section
  const renderDynamicSection = (section: any, index: number) => {
    if (section.type === 'categories') {
      return (
        <View key={section.id} style={styles.section}>
          <SectionHeader
            title={getMLText(section.title)}
            icon={section.icon}
            showSeeAll={section.showSeeAll}
            onSeeAll={() => router.push('/(tabs)/categories')}
            delay={300 + index * 100}
          />
          <FlatList
            data={displayCategories.slice(0, section.limit || 8)}
            renderItem={({ item, index: idx }) => (
              <CategoryCard
                category={item}
                onPress={() => router.push(`/category/${item.id}`)}
                getMLText={getMLText}
                index={idx}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      );
    }

    const products = getProductsForSection(section);
    if (products.length === 0) return null;

    return (
      <View key={section.id} style={styles.section}>
        <SectionHeader
          title={getMLText(section.title)}
          icon={section.icon}
          showSeeAll={section.showSeeAll}
          onSeeAll={() => {
            if (section.categoryId) {
              router.push(`/category/${section.categoryId}`);
            } else {
              router.push('/(tabs)/categories');
            }
          }}
          delay={300 + index * 100}
        />
        <FlatList
          data={products}
          renderItem={({ item, index: idx }) => (
            <View style={styles.productWrapper}>
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                onFavoritePress={() => toggleFavorite(item.id)}
                isFavorite={isFavorite(item.id)}
                showNewBadge={section.type === 'new_arrivals'}
                index={idx}
              />
            </View>
          )}
          keyExtractor={(item) => `${section.id}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    );
  };

  // Render content with dynamic sections from Firebase ONLY
  const renderContent = () => {
    const hasFirebaseSections = homeSections.length > 0;
    const hasCategories = displayCategories.length > 0;
    const hasProducts = displayProducts.length > 0;
    const hasBanners = displayBanners.length > 0;

    return (
      <View style={styles.content}>
        {/* Hero Banner Carousel - Only if banners exist */}
        {hasBanners && (
          <Animated.View entering={FadeIn.delay(200).duration(600)}>
            <BannerCarousel
              banners={displayBanners}
              onBannerPress={handleBannerPress}
              getMLText={getMLText}
            />
          </Animated.View>
        )}

        {/* Search Bar */}
        <SearchBar
          placeholder={t('searchProducts')}
          onPress={() => router.push('/(tabs)/categories')}
          onFilterPress={() => {}}
        />

        {/* Dynamic Sections from Firebase */}
        {hasFirebaseSections ? (
          homeSections.map((section, index) => renderDynamicSection(section, index))
        ) : (
          // Show sections based on Firebase data - NO DEMO FALLBACK
          <>
            {/* Categories Section - Only Firebase categories */}
            {hasCategories && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('categories')}
                  subtitle="Shop by collection"
                  showSeeAll
                  onSeeAll={() => router.push('/(tabs)/categories')}
                  delay={300}
                />
                <FlatList
                  data={displayCategories}
                  renderItem={({ item, index }) => (
                    <CategoryCard
                      category={item}
                      onPress={() => router.push(`/category/${item.id}`)}
                      getMLText={getMLText}
                      index={index}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}

            {/* Featured Products - Only Firebase products */}
            {featuredProducts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Featured"
                  icon="⭐"
                  showSeeAll
                  onSeeAll={() => router.push('/(tabs)/categories')}
                  delay={400}
                />
                <FlatList
                  data={featuredProducts}
                  renderItem={({ item, index }) => (
                    <View style={styles.productWrapper}>
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
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}

            {/* New Arrivals - Only Firebase products */}
            {newProducts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="New Arrivals"
                  icon="🆕"
                  showSeeAll
                  onSeeAll={() => router.push('/(tabs)/categories')}
                  delay={500}
                />
                <FlatList
                  data={newProducts}
                  renderItem={({ item, index }) => (
                    <View style={styles.productWrapper}>
                      <ProductCard
                        product={item}
                        onPress={() => router.push(`/product/${item.id}`)}
                        onFavoritePress={() => toggleFavorite(item.id)}
                        isFavorite={isFavorite(item.id)}
                        showNewBadge
                        index={index}
                      />
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}

            {/* Popular / Trending - Only Firebase products */}
            {popularProducts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Trending Now"
                  icon="🔥"
                  showSeeAll
                  onSeeAll={() => router.push('/(tabs)/categories')}
                  delay={600}
                />
                <FlatList
                  data={popularProducts}
                  renderItem={({ item, index }) => (
                    <View style={styles.productWrapper}>
                      <ProductCard
                        product={item}
                        onPress={() => router.push(`/product/${item.id}`)}
                        onFavoritePress={() => toggleFavorite(item.id)}
                        isFavorite={isFavorite(item.id)}
                        index={index}
                      />
                    </View>
                  )}
                  keyExtractor={(item) => `popular-${item.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}

            {/* Empty State - When no data in Firebase */}
            {!hasCategories && !hasProducts && (
              <View style={styles.emptyStateContainer}>
                <EmptyState
                  icon="cube-outline"
                  title="No Products Yet"
                  message="Add products through the Admin Panel to see them here"
                  actionLabel="Open Admin"
                  onAction={() => router.push('/admin')}
                />
              </View>
            )}
          </>
        )}

        {/* Premium Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLogoText}>R</Text>
          </View>
          <Text style={styles.footerTitle}>RestArtuz</Text>
          <Text style={styles.footerSubtitle}>Premium Interior Materials</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerCopyright}>© 2025 RestArtuz. All rights reserved.</Text>
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </View>
    );
  };

  // Show loading while initial data loads
  const isInitialLoading = bannersLoading && categoriesLoading && productsLoading;
  
  if (isInitialLoading && banners.length === 0 && categories.length === 0 && allProducts.length === 0) {
    return <Loading message={t('loading')} />;
  }

  // Open Admin Panel using native navigation
  const openAdminPanel = () => {
    // Navigate to the native admin panel using Expo Router
    router.push('/admin');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Main Scroll Content - NO FLOATING HEADER */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* Hero Logo Section */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.heroHeader}
        >
          <View style={styles.heroLogoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.goldDark]}
              style={styles.heroLogo}
            >
              <Text style={styles.heroLogoText}>R</Text>
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>RestArtuz</Text>
          <Text style={styles.heroSubtitle}>Premium Interior Materials</Text>
        </Animated.View>

        {renderContent()}
      </Animated.ScrollView>

      {/* Floating Admin Button */}
      <Animated.View 
        entering={FadeIn.delay(800).duration(400)}
        style={[styles.adminButtonContainer, { bottom: insets.bottom + 100 }]}
      >
        <TouchableOpacity
          style={styles.adminButton}
          onPress={openAdminPanel}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.goldDark]}
            style={styles.adminButtonGradient}
          >
            <Ionicons name="settings" size={20} color={Colors.background} />
            <Text style={styles.adminButtonText}>Admin</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Hero Header
  heroHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  heroLogoContainer: {
    marginBottom: Spacing.md,
    ...Shadows.goldGlow,
  },
  heroLogo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLogoText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.background,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroSubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  horizontalList: {
    paddingHorizontal: Spacing.md,
  },
  productWrapper: {
    marginRight: Spacing.md,
  },
  emptyStateContainer: {
    flex: 1,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  footerLogoText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  footerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  footerSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  footerDivider: {
    width: 48,
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  footerCopyright: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },

  // Admin Button
  adminButtonContainer: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 50,
  },
  adminButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.goldGlow,
  },
  adminButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  adminButtonText: {
    ...Typography.button,
    color: Colors.background,
    fontWeight: '700',
    fontSize: 13,
  },
});
