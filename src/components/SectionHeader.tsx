// Premium Section Header Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  seeAllText?: string;
  delay?: number;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  showSeeAll = true,
  onSeeAll,
  seeAllText = 'See All',
  delay = 0,
}: SectionHeaderProps) {
  return (
    <Animated.View 
      entering={FadeInLeft.delay(delay).duration(400)}
      style={styles.container}
    >
      <View style={styles.titleContainer}>
        {icon && (
          <Text style={styles.icon}>{icon}</Text>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.goldAccent} />
      </View>

      {showSeeAll && onSeeAll && (
        <TouchableOpacity 
          style={styles.seeAllButton} 
          onPress={onSeeAll}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>{seeAllText}</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goldAccent: {
    width: 32,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginLeft: Spacing.sm,
    opacity: 0.8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  arrowContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
