// Premium Search Bar Component
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
  onFilterPress?: () => void;
  autoFocus?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function SearchBar({
  placeholder = 'Search products...',
  value,
  onChangeText,
  onPress,
  editable = false,
  onFilterPress,
  autoFocus = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!editable) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const Container = editable ? View : AnimatedTouchable;
  const containerProps = editable ? {} : {
    onPress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    activeOpacity: 1,
  };

  return (
    <Animated.View 
      entering={FadeInUp.delay(300).duration(400)}
      style={styles.wrapper}
    >
      <Container
        style={[styles.container, animatedStyle, isFocused && styles.containerFocused]}
        {...containerProps}
      >
        {/* Glassmorphism background */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} tint="dark" style={styles.blur}>
            <SearchContent
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              editable={editable}
              isFocused={isFocused}
              setIsFocused={setIsFocused}
              onFilterPress={onFilterPress}
              autoFocus={autoFocus}
            />
          </BlurView>
        ) : (
          <View style={[styles.blur, styles.androidBg]}>
            <SearchContent
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              editable={editable}
              isFocused={isFocused}
              setIsFocused={setIsFocused}
              onFilterPress={onFilterPress}
              autoFocus={autoFocus}
            />
          </View>
        )}
      </Container>
    </Animated.View>
  );
}

function SearchContent({
  placeholder,
  value,
  onChangeText,
  editable,
  isFocused,
  setIsFocused,
  onFilterPress,
  autoFocus,
}: any) {
  return (
    <View style={styles.content}>
      {/* Search Icon */}
      <View style={styles.iconContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? Colors.primary : Colors.textTertiary} 
        />
      </View>

      {/* Input or Placeholder */}
      {editable ? (
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Animated.Text style={styles.placeholderText}>
            {placeholder}
          </Animated.Text>
        </View>
      )}

      {/* Filter Button */}
      {onFilterPress && (
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[Colors.goldLight, 'transparent']}
            style={styles.filterGradient}
          >
            <Ionicons name="options-outline" size={18} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  containerFocused: {
    borderColor: Colors.borderGold,
  },
  blur: {
    overflow: 'hidden',
  },
  androidBg: {
    backgroundColor: Colors.glass,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...Typography.body1,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  placeholderContainer: {
    flex: 1,
  },
  placeholderText: {
    ...Typography.body1,
    color: Colors.textTertiary,
  },
  filterButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  filterGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
});
