import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Image, RefreshControl, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../../src/config/firebase';
import { theme } from '../../src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getMLText } from '../../src/utils/adminHelpers';

interface MLText {
  uz?: string;
  ru?: string;
  en?: string;
}

interface Category {
  id: string;
  name: MLText;
  description?: MLText;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  productCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nameUz: '',
    nameRu: '',
    nameEn: '',
    order: '0',
    isActive: true,
  });
  const [formImage, setFormImage] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const categoriesSnap = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
      const categoriesData = categoriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ nameUz: '', nameRu: '', nameEn: '', order: '0', isActive: true });
    setFormImage(null);
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nameUz: category.name?.uz || '',
      nameRu: category.name?.ru || '',
      nameEn: category.name?.en || '',
      order: category.order?.toString() || '0',
      isActive: category.isActive !== false,
    });
    setFormImage(category.imageUrl || null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `categories/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!formData.nameUz.trim()) {
      Alert.alert('Error', 'Category name (UZ) is required');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formImage;
      if (formImage && (formImage.startsWith('file://') || formImage.startsWith('content://'))) {
        imageUrl = await uploadImage(formImage);
      }

      // Match mobile app schema exactly
      const categoryData = {
        name: {
          uz: formData.nameUz,
          ru: formData.nameRu || formData.nameUz,
          en: formData.nameEn || formData.nameUz,
        },
        imageUrl: imageUrl || '',
        order: parseInt(formData.order) || 0,
        isActive: formData.isActive,
        updatedAt: new Date(),
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          productCount: 0,
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Category created successfully');
      }

      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    // First check if category has products
    const checkAndDeleteCategory = async () => {
      const productsSnap = await getDocs(
        query(collection(db, 'products'), where('categoryId', '==', category.id))
      );
      const productCount = productsSnap.docs.length;

      if (productCount > 0) {
        Alert.alert(
          'Category Has Products',
          `This category contains ${productCount} product(s).\n\nDo you want to permanently delete the category AND all ${productCount} products with their images?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: `Delete All (${productCount + 1} items)`,
              style: 'destructive',
              onPress: async () => {
                try {
                  // Delete all products and their images
                  for (const productDoc of productsSnap.docs) {
                    const product = productDoc.data();
                    
                    // Delete product images from Storage
                    if (product.images && product.images.length > 0) {
                      for (const image of product.images) {
                        if (image.storagePath) {
                          try {
                            const imageRef = ref(storage, image.storagePath);
                            await deleteObject(imageRef);
                          } catch (e) {
                            console.warn('Failed to delete product image');
                          }
                        }
                      }
                    }
                    
                    // Delete product folder
                    try {
                      const folderRef = ref(storage, `products/${productDoc.id}`);
                      const folderContents = await listAll(folderRef);
                      for (const item of folderContents.items) {
                        await deleteObject(item);
                      }
                    } catch (e) {}
                    
                    // Delete product document
                    await deleteDoc(doc(db, 'products', productDoc.id));
                  }
                  
                  // Delete category image
                  if (category.imageUrl) {
                    try {
                      const imageRef = ref(storage, `categories/${category.id}`);
                      await deleteObject(imageRef);
                    } catch (e) {}
                  }
                  
                  // Delete category document
                  await deleteDoc(doc(db, 'categories', category.id));
                  
                  Alert.alert('Success', `Category and ${productCount} products permanently deleted`);
                  fetchCategories();
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                }
              },
            },
          ]
        );
        return;
      }

      // No products - just delete category
      Alert.alert(
        'Delete Category',
        `Permanently delete "${getMLText(category.name)}"?\n\nThis action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete category image from Storage
                if (category.imageUrl) {
                  try {
                    const imageRef = ref(storage, `categories/${category.id}`);
                    await deleteObject(imageRef);
                  } catch (imgError) {}
                }
                
                // Delete the Firestore document
                await deleteDoc(doc(db, 'categories', category.id));
                Alert.alert('Success', 'Category deleted permanently');
                fetchCategories();
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            },
          },
        ]
      );
    };

    checkAndDeleteCategory();
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.categoryImage} />
      ) : (
        <View style={[styles.categoryImage, styles.placeholderImage]}>
          <Ionicons name="grid-outline" size={28} color={theme.colors.textSecondary} />
        </View>
      )}
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{getMLText(item.name)}</Text>
        <Text style={styles.categoryOrder}>Order: {item.order || 0}</Text>
        <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#F4433620' }]}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={18} color="#F44336" />
      </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{categories.length} Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#000" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No categories found</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.disabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Category Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {formImage ? (
                <Image source={{ uri: formImage }} style={styles.pickerImage} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={theme.colors.textSecondary} />
                  <Text style={styles.pickerText}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Category Name (UZ) *</Text>
            <TextInput
              style={styles.input}
              value={formData.nameUz}
              onChangeText={text => setFormData({ ...formData, nameUz: text })}
              placeholder="Kategoriya nomi"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Category Name (RU)</Text>
            <TextInput
              style={styles.input}
              value={formData.nameRu}
              onChangeText={text => setFormData({ ...formData, nameRu: text })}
              placeholder="Название категории"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Category Name (EN)</Text>
            <TextInput
              style={styles.input}
              value={formData.nameEn}
              onChangeText={text => setFormData({ ...formData, nameEn: text })}
              placeholder="Category name"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Display Order</Text>
            <TextInput
              style={styles.input}
              value={formData.order}
              onChangeText={text => setFormData({ ...formData, order: text })}
              placeholder="0"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active</Text>
              <TouchableOpacity
                style={[styles.toggle, formData.isActive && styles.toggleActive]}
                onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
              >
                <Text style={styles.toggleText}>{formData.isActive ? 'Yes' : 'No'}</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#000',
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceLight,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryOrder: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusActive: {
    backgroundColor: '#4CAF5020',
  },
  statusInactive: {
    backgroundColor: '#F4433620',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  pickerImage: {
    width: '100%',
    height: '100%',
  },
  pickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F4433620',
  },
  toggleActive: {
    backgroundColor: '#4CAF5020',
  },
  toggleText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
