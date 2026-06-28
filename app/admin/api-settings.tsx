// RestArtuz - Admin API Settings Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Colors, Spacing, Typography, BorderRadius } from '@/src/constants/theme';

const theme = {
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
  },
  spacing: Spacing,
  typography: Typography,
  borderRadius: BorderRadius,
};

interface APISettings {
  geminiApiKey: string;
  openaiApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  googleMapsApiKey: string;
  firebaseProjectId: string;
}

interface PasswordField {
  key: keyof APISettings;
  label: string;
  placeholder: string;
  hint: string;
  icon: string;
}

const apiFields: PasswordField[] = [
  {
    key: 'geminiApiKey',
    label: 'Gemini API Key',
    placeholder: 'AIza...',
    hint: 'Used for AI product description generation',
    icon: 'sparkles',
  },
  {
    key: 'openaiApiKey',
    label: 'OpenAI API Key (Optional)',
    placeholder: 'sk-...',
    hint: 'Alternative AI provider for product descriptions',
    icon: 'logo-electron',
  },
  {
    key: 'telegramBotToken',
    label: 'Telegram Bot Token',
    placeholder: '123456789:ABC-DEF...',
    hint: 'From @BotFather - for order notifications',
    icon: 'paper-plane',
  },
  {
    key: 'telegramChatId',
    label: 'Telegram Chat ID',
    placeholder: '-1001234567890',
    hint: 'Group/channel ID to receive orders',
    icon: 'chatbubbles',
  },
  {
    key: 'googleMapsApiKey',
    label: 'Google Maps API Key (Optional)',
    placeholder: 'AIza...',
    hint: 'For store location maps',
    icon: 'map',
  },
  {
    key: 'firebaseProjectId',
    label: 'Firebase Project ID',
    placeholder: 'your-project-id',
    hint: 'Your Firebase project identifier',
    icon: 'flame',
  },
];

export default function APISettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  const [settings, setSettings] = useState<APISettings>({
    geminiApiKey: '',
    openaiApiKey: '',
    telegramBotToken: '',
    telegramChatId: '',
    googleMapsApiKey: '',
    firebaseProjectId: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'api');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          ...data,
        }));
      }
      
      // Also load telegram settings from separate doc
      const telegramRef = doc(db, 'settings', 'telegram');
      const telegramSnap = await getDoc(telegramRef);
      if (telegramSnap.exists()) {
        const telegramData = telegramSnap.data();
        setSettings(prev => ({
          ...prev,
          telegramBotToken: telegramData.botToken || '',
          telegramChatId: telegramData.chatId || '',
        }));
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save API settings
      const docRef = doc(db, 'settings', 'api');
      await setDoc(docRef, {
        geminiApiKey: settings.geminiApiKey.trim(),
        openaiApiKey: settings.openaiApiKey.trim(),
        googleMapsApiKey: settings.googleMapsApiKey.trim(),
        firebaseProjectId: settings.firebaseProjectId.trim(),
        updatedAt: new Date(),
      }, { merge: true });
      
      // Save Telegram settings separately
      const telegramRef = doc(db, 'settings', 'telegram');
      await setDoc(telegramRef, {
        botToken: settings.telegramBotToken.trim(),
        chatId: settings.telegramChatId.trim(),
        updatedAt: new Date(),
      }, { merge: true });
      
      Alert.alert('Success', 'API settings saved securely');
    } catch (error) {
      console.error('Error saving API settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof APISettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleShowPassword = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string, show: boolean) => {
    if (show || !value) return value;
    if (value.length <= 8) return '•'.repeat(value.length);
    return value.substring(0, 4) + '•'.repeat(value.length - 8) + value.substring(value.length - 4);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>API Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Notice */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure Storage</Text>
            <Text style={styles.securityText}>
              API keys are stored securely in Firebase and are never exposed in the client app bundle.
            </Text>
          </View>
        </View>

        {/* API Fields */}
        {apiFields.map((field) => (
          <View key={field.key} style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Ionicons name={field.icon as any} size={18} color={theme.colors.primary} />
              <Text style={styles.label}>{field.label}</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={showPasswords[field.key] ? settings[field.key] : maskValue(settings[field.key], false)}
                onChangeText={(value) => updateSetting(field.key, value)}
                placeholder={field.placeholder}
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPasswords[field.key] && settings[field.key].length > 0}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => toggleShowPassword(field.key)}
              >
                <Ionicons
                  name={showPasswords[field.key] ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>{field.hint}</Text>
          </View>
        ))}

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={theme.colors.error} />
          <Text style={styles.warningText}>
            Only Super Admin can access and modify these settings. Never share API keys with unauthorized users.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={theme.colors.background} />
              <Text style={styles.saveButtonText}>Save All Settings</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: '#22c55e15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: '#22c55e30',
    gap: theme.spacing.md,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    ...theme.typography.body2,
    color: theme.colors.success,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  securityText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  label: {
    ...theme.typography.body2,
    color: theme.colors.text,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  eyeButton: {
    position: 'absolute',
    right: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#ef444420',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  warningText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    flex: 1,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.background,
    fontWeight: '700',
  },
});
