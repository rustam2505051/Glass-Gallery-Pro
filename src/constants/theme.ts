// RestArtuz Premium Theme - Enterprise Luxury Design System
import { StyleSheet, Platform } from 'react-native';

// Color Palette - Premium Dark Theme with Gold Accents
export const Colors = {
  // Primary - Premium Gold
  primary: '#D4AF37',
  primaryDark: '#B8960C',
  primaryLight: '#E8C84A',
  gold: '#D4AF37',
  goldLight: 'rgba(212, 175, 55, 0.15)',
  goldDark: '#B8960C',
  
  // Background - Deep Dark
  background: '#050505',
  backgroundSecondary: '#111111',
  backgroundTertiary: '#1A1A1A',
  
  // Surface - Card/Container backgrounds
  surface: '#111111',
  surfaceLight: '#1A1A1A',
  surfaceElevated: '#222222',
  
  // Glass morphism
  glass: 'rgba(17, 17, 17, 0.85)',
  glassLight: 'rgba(26, 26, 26, 0.75)',
  glassBorder: 'rgba(212, 175, 55, 0.2)',
  
  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#AAAAAA',
  textTertiary: '#777777',
  textDisabled: '#555555',
  textGold: '#D4AF37',
  
  // Borders
  border: '#2A2A2A',
  borderLight: '#333333',
  borderGold: 'rgba(212, 175, 55, 0.3)',
  
  // Status
  success: '#4ADE80',
  successBg: 'rgba(74, 222, 128, 0.15)',
  warning: '#FBBF24',
  warningBg: 'rgba(251, 191, 36, 0.15)',
  error: '#F87171',
  errorBg: 'rgba(248, 113, 113, 0.15)',
  info: '#60A5FA',
  infoBg: 'rgba(96, 165, 250, 0.15)',
  
  // Overlay
  overlay: 'rgba(5, 5, 5, 0.9)',
  overlayLight: 'rgba(5, 5, 5, 0.7)',
  overlayDark: 'rgba(0, 0, 0, 0.95)',
  
  // Gradients (used as array for LinearGradient)
  gradientGold: ['#D4AF37', '#B8960C'],
  gradientDark: ['#111111', '#050505'],
  gradientCard: ['#1A1A1A', '#111111'],
  gradientOverlay: ['transparent', 'rgba(5, 5, 5, 0.95)'],
};

// Spacing Scale (8pt grid system)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Typography - Premium System Font Stack
export const Typography = {
  // Display - Hero titles
  display: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
    letterSpacing: -1.5,
  },
  // Headlines
  h1: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 44,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  // Body text
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  // Small text
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  // Buttons
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  buttonLarge: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
};

// Border Radius
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

// Shadows - Premium depth
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  goldGlow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Animation constants
export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

// Common Styles
export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  glassCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  goldBorder: {
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  textGold: {
    color: Colors.primary,
  },
  shadow: Shadows.medium,
  // Safe area padding for status bar
  safeTop: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
});

// Glassmorphism helper
export const Glassmorphism = {
  background: Colors.glass,
  borderColor: Colors.glassBorder,
  borderWidth: 1,
  borderRadius: BorderRadius.lg,
};

// Theme object for admin panel compatibility
export const theme = {
  colors: {
    primary: Colors.primary,
    background: Colors.background,
    surface: Colors.surface,
    surfaceLight: Colors.surfaceLight,
    text: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    textTertiary: Colors.textTertiary,
    border: Colors.border,
    error: Colors.error,
    success: Colors.success,
    warning: Colors.warning,
  },
  spacing: Spacing,
  typography: Typography,
  borderRadius: BorderRadius,
  shadows: Shadows,
};
