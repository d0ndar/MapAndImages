import { useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Map } from '../components/Map';
import { useMarkers } from '../context/MarkersContext';

const INITIAL_REGION = { latitude: 55.751244, longitude: 37.618423 };

export default function MapScreen() {
  const router = useRouter();
  const { markers, addMarker } = useMarkers();

  const handleLongPress = useCallback(
    (coord: { latitude: number; longitude: number }) => {
      try {
        addMarker({
          id: Date.now().toString(),
          coordinate: coord,
          title: `Место ${markers.length + 1}`,
        });
      } catch (error) {
        console.error('addMarker failed:', error);
        Alert.alert('Ошибка', 'Не удалось добавить маркер.');
      }
    },
    [addMarker, markers.length]
  );

  const handleMarkerPress = useCallback(
    (id: string) => {
      const exists = markers.some((m) => m.id === id);
      if (!exists) {
        Alert.alert('Ошибка', 'Маркер не найден.');
        return;
      }
      try {
        router.push(`/marker/${id}`);
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Ошибка навигации', 'Не удалось открыть экран деталей маркера.');
      }
    },
    [markers, router]
  );

  return (
    <View style={styles.container}>
      <Map
        markers={markers}
        initialRegion={INITIAL_REGION}
        onLongPress={handleLongPress}
        onMarkerPress={handleMarkerPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});