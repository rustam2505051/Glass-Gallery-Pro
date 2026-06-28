import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../types';
import { translations } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@restartuz_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru'); // Default Russian
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && ['uz', 'ru', 'en'].includes(saved)) {
        setLanguageState(saved as Language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language]?.[key as keyof typeof translations.ru] || key;
  };

  // Check if current language is RTL (none of our languages are RTL)
  const isRTL = false;

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// Helper hook to get multilang text based on current language
export function useMLText() {
  const { language } = useLanguage();
  
  return (text: { uz: string; ru: string; en: string } | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[language] || text.en || text.ru || text.uz || '';
  };
}
