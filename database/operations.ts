import * as SQLite from 'expo-sqlite';
import { MarkerRow, MarkerImageRow } from '../types';

const log = (...args: unknown[]) => {
  if (__DEV__) console.log('[DB]', ...args);
};


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
    throw new Error('Не удалось создать маркер.');
  }
}

export async function deleteMarkerById(
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync(
        'DELETE FROM markers WHERE id = ?;',
        markerId
      );
      if (res.changes === 0) throw new Error('Маркер не найден.');
    });
    log('deleteMarkerById', markerId);
  } catch (error) {
    console.error('[DB] deleteMarkerById failed:', error);
    throw error instanceof Error
      ? error
      : new Error('Не удалось удалить маркер.');
  }
}

export async function fetchMarkers(
  db: SQLite.SQLiteDatabase
): Promise<MarkerRow[]> {
  try {
    const rows = await db.getAllAsync<MarkerRow>(
      'SELECT id, latitude, longitude, created_at FROM markers ORDER BY created_at DESC;'
    );
    log('fetchMarkers', rows.length);
    return rows;
  } catch (error) {
    console.error('[DB] fetchMarkers failed:', error);
    throw new Error('Не удалось загрузить маркеры.');
  }
}


export async function createMarkerImage(
  db: SQLite.SQLiteDatabase,
  markerId: number,
  uri: string
): Promise<number> {
  try {
    const result = await db.runAsync(
      'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);',
      markerId,
      uri
    );
    log('createMarkerImage', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('[DB] createMarkerImage failed:', error);
    throw new Error('Не удалось добавить изображение.');
  }
}

export async function deleteMarkerImageById(
  db: SQLite.SQLiteDatabase,
  imageId: number
): Promise<void> {
  try {
    const res = await db.runAsync(
      'DELETE FROM marker_images WHERE id = ?;',
      imageId
    );
    if (res.changes === 0) throw new Error('Изображение не найдено.');
    log('deleteMarkerImageById', imageId);
  } catch (error) {
    console.error('[DB] deleteMarkerImageById failed:', error);
    throw error instanceof Error
      ? error
      : new Error('Не удалось удалить изображение.');
  }
}

export async function fetchImagesForMarker(
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<MarkerImageRow[]> {
  try {
    const rows = await db.getAllAsync<MarkerImageRow>(
      'SELECT id, marker_id, uri, created_at FROM marker_images WHERE marker_id = ? ORDER BY created_at ASC;',
      markerId
    );
    log('fetchImagesForMarker', markerId, rows.length);
    return rows;
  } catch (error) {
    console.error('[DB] fetchImagesForMarker failed:', error);
    throw new Error('Не удалось загрузить изображения маркера.');
  }
}