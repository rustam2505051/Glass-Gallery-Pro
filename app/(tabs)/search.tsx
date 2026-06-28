import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { ImageItem } from '@/src/types';
import { orderBy } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 3;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { data: images, loading } = useFirestoreCollection<ImageItem>('images', [orderBy('createdAt', 'desc')]);

  const filteredImages = images.filter(image => 
    image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (image.description && image.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderImageItem = ({ item }: { item: ImageItem }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => router.push(`/image/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.imageOverlay}>
        <Text style={styles.imageName} numberOfLines={2}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search images..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : filteredImages.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={64} color="#333" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No images found' : 'Start searching for images'}
          </Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>
              Try different keywords
            </Text>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.resultsText}>
            {filteredImages.length} {filteredImages.length === 1 ? 'result' : 'results'}
          </Text>
          <FlatList
            data={filteredImages}
            renderItem={renderImageItem}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  resultsText: {
    color: '#999',
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContainer: {
    padding: 12,
  },
  imageItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  imageName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
