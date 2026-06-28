import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Modal,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useFavorites } from '@/src/hooks/useFavorites';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { ImageItem } from '@/src/types';

const { width, height } = Dimensions.get('window');

export default function ImageViewerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: images } = useFirestoreCollection<ImageItem>('images');
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const currentImage = images.find(img => img.id === id);
  const scale = useSharedValue(1);
  const [showInfo, setShowInfo] = useState(false);

  const pinchHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const resetZoom = () => {
    scale.value = withTiming(1);
  };

  if (!currentImage) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Image not found</Text>
      </View>
    );
  }

  const favorite = isFavorite(currentImage.id);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#FFD700',
          headerTransparent: true,
        }}
      />

      <View style={styles.imageContainer}>
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={[styles.imageWrapper, animatedStyle]}>
            <Image
              source={{ uri: currentImage.imageUrl }}
              style={styles.image}
              contentFit="contain"
              transition={300}
            />
          </Animated.View>
        </PinchGestureHandler>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleFavorite(currentImage.id)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={favorite ? 'heart' : 'heart-outline'} 
            size={28} 
            color={favorite ? '#FF4444' : '#fff'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowInfo(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={resetZoom}
          activeOpacity={0.7}
        >
          <Ionicons name="resize-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Image Details</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.infoRow}>
                <Ionicons name="document-text" size={20} color="#FFD700" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{currentImage.name}</Text>
                </View>
              </View>

              {currentImage.description && (
                <View style={styles.infoRow}>
                  <Ionicons name="information-circle" size={20} color="#FFD700" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Description</Text>
                    <Text style={styles.infoValue}>{currentImage.description}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={20} color="#FFD700" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Added</Text>
                  <Text style={styles.infoValue}>
                    {new Date(currentImage.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Hint Text */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>Pinch to zoom • Swipe to navigate</Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: width,
    height: height * 0.7,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#999',
    fontSize: 12,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
  },
});
