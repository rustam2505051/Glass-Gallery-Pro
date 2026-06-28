// Settings Context with Firebase Integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppSettings, Banner, MultiLangText } from '../types';

// Extended settings type with Telegram Bot
interface ExtendedAppSettings extends AppSettings {
  telegramBotToken?: string;
  telegramChatId?: string;
}

// Default settings - NO HARDCODED CONTACTS
const DEFAULT_SETTINGS: ExtendedAppSettings = {
  companyName: {
    uz: 'RestArtuz',
    ru: 'RestArtuz',
    en: 'RestArtuz',
  },
  companyDescription: {
    uz: 'Premium interyer materiallari',
    ru: 'Премиум материалы для интерьера',
    en: 'Premium Interior Materials',
  },
  logoUrl: '',
  whatsappNumber: '', // Loaded from Firebase settings/contact
  whatsappLink: '', // Loaded from Firebase settings/contact
  telegramUsername: '', // Loaded from Firebase settings/contact
  telegramLink: '', // Loaded from Firebase settings/contact
  phoneNumbers: [], // Loaded from Firebase settings/contact
  email: '', // Loaded from Firebase settings/contact
  telegramBotToken: '', // Loaded from Firebase settings/telegram
  telegramChatId: '', // Loaded from Firebase settings/telegram
  banners: [],
  primaryColor: '#D4AF37',
  accentColor: '#D4AF37',
  enablePricing: true,
  enableSharing: true,
  enableFavorites: true,
};

interface SettingsContextType {
  settings: ExtendedAppSettings;
  loading: boolean;
  error: Error | null;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<ExtendedAppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // Subscribe to both app settings and contact settings
    const unsubscribeApp = onSnapshot(
      doc(db, 'settings', 'app'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings(prev => ({
            ...prev,
            ...data,
            // Ensure nested objects have defaults
            companyName: data.companyName || DEFAULT_SETTINGS.companyName,
            companyDescription: data.companyDescription || DEFAULT_SETTINGS.companyDescription,
            banners: data.banners || [],
          }));
        }
        setLoading(false);
      },
      (err) => {
        console.error('App settings error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Subscribe to contact settings
    const unsubscribeContact = onSnapshot(
      doc(db, 'settings', 'contact'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings(prev => ({
            ...prev,
            whatsappNumber: data.whatsappNumber || '',
            whatsappLink: data.whatsappNumber ? `https://wa.me/${data.whatsappNumber.replace(/[^0-9]/g, '')}` : '',
            telegramUsername: data.telegramUsername || '',
            telegramLink: data.telegramLink || (data.telegramUsername ? `https://t.me/${data.telegramUsername.replace('@', '')}` : ''),
            phoneNumbers: data.phoneNumber ? [data.phoneNumber] : [],
            email: data.email || '',
          }));
        }
      },
      (err) => {
        console.error('Contact settings error:', err);
      }
    );

    // Subscribe to Telegram bot settings
    const unsubscribeTelegram = onSnapshot(
      doc(db, 'settings', 'telegram'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings(prev => ({
            ...prev,
            telegramBotToken: data.botToken || '',
            telegramChatId: data.chatId || '',
          }));
        }
      },
      (err) => {
        console.error('Telegram settings error:', err);
      }
    );

    return () => {
      unsubscribeApp();
      unsubscribeContact();
      unsubscribeTelegram();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}
