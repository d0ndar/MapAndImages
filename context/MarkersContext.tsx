import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { MarkerData, MarkerImage } from '../types';

interface MarkersContextType {
  markers: MarkerData[];
  images: Record<string, MarkerImage[]>;
  addMarker: (marker: MarkerData) => void;
  addImageToMarker: (markerId: string, image: MarkerImage) => void;
  removeImageFromMarker: (markerId: string, imageUri: string) => void;
  getImagesForMarker: (markerId: string) => MarkerImage[];
}

const MarkersContext = createContext<MarkersContextType | undefined>(undefined);

export const MarkersProvider = ({ children }: { children: ReactNode }) => {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [images, setImages] = useState<Record<string, MarkerImage[]>>({});

  const addMarker = useCallback((marker: MarkerData) => {
    setMarkers((prev) => [...prev, marker]);
  }, []);

  const addImageToMarker = useCallback((markerId: string, image: MarkerImage) => {
    setImages((prev) => ({
      ...prev,
      [markerId]: [...(prev[markerId] ?? []), image],
    }));
  }, []);

  const removeImageFromMarker = useCallback((markerId: string, imageUri: string) => {
    setImages((prev) => ({
      ...prev,
      [markerId]: (prev[markerId] ?? []).filter((img) => img.uri !== imageUri),
    }));
  }, []);

  const getImagesForMarker = useCallback(
    (markerId: string) => images[markerId] ?? [],
    [images]
  );

  const value = useMemo(
    () => ({
      markers,
      images,
      addMarker,
      addImageToMarker,
      removeImageFromMarker,
      getImagesForMarker,
    }),
    [markers, images, addMarker, addImageToMarker, removeImageFromMarker, getImagesForMarker]
  );

  return <MarkersContext.Provider value={value}>{children}</MarkersContext.Provider>;
};

export const useMarkers = () => {
  const ctx = useContext(MarkersContext);
  if (!ctx) throw new Error('useMarkers must be used within MarkersProvider');
  return ctx;
};