// Contact Settings Hook - Fetches contact info from Firebase
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Linking, Alert } from 'react-native';

export interface ContactSettings {
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

const defaultSettings: ContactSettings = {
  phoneNumber: '',
  whatsappNumber: '',
  telegramUsername: '',
  telegramLink: '',
  email: '',
  website: '',
  instagram: '',
  address: '',
  workingHours: '',
};

// Hook to fetch and subscribe to contact settings
export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'contact');
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as ContactSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching contact settings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Open WhatsApp with message
  const openWhatsApp = useCallback(async (message?: string) => {
    const number = settings.whatsappNumber;
    if (!number) {
      Alert.alert('Error', 'WhatsApp number not configured');
      return;
    }

    try {
      const cleanNumber = number.replace(/[^0-9]/g, '');
      const encodedMessage = message ? encodeURIComponent(message) : '';
      const url = `whatsapp://send?phone=${cleanNumber}${message ? `&text=${encodedMessage}` : ''}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/${cleanNumber}${message ? `?text=${encodedMessage}` : ''}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
      // Try Telegram as fallback
      if (settings.telegramUsername || settings.telegramLink) {
        Alert.alert(
          'WhatsApp Unavailable',
          'Would you like to contact via Telegram instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Telegram', onPress: () => openTelegram() },
          ]
        );
      } else if (settings.phoneNumber) {
        Alert.alert(
          'WhatsApp Unavailable',
          'Would you like to call instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => makeCall() },
          ]
        );
      } else {
        Alert.alert('Error', 'Could not open WhatsApp');
      }
    }
  }, [settings]);

  // Open Telegram
  const openTelegram = useCallback(async () => {
    try {
      // Prefer direct link if available
      if (settings.telegramLink) {
        await Linking.openURL(settings.telegramLink);
        return;
      }
      
      const username = settings.telegramUsername;
      if (!username) {
        Alert.alert('Error', 'Telegram not configured');
        return;
      }

      const cleanUsername = username.replace('@', '');
      const url = `tg://resolve?domain=${cleanUsername}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web Telegram
        const webUrl = `https://t.me/${cleanUsername}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open Telegram:', error);
      Alert.alert('Error', 'Could not open Telegram');
    }
  }, [settings]);

  // Make phone call
  const makeCall = useCallback(async () => {
    const number = settings.phoneNumber;
    if (!number) {
      Alert.alert('Error', 'Phone number not configured');
      return;
    }

    try {
      const cleanNumber = number.replace(/[^0-9+]/g, '');
      const url = `tel:${cleanNumber}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      console.error('Failed to make call:', error);
      Alert.alert('Error', 'Could not make phone call');
    }
  }, [settings]);

  // Request price - tries WhatsApp -> Telegram -> Phone in order
  const requestPrice = useCallback(async (
    productName: string,
    productCode: string,
    categoryName?: string,
    language: 'uz' | 'ru' | 'en' = 'ru'
  ) => {
    const messages = {
      uz: `Salom!\n\nMen quyidagi mahsulot haqida ma'lumot olmoqchiman:\n\nMahsulot: ${productName}\n${categoryName ? `Kategoriya: ${categoryName}\n` : ''}Kod: ${productCode}\n\nIltimos, narx va mavjudligi haqida xabar bering.`,
      ru: `Здравствуйте!\n\nХочу узнать информацию о товаре:\n\nТовар: ${productName}\n${categoryName ? `Категория: ${categoryName}\n` : ''}Код: ${productCode}\n\nПрошу сообщить цену и наличие.`,
      en: `Hello!\n\nI would like information about:\n\nProduct: ${productName}\n${categoryName ? `Category: ${categoryName}\n` : ''}Code: ${productCode}\n\nPlease let me know the price and availability.`,
    };

    if (settings.whatsappNumber) {
      await openWhatsApp(messages[language]);
    } else if (settings.telegramUsername || settings.telegramLink) {
      await openTelegram();
    } else if (settings.phoneNumber) {
      await makeCall();
    } else {
      Alert.alert('Error', 'No contact method configured');
    }
  }, [settings, openWhatsApp, openTelegram, makeCall]);

  // Open email
  const openEmail = useCallback(async (subject?: string, body?: string) => {
    const email = settings.email;
    if (!email) {
      Alert.alert('Error', 'Email not configured');
      return;
    }

    try {
      let url = `mailto:${email}`;
      const params: string[] = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open email:', error);
      Alert.alert('Error', 'Could not open email client');
    }
  }, [settings]);

  // Open Instagram
  const openInstagram = useCallback(async () => {
    const instagram = settings.instagram;
    if (!instagram) {
      Alert.alert('Error', 'Instagram not configured');
      return;
    }

    try {
      // Check if it's a URL or username
      if (instagram.startsWith('http')) {
        await Linking.openURL(instagram);
      } else {
        const username = instagram.replace('@', '');
        const url = `instagram://user?username=${username}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(`https://instagram.com/${username}`);
        }
      }
    } catch (error) {
      console.error('Failed to open Instagram:', error);
      Alert.alert('Error', 'Could not open Instagram');
    }
  }, [settings]);

  // Open website
  const openWebsite = useCallback(async () => {
    const website = settings.website;
    if (!website) {
      Alert.alert('Error', 'Website not configured');
      return;
    }

    try {
      const url = website.startsWith('http') ? website : `https://${website}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open website:', error);
      Alert.alert('Error', 'Could not open website');
    }
  }, [settings]);

  return {
    settings,
    loading,
    openWhatsApp,
    openTelegram,
    makeCall,
    requestPrice,
    openEmail,
    openInstagram,
    openWebsite,
    hasWhatsApp: !!settings.whatsappNumber,
    hasTelegram: !!(settings.telegramUsername || settings.telegramLink),
    hasPhone: !!settings.phoneNumber,
    hasEmail: !!settings.email,
    hasInstagram: !!settings.instagram,
    hasWebsite: !!settings.website,
  };
}
