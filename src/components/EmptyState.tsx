// Updated Empty State Component with Premium Design
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'folder-open-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      {/* Icon Container */}
      <Animated.View 
        entering={FadeInUp.delay(100).duration(500).springify()}
        style={styles.iconContainer}
      >
        <LinearGradient
          colors={[Colors.surfaceLight, Colors.surface]}
          style={styles.iconGradient}
        >
          <Ionicons name={icon} size={56} color={Colors.textTertiary} />
        </LinearGradient>
        {/* Gold ring */}
        <View style={styles.goldRing} />
      </Animated.View>

      {/* Text Content */}
      <Animated.View 
        entering={FadeInUp.delay(200).duration(500)}
        style={styles.textContainer}
      >
        <Text style={styles.title}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </Animated.View>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            style={styles.button}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goldRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.3,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  button: {
    minWidth: 180,
  },
});
