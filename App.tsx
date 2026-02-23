import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import ImagePicker, { type Image as PickerImage, type PickerErrorCode } from 'react-native-image-crop-picker';

const MAX_IMAGES = 5;

export default function App() {
  const [images, setImages] = useState<PickerImage[]>([]);

  const selectedCountText = useMemo(() => `${images.length}/${MAX_IMAGES}`, [images.length]);

  const normalizeUri = useCallback((path: string) => {
    if (path.startsWith('file://') || path.startsWith('content://') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    return `file://${path}`;
  }, []);

  const handlePickerError = useCallback((error: unknown) => {
    const maybeCode = (error as { code?: PickerErrorCode }).code;
    if (maybeCode === 'E_PICKER_CANCELLED') {
      return;
    }

    const message = error instanceof Error ? error.message : 'Unbekannter Fehler beim Öffnen der Medienauswahl.';
    Alert.alert('Fehler', message);
  }, []);

  const addImages = useCallback((newImages: PickerImage[]) => {
    setImages((current) => {
      if (current.length >= MAX_IMAGES) {
        return current;
      }

      const seenPaths = new Set(current.map((img) => img.path));
      const merged = [...current];

      for (const img of newImages) {
        if (merged.length >= MAX_IMAGES) {
          break;
        }
        if (seenPaths.has(img.path)) {
          continue;
        }
        merged.push(img);
        seenPaths.add(img.path);
      }

      return merged;
    });
  }, []);

  const removeImage = useCallback((path: string) => {
    setImages((current) => current.filter((img) => img.path !== path));
  }, []);

  const cropImage = useCallback(
    async (img: PickerImage) => {
      try {
        const cropped = await ImagePicker.openCropper({
          path: img.path,
          mediaType: 'photo',
          width: img.width || 1024,
          height: img.height || 1024,
          freeStyleCropEnabled: true,
        });

        setImages((current) => {
          const index = current.findIndex((x) => x.path === img.path);
          if (index === -1) {
            return current;
          }
          const next = [...current];
          next[index] = cropped;
          return next;
        });

        ImagePicker.cleanSingle(img.path).catch(() => undefined);
      } catch (error) {
        handlePickerError(error);
      }
    },
    [handlePickerError]
  );

  const pickFromGallery = useCallback(async () => {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit erreicht', `Du kannst maximal ${MAX_IMAGES} Bilder auswählen.`);
      return;
    }

    try {
      const result = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        minFiles: 1,
        maxFiles: remainingSlots,
      });

      addImages(result);
    } catch (error) {
      handlePickerError(error);
    }
  }, [addImages, handlePickerError, images.length]);

  const takePhoto = useCallback(async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit erreicht', `Du kannst maximal ${MAX_IMAGES} Bilder auswählen.`);
      return;
    }

    try {
      const result = await ImagePicker.openCamera({
        mediaType: 'photo',
        cropping: true,
        width: 1024,
        height: 1024,
        freeStyleCropEnabled: true,
      });

      addImages([result]);
    } catch (error) {
      handlePickerError(error);
    }
  }, [addImages, handlePickerError, images.length]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Bilder auswählen</Text>
        <Text style={styles.subtitle}>Wähle 1–5 Bilder aus der Galerie oder nimm ein Foto mit der Kamera auf.</Text>

        <View style={styles.actionsRow}>
          <Pressable onPress={pickFromGallery} style={[styles.button, styles.buttonLeft]}>
            <Text style={styles.buttonText}>Aus Galerie wählen</Text>
          </Pressable>

          <Pressable onPress={takePhoto} style={styles.button}>
            <Text style={styles.buttonText}>Mit Kamera aufnehmen</Text>
          </Pressable>
        </View>

        <Text style={styles.counter}>Ausgewählt: {selectedCountText}</Text>
        {images.length > 0 ? <Text style={styles.hint}>Tipp: Tippe auf ein Bild, um es zu croppen.</Text> : null}

        {images.length === 0 ? (
          <Text style={styles.emptyState}>Noch keine Bilder ausgewählt.</Text>
        ) : (
          <FlatList
            data={images}
            keyExtractor={(item) => item.path}
            numColumns={3}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <Pressable onPress={() => cropImage(item)} style={styles.thumbnailPressable}>
                  <Image
                    source={{ uri: normalizeUri(item.path) }}
                    style={styles.thumbnail}
                    accessibilityLabel="Ausgewähltes Bild"
                  />
                </Pressable>

                <Pressable
                  onPress={() => removeImage(item.path)}
                  hitSlop={10}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Bild entfernen"
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonLeft: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  counter: {
    marginTop: 12,
    fontSize: 14,
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
  },
  emptyState: {
    marginTop: 14,
    fontSize: 14,
  },
  grid: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  gridItem: {
    flex: 1,
    margin: 5,
  },
  thumbnailPressable: {
    flex: 1,
  },
  thumbnail: {
    aspectRatio: 1,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '600',
  },
});
