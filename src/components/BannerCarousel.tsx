// Premium Banner Carousel Component
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';
import { Banner, MultiLangText } from '../types';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - Spacing.md * 2;
const BANNER_HEIGHT = 420;

interface BannerCarouselProps {
  banners: Banner[];
  onBannerPress?: (banner: Banner) => void;
  getMLText: (text: MultiLangText | string | undefined) => string;
}

export function BannerCarousel({ banners, onBannerPress, getMLText }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const index = Math.round(offsetX / width);
    setActiveIndex(index);
  };

  const renderBanner = ({ item, index }: { item: Banner; index: number }) => {
    return (
      <TouchableOpacity
        style={styles.bannerSlide}
        onPress={() => onBannerPress?.(item)}
        activeOpacity={0.95}
      >
        <Animated.View 
          entering={FadeIn.delay(200).duration(600)}
          style={styles.bannerContainer}
        >
          {/* Background Image */}
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.bannerImage}
            contentFit="cover"
            transition={400}
          />

          {/* Multi-layer gradient overlay for premium look */}
          <LinearGradient
            colors={['rgba(5, 5, 5, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sideGradient}
          />
          <LinearGradient
            colors={['transparent', 'rgba(5, 5, 5, 0.3)', 'rgba(5, 5, 5, 0.95)']}
            locations={[0, 0.5, 1]}
            style={styles.bottomGradient}
          />

          {/* Content */}
          <View style={styles.bannerContent}>
            {/* Gold accent line */}
            <View style={styles.goldAccent} />
            
            {item.title && (
              <Text style={styles.bannerTitle}>
                {getMLText(item.title)}
              </Text>
            )}
            
            {item.subtitle && (
              <Text style={styles.bannerSubtitle}>
                {getMLText(item.subtitle)}
              </Text>
            )}

            {/* CTA Button */}
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.primary, Colors.goldDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Explore Collection</Text>
                <View style={styles.ctaArrow}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.background} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Decorative corner elements */}
          <View style={styles.cornerTL} />
          <View style={styles.cornerBR} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      />

      {/* Premium Pagination Dots */}
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === activeIndex && styles.dotActive,
            ]}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index, animated: true });
            }}
          >
            {index === activeIndex && <View style={styles.dotInner} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  bannerSlide: {
    width: width,
    paddingHorizontal: Spacing.md,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.large,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  sideGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '40%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  goldAccent: {
    width: 48,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  bannerTitle: {
    ...Typography.display,
    color: Colors.textPrimary,
    fontSize: 36,
    lineHeight: 42,
    marginBottom: Spacing.sm,
  },
  bannerSubtitle: {
    ...Typography.body1,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.goldGlow,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  ctaText: {
    ...Typography.button,
    color: Colors.background,
    fontWeight: '700',
  },
  ctaArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 5, 5, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.5,
    borderTopLeftRadius: BorderRadius.sm,
  },
  cornerBR: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.5,
    borderBottomRightRadius: BorderRadius.sm,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    width: 32,
    backgroundColor: Colors.primary,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.background,
  },
});
