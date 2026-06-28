import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { theme } from '../../src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminTranslation } from '../../src/utils/adminTranslations';

interface ContactSettings {
  phoneNumber: string;
  whatsappNumber: string;
  telegramUsername: string;
  telegramLink: string;
  email: string;
  website: string;
  instagram: string;
  address: string;
  workingHours: string;
}

export default function ContactSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useAdminTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>({
    phoneNumber: '',
    whatsappNumber: '',
    telegramUsername: '',
    telegramLink: '',
    email: '',
    website: '',
    instagram: '',
    address: '',
    workingHours: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'contact');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data() as ContactSettings);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'contact'), {
        ...settings,
        updatedAt: new Date(),
      });
      Alert.alert(t('success'), t('changesSaved'));
    } catch (error) {
      console.error('Error saving contact settings:', error);
      Alert.alert(t('error'), t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#000" />
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Phone */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t('phone') || 'Phone'}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={settings.phoneNumber}
          onChangeText={text => setSettings({ ...settings, phoneNumber: text })}
          placeholder="+998 XX XXX XX XX"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="phone-pad"
        />
      </View>

      {/* WhatsApp */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={styles.sectionTitle}>WhatsApp</Text>
        </View>
        <TextInput
          style={styles.input}
          value={settings.whatsappNumber}
          onChangeText={text => setSettings({ ...settings, whatsappNumber: text })}
          placeholder="+998 XX XXX XX XX"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="phone-pad"
        />
        <Text style={styles.hint}>Without + or spaces for WhatsApp link (e.g., 998901234567)</Text>
      </View>

      {/* Telegram */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="paper-plane-outline" size={20} color="#0088CC" />
          <Text style={styles.sectionTitle}>Telegram</Text>
        </View>
        <TextInput
          style={styles.input}
          value={settings.telegramUsername}
          onChangeText={text => setSettings({ ...settings, telegramUsername: text })}
          placeholder="@username"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          value={settings.telegramLink}
          onChangeText={text => setSettings({ ...settings, telegramLink: text })}
          placeholder="https://t.me/channel or t.me/username"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="url"
        />
      </View>

      {/* Email */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t('email')}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={settings.email}
          onChangeText={text => setSettings({ ...settings, email: text })}
          placeholder="info@example.com"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Website */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t('website') || 'Website'}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={settings.website}
          onChangeText={text => setSettings({ ...settings, website: text })}
          placeholder="https://www.example.com"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>

      {/* Instagram */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="logo-instagram" size={20} color="#E4405F" />
          <Text style={styles.sectionTitle}>Instagram</Text>
        </View>
        <TextInput
          style={styles.input}
          value={settings.instagram}
          onChangeText={text => setSettings({ ...settings, instagram: text })}
          placeholder="@username or full URL"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Address */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t('address') || 'Address'}</Text>
        </View>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={settings.address}
          onChangeText={text => setSettings({ ...settings, address: text })}
          placeholder="Store address"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Working Hours */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t('workingHours') || 'Working Hours'}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={settings.workingHours}
          onChangeText={text => setSettings({ ...settings, workingHours: text })}
          placeholder="Mon-Sat: 9:00 - 18:00"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          These settings will be used for "Request Price", "Contact Us" buttons and in the app footer.
          Make sure to save after making changes.
        </Text>
      </View>
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
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 15,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 6,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
