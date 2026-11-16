// components/Map.web.tsx
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

  const [html] = useState(() =>
    buildLeafletHtml(initialRegion.latitude, initialRegion.longitude, 13)
  );

  // Слушаем сообщения из iframe (готовность карты, клики, long-press)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ready') {
          setReady(true);
        } else if (msg.type === 'longPress') {
          onLongPress(msg.payload);
        } else if (msg.type === 'markerPress') {
          onMarkerPress(msg.payload.id);
        }
      } catch {
        // Игнорируем сообщения не от нашего iframe
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLongPress, onMarkerPress]);

  // Синхронизируем маркеры при их изменении
  useEffect(() => {
    if (!ready || !iframeRef.current?.contentWindow) return;
    const payload = serializeMarkers(markers);
    iframeRef.current.contentWindow.postMessage(
      { type: 'setMarkers', payload },
      '*'
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
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={styles.iframe}
        onError={() => setError('Ошибка загрузки карты.')}
        title="Leaflet Map"
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
  } as any, // Стили для iframe в RN Web
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});