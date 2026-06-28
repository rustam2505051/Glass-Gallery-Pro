// Contact Integration Utilities
import { Linking, Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';

export class ContactService {
  /**
   * Open WhatsApp with pre-filled message
   */
  static async openWhatsApp(phoneNumber: string, message?: string) {
    try {
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
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
      Alert.alert('Error', 'Could not open WhatsApp');
    }
  }

  /**
   * Open Telegram
   */
  static async openTelegram(username: string) {
    try {
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
  }

  /**
   * Make phone call
   */
  static async makeCall(phoneNumber: string) {
    try {
      const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
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
  }

  /**
   * Request price via WhatsApp
   */
  static async requestPrice(
    whatsappNumber: string,
    productName: string,
    productCode: string,
    language: 'uz' | 'ru' | 'en' = 'ru'
  ) {
    const messages = {
      uz: `Salom! ${productName} (Kod: ${productCode}) mahsuloti narxini bilmoqchiman.`,
      ru: `Здравствуйте! Хочу узнать цену на ${productName} (Код: ${productCode}).`,
      en: `Hello! I would like to know the price for ${productName} (Code: ${productCode}).`,
    };

    await this.openWhatsApp(whatsappNumber, messages[language]);
  }

  /**
   * Request callback via WhatsApp
   */
  static async requestCallback(
    whatsappNumber: string,
    language: 'uz' | 'ru' | 'en' = 'ru'
  ) {
    const messages = {
      uz: "Salom! Menga qayta qo'ng'iroq qilishingizni so'rayman.",
      ru: 'Здравствуйте! Прошу перезвонить мне.',
      en: 'Hello! Please call me back.',
    };

    await this.openWhatsApp(whatsappNumber, messages[language]);
  }
}

/**
 * Share product
 */
export async function shareProduct(
  productName: string,
  productCode: string,
  productUrl?: string
) {
  try {
    const message = `${productName}\nCode: ${productCode}${productUrl ? `\n${productUrl}` : ''}`;
    
    if (Platform.OS === 'web') {
      // Web sharing
      if (navigator.share) {
        await navigator.share({
          title: productName,
          text: message,
          url: productUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(message);
        Alert.alert('Success', 'Link copied to clipboard');
      }
    } else {
      // Native sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(message);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Failed to share:', error);
  }
}
