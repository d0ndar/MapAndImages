import * as SQLite from 'expo-sqlite';
import { migrations, LATEST_SCHEMA_VERSION } from './migrations';

export const DATABASE_NAME = 'markers.db';


export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');

    await migrateDatabase(db);
    return db;
  } catch (error) {
    console.error('[DB] Ошибка инициализации базы данных:', error);
    throw error instanceof Error
      ? error
      : new Error('Неизвестная ошибка инициализации БД');
  }
}

async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `Версия БД (${currentVersion}) новее поддерживаемой (${LATEST_SCHEMA_VERSION}).`
    );
  }

  for (let v = currentVersion + 1; v <= LATEST_SCHEMA_VERSION; v++) {
    const migration = migrations[v];
    if (!migration) {
      throw new Error(`Неизвестная версия миграции: ${v}`);
    }
    await db.withTransactionAsync(async () => {
      await migration(db);
      await db.execAsync(`PRAGMA user_version = ${v};`);
    });
  }
}