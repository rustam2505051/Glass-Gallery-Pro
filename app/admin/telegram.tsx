// RestArtuz - Admin Telegram Settings Screen
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

export default function TelegramSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'telegram');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBotToken(data.botToken || '');
        setChatId(data.chatId || '');
      }
    } catch (error) {
      console.error('Error loading telegram settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'telegram');
      await setDoc(docRef, {
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        updatedAt: new Date(),
      });
      
      Alert.alert('Success', 'Telegram settings saved successfully');
    } catch (error) {
      console.error('Error saving telegram settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      Alert.alert('Error', 'Please fill in Bot Token and Chat ID first');
      return;
    }

    setTesting(true);
    try {
      const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: '✅ Test message from RestArtuz Admin Panel\n\nTelegram integration is working correctly!',
        }),
      });

      const data = await response.json();

      if (data.ok) {
        Alert.alert('Success', 'Test message sent successfully! Check your Telegram.');
      } else {
        Alert.alert('Error', `Telegram API error: ${data.description || 'Unknown error'}`);
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to send test message: ${error.message}`);
    } finally {
      setTesting(false);
    }
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
        <Text style={styles.headerTitle}>Telegram Bot Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How to get Bot Token & Chat ID</Text>
            <Text style={styles.infoText}>
              1. Open Telegram and search for @BotFather{'\n'}
              2. Send /newbot and follow instructions{'\n'}
              3. Copy the Bot Token{'\n'}
              4. Add your bot to a group or channel{'\n'}
              5. Get Chat ID from @userinfobot or API
            </Text>
          </View>
        </View>

        {/* Bot Token */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Bot Token *</Text>
          <TextInput
            style={styles.input}
            value={botToken}
            onChangeText={setBotToken}
            placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Get this from @BotFather after creating your bot
          </Text>
        </View>

        {/* Chat ID */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Chat ID *</Text>
          <TextInput
            style={styles.input}
            value={chatId}
            onChangeText={setChatId}
            placeholder="-1001234567890"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.hint}>
            Your group/channel ID (use @userinfobot to find it)
          </Text>
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.testButtonText}>Send Test Message</Text>
            </>
          )}
        </TouchableOpacity>

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
              <Text style={styles.saveButtonText}>Save Settings</Text>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...theme.typography.body2,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body2,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  testButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '600',
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
