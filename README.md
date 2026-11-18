## Схема базы данных (Задание 2)

- `markers` — `id`, `latitude`, `longitude`, `created_at`
- `marker_images` — `id`, `marker_id` (FK → markers.id, ON DELETE CASCADE), `uri`, `created_at`
- Индекс `idx_marker_images_marker_id` по `marker_id`
- Версионирование через `PRAGMA user_version`, миграции в `database/migrations/`

## Обработка ошибок

- Инициализация БД — `try/catch` в `initDatabase`, статус `error` и `retryInit` в контексте
- Транзакции — `withTransactionAsync` для миграций и удаления маркера
- Ограничения — проверка `changes === 0` при удалении
- `PRAGMA foreign_keys = ON` при каждом открытии соединения
- Логирование операций в `__DEV__`