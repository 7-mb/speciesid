import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImagePicker, { type Image as PickerImage, type PickerErrorCode } from 'react-native-image-crop-picker';
import * as FileSystem from 'expo-file-system';
import * as Exify from '@lodev09/react-native-exify';
import type { ExifTags } from '@lodev09/react-native-exify';
import * as MediaLibrary from 'expo-media-library';

import ModeSwitcher from '../components/ModeSwitcher';
import { useMode } from '../state/mode';
import { colors } from '../theme/colors';

const MAX_IMAGES = 5;

type StoredImage = {
  id: string;
  picker: PickerImage;
  savedUri?: string;
  saving: boolean;
};

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildDummyExifTags(): ExifTags {
  const now = new Date();
  const iso = now.toISOString();
  const dateTime = iso.replace('T', ' ').replace('Z', '');

  return {
    GPSLatitude: 48.137154,
    GPSLongitude: 11.576124,
    GPSLatitudeRef: 'N',
    GPSLongitudeRef: 'E',
    GPSAltitude: 520,
    GPSAltitudeRef: 0,
    GPSHPositioningError: 5,

    UserComment: 'CUSTOM: hard-coded dummy user comment',
    MakerNote: 'CUSTOM: hard-coded maker note payload',
    HostComputer: 'CUSTOM: feb-cropper-1',
    Software: 'feb-cropper-1 (dummy-exif)',
    Artist: 'Demo',
    ImageDescription: 'Dummy image with injected EXIF',
    ImageUniqueID: 'dummy-unique-id-0001',
    DateTimeOriginal: dateTime,
  };
}

function guessFileExtension(picker: PickerImage): string {
  const match = picker.path.match(/\.([a-zA-Z0-9]+)$/);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }
  if (picker.mime === 'image/png') {
    return 'png';
  }
  return 'jpg';
}

function ensureImagesDir(): FileSystem.Directory {
  const dir = new FileSystem.Directory(FileSystem.Paths.document, 'images');
  try {
    dir.create({ intermediates: true, idempotent: true });
  } catch {
    // ignore
  }
  return dir;
}

export default function IdentifyScreen() {
  const [images, setImages] = useState<StoredImage[]>([]);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { mode, setMode } = useMode();

  const selectedCountText = useMemo(() => `${images.length}/${MAX_IMAGES}`, [images.length]);
  const savedCountText = useMemo(() => `${images.filter((i) => i.savedUri).length}/${images.length || 0}`, [images]);

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

    const message = error instanceof Error ? error.message : 'Unknown error while opening the media picker.';
    Alert.alert('Error', message);
  }, []);

  const persistWithDummyExif = useCallback(
    async (id: string, picker: PickerImage) => {
      try {
        const sourceUri = normalizeUri(picker.path);
        const tags = buildDummyExifTags();
        const result = await Exify.write(sourceUri, tags);
        const exifUri = result.uri;

        const dir = ensureImagesDir();
        const ext = guessFileExtension(picker);
        const fileName = `${Date.now()}-${id}.${ext}`;
        const targetFile = new FileSystem.File(dir, fileName);

        new FileSystem.File(exifUri).copy(targetFile);

        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('No permission', 'Without photo permission, the app cannot save to your photo library.');
        } else {
          const asset = await MediaLibrary.createAssetAsync(targetFile.uri);
          const albumName = 'feb-cropper-1';
          const album = await MediaLibrary.getAlbumAsync(albumName);
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
          }
        }

        setImages((current) => current.map((x) => (x.id === id ? { ...x, savedUri: targetFile.uri, saving: false } : x)));
      } catch (error) {
        setImages((current) => current.map((x) => (x.id === id ? { ...x, saving: false } : x)));
        handlePickerError(error);
      }
    },
    [handlePickerError, normalizeUri]
  );

  const addImages = useCallback(
    (newImages: PickerImage[]) => {
      setImages((current) => {
        if (current.length >= MAX_IMAGES) {
          return current;
        }

        const seenPaths = new Set(current.map((img) => img.picker.path));
        const merged = [...current];

        for (const picker of newImages) {
          if (merged.length >= MAX_IMAGES) {
            break;
          }
          if (seenPaths.has(picker.path)) {
            continue;
          }

          const id = createId();
          merged.push({ id, picker, saving: true });
          seenPaths.add(picker.path);

          void persistWithDummyExif(id, picker);
        }

        return merged;
      });
    },
    [persistWithDummyExif]
  );

  const removeImage = useCallback((id: string) => {
    setImages((current) => {
      const item = current.find((x) => x.id === id);
      if (item?.savedUri) {
        try {
          new FileSystem.File(item.savedUri).delete();
        } catch {
          // ignore
        }
      }
      return current.filter((img) => img.id !== id);
    });
  }, []);

  const cropImage = useCallback(
    async (img: StoredImage) => {
      try {
        const cropped = await ImagePicker.openCropper({
          path: img.picker.path,
          mediaType: 'photo',
          width: img.picker.width || 1024,
          height: img.picker.height || 1024,
          freeStyleCropEnabled: true,
        });

        setImages((current) => {
          const index = current.findIndex((x) => x.id === img.id);
          if (index === -1) {
            return current;
          }
          const next = [...current];
          if (next[index]?.savedUri) {
            try {
              new FileSystem.File(next[index].savedUri!).delete();
            } catch {
              // ignore
            }
          }
          next[index] = { ...next[index], picker: cropped, savedUri: undefined, saving: true };
          return next;
        });

        void persistWithDummyExif(img.id, cropped);

        ImagePicker.cleanSingle(img.picker.path).catch(() => undefined);
      } catch (error) {
        handlePickerError(error);
      }
    },
    [handlePickerError, persistWithDummyExif]
  );

  const pickFromGallery = useCallback(async () => {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit reached', `You can select up to ${MAX_IMAGES} images.`);
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
      Alert.alert('Limit reached', `You can select up to ${MAX_IMAGES} images.`);
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
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: 12 + tabBarHeight }]}>
      <ModeSwitcher mode={mode} onChange={setMode} />

      <Text style={styles.title}>Select images</Text>
      <Text style={styles.subtitle}>Choose 1–5 images from your gallery, or take a photo with the camera.</Text>

      <View style={styles.actionsRow}>
        <Pressable onPress={pickFromGallery} style={[styles.button, styles.buttonLeft]}>
          <Text style={styles.buttonText}>Pick from gallery</Text>
        </Pressable>

        <Pressable onPress={takePhoto} style={styles.button}>
          <Text style={styles.buttonText}>Take a photo</Text>
        </Pressable>
      </View>

      <Text style={styles.counter}>Selected: {selectedCountText}</Text>
      {images.length > 0 ? <Text style={styles.counter}>Saved: {savedCountText}</Text> : null}
      {images.length > 0 ? <Text style={styles.hint}>Tip: Tap an image to crop it.</Text> : null}

      {images.length === 0 ? (
        <Text style={styles.emptyState}>No images selected yet.</Text>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={[styles.grid, { paddingBottom: 24 + tabBarHeight }]}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <Pressable onPress={() => cropImage(item)} style={styles.thumbnailPressable}>
                <Image source={{ uri: item.savedUri ?? normalizeUri(item.picker.path) }} style={styles.thumbnail} accessibilityLabel="Selected image" />
              </Pressable>

              <Pressable
                onPress={() => removeImage(item.id)}
                hitSlop={10}
                style={styles.removeButton}
                accessibilityRole="button"
                accessibilityLabel="Remove image"
              >
                <Text style={styles.removeButtonText}>×</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.text,
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
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
  },
  buttonLeft: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.buttonText,
  },
  counter: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text,
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
    color: colors.text,
  },
  emptyState: {
    marginTop: 14,
    fontSize: 14,
    color: colors.text,
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
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
  },
  removeButtonText: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.buttonText,
  },
});
