// Premium Category Card Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Category, MultiLangText } from '../types';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_SIZE = 160;

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  getMLText: (text: MultiLangText | string | undefined) => string;
  index?: number;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function CategoryCard({
  category,
  onPress,
  getMLText,
  index = 0,
  size = 'medium',
}: CategoryCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardSizes = {
    small: 130,
    medium: CARD_SIZE,
    large: 200,
  };

  const cardSize = cardSizes[size];

  return (
    <AnimatedTouchable
      entering={FadeInRight.delay(index * 80).duration(400).springify()}
      style={[styles.card, { width: cardSize, height: cardSize }, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      {/* Background Image */}
      {category.imageUrl ? (
        <Image
          source={{ uri: category.imageUrl }}
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
          <Ionicons name="folder" size={48} color={Colors.primary} />
        </LinearGradient>
      )}

      {/* Multi-layer gradient */}
      <LinearGradient
        colors={['rgba(5, 5, 5, 0.1)', 'rgba(5, 5, 5, 0.4)', 'rgba(5, 5, 5, 0.95)']}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      />

      {/* Gold shine effect */}
      <View style={styles.shineEffect} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {getMLText(category.name)}
        </Text>
        {category.productCount && category.productCount > 0 && (
          <View style={styles.countContainer}>
            <Text style={styles.count}>{category.productCount} items</Text>
          </View>
        )}
      </View>

      {/* Gold accent border */}
      <View style={styles.goldBorder} />

      {/* Corner accent */}
      <View style={styles.cornerAccent} />
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
    marginRight: Spacing.md,
    ...Shadows.medium,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shineEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 100,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '45deg' }],
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  name: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  countContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  count: {
    ...Typography.overline,
    color: Colors.primary,
    fontSize: 9,
  },
  goldBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.7,
  },
  cornerAccent: {
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
