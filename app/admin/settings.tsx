import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { theme } from '../../src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface AppSettings {
  appName: string;
  appNameRu: string;
  appNameEn: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialInstagram: string;
  socialTelegram: string;
  socialFacebook: string;
  currency: string;
  maintenanceMode: boolean;
  showPrices: boolean;
  allowOrders: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'RestArtuz',
  appNameRu: 'RestArtuz',
  appNameEn: 'RestArtuz',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  socialInstagram: '',
  socialTelegram: '',
  socialFacebook: '',
  currency: 'USD',
  maintenanceMode: false,
  showPrices: true,
  allowOrders: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
      if (settingsDoc.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsDoc.data() } as AppSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'app'), {
        ...settings,
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
    >
      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <Text style={styles.inputLabel}>App Name (UZ)</Text>
        <TextInput
          style={styles.input}
          value={settings.appName}
          onChangeText={text => updateSetting('appName', text)}
          placeholder="App name in Uzbek"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.inputLabel}>App Name (RU)</Text>
        <TextInput
          style={styles.input}
          value={settings.appNameRu}
          onChangeText={text => updateSetting('appNameRu', text)}
          placeholder="Название приложения"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.inputLabel}>App Name (EN)</Text>
        <TextInput
          style={styles.input}
          value={settings.appNameEn}
          onChangeText={text => updateSetting('appNameEn', text)}
          placeholder="App name in English"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={settings.contactEmail}
          onChangeText={text => updateSetting('contactEmail', text)}
          placeholder="contact@example.com"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput
          style={styles.input}
          value={settings.contactPhone}
          onChangeText={text => updateSetting('contactPhone', text)}
          placeholder="+998 XX XXX XX XX"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={settings.contactAddress}
          onChangeText={text => updateSetting('contactAddress', text)}
          placeholder="Enter business address"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Social Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media</Text>
        
        <Text style={styles.inputLabel}>Instagram</Text>
        <TextInput
          style={styles.input}
          value={settings.socialInstagram}
          onChangeText={text => updateSetting('socialInstagram', text)}
          placeholder="@username or full URL"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.inputLabel}>Telegram</Text>
        <TextInput
          style={styles.input}
          value={settings.socialTelegram}
          onChangeText={text => updateSetting('socialTelegram', text)}
          placeholder="@username or t.me/username"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.inputLabel}>Facebook</Text>
        <TextInput
          style={styles.input}
          value={settings.socialFacebook}
          onChangeText={text => updateSetting('socialFacebook', text)}
          placeholder="Facebook page URL"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Store Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Settings</Text>
        
        <Text style={styles.inputLabel}>Default Currency</Text>
        <TextInput
          style={styles.input}
          value={settings.currency}
          onChangeText={text => updateSetting('currency', text)}
          placeholder="USD"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Show Prices</Text>
            <Text style={styles.switchDescription}>Display prices in the app</Text>
          </View>
          <Switch
            value={settings.showPrices}
            onValueChange={value => updateSetting('showPrices', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Allow Orders</Text>
            <Text style={styles.switchDescription}>Enable order functionality</Text>
          </View>
          <Switch
            value={settings.allowOrders}
            onValueChange={value => updateSetting('allowOrders', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Maintenance Mode</Text>
            <Text style={styles.switchDescription}>Show maintenance message to users</Text>
          </View>
          <Switch
            value={settings.maintenanceMode}
            onValueChange={value => updateSetting('maintenanceMode', value)}
            trackColor={{ false: theme.colors.border, true: '#F44336' }}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={22} color="#000" />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Back to Dashboard */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  switchDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: theme.colors.primary,
    marginLeft: 6,
  },
});
