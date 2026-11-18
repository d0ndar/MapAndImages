import { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Map } from '../components/Map';
import { useDatabase } from '../context/DatabaseContext';
import type { Marker, MarkerData } from '../types';

const INITIAL_REGION = {
  latitude: 55.751244,
  longitude: 37.618423,
};

export default function MapScreen() {
  const router = useRouter();
  const { isReady, isLoading, error, retryInit, addMarker, getMarkers } =
    useDatabase();

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [busy, setBusy] = useState(false);

  const loadMarkers = useCallback(async () => {
    try {
      const rows = await getMarkers();
      setMarkers(rows);
    } catch (e) {
      Alert.alert(
        'Ошибка',
        e instanceof Error ? e.message : 'Не удалось загрузить маркеры.'
      );
    }
  }, [getMarkers]);

  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        void loadMarkers();
      }
    }, [isReady, loadMarkers])
  );

  const handleLongPress = useCallback(
    async (coord: { latitude: number; longitude: number }) => {
      if (busy) return;

      setBusy(true);
      try {
        await addMarker(coord.latitude, coord.longitude);
        await loadMarkers();
      } catch (e) {
        Alert.alert(
          'Ошибка',
          e instanceof Error ? e.message : 'Не удалось добавить маркер.'
        );
      } finally {
        setBusy(false);
      }
    },
    [addMarker, busy, loadMarkers]
  );

  const handleMarkerPress = useCallback(
    (id: string) => {
      try {
        router.push(`/marker/${id}`);
      } catch {
        Alert.alert(
          'Ошибка навигации',
          'Не удалось открыть экран деталей.'
        );
      }
    },
    [router]
  );

  const mapMarkers: MarkerData[] = markers.map((marker) => ({
    id: String(marker.id),
    coordinate: {
      latitude: marker.latitude,
      longitude: marker.longitude,
    },
    title: `Маркер #${marker.id}`,
  }));

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Инициализация базы данных…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Не удалось открыть базу данных: {error.message}</Text>
        <Pressable style={styles.retryBtn} onPress={retryInit}>
          <Text style={styles.retryText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        markers={mapMarkers}
        initialRegion={INITIAL_REGION}
        onLongPress={handleLongPress}
        onMarkerPress={handleMarkerPress}
      />
      {busy && (
        <View style={styles.overlay}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#208AEF',
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  overlay: { position: 'absolute', top: 12, alignSelf: 'center' },
});