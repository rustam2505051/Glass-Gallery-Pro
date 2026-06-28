// RestArtuz - Premium Categories Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useLanguage, useMLText } from '@/src/contexts/LanguageContext';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { Category } from '@/src/types';
import { Loading } from '@/src/components/Loading';
import { EmptyState } from '@/src/components/EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/src/constants/theme';
import { where, orderBy } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;
const CARD_HEIGHT = 200;

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const getMLText = useMLText();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, loading, error } = useFirestoreCollection<Category>('categories', [
    orderBy('order', 'asc'),
  ]);

  // Filter active categories manually to avoid compound index requirement
  const displayCategories = categories.filter(cat => cat.isActive !== false);

  // Filter categories by search
  const filteredCategories = searchQuery
    ? displayCategories.filter((cat) => {
        const name = getMLText(cat.name).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      })
    : displayCategories;

  if (loading && categories.length === 0) {
    return <Loading message={t('loading')} />;
  }

  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(400).springify()}>
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => router.push(`/category/${item.id}`)}
        activeOpacity={0.9}
      >
        {/* Background Image */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.categoryImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <LinearGradient
            colors={[Colors.surfaceLight, Colors.surface]}
            style={styles.categoryImage}
          >
            <Ionicons name="folder" size={48} color={Colors.primary} />
          </LinearGradient>
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(5, 5, 5, 0.1)', 'rgba(5, 5, 5, 0.5)', 'rgba(5, 5, 5, 0.95)']}
          locations={[0, 0.5, 1]}
          style={styles.categoryGradient}
        />

        {/* Content */}
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName} numberOfLines={2}>
            {getMLText(item.name)}
          </Text>
          {item.productCount && item.productCount > 0 && (
            <View style={styles.countBadge}>
              <Ionicons name="cube-outline" size={12} color={Colors.primary} />
              <Text style={styles.countText}>{item.productCount} items</Text>
            </View>
          )}
        </View>

        {/* Gold accent */}
        <View style={styles.goldLine} />

        {/* Corner decoration */}
        <View style={styles.cornerDecor} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Page Title */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>{t('categories')}</Text>
        <Text style={styles.pageSubtitle}>Explore our premium collections</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIconBg}>
            <Ionicons name="search" size={18} color={Colors.primary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
        </Text>
        <View style={styles.goldDot} />
      </View>
    </Animated.View>
  );

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

      {filteredCategories.length === 0 && !loading ? (
        <EmptyState
          icon="search-outline"
          title={searchQuery ? t('noResults') : 'No categories'}
          message={searchQuery ? 'Try a different search term' : 'Categories will appear here'}
        />
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
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
  clearButton: {
    padding: Spacing.xs,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  resultsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  goldDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  categoryName: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  countText: {
    ...Typography.overline,
    color: Colors.primary,
    fontSize: 10,
  },
  goldLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.7,
  },
  cornerDecor: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.5,
    borderTopRightRadius: BorderRadius.xs,
  },
});
