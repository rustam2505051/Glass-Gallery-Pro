// Glassmorphic Header Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  scrollY?: SharedValue<number>;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  transparent?: boolean;
}

export function GlassHeader({
  title,
  subtitle,
  scrollY,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  transparent = false,
}: GlassHeaderProps) {
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: transparent ? 0 : 1 };
    return {
      opacity: interpolate(scrollY.value, [0, 100], [transparent ? 0 : 0.5, 1]),
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1, transform: [{ translateY: 0 }] };
    return {
      opacity: interpolate(scrollY.value, [0, 100], [0, 1]),
      transform: [{ translateY: interpolate(scrollY.value, [0, 100], [20, 0]) }],
    };
  });

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top }, animatedStyle]}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(17, 17, 17, 0.95)', 'rgba(17, 17, 17, 0.85)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Left - Back button or Logo */}
            <View style={styles.leftContainer}>
              {showBack ? (
                <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
                  <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.logoContainer}>
                  <Text style={styles.logo}>R</Text>
                </View>
              )}
            </View>

            {/* Center - Title */}
            <Animated.View style={[styles.centerContainer, titleAnimatedStyle]}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </Animated.View>

            {/* Right - Action button */}
            <View style={styles.rightContainer}>
              {rightIcon && (
                <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
                  <Ionicons name={rightIcon} size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bottom border */}
          <View style={styles.borderLine} />
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurContainer: {
    overflow: 'hidden',
  },
  gradient: {
    paddingBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    minHeight: 44,
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.background,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  borderLine: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.sm,
  },
});
