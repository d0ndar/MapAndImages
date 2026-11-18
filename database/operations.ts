import * as SQLite from 'expo-sqlite';
import type { Marker, MarkerImage } from '../types';

const log = (...args: unknown[]) => {
  if (__DEV__) {
    console.log('[DB]', ...args);
  }
};

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export async function createMarker(
  db: SQLite.SQLiteDatabase,
  latitude: number,
  longitude: number
): Promise<number> {
  try {
    const result = await db.runAsync(
      'INSERT INTO markers (latitude, longitude) VALUES (?, ?);',
      latitude,
      longitude
    );

    log('createMarker', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('[DB] createMarker failed:', error);
    throw toError(error, 'Не удалось создать маркер.');
  }
}

export async function deleteMarkerById(
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'DELETE FROM marker_images WHERE marker_id = ?;',
        markerId
      );

      const result = await db.runAsync(
        'DELETE FROM markers WHERE id = ?;',
        markerId
      );

      if (result.changes === 0) {
        throw new Error('Маркер не найден.');
      }
    });

    log('deleteMarkerById', markerId);
  } catch (error) {
    console.error('[DB] deleteMarkerById failed:', error);
    throw toError(error, 'Не удалось удалить маркер.');
  }
}

export async function fetchMarkers(
  db: SQLite.SQLiteDatabase
): Promise<Marker[]> {
  try {
    const rows = await db.getAllAsync<Marker>(
      `SELECT id, latitude, longitude, created_at
       FROM markers
       ORDER BY created_at DESC;`
    );

    log('fetchMarkers', rows.length);
    return rows;
  } catch (error) {
    console.error('[DB] fetchMarkers failed:', error);
    throw toError(error, 'Не удалось загрузить маркеры.');
  }
}

export async function createMarkerImage(
  db: SQLite.SQLiteDatabase,
  markerId: number,
  uri: string
): Promise<number> {
  try {
    const marker = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM markers WHERE id = ?;',
      markerId
    );

    if (!marker) {
      throw new Error('Маркер не найден.');
    }

    const result = await db.runAsync(
      'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);',
      markerId,
      uri
    );

    log('createMarkerImage', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('[DB] createMarkerImage failed:', error);
    throw toError(error, 'Не удалось добавить изображение.');
  }
}

export async function deleteMarkerImageById(
  db: SQLite.SQLiteDatabase,
  imageId: number
): Promise<void> {
  try {
    const result = await db.runAsync(
      'DELETE FROM marker_images WHERE id = ?;',
      imageId
    );

    if (result.changes === 0) {
      throw new Error('Изображение не найдено.');
    }

    log('deleteMarkerImageById', imageId);
  } catch (error) {
    console.error('[DB] deleteMarkerImageById failed:', error);
    throw toError(error, 'Не удалось удалить изображение.');
  }
}

export async function fetchImagesForMarker(
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<MarkerImage[]> {
  try {
    const rows = await db.getAllAsync<MarkerImage>(
      `SELECT id, marker_id, uri, created_at
       FROM marker_images
       WHERE marker_id = ?
       ORDER BY created_at ASC;`,
      markerId
    );

    log('fetchImagesForMarker', markerId, rows.length);
    return rows;
  } catch (error) {
    console.error('[DB] fetchImagesForMarker failed:', error);
    throw toError(error, 'Не удалось загрузить изображения маркера.');
  }
}