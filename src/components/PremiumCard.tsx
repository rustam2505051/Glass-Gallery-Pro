// Premium Card Component with Glassmorphism
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

interface PremiumCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  showGradient?: boolean;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function PremiumCard({
  imageUrl,
  title,
  subtitle,
  badge,
  badgeColor = Colors.primary,
  onPress,
  style,
  size = 'medium',
  showGradient = true,
  index = 0,
}: PremiumCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardSizes = {
    small: { width: (width - Spacing.md * 3) / 2 - 4, height: 180 },
    medium: { width: (width - Spacing.md * 3) / 2, height: 220 },
    large: { width: width - Spacing.md * 2, height: 280 },
  };

  const cardDimensions = cardSizes[size];

  return (
    <AnimatedTouchable
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
      style={[styles.card, cardDimensions, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />

      {/* Gradient Overlay */}
      {showGradient && (
        <LinearGradient
          colors={['transparent', 'rgba(5, 5, 5, 0.4)', 'rgba(5, 5, 5, 0.95)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />
      )}

      {/* Badge */}
      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      {/* Gold accent line */}
      <View style={styles.goldLine} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Corner shine effect */}
      <View style={styles.shine} />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.overline,
    color: Colors.background,
    fontWeight: '700',
  },
  goldLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  shine: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '45deg' }],
  },
});
