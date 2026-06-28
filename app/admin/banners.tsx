import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Image, RefreshControl, Modal, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../src/config/firebase';
import { theme } from '../../src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getMLText } from '../../src/utils/adminHelpers';
import { useAdminTranslation } from '../../src/utils/adminTranslations';

interface MLText {
  uz?: string;
  ru?: string;
  en?: string;
}

interface Banner {
  id: string;
  title?: MLText | string;
  subtitle?: MLText | string;
  imageUrl?: string;
  image?: string;
  linkType?: string;
  linkId?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export default function BannersScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useAdminTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titleUz: '',
    titleRu: '',
    titleEn: '',
    subtitleUz: '',
    subtitleRu: '',
    subtitleEn: '',
    linkUrl: '',
    order: '0',
    isActive: true,
  });
  const [formImage, setFormImage] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      const bannersSnap = await getDocs(query(collection(db, 'banners'), orderBy('order', 'asc')));
      const bannersData = bannersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Banner[];
      setBanners(bannersData);
    } catch (error) {
      console.error('Error fetching banners:', error);
      Alert.alert(t('error'), t('failedToLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBanners();
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({
      titleUz: '',
      titleRu: '',
      titleEn: '',
      subtitleUz: '',
      subtitleRu: '',
      subtitleEn: '',
      linkUrl: '',
      order: '0',
      isActive: true,
    });
    setFormImage(null);
    setModalVisible(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    
    // Handle both string and MLText format for title
    const titleObj = typeof banner.title === 'object' ? banner.title : { uz: banner.title || '', ru: banner.title || '', en: banner.title || '' };
    const subtitleObj = typeof banner.subtitle === 'object' ? banner.subtitle : { uz: banner.subtitle || '', ru: banner.subtitle || '', en: banner.subtitle || '' };
    
    setFormData({
      titleUz: titleObj?.uz || '',
      titleRu: titleObj?.ru || '',
      titleEn: titleObj?.en || '',
      subtitleUz: subtitleObj?.uz || '',
      subtitleRu: subtitleObj?.ru || '',
      subtitleEn: subtitleObj?.en || '',
      linkUrl: banner.linkUrl || '',
      order: banner.order?.toString() || '0',
      isActive: banner.isActive !== false,
    });
    setFormImage(banner.imageUrl || banner.image || null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `banners/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!formData.titleUz.trim()) {
      Alert.alert(t('error'), `${t('titleUz')} - ${t('requiredField')}`);
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formImage;
      if (formImage && (formImage.startsWith('file://') || formImage.startsWith('content://'))) {
        imageUrl = await uploadImage(formImage);
      }

      // Match mobile app schema exactly
      const bannerData = {
        title: {
          uz: formData.titleUz,
          ru: formData.titleRu || formData.titleUz,
          en: formData.titleEn || formData.titleUz,
        },
        subtitle: {
          uz: formData.subtitleUz,
          ru: formData.subtitleRu || formData.subtitleUz,
          en: formData.subtitleEn || formData.subtitleUz,
        },
        imageUrl: imageUrl || '',
        linkType: formData.linkUrl ? 'url' : 'none',
        linkUrl: formData.linkUrl || '',
        order: parseInt(formData.order) || 0,
        isActive: formData.isActive,
        updatedAt: new Date(),
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerData);
        Alert.alert(t('success'), t('bannerUpdated'));
      } else {
        await addDoc(collection(db, 'banners'), {
          ...bannerData,
          createdAt: new Date(),
        });
        Alert.alert(t('success'), t('bannerCreated'));
      }

      setModalVisible(false);
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      Alert.alert(t('error'), t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (banner: Banner) => {
    const titleText = getMLText(banner.title);
    Alert.alert(
      t('delete'),
      `${t('confirmDeleteBanner')}\n"${titleText}"\n\nThis will also delete the banner image.`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete banner image from Storage
              const imageUrl = banner.imageUrl || banner.image;
              if (imageUrl) {
                try {
                  const imageRef = ref(storage, `banners/${banner.id}`);
                  await deleteObject(imageRef);
                } catch (imgError) {
                  console.warn('Failed to delete banner image:', imgError);
                }
              }
              
              // Delete the Firestore document
              await deleteDoc(doc(db, 'banners', banner.id));
              Alert.alert(t('success'), t('bannerDeleted'));
              fetchBanners();
            } catch (error: any) {
              Alert.alert(t('error'), `${t('failedToDelete')}: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const renderBanner = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      style={styles.bannerCard}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      {(item.imageUrl || item.image) ? (
        <Image source={{ uri: item.imageUrl || item.image }} style={styles.bannerImage} />
      ) : (
        <View style={[styles.bannerImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={40} color={theme.colors.textSecondary} />
        </View>
      )}
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{getMLText(item.title) || t('noTitle')}</Text>
        {item.subtitle && <Text style={styles.bannerSubtitle}>{getMLText(item.subtitle)}</Text>}
        <View style={styles.bannerMeta}>
          <Text style={styles.bannerOrder}>{t('order')}: {item.order || 0}</Text>
          <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{item.isActive ? t('active') : t('inactive')}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{banners.length} {t('banners')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#000" />
          <Text style={styles.addButtonText}>{t('add')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={banners}
        renderItem={renderBanner}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{t('noBanners')}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>{t('addBanner')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingBanner ? t('editBanner') : t('newBanner')}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.disabled]}>
                {saving ? t('saving') : t('save')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>{t('bannerImage')} (16:9)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {formImage ? (
                <Image source={{ uri: formImage }} style={styles.pickerImage} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={theme.colors.textSecondary} />
                  <Text style={styles.pickerText}>{t('tapToSelectImage')}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{t('titleUz')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.titleUz}
              onChangeText={text => setFormData({ ...formData, titleUz: text })}
              placeholder="Banner sarlavhasi"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>{t('titleRu')}</Text>
            <TextInput
              style={styles.input}
              value={formData.titleRu}
              onChangeText={text => setFormData({ ...formData, titleRu: text })}
              placeholder="Заголовок баннера"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>{t('titleEn')}</Text>
            <TextInput
              style={styles.input}
              value={formData.titleEn}
              onChangeText={text => setFormData({ ...formData, titleEn: text })}
              placeholder="Banner title"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>{t('subtitle')} (UZ)</Text>
            <TextInput
              style={styles.input}
              value={formData.subtitleUz}
              onChangeText={text => setFormData({ ...formData, subtitleUz: text })}
              placeholder="Qoshimcha sarlavha"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>{t('subtitle')} (RU)</Text>
            <TextInput
              style={styles.input}
              value={formData.subtitleRu}
              onChangeText={text => setFormData({ ...formData, subtitleRu: text })}
              placeholder="Подзаголовок"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>{t('subtitle')} (EN)</Text>
            <TextInput
              style={styles.input}
              value={formData.subtitleEn}
              onChangeText={text => setFormData({ ...formData, subtitleEn: text })}
              placeholder="Subtitle"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>{t('link')}</Text>
            <TextInput
              style={styles.input}
              value={formData.linkUrl}
              onChangeText={text => setFormData({ ...formData, linkUrl: text })}
              placeholder="https://..."
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="url"
            />

            <Text style={styles.inputLabel}>{t('displayOrder')}</Text>
            <TextInput
              style={styles.input}
              value={formData.order}
              onChangeText={text => setFormData({ ...formData, order: text })}
              placeholder="0"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('active')}</Text>
              <Switch
                value={formData.isActive}
                onValueChange={value => setFormData({ ...formData, isActive: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
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
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
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
  bannerCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  bannerImage: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.surfaceLight,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    padding: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  bannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  bannerOrder: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 15,
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
    fontSize: 17,
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
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imagePicker: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  pickerImage: {
    width: '100%',
    height: 180,
  },
  pickerPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
});
