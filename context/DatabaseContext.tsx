import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../database/schema';
import {
  createMarker,
  deleteMarkerById,
  fetchMarkers,
  createMarkerImage,
  deleteMarkerImageById,
  fetchImagesForMarker,
} from '../database/operations';
import { MarkerRow, MarkerImageRow } from '../types';

interface DatabaseContextType {
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<MarkerRow[]>;
  addImage: (markerId: number, uri: string) => Promise<number>;
  deleteImage: (imageId: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImageRow[]>;

  isReady: boolean;
  isLoading: boolean;
  error: Error | null;

  retryInit: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined
);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setIsReady(false);

    initDatabase()
      .then((db) => {
        if (cancelled) return;
        dbRef.current = db;
        setIsReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err : new Error('Ошибка инициализации БД')
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initAttempt]);

  const requireDb = (): SQLite.SQLiteDatabase => {
    if (!dbRef.current) {
      throw new Error('База данных ещё не инициализирована.');
    }
    return dbRef.current;
  };

  const value = useMemo<DatabaseContextType>(
    () => ({
      addMarker: (lat, lng) => createMarker(requireDb(), lat, lng),
      deleteMarker: (id) => deleteMarkerById(requireDb(), id),
      getMarkers: () => fetchMarkers(requireDb()),
      addImage: (markerId, uri) => createMarkerImage(requireDb(), markerId, uri),
      deleteImage: (imageId) => deleteMarkerImageById(requireDb(), imageId),
      getMarkerImages: (markerId) => fetchImagesForMarker(requireDb(), markerId),
      isReady,
      isLoading,
      error,
      retryInit: () => setInitAttempt((n) => n + 1),
    }),
    [isReady, isLoading, error]
  );

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase должен использоваться внутри DatabaseProvider');
  }
  return ctx;
};