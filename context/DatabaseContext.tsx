import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
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
import type { Marker, MarkerImage } from '../types';
import { persistImage, removePersistedImage } from '../utils/imageStorage';

interface DatabaseContextType {
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;

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

    const open = async () => {
      setIsLoading(true);
      setError(null);
      setIsReady(false);

      if (dbRef.current) {
        await dbRef.current.closeAsync().catch((closeError) => {
          console.error(
            '[DB] Не удалось закрыть предыдущее соединение:',
            closeError
          );
        });
        dbRef.current = null;
      }

      try {
        const db = await initDatabase();

        if (cancelled) {
          await db.closeAsync().catch(() => undefined);
          return;
        }

        dbRef.current = db;
        setIsReady(true);
      } catch (err: unknown) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err : new Error('Ошибка инициализации БД')
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void open();

    return () => {
      cancelled = true;

      if (dbRef.current) {
        dbRef.current.closeAsync().catch((closeError) => {
          console.error('[DB] Ошибка при закрытии БД:', closeError);
        });
        dbRef.current = null;
      }
    };
  }, [initAttempt]);

  const requireDb = useCallback((): SQLite.SQLiteDatabase => {
    if (!dbRef.current) {
      throw new Error('База данных ещё не инициализирована.');
    }
    return dbRef.current;
  }, []);

  const retryInit = useCallback(() => {
    setInitAttempt((n) => n + 1);
  }, []);

  const value = useMemo<DatabaseContextType>(
    () => ({
      addMarker: (latitude: number, longitude: number) =>
        createMarker(requireDb(), latitude, longitude),

      deleteMarker: (id: number) => deleteMarkerById(requireDb(), id),

      getMarkers: () => fetchMarkers(requireDb()),

      addImage: async (markerId: number, uri: string) => {
        await createMarkerImage(requireDb(), markerId, uri);
      },

      deleteImage: (id: number) => deleteMarkerImageById(requireDb(), id),

      getMarkerImages: (markerId: number) =>
        fetchImagesForMarker(requireDb(), markerId),

      isReady,
      isLoading,
      error,
      retryInit,

      addImage: async (markerId: number, uri: string) => {
      const db = requireDb();
      const permanentUri = await persistImage(uri);

      try {
        await createMarkerImage(db, markerId, permanentUri);
      } catch (error) {
        await removePersistedImage(permanentUri);
        throw error;
      }
    },

    deleteImage: async (id: number) => {
      const db = requireDb();

      const row = await db.getFirstAsync<{ uri: string }>(
        'SELECT uri FROM marker_images WHERE id = ?;',
        id
      );

      await deleteMarkerImageById(db, id);

      if (row?.uri) {
        await removePersistedImage(row.uri);
      }
    },

    }),
    [isReady, isLoading, error, requireDb, retryInit]
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
    throw new Error(
      'useDatabase должен использоваться внутри DatabaseProvider'
    );
  }

  return ctx;
};