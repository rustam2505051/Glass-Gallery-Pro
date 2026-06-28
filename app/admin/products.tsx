import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Image, RefreshControl, Modal, ScrollView, ActivityIndicator, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../../src/config/firebase';
import { theme } from '../../src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getMLText } from '../../src/utils/adminHelpers';
import { useAdminTranslation } from '../../src/utils/adminTranslations';
import Constants from 'expo-constants';

// API URL for AI endpoint
const getApiUrl = () => {
  // Try multiple sources for the backend URL
  const backendUrl = 
    Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  
  console.log('[AI] Backend URL:', backendUrl);
  return backendUrl;
};

interface MLText {
  uz?: string;
  ru?: string;
  en?: string;
}

interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  storagePath: string;
}

interface Product {
  id: string;
  code: string;
  name: MLText;
  categoryId: string;
  categoryName?: MLText;
  description: MLText;
  images: ProductImage[];
  thumbnailUrl: string;
  material?: MLText;
  size?: string;
  thickness?: string;
  colors: string[];
  tags: string[];
  price?: number;
  currency?: string;
  stockStatus: string;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  createdAt?: any;
  updatedAt?: any;
}

interface Category {
  id: string;
  name: MLText;
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useAdminTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    nameUz: '',
    nameRu: '',
    nameEn: '',
    descriptionUz: '',
    descriptionRu: '',
    descriptionEn: '',
    categoryId: '',
    price: '',
    currency: 'USD',
    width: '',
    height: '',
    thickness: '',
    materialUz: '',
    materialRu: '',
    materialEn: '',
    colors: '',
    surfaceUz: '',
    surfaceRu: '',
    surfaceEn: '',
    finishUz: '',
    finishRu: '',
    finishEn: '',
    collection: '',
    tags: '',
    stockStatus: 'in_stock',
    isActive: true,
    isFeatured: false,
    isNew: true,
  });
  const [formImages, setFormImages] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [productsSnap, categoriesSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'categories')),
      ]);

      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      const categoriesData = categoriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredProducts = products.filter(p => {
    const nameText = getMLText(p.name);
    return nameText.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.code?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      nameUz: '',
      nameRu: '',
      nameEn: '',
      descriptionUz: '',
      descriptionRu: '',
      descriptionEn: '',
      categoryId: '',
      price: '',
      currency: 'USD',
      size: '',
      thickness: '',
      materialUz: '',
      materialRu: '',
      materialEn: '',
      colors: '',
      tags: '',
      stockStatus: 'in_stock',
      isActive: true,
      isFeatured: false,
      isNew: true,
    });
    setFormImages([]);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const attrs = product.attributes as any || {};
    setFormData({
      code: product.code || '',
      nameUz: product.name?.uz || '',
      nameRu: product.name?.ru || '',
      nameEn: product.name?.en || '',
      descriptionUz: product.description?.uz || '',
      descriptionRu: product.description?.ru || '',
      descriptionEn: product.description?.en || '',
      categoryId: product.categoryId || '',
      price: product.price?.toString() || '',
      currency: product.currency || 'USD',
      width: attrs.width || '',
      height: attrs.height || '',
      thickness: attrs.thickness || product.thickness || '',
      materialUz: (product.material as MLText)?.uz || '',
      materialRu: (product.material as MLText)?.ru || '',
      materialEn: (product.material as MLText)?.en || '',
      colors: product.colors?.join(', ') || '',
      surfaceUz: attrs.surface || '',
      surfaceRu: attrs.surface || '',
      surfaceEn: attrs.surface || '',
      finishUz: attrs.finish || '',
      finishRu: attrs.finish || '',
      finishEn: attrs.finish || '',
      collection: attrs.collection || '',
      tags: product.tags?.join(', ') || '',
      stockStatus: product.stockStatus || 'in_stock',
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured === true,
      isNew: product.isNew !== false,
    });
    // Extract image URLs from ProductImage objects
    const imageUrls = product.images?.map(img => 
      typeof img === 'string' ? img : img.url
    ) || [];
    setFormImages(imageUrls);
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setFormImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('error'), 'Failed to select images');
    }
  };

  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (uri: string, index: number): Promise<ProductImage> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const timestamp = Date.now();
    const filename = `products/${timestamp}_${index}.jpg`;
    const thumbFilename = `products/${timestamp}_${index}_thumb.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    
    return {
      id: `img_${timestamp}_${index}`,
      url: url,
      thumbnailUrl: url, // In production, generate actual thumbnail
      order: index,
      storagePath: filename,
    };
  };

  // AI-powered product description generation
  const generateAIDescription = async () => {
    console.log('[AI] generateAIDescription called');
    console.log('[AI] formImages count:', formImages.length);
    console.log('[AI] formImages:', formImages.map(img => img.substring(0, 80)));
    
    if (formImages.length === 0) {
      Alert.alert(t('error'), t('uploadImageForAi') || 'Please upload at least one image first');
      return;
    }

    setAiGenerating(true);
    console.log('[AI] Starting AI generation...');
    
    try {
      // Convert images to base64 for AI analysis
      const imagesBase64: string[] = [];
      
      for (const imageUri of formImages.slice(0, 3)) { // Max 3 images
        console.log('[AI] Processing image:', imageUri.substring(0, 80) + '...');
        try {
          let base64Data: string;
          
          if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
            // Native mobile - local file - read as base64
            console.log('[AI] Reading native local file...');
            base64Data = await FileSystem.readAsStringAsync(imageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log('[AI] Native file read, base64 length:', base64Data.length);
          } else if (imageUri.startsWith('blob:') || imageUri.startsWith('http')) {
            // Web blob URL or remote URL - fetch and convert using FileReader
            console.log('[AI] Fetching blob/http URL...');
            const response = await fetch(imageUri);
            const blob = await response.blob();
            console.log('[AI] Blob size:', blob.size, 'type:', blob.type);
            base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                console.log('[AI] FileReader result length:', result?.length);
                // Extract base64 data from data URL
                const base64 = result.split(',')[1] || result;
                resolve(base64);
              };
              reader.onerror = (e) => {
                console.error('[AI] FileReader error:', e);
                reject(e);
              };
              reader.readAsDataURL(blob);
            });
            console.log('[AI] Blob URL converted, base64 length:', base64Data.length);
          } else if (imageUri.startsWith('data:')) {
            // Already base64 data URL
            console.log('[AI] Already base64 data URL');
            base64Data = imageUri.split(',')[1] || imageUri;
            console.log('[AI] Extracted base64 length:', base64Data.length);
          } else {
            console.log('[AI] Unknown image URI format:', imageUri.substring(0, 30), '- skipping');
            continue;
          }
          
          if (base64Data && base64Data.length > 0) {
            imagesBase64.push(`data:image/jpeg;base64,${base64Data}`);
            console.log('[AI] Added image to array, total:', imagesBase64.length);
          } else {
            console.log('[AI] Empty base64 data, skipping');
          }
        } catch (e) {
          console.error('[AI] Error processing image:', e);
        }
      }

      console.log('[AI] Processed images count:', imagesBase64.length);
      
      if (imagesBase64.length === 0) {
        throw new Error('Could not process any images. Please try re-selecting the images.');
      }

      // Call AI endpoint
      const apiUrl = getApiUrl();
      const endpoint = `${apiUrl}/api/ai/analyze-product`;
      console.log('[AI] Calling API endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: imagesBase64 }),
      });

      console.log('[AI] API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI] API error response:', errorText);
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[AI] API result:', JSON.stringify(result, null, 2));

      if (result.success && result.titles) {
        // Update form with ALL AI-generated content
        setFormData(prev => ({
          ...prev,
          // Generate product code if empty
          code: prev.code || result.product_code_suggestion || `PRD-${Date.now().toString(36).toUpperCase()}`,
          // Names in all languages
          nameUz: result.titles.uz || prev.nameUz,
          nameRu: result.titles.ru || prev.nameRu,
          nameEn: result.titles.en || prev.nameEn,
          // Descriptions in all languages
          descriptionUz: result.descriptions?.uz || prev.descriptionUz,
          descriptionRu: result.descriptions?.ru || prev.descriptionRu,
          descriptionEn: result.descriptions?.en || prev.descriptionEn,
          // Material
          materialUz: result.attributes?.material || prev.materialUz,
          materialRu: result.attributes?.material || prev.materialRu,
          materialEn: result.attributes?.material || prev.materialEn,
          // Dimensions
          width: result.dimensions?.width || prev.width,
          height: result.dimensions?.height || prev.height,
          thickness: result.dimensions?.thickness || prev.thickness,
          // Colors
          colors: result.attributes?.colors?.join(', ') || result.attributes?.color || prev.colors,
          // Surface and finish
          surfaceUz: result.attributes?.surface || prev.surfaceUz,
          surfaceRu: result.attributes?.surface || prev.surfaceRu,
          surfaceEn: result.attributes?.surface || prev.surfaceEn,
          finishUz: result.attributes?.finish || prev.finishUz,
          finishRu: result.attributes?.finish || prev.finishRu,
          finishEn: result.attributes?.finish || prev.finishEn,
          // Tags and collection
          tags: result.seo?.keywords?.join(', ') || prev.tags,
          collection: result.collection || prev.collection,
        }));

        Alert.alert(
          t('success') || 'Success', 
          `✅ AI Generated Successfully!\n\n` +
          `📝 ${result.titles.en || 'Product'}\n` +
          `📐 ${result.dimensions?.width || '?'}×${result.dimensions?.height || '?'} cm\n` +
          `🎨 ${result.attributes?.material || 'N/A'}`
        );
      } else {
        // Show detailed error from AI
        const errorMsg = result.error_message || result.message || 'AI analysis failed - unknown error';
        console.error('[AI] Analysis failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('[AI] Generation error:', error);
      Alert.alert(
        t('error') || 'Error', 
        `AI Analysis Failed:\n\n${error.message || 'Unknown error occurred'}\n\nPlease check that the image is clear and try again.`
      );
    } finally {
      setAiGenerating(false);
      console.log('[AI] Generation complete');
    }
  };

  const handleSave = async () => {
    if (!formData.nameUz.trim()) {
      Alert.alert('Error', 'Product name (UZ) is required');
      return;
    }
    if (!formData.categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setSaving(true);
    try {
      // Upload new images (local URIs)
      const uploadedImages: ProductImage[] = [];
      for (let i = 0; i < formImages.length; i++) {
        const img = formImages[i];
        if (img.startsWith('file://') || img.startsWith('content://')) {
          const productImage = await uploadImage(img, i);
          uploadedImages.push(productImage);
        } else {
          // Existing image URL - create ProductImage object
          uploadedImages.push({
            id: `img_existing_${i}`,
            url: img,
            thumbnailUrl: img,
            order: i,
            storagePath: '',
          });
        }
      }

      // Get category name for denormalization
      const selectedCategory = categories.find(c => c.id === formData.categoryId);

      // Match mobile app schema EXACTLY
      const productData: Partial<Product> = {
        code: formData.code || `PRD-${Date.now()}`,
        name: {
          uz: formData.nameUz,
          ru: formData.nameRu || formData.nameUz,
          en: formData.nameEn || formData.nameUz,
        },
        categoryId: formData.categoryId,
        categoryName: selectedCategory?.name,
        description: {
          uz: formData.descriptionUz,
          ru: formData.descriptionRu || formData.descriptionUz,
          en: formData.descriptionEn || formData.descriptionUz,
        },
        images: uploadedImages,
        thumbnailUrl: uploadedImages[0]?.thumbnailUrl || '',
        material: {
          uz: formData.materialUz,
          ru: formData.materialRu || formData.materialUz,
          en: formData.materialEn || formData.materialUz,
        },
        attributes: {
          width: formData.width,
          height: formData.height,
          thickness: formData.thickness,
          surface: formData.surfaceUz || '',
          finish: formData.finishUz || '',
          collection: formData.collection || '',
        },
        colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        stockStatus: formData.stockStatus,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        updatedAt: new Date(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          viewCount: 0,
          favoriteCount: 0,
          shareCount: 0,
          relatedProductIds: [],
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Product created successfully');
      }

      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    console.log("DELETE BUTTON PRESSED", product.id);
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(
            `Are you sure you want to permanently delete "${getMLText(product.name)}"?`
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              '⚠️ PERMANENT DELETE',
              `Are you sure you want to permanently delete "${getMLText(product.name)}"?\n\nThis action CANNOT be undone.`,
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: '🗑 Delete Forever',
                  style: 'destructive',
                  onPress: () => resolve(true),
                },
              ]
            );
          });
            if (!confirmed) return;
            try {
              console.log('[Delete] Starting permanent delete for:', product.id);
              
              // Step 1: Delete all images from Firebase Storage by URL
              if (product.images && product.images.length > 0) {
                console.log('[Delete] Deleting', product.images.length, 'images...');
                for (const image of product.images) {
                  // Try storagePath first
                  if (image.storagePath) {
                    try {
                      const imageRef = ref(storage, image.storagePath);
                      await deleteObject(imageRef);
                      console.log('[Delete] Deleted by storagePath:', image.storagePath);
                    } catch (e: any) {
                      console.warn('[Delete] storagePath failed:', e.message);
                    }
                  }
                  
                  // Also try extracting path from URL
                  if (image.url && image.url.includes('firebasestorage.googleapis.com')) {
                    try {
                      const urlPath = decodeURIComponent(image.url.split('/o/')[1]?.split('?')[0] || '');
                      if (urlPath) {
                        const imageRef = ref(storage, urlPath);
                        await deleteObject(imageRef);
                        console.log('[Delete] Deleted by URL path:', urlPath);
                      }
                    } catch (e: any) {
                      console.warn('[Delete] URL path delete failed:', e.message);
                    }
                  }
                }
              }

              // Step 2: Delete thumbnail
              if (product.thumbnailUrl && product.thumbnailUrl.includes('firebasestorage.googleapis.com')) {
                try {
                  const urlPath = decodeURIComponent(product.thumbnailUrl.split('/o/')[1]?.split('?')[0] || '');
                  if (urlPath) {
                    const thumbRef = ref(storage, urlPath);
                    await deleteObject(thumbRef);
                    console.log('[Delete] Deleted thumbnail');
                  }
                } catch (e) {
                  console.warn('[Delete] Thumbnail delete failed');
                }
              }

              // Step 3: Delete entire product folder from storage
              try {
                console.log('[Delete] Deleting product folder: products/' + product.id);
                const folderRef = ref(storage, `products/${product.id}`);
                const folderContents = await listAll(folderRef);
                console.log('[Delete] Found', folderContents.items.length, 'items in folder');
                for (const item of folderContents.items) {
                  await deleteObject(item);
                  console.log('[Delete] Deleted folder item:', item.fullPath);
                }
              } catch (folderError) {
                console.warn('[Delete] Folder delete skipped (may not exist)');
              }

              // Step 4: Delete the Firestore document
              console.log('[Delete] Deleting Firestore document...');
              await deleteDoc(doc(db, 'products', product.id));
              console.log('[Delete] Firestore document deleted');
              
              // Step 5: Refresh the list
              Alert.alert(
                '✅ Deleted Permanently', 
                `"${getMLText(product.name)}" has been permanently deleted from Firestore and Storage.`
              );
              fetchData();
              
            } catch (error: any) {
              console.error('[Delete] Error:', error);
              Alert.alert('Error', `Failed to delete product: ${error.message}`);
            }

  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      {item.thumbnailUrl || item.images?.[0]?.url ? (
        <Image 
          source={{ uri: item.thumbnailUrl || item.images?.[0]?.url }} 
          style={styles.productImage} 
        />
      ) : (
        <View style={[styles.productImage, styles.placeholderImage]}>
          <Ionicons name="cube-outline" size={32} color={theme.colors.textSecondary} />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{getMLText(item.name)}</Text>
        <Text style={styles.productCode}>{item.code || 'No code'}</Text>
        <Text style={styles.productPrice}>
          {item.currency || '$'} {item.price?.toLocaleString() || '0'}
        </Text>
        <View style={styles.badgeRow}>
          {item.isActive && <View style={[styles.badge, styles.activeBadge]}><Text style={styles.badgeText}>Active</Text></View>}
          {item.isFeatured && <View style={[styles.badge, styles.featuredBadge]}><Text style={styles.badgeText}>Featured</Text></View>}
          {item.isNew && <View style={[styles.badge, styles.newBadge]}><Text style={styles.badgeText}>New</Text></View>}
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F4433620' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'New Product'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.disabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Images */}
            <Text style={styles.inputLabel}>{t('images')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
              {formImages.map((img, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: img }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary} />
                <Text style={styles.addImageText}>{t('add')}</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* AI Generate Button */}
            {formImages.length > 0 && (
              <TouchableOpacity 
                style={[styles.aiButton, aiGenerating && styles.aiButtonDisabled]} 
                onPress={() => {
                  console.log('[AI BUTTON] Button pressed! aiGenerating:', aiGenerating);
                  if (!aiGenerating) {
                    generateAIDescription();
                  }
                }}
                disabled={aiGenerating}
                activeOpacity={0.7}
              >
                {aiGenerating ? (
                  <>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={styles.aiButtonText}>{t('aiGenerating')}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#000" />
                    <Text style={styles.aiButtonText}>{t('aiGenerate')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Category Selection */}
            <Text style={styles.inputLabel}>{t('category')} *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    formData.categoryId === cat.id && styles.categoryChipSelected
                  ]}
                  onPress={() => setFormData({ ...formData, categoryId: cat.id })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formData.categoryId === cat.id && styles.categoryChipTextSelected
                  ]}>
                    {getMLText(cat.name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Product Code */}
            <Text style={styles.inputLabel}>Product Code</Text>
            <TextInput
              style={styles.input}
              value={formData.code}
              onChangeText={text => setFormData({ ...formData, code: text })}
              placeholder="e.g. KB-001"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Product Names */}
            <Text style={styles.inputLabel}>Product Name (UZ) *</Text>
            <TextInput
              style={styles.input}
              value={formData.nameUz}
              onChangeText={text => setFormData({ ...formData, nameUz: text })}
              placeholder="Mahsulot nomi"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Product Name (RU)</Text>
            <TextInput
              style={styles.input}
              value={formData.nameRu}
              onChangeText={text => setFormData({ ...formData, nameRu: text })}
              placeholder="Название продукта"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Product Name (EN)</Text>
            <TextInput
              style={styles.input}
              value={formData.nameEn}
              onChangeText={text => setFormData({ ...formData, nameEn: text })}
              placeholder="Product name"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Description (UZ)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descriptionUz}
              onChangeText={text => setFormData({ ...formData, descriptionUz: text })}
              placeholder="Tavsif"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            {/* Price & Currency */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={text => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Currency</Text>
                <TextInput
                  style={styles.input}
                  value={formData.currency}
                  onChangeText={text => setFormData({ ...formData, currency: text })}
                  placeholder="USD"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Size & Thickness */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Size</Text>
                <TextInput
                  style={styles.input}
                  value={formData.size}
                  onChangeText={text => setFormData({ ...formData, size: text })}
                  placeholder="60x60 cm"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Thickness</Text>
                <TextInput
                  style={styles.input}
                  value={formData.thickness}
                  onChangeText={text => setFormData({ ...formData, thickness: text })}
                  placeholder="8mm"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Material */}
            <Text style={styles.inputLabel}>Material (UZ)</Text>
            <TextInput
              style={styles.input}
              value={formData.materialUz}
              onChangeText={text => setFormData({ ...formData, materialUz: text })}
              placeholder="e.g. Marmar, Keramika"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Tags & Colors */}
            <Text style={styles.inputLabel}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.tags}
              onChangeText={text => setFormData({ ...formData, tags: text })}
              placeholder="marble, luxury, kitchen"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Colors (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.colors}
              onChangeText={text => setFormData({ ...formData, colors: text })}
              placeholder="white, beige, gray"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Toggles */}
            <View style={styles.toggleSection}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={value => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Featured</Text>
                <Switch
                  value={formData.isFeatured}
                  onValueChange={value => setFormData({ ...formData, isFeatured: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>New Arrival</Text>
                <Switch
                  value={formData.isNew}
                  onValueChange={value => setFormData({ ...formData, isNew: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceLight,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  productCode: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#4CAF5020',
  },
  featuredBadge: {
    backgroundColor: '#FF980020',
  },
  newBadge: {
    backgroundColor: '#2196F320',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  addImageText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  categoryChipText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#000',
  },
  toggleSection: {
    marginTop: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  aiButtonDisabled: {
    opacity: 0.7,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});
