import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const IMAGES_DIR = 'marker-images/';

export async function persistImage(tempUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return blobUriToDataUrl(tempUri);
  }

  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }

  const ext =
    tempUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `img_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const destination = `${IMAGES_DIR}${filename}`;

  await FileSystem.copyAsync({ from: tempUri, to: destination });
  return destination;
}

export async function removePersistedImage(uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  if (!uri.startsWith(IMAGES_DIR)) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.warn('[FS] Не удалось удалить файл изображения:', uri, error);
  }
}
async function blobUriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;

  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Не удалось преобразовать изображение в data URL.'));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Ошибка чтения изображения.'));
    reader.readAsDataURL(blob);
  });
}