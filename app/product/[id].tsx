// RestArtuz - Premium Product Detail Screen with Cart and Swipe Navigation
// FIXED: Swipe gesture only on image area, does not block ScrollView
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLanguage, useMLText } from '@/src/contexts/LanguageContext';
import { useSettings } from '@/src/contexts/SettingsContext';
import { useCart } from '@/src/contexts/CartContext';
import { useFavorites } from '@/src/hooks/useFavorites';
import { useRecentlyViewed } from '@/src/hooks/useRecentlyViewed';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { useContactSettings } from '@/src/hooks/useContactSettings';
import { Product } from '@/src/types';
import { ProductCard } from '@/src/components/ProductCard';
import { Button } from '@/src/components/Button';
import { Loading } from '@/src/components/Loading';
import { SectionHeader } from '@/src/components/SectionHeader';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/src/constants/theme';
import { ContactService } from '@/src/utils/contact';
import { AnalyticsService } from '@/src/utils/analytics';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80; // Increased threshold for clearer intent

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const getMLText = useMLText();
  const { settings } = useSettings();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { requestPrice, openWhatsApp, openTelegram, makeCall, hasWhatsApp, hasTelegram, hasPhone } = useContactSettings();
  const { addToCart, isInCart, getCartItem } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Zoom values for pinch gesture in full screen viewer
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  
  // Swipe translation for image gallery only
  const imageTranslateX = useSharedValue(0);

  // Load product from Firebase ONLY - no demo fallback
  const { data: products, loading } = useFirestoreCollection<Product>('products');
  const product = products.find((p) => p.id === id);

  // Get products in same category for swipe navigation
  const categoryProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.categoryId === product.categoryId && p.isActive !== false);
  }, [products, product]);

  const currentIndex = useMemo(() => {
    return categoryProducts.findIndex(p => p.id === id);
  }, [categoryProducts, id]);

  // Load related products from Firebase ONLY
  const relatedProducts = products.filter(
    (p) =>
      product &&
      p.isActive !== false &&
      p.id !== product.id &&
      (p.categoryId === product.categoryId || (product.relatedProductIds && product.relatedProductIds.includes(p.id)))
  ).slice(0, 6);

  useEffect(() => {
    if (product) {
      AnalyticsService.trackProductView(product.id);
      addRecentlyViewed(product.id);
    }
  }, [product?.id]);

  // Check if product is in cart and set initial quantity
  useEffect(() => {
    if (product) {
      const cartItem = getCartItem(product.id);
      if (cartItem) {
        setQuantity(cartItem.quantity);
      } else {
        setQuantity(1);
      }
    }
  }, [product?.id, getCartItem]);

  // Navigate to previous/next product
  const navigateToProduct = useCallback((direction: 'prev' | 'next') => {
    if (categoryProducts.length <= 1) return;
    
    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < categoryProducts.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      const nextProduct = categoryProducts[newIndex];
      router.replace(`/product/${nextProduct.id}`);
    }
  }, [categoryProducts, currentIndex, router]);

  // Swipe gesture for IMAGE GALLERY ONLY - does not affect scroll
  const imageSwipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      imageTranslateX.value = e.translationX;
    })
    .onEnd((e) => {
      // Navigate only on clear horizontal swipes
      if (e.translationX > SWIPE_THRESHOLD && currentIndex > 0) {
        runOnJS(navigateToProduct)('prev');
      } else if (e.translationX < -SWIPE_THRESHOLD && currentIndex < categoryProducts.length - 1) {
        runOnJS(navigateToProduct)('next');
      }
      imageTranslateX.value = withSpring(0);
    });

  // Animated style for image swipe feedback
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: imageTranslateX.value * 0.3 }],
  }));

  // Create pinch gesture for full screen viewer
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = scale.value;
      }
    });

  const zoomAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const resetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        title: getMLText(product.name),
        message: `${getMLText(product.name)}\nCode: ${product.code}\n\nCheck out this product from RestArtuz!`,
      });
      await AnalyticsService.trackProductShare(product.id);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleRequestPrice = () => {
    if (!product) return;
    requestPrice(
      getMLText(product.name),
      product.code,
      undefined,
      language as 'uz' | 'ru' | 'en'
    );
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    Alert.alert(
      '✅ Added to Cart',
      `${getMLText(product.name)} (x${quantity}) has been added to your cart.`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
      ]
    );
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  if (loading && products.length === 0) {
    return <Loading message={t('loading')} />;
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Product not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </View>
    );
  }

  const currentImage = product.images[selectedImageIndex] || product.images[0];
  const isFav = isFavorite(product.id);
  const inCart = isInCart(product.id);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Custom Header */}
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
            <HeaderContent router={router} product={product} isFav={isFav} toggleFavorite={toggleFavorite} />
          </BlurView>
        ) : (
          <View style={[styles.headerBlur, styles.headerAndroid]}>
            <HeaderContent router={router} product={product} isFav={isFav} toggleFavorite={toggleFavorite} />
          </View>
        )}
      </Animated.View>

      {/* REGULAR ScrollView - NO gesture wrapper - scrolls freely */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: 100 }}
        bounces={true}
        scrollEventThrottle={16}
      >
        {/* Product Navigation Indicator */}
        {categoryProducts.length > 1 && (
          <Animated.View entering={FadeIn.delay(50).duration(300)} style={styles.navIndicator}>
            <TouchableOpacity
              style={[styles.navArrow, currentIndex === 0 && styles.navArrowDisabled]}
              onPress={() => navigateToProduct('prev')}
              disabled={currentIndex === 0}
            >
              <Ionicons 
                name="chevron-back" 
                size={20} 
                color={currentIndex === 0 ? Colors.textTertiary : Colors.primary} 
              />
            </TouchableOpacity>
            <Text style={styles.navText}>
              {currentIndex + 1} / {categoryProducts.length}
            </Text>
            <TouchableOpacity
              style={[styles.navArrow, currentIndex === categoryProducts.length - 1 && styles.navArrowDisabled]}
              onPress={() => navigateToProduct('next')}
              disabled={currentIndex === categoryProducts.length - 1}
            >
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={currentIndex === categoryProducts.length - 1 ? Colors.textTertiary : Colors.primary} 
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Image Gallery - SWIPE GESTURE ONLY HERE */}
        <Animated.View entering={FadeIn.delay(100).duration(500)}>
          <GestureDetector gesture={imageSwipeGesture}>
            <Animated.View style={imageAnimatedStyle}>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={() => setShowImageViewer(true)}
                activeOpacity={0.95}
              >
                <Image
                  source={{ uri: currentImage?.url || product.thumbnailUrl }}
                  style={styles.mainImage}
                  contentFit="contain"
                  contentPosition="center"
                  transition={300}
                />
                
                {/* Gradient overlay */}
                <LinearGradient
                  colors={['rgba(5, 5, 5, 0.3)', 'transparent', 'rgba(5, 5, 5, 0.5)']}
                  locations={[0, 0.5, 1]}
                  style={styles.imageOverlay}
                />

                {/* Image counter */}
                <View style={styles.imageCounter}>
                  <Ionicons name="images" size={14} color={Colors.textPrimary} />
                  <Text style={styles.imageCounterText}>
                    {selectedImageIndex + 1} / {product.images.length}
                  </Text>
                </View>

                {/* Swipe hint */}
                {categoryProducts.length > 1 && (
                  <View style={styles.swipeHint}>
                    <Ionicons name="swap-horizontal" size={16} color={Colors.textPrimary} />
                    <Text style={styles.swipeHintText}>Swipe image for more</Text>
                  </View>
                )}

                {/* Badges */}
                <View style={styles.badgeRow}>
                  {product.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                  {product.isFeatured && (
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color={Colors.background} />
                      <Text style={styles.featuredBadgeText}>Featured</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </GestureDetector>
        </Animated.View>

        {/* Thumbnail Slider */}
        {product.images.length > 1 && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <FlatList
              data={product.images}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.thumbnail,
                    index === selectedImageIndex && styles.thumbnailActive,
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image
                    source={{ uri: item.thumbnailUrl || item.url }}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                  />
                  {index === selectedImageIndex && <View style={styles.thumbnailGold} />}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsList}
            />
          </Animated.View>
        )}

        {/* Product Info */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.content}
        >
          {/* Code & Status */}
          <View style={styles.topRow}>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Product Code</Text>
              <Text style={styles.code}>{product.code}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              product.stockStatus === 'in_stock' ? styles.inStockBadge : styles.outOfStockBadge
            ]}>
              <View style={[
                styles.statusDot,
                product.stockStatus === 'in_stock' ? styles.inStockDot : styles.outOfStockDot
              ]} />
              <Text style={styles.statusText}>
                {product.stockStatus === 'in_stock' ? t('inStock') : t('outOfStock')}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.name}>{getMLText(product.name)}</Text>

          {/* Price */}
          {product.price && (
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ${product.price.toLocaleString()}
              </Text>
              <Text style={styles.currency}>{product.currency || 'USD'}</Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
              >
                <Ionicons name="remove" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
              >
                <Ionicons name="add" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[styles.addToCartButton, inCart && styles.addToCartButtonInCart]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={inCart ? [Colors.success, '#3BB060'] : [Colors.primary, Colors.goldDark]}
              style={styles.addToCartGradient}
            >
              <Ionicons 
                name={inCart ? 'checkmark-circle' : 'cart'} 
                size={22} 
                color={Colors.background} 
              />
              <Text style={styles.addToCartText}>
                {inCart ? 'Update Cart' : 'Add to Cart'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => toggleFavorite(product.id)}
            >
              <View style={[styles.quickActionIcon, isFav && styles.quickActionIconActive]}>
                <Ionicons 
                  name={isFav ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={isFav ? Colors.error : Colors.textPrimary} 
                />
              </View>
              <Text style={styles.quickActionText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleShare}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="share-social-outline" size={20} color={Colors.textPrimary} />
              </View>
              <Text style={styles.quickActionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => ContactService.openWhatsApp(settings.whatsappNumber)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#25D36620' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <Text style={styles.quickActionText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => ContactService.makeCall(settings.phoneNumbers?.[0])}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.successBg }]}>
                <Ionicons name="call-outline" size={20} color={Colors.success} />
              </View>
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('specifications')}</Text>
            <View style={styles.specsCard}>
              {product.material && (
                <View style={styles.specRow}>
                  <View style={styles.specIconBg}>
                    <Ionicons name="cube-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>{t('material')}</Text>
                  <Text style={styles.specValue}>{getMLText(product.material)}</Text>
                </View>
              )}
              
              {product.size && (
                <View style={styles.specRow}>
                  <View style={styles.specIconBg}>
                    <Ionicons name="resize-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>{t('size')}</Text>
                  <Text style={styles.specValue}>{product.size}</Text>
                </View>
              )}
              
              {product.thickness && (
                <View style={styles.specRow}>
                  <View style={styles.specIconBg}>
                    <Ionicons name="layers-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>{t('thickness')}</Text>
                  <Text style={styles.specValue}>{product.thickness}</Text>
                </View>
              )}
              
              {product.colors && product.colors.length > 0 && (
                <View style={styles.specRow}>
                  <View style={styles.specIconBg}>
                    <Ionicons name="color-palette-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>{t('colors')}</Text>
                  <Text style={styles.specValue}>{product.colors.join(', ')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('description')}</Text>
              <Text style={styles.description}>{getMLText(product.description)}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <Button
              title={t('requestPrice')}
              onPress={handleRequestPrice}
              icon={<Ionicons name="logo-whatsapp" size={20} color={Colors.background} />}
              fullWidth
              size="large"
            />
            <View style={styles.secondaryActions}>
              <Button
                title="Telegram"
                onPress={() => ContactService.openTelegram(settings.telegramUsername)}
                variant="outline"
                icon={<Ionicons name="paper-plane" size={18} color={Colors.primary} />}
                style={{ flex: 1 }}
              />
              <Button
                title={t('call')}
                onPress={() => ContactService.makeCall(settings.phoneNumbers?.[0])}
                variant="secondary"
                icon={<Ionicons name="call" size={18} color={Colors.textPrimary} />}
                style={{ flex: 1 }}
              />
            </View>
          </View>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <SectionHeader
                title={t('relatedProducts')}
                icon="🔗"
                showSeeAll={false}
              />
              <FlatList
                data={relatedProducts}
                renderItem={({ item, index }) => (
                  <View style={{ marginRight: Spacing.md }}>
                    <ProductCard
                      product={item}
                      onPress={() => router.push(`/product/${item.id}`)}
                      onFavoritePress={() => toggleFavorite(item.id)}
                      isFavorite={isFavorite(item.id)}
                      index={index}
                    />
                  </View>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 0 }}
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Full Screen Image Viewer */}
      <Modal visible={showImageViewer} transparent animationType="fade">
        <GestureHandlerRootView style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                resetZoom();
                setShowImageViewer(false);
              }}
            >
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedImageIndex + 1} / {product.images.length}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={resetZoom}>
              <Ionicons name="resize-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <GestureDetector gesture={pinchGesture}>
            <Animated.View style={[styles.imageViewerContainer, zoomAnimatedStyle]}>
              <Image
                source={{ uri: currentImage?.url || product.thumbnailUrl }}
                style={styles.fullImage}
                contentFit="contain"
              />
            </Animated.View>
          </GestureDetector>
          
          {/* Navigation arrows */}
          {product.images.length > 1 && (
            <View style={styles.imageNavigation}>
              <TouchableOpacity
                style={[styles.navButton, selectedImageIndex === 0 && styles.navButtonDisabled]}
                onPress={() => {
                  if (selectedImageIndex > 0) {
                    setSelectedImageIndex(selectedImageIndex - 1);
                    resetZoom();
                  }
                }}
                disabled={selectedImageIndex === 0}
              >
                <Ionicons name="chevron-back" size={32} color={selectedImageIndex === 0 ? Colors.textTertiary : Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, selectedImageIndex === product.images.length - 1 && styles.navButtonDisabled]}
                onPress={() => {
                  if (selectedImageIndex < product.images.length - 1) {
                    setSelectedImageIndex(selectedImageIndex + 1);
                    resetZoom();
                  }
                }}
                disabled={selectedImageIndex === product.images.length - 1}
              >
                <Ionicons name="chevron-forward" size={32} color={selectedImageIndex === product.images.length - 1 ? Colors.textTertiary : Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.imageViewerHint}>Pinch to zoom • Tap arrows to navigate</Text>
        </GestureHandlerRootView>
      </Modal>
    </GestureHandlerRootView>
  );
}

// Header Content Component
function HeaderContent({ router, product, isFav, toggleFavorite }: any) {
  return (
    <View style={styles.headerContent}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerCode}>{product.code}</Text>
      </View>
      <TouchableOpacity
        style={[styles.headerButton, isFav && styles.headerButtonActive]}
        onPress={() => toggleFavorite(product.id)}
      >
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={22}
          color={isFav ? Colors.error : Colors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    overflow: 'hidden',
  },
  headerAndroid: {
    backgroundColor: Colors.glass,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerButtonActive: {
    backgroundColor: Colors.errorBg,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerCode: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  navIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navArrowDisabled: {
    opacity: 0.5,
  },
  navText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: Colors.surface,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageCounter: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  imageCounterText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  swipeHint: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  swipeHintText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  badgeRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  newBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  newBadgeText: {
    ...Typography.overline,
    color: Colors.background,
    fontWeight: '800',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  featuredBadgeText: {
    ...Typography.overline,
    color: Colors.background,
    fontWeight: '700',
  },
  thumbnailsList: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  thumbnailActive: {
    borderColor: Colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailGold: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
  },
  content: {
    padding: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  codeContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeLabel: {
    ...Typography.overline,
    color: Colors.textTertiary,
    fontSize: 9,
    marginBottom: 2,
  },
  code: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  inStockBadge: {
    backgroundColor: Colors.successBg,
  },
  outOfStockBadge: {
    backgroundColor: Colors.errorBg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inStockDot: {
    backgroundColor: Colors.success,
  },
  outOfStockDot: {
    backgroundColor: Colors.error,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  name: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  price: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '800',
  },
  currency: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityLabel: {
    ...Typography.body2,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  addToCartButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.goldGlow,
  },
  addToCartButtonInCart: {
    ...Shadows.medium,
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  addToCartText: {
    ...Typography.button,
    color: Colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAction: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconActive: {
    backgroundColor: Colors.errorBg,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  specsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  specIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specLabel: {
    ...Typography.body2,
    color: Colors.textSecondary,
    flex: 1,
  },
  specValue: {
    ...Typography.body2,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  description: {
    ...Typography.body1,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  actionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  relatedSection: {
    marginTop: Spacing.lg,
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  imageViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: height * 0.7,
  },
  imageViewerHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    padding: Spacing.lg,
  },
  imageNavigation: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    transform: [{ translateY: -22 }],
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
});
