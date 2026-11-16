import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const [html] = useState(() =>
    buildLeafletHtml(initialRegion.latitude, initialRegion.longitude, 13)
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!msg || typeof msg.type !== 'string') return;
        if (msg.type === 'ready') setReady(true);
        else if (msg.type === 'longPress') onLongPress(msg.payload);
        else if (msg.type === 'markerPress') onMarkerPress(msg.payload.id);
      } catch {
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLongPress, onMarkerPress]);

  useEffect(() => {
    if (!ready) return;
    try {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      const payload = serializeMarkers(markers);
      iframe.contentWindow.postMessage({ type: 'setMarkers', payload }, '*');
    } catch (e) {
      console.error('postMessage failed:', e);
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
      <iframe
        key={mapKey}
        ref={iframeRef}
        srcDoc={html}
        style={styles.iframe}
        onError={() => setError('Ошибка загрузки карты.')}
        title="OpenStreetMap"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  iframe: {
    flex: 1,
    border: 'none',
    width: '100%',
    height: '100%',
  } as any,
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  errorText: { fontSize: 16, textAlign: 'center' },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#208AEF', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});