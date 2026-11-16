import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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

  const [html] = useState(() =>
    buildLeafletHtml(initialRegion.latitude, initialRegion.longitude, 13)
  );

  useEffect(() => {
    if (!ready || !webRef.current) return;
    const payload = serializeMarkers(markers);
    webRef.current.injectJavaScript(
      `window.setMarkers(${JSON.stringify(payload)}); true;`
    );
  }, [markers, ready]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
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
            // игнорируем невалидные сообщения
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  web: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e3df',
    gap: 8,
  },
});