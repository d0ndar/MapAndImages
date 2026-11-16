import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Map } from '../components/Map';
import { useMarkers } from '../context/MarkersContext';

const INITIAL_REGION = { latitude: 55.751244, longitude: 37.618423 };

export default function MapScreen() {
  const router = useRouter();
  const { markers, addMarker } = useMarkers();

  const handleLongPress = (coord: { latitude: number; longitude: number }) => {
    addMarker({
      id: Date.now().toString(),
      coordinate: coord,
      title: `Место ${markers.length + 1}`,
    });
  };

  return (
    <View style={styles.container}>
      <Map
        markers={markers}
        initialRegion={INITIAL_REGION}
        onLongPress={handleLongPress}
        onMarkerPress={(id) => router.push(`/marker/${id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});