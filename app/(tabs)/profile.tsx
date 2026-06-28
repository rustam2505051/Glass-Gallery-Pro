// RestArtuz - Premium Profile Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLanguage, useMLText } from '@/src/contexts/LanguageContext';
import { useSettings } from '@/src/contexts/SettingsContext';
import { Language } from '@/src/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/src/constants/theme';
import { ContactService } from '@/src/utils/contact';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const getMLText = useMLText();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  interface MenuItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    iconColor?: string;
    badge?: string;
  }

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    iconColor = Colors.primary,
    badge,
  }: MenuItemProps) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <Text style={styles.headerTitle}>RestArtuz</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Company Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View style={styles.companyCard}>
          <LinearGradient
            colors={[Colors.surfaceLight, Colors.surface]}
            style={styles.companyGradient}
          >
            {/* Logo */}
            <View style={styles.companyLogoContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.goldDark]}
                style={styles.companyLogo}
              >
                <Text style={styles.companyLogoText}>R</Text>
              </LinearGradient>
            </View>

            {/* Info */}
            <Text style={styles.companyName}>{getMLText(settings.companyName)}</Text>
            {settings.companyDescription && (
              <Text style={styles.companyDescription}>
                {getMLText(settings.companyDescription)}
              </Text>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>12+</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>5000+</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>Premium</Text>
                <Text style={styles.statLabel}>Quality</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Language Selection */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.languageGrid}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  language === lang.code && styles.languageItemActive,
                ]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageName,
                  language === lang.code && styles.languageNameActive
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <View style={styles.languageCheck}>
                    <Ionicons name="checkmark" size={14} color={Colors.background} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Contact Section */}
      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact')}</Text>

          {settings.whatsappNumber && (
            <MenuItem
              icon="logo-whatsapp"
              title="WhatsApp"
              subtitle={settings.whatsappNumber}
              iconColor="#25D366"
              onPress={() => ContactService.openWhatsApp(settings.whatsappNumber)}
            />
          )}

          {settings.telegramUsername && (
            <MenuItem
              icon="paper-plane"
              title="Telegram"
              subtitle={settings.telegramUsername}
              iconColor="#0088cc"
              onPress={() => ContactService.openTelegram(settings.telegramUsername)}
            />
          )}

          {settings.phoneNumbers && settings.phoneNumbers.length > 0 && (
            <MenuItem
              icon="call"
              title={t('phoneNumber')}
              subtitle={settings.phoneNumbers[0]}
              iconColor={Colors.success}
              onPress={() => ContactService.makeCall(settings.phoneNumbers[0])}
            />
          )}

          {settings.email && (
            <MenuItem
              icon="mail"
              title="Email"
              subtitle={settings.email}
              iconColor={Colors.info}
              showChevron={false}
            />
          )}
        </View>
      </Animated.View>

      {/* App Info */}
      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutUs')}</Text>
          <MenuItem
            icon="information-circle"
            title="About RestArtuz"
            subtitle="Premium Interior Materials"
            onPress={() => Alert.alert('RestArtuz', 'Premium Interior Materials Catalog\n\nVersion 1.0.0\n© 2025 RestArtuz')}
          />
          <MenuItem
            icon="shield-checkmark"
            title="Privacy Policy"
            onPress={() => {}}
          />
          <MenuItem
            icon="document-text"
            title="Terms of Service"
            onPress={() => {}}
          />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLogo}>
          <Text style={styles.footerLogoText}>R</Text>
        </View>
        <Text style={styles.footerTitle}>RestArtuz</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
        <Text style={styles.footerCopyright}>© 2025 RestArtuz. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.background,
  },
  headerTitle: {
    flex: 1,
    ...Typography.h4,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontWeight: '700',
  },
  companyCard: {
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  companyGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  companyLogoContainer: {
    marginBottom: Spacing.md,
    ...Shadows.goldGlow,
  },
  companyLogo: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogoText: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.background,
  },
  companyName: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  companyDescription: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  languageGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  languageItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  languageItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.goldLight,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  languageNameActive: {
    color: Colors.primary,
  },
  languageCheck: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.body1,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  menuSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  menuBadgeText: {
    ...Typography.overline,
    color: Colors.background,
    fontSize: 10,
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  footerLogoText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  footerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  footerVersion: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  footerCopyright: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});
