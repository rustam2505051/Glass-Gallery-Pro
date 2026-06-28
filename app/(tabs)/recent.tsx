import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { ImageItem } from '@/src/types';
import { orderBy } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 3;

export default function RecentScreen() {
  const router = useRouter();
  
  // Get images from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: recentImages, loading } = useFirestoreCollection<ImageItem>(
    'images',
    [orderBy('createdAt', 'desc')]
  );

  // Filter images from last 7 days
  const filteredImages = recentImages.filter(img => {
    const imageDate = img.createdAt instanceof Date ? img.createdAt : new Date(img.createdAt);
    return imageDate >= sevenDaysAgo;
  });

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
      <View style={styles.newBadge}>
        <Text style={styles.newText}>NEW</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {filteredImages.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="time-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>No recent additions</Text>
          <Text style={styles.emptySubtext}>
            Images added in the last 7 days will appear here
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.countText}>
              {filteredImages.length} new {filteredImages.length === 1 ? 'image' : 'images'} this week
            </Text>
          </View>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
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
  newBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 20,
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
