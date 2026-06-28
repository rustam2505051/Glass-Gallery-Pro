// Premium Product Card Component - Luxury Version
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Product } from '../types';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';
import { useMLText } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  showNewBadge?: boolean;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ProductCard({
  product,
  onPress,
  onFavoritePress,
  isFavorite = false,
  showNewBadge = false,
  index = 0,
}: ProductCardProps) {
  const getMLText = useMLText();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      entering={FadeInUp.delay(index * 60).duration(400).springify()}
      style={[styles.card, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {product.thumbnailUrl ? (
          <Image
            source={{ uri: product.thumbnailUrl }}
            style={styles.image}
            contentFit="contain"
            contentPosition="center"
            transition={300}
          />
        ) : (
          <LinearGradient
            colors={[Colors.surfaceLight, Colors.surface]}
            style={styles.imagePlaceholder}
          >
            <Ionicons name="image-outline" size={40} color={Colors.border} />
          </LinearGradient>
        )}
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(5, 5, 5, 0.3)', 'rgba(5, 5, 5, 0.8)']}
          locations={[0.3, 0.6, 1]}
          style={styles.imageGradient}
        />

        {/* Badges */}
        <View style={styles.badgeRow}>
          {(showNewBadge || product.isNew) && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={10} color={Colors.background} />
            </View>
          )}
        </View>
        
        {/* Favorite Button */}
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onFavoritePress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <View style={[styles.favoriteCircle, isFavorite && styles.favoriteCircleActive]}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={16}
                color={isFavorite ? Colors.error : Colors.textPrimary}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Gold accent line */}
        <View style={styles.goldLine} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Product Code */}
        <Text style={styles.code} numberOfLines={1}>
          {product.code}
        </Text>
        
        {/* Product Name */}
        <Text style={styles.name} numberOfLines={2}>
          {getMLText(product.name)}
        </Text>
        
        {/* Footer */}
        <View style={styles.footer}>
          {/* Stock Status */}
          <View style={[
            styles.stockBadge,
            product.stockStatus === 'in_stock' ? styles.inStock : styles.outOfStock
          ]}>
            <View style={[
              styles.stockDot,
              product.stockStatus === 'in_stock' ? styles.inStockDot : styles.outOfStockDot
            ]} />
            <Text style={styles.stockText}>
              {product.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
          
          {/* Price */}
          {product.price && (
            <Text style={styles.price}>
              ${product.price.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  badgeRow: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  newBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  newBadgeText: {
    ...Typography.overline,
    color: Colors.background,
    fontWeight: '800',
    fontSize: 9,
  },
  featuredBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  favoriteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5, 5, 5, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  favoriteCircleActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  goldLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  code: {
    ...Typography.overline,
    color: Colors.primary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  name: {
    ...Typography.body2,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.sm,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  inStock: {
    backgroundColor: Colors.successBg,
  },
  outOfStock: {
    backgroundColor: Colors.errorBg,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  inStockDot: {
    backgroundColor: Colors.success,
  },
  outOfStockDot: {
    backgroundColor: Colors.error,
  },
  stockText: {
    ...Typography.overline,
    color: Colors.textSecondary,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  price: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
