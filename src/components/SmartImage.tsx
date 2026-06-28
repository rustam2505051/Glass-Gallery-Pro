/**
 * RestArtuz Smart Image Component
 * Intelligent image display with automatic aspect ratio handling,
 * lazy loading, caching, and responsive delivery
 */

import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Image variant configurations matching backend
export const IMAGE_VARIANTS = {
  thumbnail: { width: 150, height: 150, aspectRatio: 1 },
  card: { width: 400, height: 400, aspectRatio: 1 },
  detail: { width: 800, height: 800, aspectRatio: 1 },
  fullscreen: { width: 1920, height: 1920, aspectRatio: 1 },
  banner: { width: 1200, height: 600, aspectRatio: 2 },
  category: { width: 600, height: 400, aspectRatio: 1.5 },
};

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

export interface SmartImageProps {
  /** Image source URL or object with variant URLs */
  source: string | { [key: string]: string };
  /** Preferred variant to display */
  variant?: ImageVariant;
  /** Container width (optional, auto-calculated if not provided) */
  width?: number | string;
  /** Container height (optional, auto-calculated if not provided) */
  height?: number | string;
  /** How the image should be fitted */
  contentFit?: ImageContentFit;
  /** Border radius */
  borderRadius?: number;
  /** Show loading indicator */
  showLoader?: boolean;
  /** Placeholder blur hash */
  placeholder?: string;
  /** Enable transitions */
  transition?: number;
  /** On load callback */
  onLoad?: () => void;
  /** On error callback */
  onError?: (error: Error) => void;
  /** Style override */
  style?: any;
  /** Alt text for accessibility */
  alt?: string;
  /** Enable lazy loading */
  lazy?: boolean;
  /** Priority loading */
  priority?: 'low' | 'normal' | 'high';
  /** Apply premium styling (gradient overlay, etc.) */
  premium?: boolean;
  /** Aspect ratio mode */
  aspectRatioMode?: 'fit' | 'fill' | 'cover' | 'contain';
}

/**
 * Get the best URL for the requested variant
 */
function getVariantUrl(
  source: string | { [key: string]: string },
  variant: ImageVariant
): string {
  if (typeof source === 'string') {
    return source;
  }

  // Fallback chain: requested variant -> similar variants -> original
  const fallbackChain: { [key: string]: string[] } = {
    thumbnail: ['thumbnail', 'card', 'detail', 'original'],
    card: ['card', 'detail', 'thumbnail', 'original'],
    detail: ['detail', 'card', 'fullscreen', 'original'],
    fullscreen: ['fullscreen', 'detail', 'original'],
    banner: ['banner', 'fullscreen', 'detail', 'original'],
    category: ['category', 'card', 'detail', 'original'],
  };

  const chain = fallbackChain[variant] || [variant, 'original'];
  
  for (const v of chain) {
    if (source[v]) {
      return source[v];
    }
  }

  // Return first available URL
  const firstKey = Object.keys(source)[0];
  return source[firstKey] || '';
}

/**
 * Calculate responsive dimensions based on variant and container
 */
function calculateDimensions(
  variant: ImageVariant,
  containerWidth?: number | string,
  containerHeight?: number | string
): { width: number; height: number } {
  const config = IMAGE_VARIANTS[variant];
  
  // Parse width/height if string
  const parseSize = (size: number | string | undefined, screenSize: number): number | undefined => {
    if (typeof size === 'number') return size;
    if (typeof size === 'string') {
      if (size.endsWith('%')) {
        return (parseFloat(size) / 100) * screenSize;
      }
      return parseFloat(size);
    }
    return undefined;
  };

  const width = parseSize(containerWidth, SCREEN_WIDTH) || config.width;
  const height = parseSize(containerHeight, SCREEN_HEIGHT) || (width / config.aspectRatio);

  // Cap to reasonable sizes
  const maxWidth = Math.min(width, SCREEN_WIDTH);
  const maxHeight = Math.min(height, SCREEN_HEIGHT);

  return {
    width: Math.round(maxWidth),
    height: Math.round(maxHeight),
  };
}

/**
 * Smart Image Component
 * 
 * Features:
 * - Automatic aspect ratio handling
 * - Lazy loading with priority control
 * - Smooth fade-in transitions
 * - Error fallback
 * - Premium styling option
 * - Responsive sizing
 * - Caching via expo-image
 */
export const SmartImage = memo(function SmartImage({
  source,
  variant = 'card',
  width: containerWidth,
  height: containerHeight,
  contentFit = 'cover',
  borderRadius = 12,
  showLoader = true,
  placeholder,
  transition = 300,
  onLoad,
  onError,
  style,
  alt,
  lazy = true,
  priority = 'normal',
  premium = false,
  aspectRatioMode = 'cover',
}: SmartImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get the URL for the requested variant
  const imageUrl = getVariantUrl(source, variant);

  // Calculate dimensions
  const dimensions = calculateDimensions(variant, containerWidth, containerHeight);

  // Handle load complete
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Handle error
  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  // Reset state when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [imageUrl]);

  // Determine content fit based on aspect ratio mode
  const getContentFit = (): ImageContentFit => {
    switch (aspectRatioMode) {
      case 'fit':
      case 'contain':
        return 'contain';
      case 'fill':
        return 'fill';
      case 'cover':
      default:
        return 'cover';
    }
  };

  // Error fallback
  if (hasError || !imageUrl) {
    return (
      <View
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            borderRadius,
          },
          styles.errorContainer,
          style,
        ]}
      >
        <View style={styles.errorIcon}>
          <View style={styles.errorIconInner} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius,
        },
        style,
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          { borderRadius },
        ]}
        contentFit={contentFit || getContentFit()}
        transition={transition}
        placeholder={placeholder}
        cachePolicy="memory-disk"
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        accessibilityLabel={alt}
      />

      {/* Loading indicator */}
      {showLoader && isLoading && (
        <View style={[styles.loaderContainer, { borderRadius }]}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {/* Premium gradient overlay */}
      {premium && !isLoading && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={[styles.premiumOverlay, { borderRadius }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
});

/**
 * Product Card Image - Optimized for product grid display
 */
export const ProductCardImage = memo(function ProductCardImage({
  source,
  width = SCREEN_WIDTH * 0.45,
  ...props
}: Omit<SmartImageProps, 'variant'>) {
  return (
    <SmartImage
      source={source}
      variant="card"
      width={width}
      height={width}
      borderRadius={16}
      {...props}
    />
  );
});

/**
 * Product Detail Image - Large image for detail view
 */
export const ProductDetailImage = memo(function ProductDetailImage({
  source,
  ...props
}: Omit<SmartImageProps, 'variant'>) {
  return (
    <SmartImage
      source={source}
      variant="detail"
      width="100%"
      height={SCREEN_WIDTH}
      borderRadius={0}
      priority="high"
      {...props}
    />
  );
});

/**
 * Category Card Image - Optimized for category display
 */
export const CategoryCardImage = memo(function CategoryCardImage({
  source,
  width = SCREEN_WIDTH * 0.4,
  ...props
}: Omit<SmartImageProps, 'variant'>) {
  return (
    <SmartImage
      source={source}
      variant="category"
      width={width}
      height={width * 0.67}
      borderRadius={16}
      premium
      {...props}
    />
  );
});

/**
 * Banner Image - Wide hero banner
 */
export const BannerImage = memo(function BannerImage({
  source,
  ...props
}: Omit<SmartImageProps, 'variant'>) {
  return (
    <SmartImage
      source={source}
      variant="banner"
      width="100%"
      height={(SCREEN_WIDTH - 32) * 0.5}
      borderRadius={20}
      priority="high"
      premium
      {...props}
    />
  );
});

/**
 * Thumbnail Image - Small image for lists
 */
export const ThumbnailImage = memo(function ThumbnailImage({
  source,
  size = 60,
  ...props
}: Omit<SmartImageProps, 'variant' | 'width' | 'height'> & { size?: number }) {
  return (
    <SmartImage
      source={source}
      variant="thumbnail"
      width={size}
      height={size}
      borderRadius={size * 0.2}
      showLoader={false}
      {...props}
    />
  );
});

/**
 * Avatar Image - Circular image for user avatars
 */
export const AvatarImage = memo(function AvatarImage({
  source,
  size = 48,
  ...props
}: Omit<SmartImageProps, 'variant' | 'width' | 'height' | 'borderRadius'> & { size?: number }) {
  return (
    <SmartImage
      source={source}
      variant="thumbnail"
      width={size}
      height={size}
      borderRadius={size / 2}
      showLoader={false}
      contentFit="cover"
      {...props}
    />
  );
});

/**
 * Gallery Image - Full-screen image for gallery view
 */
export const GalleryImage = memo(function GalleryImage({
  source,
  ...props
}: Omit<SmartImageProps, 'variant'>) {
  return (
    <SmartImage
      source={source}
      variant="fullscreen"
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT * 0.7}
      borderRadius={0}
      priority="high"
      contentFit="contain"
      aspectRatioMode="contain"
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textMuted,
  },
  premiumOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default SmartImage;
