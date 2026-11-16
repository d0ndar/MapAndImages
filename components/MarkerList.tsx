import { MarkerData } from '../types';

export interface LeafletMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
}

// Преобразует MarkerData[] в формат, который ждёт window.setMarkers в HTML
export const serializeMarkers = (markers: MarkerData[]): LeafletMarker[] =>
  markers.map((m) => ({
    id: m.id,
    latitude: m.coordinate.latitude,
    longitude: m.coordinate.longitude,
    title: m.title,
  }));