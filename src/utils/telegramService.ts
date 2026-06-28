// RestArtuz - Telegram Order Service
import { CartItem } from '../contexts/CartContext';
import { MultiLangText, Language } from '../types';

export interface TelegramSettings {
  botToken: string;
  chatId: string;
}

export interface OrderDetails {
  customerPhone: string;
  customerName?: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  notes?: string;
}

const getMLText = (text: MultiLangText | undefined, lang: Language = 'en'): string => {
  if (!text) return '';
  return text[lang] || text.en || text.ru || text.uz || '';
};

export const formatOrderMessage = (
  order: OrderDetails,
  language: Language = 'en'
): string => {
  const lines: string[] = [];
  
  lines.push('🛒 NEW ORDER');
  lines.push('═══════════════════════');
  lines.push('');
  
  if (order.customerName) {
    lines.push(`👤 Customer: ${order.customerName}`);
  }
  lines.push(`📱 Phone: ${order.customerPhone}`);
  lines.push('');
  lines.push('─────────────────────');
  lines.push('📦 PRODUCTS:');
  lines.push('─────────────────────');
  
  let grandTotal = 0;
  
  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    grandTotal += itemTotal;
    
    lines.push('');
    lines.push(`${index + 1}. ${getMLText(item.productName, language)}`);
    lines.push(`   🏷️ Code: ${item.productCode}`);
    if (item.categoryName) {
      lines.push(`   📁 Category: ${getMLText(item.categoryName, language)}`);
    }
    lines.push(`   📊 Quantity: ${item.quantity}`);
    if (item.price > 0) {
      lines.push(`   💵 Unit Price: ${item.currency} ${item.price.toLocaleString()}`);
      lines.push(`   💰 Subtotal: ${item.currency} ${itemTotal.toLocaleString()}`);
    }
  });
  
  lines.push('');
  lines.push('─────────────────────');
  lines.push('📊 ORDER SUMMARY:');
  lines.push('─────────────────────');
  lines.push(`   Total Items: ${order.totalItems}`);
  
  if (order.totalPrice > 0) {
    const currency = order.items[0]?.currency || 'USD';
    lines.push(`   💰 GRAND TOTAL: ${currency} ${order.totalPrice.toLocaleString()}`);
  }
  
  if (order.notes) {
    lines.push('');
    lines.push('─────────────────────');
    lines.push('📝 NOTES:');
    lines.push(order.notes);
  }
  
  lines.push('');
  lines.push('═══════════════════════');
  lines.push(`🕐 ${new Date().toLocaleString()}`);
  lines.push('📍 RestArtuz');
  
  return lines.join('\n');
};

export const sendTelegramOrder = async (
  settings: TelegramSettings,
  order: OrderDetails,
  language: Language = 'en'
): Promise<{ success: boolean; error?: string }> => {
  console.log('[Telegram] Starting order send...');
  console.log('[Telegram] Bot Token length:', settings.botToken?.length || 0);
  console.log('[Telegram] Chat ID:', settings.chatId);
  
  try {
    if (!settings.botToken) {
      console.error('[Telegram] No bot token configured');
      return { success: false, error: 'Telegram Bot Token not configured. Go to Admin → Telegram Settings to configure.' };
    }
    
    if (!settings.chatId) {
      console.error('[Telegram] No chat ID configured');
      return { success: false, error: 'Telegram Chat ID not configured. Go to Admin → Telegram Settings to configure.' };
    }

    const message = formatOrderMessage(order, language);
    console.log('[Telegram] Message length:', message.length);
    
    const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
    console.log('[Telegram] Sending to API...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    console.log('[Telegram] Response status:', response.status);
    const data = await response.json();
    console.log('[Telegram] Response data:', JSON.stringify(data));

    if (data.ok) {
      console.log('[Telegram] Message sent successfully');
      
      // Optionally send product images
      for (const item of order.items.slice(0, 3)) { // Max 3 images
        if (item.productImage && item.productImage.startsWith('http')) {
          try {
            console.log('[Telegram] Sending product image:', item.productCode);
            await fetch(`https://api.telegram.org/bot${settings.botToken}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: settings.chatId,
                photo: item.productImage,
                caption: `${getMLText(item.productName, language)} (${item.productCode}) x${item.quantity}`,
              }),
            });
          } catch (imgError) {
            console.warn('[Telegram] Failed to send product image:', imgError);
          }
        }
      }
      
      return { success: true };
    } else {
      console.error('[Telegram] API error:', data.description);
      return { success: false, error: `Telegram Error: ${data.description || 'Unknown error'}` };
    }
  } catch (error: any) {
    console.error('[Telegram] Network error:', error);
    return { success: false, error: `Network Error: ${error.message || 'Failed to connect to Telegram'}` };
  }
};

export default {
  formatOrderMessage,
  sendTelegramOrder,
};
