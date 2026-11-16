import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { MarkerData } from '../types';
import { serializeMarkers } from './MarkerList';
import { buildLeafletHtml } from '../constants/leafletHtml';

interface MapProps {
  markers: MarkerData[];
  initialRegion: { latitude: number; longitude: number };
  onLongPress: (coord: { latitude: number; longitude: number }) => void;
  onMarkerPress: (id: string) => void;
}

export const Map = ({ markers, initialRegion, onLongPress, onMarkerPress }: MapProps) => {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const [html] = useState(() =>
    buildLeafletHtml(initialRegion.latitude, initialRegion.longitude, 13)
  );

  useEffect(() => {
    if (!ready || !webRef.current) return;
    try {
      const payload = serializeMarkers(markers);
      webRef.current.injectJavaScript(
        `window.setMarkers(${JSON.stringify(payload)}); true;`
      );
    } catch (e) {
      console.error('injectJavaScript failed:', e);
      setError('Не удалось обновить маркеры на карте.');
    }
  }, [markers, ready]);

  const handleRetry = useCallback(() => {
    setError(null);
    setReady(false);
    setMapKey((k) => k + 1);
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={handleRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={mapKey}
        ref={webRef}
        style={styles.web}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator />
            <Text>Загрузка карты…</Text>
          </View>
        )}
        onError={() => setError('Ошибка загрузки карты. Проверьте интернет.')}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'ready') setReady(true);
            else if (msg.type === 'longPress') onLongPress(msg.payload);
            else if (msg.type === 'markerPress') onMarkerPress(msg.payload.id);
          } catch {
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  web: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  errorText: { fontSize: 16, textAlign: 'center' },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#208AEF', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e3df',
    gap: 8,
  },
});