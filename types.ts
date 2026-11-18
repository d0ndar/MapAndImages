export interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MarkerImage {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}

export interface MarkerData {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
}

export interface LeafletMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
}

export type MarkerDetailsRouteParams = {
  id: string;
};