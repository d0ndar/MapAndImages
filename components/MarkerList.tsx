import type { LeafletMarker, MarkerData } from '../types';

export const serializeMarkers = (markers: MarkerData[]): LeafletMarker[] =>
  markers.map((marker) => ({
    id: marker.id,
    latitude: marker.coordinate.latitude,
    longitude: marker.coordinate.longitude,
    title: marker.title,
  }));