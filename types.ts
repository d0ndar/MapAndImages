import { ImagePickerAsset } from 'expo-image-picker';

export interface MarkerData {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
}

export interface MarkerImage extends ImagePickerAsset {}

export type MarkerDetailsRouteParams = { id: string };