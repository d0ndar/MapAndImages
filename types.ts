import { ImagePickerAsset } from 'expo-image-picker';

export interface MarkerData {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
}

export interface MarkerImage extends ImagePickerAsset {}

export type MarkerDetailsRouteParams = { id: string };

export interface MarkerRow {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MarkerImageRow {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}