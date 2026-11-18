## Схема базы данных (Задание 2)

- `markers` — `id`, `latitude`, `longitude`, `created_at`
- `marker_images` — `id`, `marker_id` (FK → markers.id, ON DELETE CASCADE), `uri`, `created_at`
- Индекс `idx_marker_images_marker_id` по `marker_id`
- Версионирование через `PRAGMA user_version`, миграции в `database/migrations/`

## Структура БД

- `database/schema.ts` — открытие соединения, PRAGMA, миграции
- `database/migrations/` — миграции с версионированием через `PRAGMA user_version`
- `database/operations.ts` — CRUD-функции (без знания о React)
- `context/DatabaseContext.tsx` — провайдер и хуки, связывает UI и `operations`
- `utils/imageStorage.ts` — платформо-зависимое сохранение/удаление файлов изображений
- `types.ts` — доменные модели (`Marker`, `MarkerImage`) и UI-модели карты (`MarkerData`)

## Обработка ошибок

- Инициализация БД — `try/catch` в `initDatabase`, статус `error` и `retryInit` в контексте
- Транзакции — `withTransactionAsync` для миграций и удаления маркера
- Ограничения — проверка `changes === 0` при удалении
- `PRAGMA foreign_keys = ON` при каждом открытии соединения
- Логирование операций в `__DEV__`

## Установка и запуск

### Требования
- Node.js 20+
- npm 10+ (или yarn)
- Expo CLI (устанавливается автоматически через npx)

### Установка
```bash
git clone https://github.com/d0ndar/MapAndImages.git
cd MapAndImages
npm install

# Android
npx expo start --android

# iOS (только macOS)
npx expo start --ios

# Веб
npx expo start --web
```

## Хранение изображений

Поле `marker_images.uri` хранит **постоянную ссылку** на изображение, а не временный URI, который возвращает `expo-image-picker` (тот указывает на кэш и перестаёт работать после перезапуска приложения). Логика инкапсулирована в `utils/imageStorage.ts` и зависит от платформы.

### Native (iOS / Android)

- При добавлении изображения файл копируется из кэша `ImagePicker` в `${FileSystem.documentDirectory}marker-images/`.
- В БД сохраняется путь вида `file:///.../marker-images/img_<timestamp>_<random>.jpg`.
- При удалении изображения из БД файл удаляется через `FileSystem.deleteAsync` (только если он лежит в нашей директории — «сиротские» пути не трогаем).
- Если `INSERT` в БД падает после копирования файла, файл удаляется, чтобы не оставлять мусор.

### Web

- `expo-file-system` на web не реализован, а `blob:`-URL, который отдаёт `ImagePicker`, умирает при перезагрузке страницы.
- Поэтому временный `blob:` конвертируется в **`data:` URL (base64)** через `fetch` + `FileReader`, и именно эта строка сохраняется в `marker_images.uri`.
- `data:` URL самодостаточен и переживает перезапуск.
- Побочный эффект: размер БД растёт (base64 ≈ +33% к размеру файла). Для учебного задания приемлемо; в production-варианте стоило бы хранить blob в IndexedDB.

