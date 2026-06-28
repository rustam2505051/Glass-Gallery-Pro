// RestArtuz - Premium Cart Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useCart, CartItem } from '@/src/contexts/CartContext';
import { useLanguage, useMLText } from '@/src/contexts/LanguageContext';
import { useSettings } from '@/src/contexts/SettingsContext';
import { sendTelegramOrder, TelegramSettings, OrderDetails } from '@/src/utils/telegramService';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/src/constants/theme';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const getMLText = useMLText();
  const { settings } = useSettings();
  const { items, totalItems, totalPrice, incrementQuantity, decrementQuantity, removeFromCart, clearCart } = useCart();
  
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendOrder = async () => {
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    // Check Telegram settings first
    const botToken = settings.telegramBotToken;
    const chatId = settings.telegramChatId;
    
    console.log('[Order] Telegram Bot Token:', botToken ? `${botToken.substring(0, 10)}...` : 'NOT SET');
    console.log('[Order] Telegram Chat ID:', chatId || 'NOT SET');
    
    if (!botToken || !chatId) {
      Alert.alert(
        'Telegram Not Configured',
        'Please configure Telegram Bot Token and Chat ID in Admin → Telegram Settings before sending orders.\n\nBot Token: ' + (botToken ? '✓' : '✗') + '\nChat ID: ' + (chatId ? '✓' : '✗'),
        [{ text: 'OK' }]
      );
      return;
    }

    setSending(true);

    const telegramSettings: TelegramSettings = {
      botToken: botToken,
      chatId: chatId,
    };

    const orderDetails: OrderDetails = {
      customerPhone: customerPhone.trim(),
      customerName: customerName.trim() || undefined,
      items,
      totalItems,
      totalPrice,
      notes: orderNotes.trim() || undefined,
    };

    console.log('[Order] Sending order with', items.length, 'items');
    
    const result = await sendTelegramOrder(telegramSettings, orderDetails, language as 'uz' | 'ru' | 'en');

    console.log('[Order] Result:', result);
    
    setSending(false);

    if (result.success) {
      Alert.alert(
        '✅ Order Sent!',
        'Your order has been sent successfully. We will contact you soon.',
        [{
          text: 'OK',
          onPress: () => {
            clearCart();
            setShowOrderModal(false);
            setCustomerPhone('');
            setCustomerName('');
            setOrderNotes('');
          },
        }]
      );
    } else {
      Alert.alert(
        '❌ Send Failed', 
        `Error: ${result.error}\n\nPlease check your Telegram settings in Admin Panel.`
      );
    }
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={styles.cartItem}
    >
      <Image
        source={{ uri: item.productImage }}
        style={styles.itemImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {getMLText(item.productName)}
        </Text>
        <Text style={styles.itemCode}>{item.productCode}</Text>
        {item.price > 0 && (
          <Text style={styles.itemPrice}>
            {item.currency} {(item.price * item.quantity).toLocaleString()}
          </Text>
        )}
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => decrementQuantity(item.productId)}
        >
          <Ionicons name="remove" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => incrementQuantity(item.productId)}
        >
          <Ionicons name="add" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => {
          Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(item.productId) },
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </Animated.View>
  );

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 Cart</Text>
        </View>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add products to your cart to place an order"
          actionLabel="Browse Products"
          onAction={() => router.push('/(tabs)/categories')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Cart</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            Alert.alert(
              'Clear Cart',
              'Are you sure you want to remove all items?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: clearCart },
              ]
            );
          }}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Summary */}
      <Animated.View 
        entering={FadeInUp.duration(400)}
        style={[styles.summaryContainer, { paddingBottom: insets.bottom + 90 }]}
      >
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items:</Text>
          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>
        {totalPrice > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Price:</Text>
            <Text style={styles.totalPrice}>
              {items[0]?.currency || 'USD'} {totalPrice.toLocaleString()}
            </Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          <Button
            title="Continue Shopping"
            variant="outline"
            onPress={() => router.push('/(tabs)/categories')}
            style={{ flex: 1 }}
          />
          <Button
            title="Send Order"
            onPress={() => setShowOrderModal(true)}
            icon={<Ionicons name="paper-plane" size={18} color={Colors.background} />}
            style={{ flex: 1 }}
          />
        </View>
      </Animated.View>

      {/* Order Modal */}
      <Modal visible={showOrderModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { paddingTop: insets.top }]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowOrderModal(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Complete Order</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123 45 67"
              placeholderTextColor={Colors.textTertiary}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Your Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textTertiary}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any special requests..."
              placeholderTextColor={Colors.textTertiary}
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
              numberOfLines={3}
            />

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              {items.map((item) => (
                <View key={item.productId} style={styles.summaryItem}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {getMLText(item.productName)}
                  </Text>
                  <Text style={styles.summaryItemQty}>x{item.quantity}</Text>
                </View>
              ))}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Total Items:</Text>
                <Text style={styles.summaryTotalValue}>{totalItems}</Text>
              </View>
              {totalPrice > 0 && (
                <View style={styles.summaryTotal}>
                  <Text style={styles.summaryTotalLabel}>Total Price:</Text>
                  <Text style={styles.summaryTotalPrice}>
                    {items[0]?.currency || 'USD'} {totalPrice.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            <Button
              title={sending ? 'Sending...' : 'Send Order via Telegram'}
              onPress={handleSendOrder}
              disabled={sending}
              icon={<Ionicons name="paper-plane" size={20} color={Colors.background} />}
              fullWidth
              size="large"
              style={{ marginTop: Spacing.lg }}
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  clearButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearButtonText: {
    ...Typography.body2,
    color: Colors.error,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 300,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    ...Typography.body2,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  itemCode: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 2,
  },
  itemPrice: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...Typography.body2,
    color: Colors.textPrimary,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.sm,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.body2,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  totalPrice: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body1,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  orderSummary: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryItemName: {
    ...Typography.body2,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.md,
  },
  summaryItemQty: {
    ...Typography.body2,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  summaryTotalLabel: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  summaryTotalValue: {
    ...Typography.body2,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  summaryTotalPrice: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
});
