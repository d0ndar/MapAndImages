import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMarkers } from '../../context/MarkersContext';
import { ImageList } from '../../components/ImageList';
import { View, Text, Button, Alert, StyleSheet, Platform } from 'react-native';

export default function MarkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { markers, addImageToMarker, removeImageFromMarker, getImagesForMarker } = useMarkers();
  const [isPicking, setIsPicking] = useState(false);

  const marker = markers.find((m) => m.id === id);
  const images = getImagesForMarker(id);

  const goBack = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('router.back failed:', error);
      Alert.alert('Ошибка навигации', 'Не удалось вернуться к карте.');
    }
  }, [router]);

  const pickImage = useCallback(async () => {
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
        addImageToMarker(id, result.assets[0]);
      }
    } catch (error) {
      console.error('ImagePicker failed:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение.');
    } finally {
      setIsPicking(false);
    }
  }, [id, addImageToMarker]);

  const handleDelete = useCallback(
    (uri: string) => {
      const doDelete = () => {
        try {
          removeImageFromMarker(id, uri);
        } catch (error) {
          console.error('removeImageFromMarker failed:', error);
          Alert.alert('Ошибка', 'Не удалось удалить изображение.');
        }
      };

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm('Удалить изображение?')) {
          doDelete();
        }
        return;
      }

      Alert.alert('Удалить изображение', 'Вы уверены?', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: doDelete },
      ]);
    },
    [id, removeImageFromMarker]
  );

  if (!marker) {
    return (
      <View style={styles.container}>
        <Text>Маркер не найден.</Text>
        <Button title="Назад к карте" onPress={goBack} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.title}>{marker.title ?? 'Без названия'}</Text>
        <Text>Широта: {marker.coordinate.latitude.toFixed(6)}</Text>
        <Text>Долгота: {marker.coordinate.longitude.toFixed(6)}</Text>
        {marker.description ? <Text style={styles.desc}>{marker.description}</Text> : null}
      </View>

      <ImageList images={images} onDelete={handleDelete} />

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
  info: { marginBottom: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  desc: { marginTop: 8, fontStyle: 'italic' },
  buttons: { marginTop: 'auto', gap: 8 },
});