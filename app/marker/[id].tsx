import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDatabase } from '../../context/DatabaseContext';
import { ImageList } from '../../components/ImageList';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MarkerImageRow } from '../../types';

export default function MarkerDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const markerId = Number(params.id);
  const router = useRouter();
  const { addImage, deleteImage, getMarkerImages } = useDatabase();

  const [images, setImages] = useState<MarkerImageRow[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  const loadImages = useCallback(async () => {
    if (!Number.isFinite(markerId)) return;
    setIsLoadingImages(true);
    try {
      const rows = await getMarkerImages(markerId);
      setImages(rows);
    } catch (e) {
      Alert.alert(
        'Ошибка',
        e instanceof Error ? e.message : 'Не удалось загрузить изображения.'
      );
    } finally {
      setIsLoadingImages(false);
    }
  }, [markerId, getMarkerImages]);

  useFocusEffect(
    useCallback(() => {
      void loadImages();
    }, [loadImages])
  );

  const goBack = useCallback(() => {
    try {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch {
      Alert.alert('Ошибка навигации', 'Не удалось вернуться к карте.');
    }
  }, [router]);

  const pickImage = useCallback(async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Требуется разрешение', 'Разрешите доступ к галерее.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) {
        await addImage(markerId, result.assets[0].uri);
        await loadImages();
      }
    } catch (e) {
      Alert.alert(
        'Ошибка',
        e instanceof Error ? e.message : 'Не удалось выбрать изображение.'
      );
    } finally {
      setIsPicking(false);
    }
  }, [addImage, isPicking, loadImages, markerId]);

  const handleDelete = useCallback(
    (imageId: number) => {
      const doDelete = async () => {
        try {
          await deleteImage(imageId);
          await loadImages();
        } catch (e) {
          Alert.alert(
            'Ошибка',
            e instanceof Error ? e.message : 'Не удалось удалить изображение.'
          );
        }
      };

      if (Platform.OS === 'web') {
        if (
          typeof window !== 'undefined' &&
          window.confirm('Удалить изображение?')
        ) {
          void doDelete();
        }
        return;
      }

      Alert.alert('Удалить изображение', 'Вы уверены?', [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => void doDelete(),
        },
      ]);
    },
    [deleteImage, loadImages]
  );

  if (!Number.isFinite(markerId)) {
    return (
      <View style={styles.container}>
        <Text>Некорректный идентификатор маркера.</Text>
        <Button title="Назад к карте" onPress={goBack} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.title}>Маркер #{markerId}</Text>
      </View>

      {isLoadingImages ? (
        <ActivityIndicator />
      ) : (
        <ImageList images={images} onDelete={handleDelete} />
      )}

      <View style={styles.buttons}>
        <Button
          title={isPicking ? 'Загрузка...' : 'Добавить изображение'}
          onPress={pickImage}
          disabled={isPicking}
        />
        <Button title="Назад к карте" onPress={goBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  info: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  buttons: { marginTop: 'auto', gap: 8 },
});