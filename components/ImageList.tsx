import {
  View,
  Image,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import type { MarkerImage } from '../types';

interface ImageListProps {
  images: MarkerImage[];
  onDelete: (imageId: number) => void;
}

export const ImageList = ({ images, onDelete }: ImageListProps) => (
  <FlatList
    data={images}
    keyExtractor={(item) => String(item.id)}
    numColumns={2}
    contentContainerStyle={styles.list}
    ListEmptyComponent={
      <Text style={styles.empty}>Нет изображений. Добавьте первое!</Text>
    }
    renderItem={({ item }) => (
      <View style={styles.wrapper}>
        <Image source={{ uri: item.uri }} style={styles.image} />
        <TouchableOpacity
          style={styles.delete}
          onPress={() => onDelete(item.id)}
          accessibilityLabel="Удалить изображение"
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    )}
  />
);

const styles = StyleSheet.create({
  list: {
    paddingBottom: 20,
  },
  wrapper: {
    flex: 1,
    margin: 4,
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  delete: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});