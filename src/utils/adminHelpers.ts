/**
 * Helper functions for Admin Panel
 */

/**
 * Multilingual text type
 */
export interface MLText {
  uz?: string;
  ru?: string;
  en?: string;
  [key: string]: string | undefined;
}

/**
 * Get text from multilingual object
 * Falls back to: current language -> uz -> ru -> en -> first available -> empty string
 */
export function getMLText(text: string | MLText | undefined | null, lang: string = 'uz'): string {
  if (!text) return '';
  
  // If it's already a string, return it
  if (typeof text === 'string') return text;
  
  // If it's an object, get the appropriate language
  if (typeof text === 'object') {
    return text[lang] || text.uz || text.ru || text.en || Object.values(text).find(v => typeof v === 'string') || '';
  }
  
  return String(text);
}

/**
 * Format date for display
 */
export function formatDate(timestamp: any): string {
  if (!timestamp) return 'N/A';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  } catch {
    return 'N/A';
  }
}

/**
 * Format date and time for display
 */
export function formatDateTime(timestamp: any): string {
  if (!timestamp) return 'N/A';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'N/A';
  }
}
