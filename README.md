# MapAndImages — React Native приложение с картой и изображениями

## Описание

Мобильное приложение на React Native + Expo:
- полноэкранная карта;
- добавление маркеров долгим нажатием;
- экран деталей маркера с координатами;
- прикрепление изображений из галереи;
- удаление изображений.

## Стек

- Expo SDK 57, React Native 0.86, TypeScript (strict)
- Expo Router (файловая маршрутизация)
- Leaflet + OpenStreetMap (WebView на native, iframe на web)
- expo-image-picker

## Установка и запуск

```bash
npm install
npx expo start