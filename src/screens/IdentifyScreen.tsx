import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImagePicker, { type Image as PickerImage, type PickerErrorCode } from 'react-native-image-crop-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Exify from '@lodev09/react-native-exify';
import type { ExifTags } from '@lodev09/react-native-exify';
import * as MediaLibrary from 'expo-media-library';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ModeSwitcher from '../components/ModeSwitcher';
import { useI18n } from '../state/language';
import { useMode } from '../state/mode';
import { colors } from '../theme/colors';

const MAX_IMAGES = 5;
const PAYLOAD_IMAGE_MIN_SIDE_PX = 384;
const IDENTIFY_API_URL =
  (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.EXPO_PUBLIC_IDENTIFY_API_URL ??
  'https://speciesid.wsl.ch/florid';

type TaxaData = {
  id: number[];
  name: string[];
  image_model: number[];
  ecological_model: number[];
  relative_eco_score: number[];
  combined_model: number[];
  coverage: number[];
};

type IdentifyResponse = {
  top_n?: {
    by_combined?: TaxaData;
  };
  requested_taxa?: TaxaData;
  Warnings?: string[];
};

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
    HostComputer: 'CUSTOM: SpeciesID',
    Software: 'SpeciesID (dummy-exif)',
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

function getImageSizeAsync(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

async function buildPayloadBase64Image(params: {
  uri: string;
  width?: number;
  height?: number;
}): Promise<string> {
  let width = params.width;
  let height = params.height;

  if (!width || !height) {
    const size = await getImageSizeAsync(params.uri);
    width = size.width;
    height = size.height;
  }

  const minSide = Math.min(width, height);
  const scale = minSide > PAYLOAD_IMAGE_MIN_SIDE_PX ? PAYLOAD_IMAGE_MIN_SIDE_PX / minSide : 1;

  const actions: ImageManipulator.Action[] =
    scale === 1
      ? []
      : [
          {
            resize: {
              width: Math.max(1, Math.round(width * scale)),
              height: Math.max(1, Math.round(height * scale)),
            },
          },
        ];

  const result = await ImageManipulator.manipulateAsync(params.uri, actions, {
    base64: true,
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  if (!result.base64) {
    throw new Error('Failed to encode image as base64');
  }

  return result.base64;
}

export default function IdentifyScreen() {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyResponseText, setIdentifyResponseText] = useState<string>('');
  const [identifyResults, setIdentifyResults] = useState<Array<{ id: number; name: string; percent: number }>>([]);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { mode, setMode } = useMode();
  const { t } = useI18n();

  const selectedCountText = useMemo(() => `${images.length}/${MAX_IMAGES}`, [images.length]);
  const savedCountText = useMemo(() => `${images.filter((i) => i.savedUri).length}/${images.length || 0}`, [images]);

  const normalizeUri = useCallback((path: string) => {
    if (path.startsWith('file://') || path.startsWith('content://') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `file://${path}`;
  }, []);

  const handlePickerError = useCallback(
    (error: unknown) => {
      const maybeCode = (error as { code?: PickerErrorCode }).code;
      if (maybeCode === 'E_PICKER_CANCELLED') {
        return;
      }

      const message = error instanceof Error ? error.message : t('identify.alerts.unknownPickerError');
      Alert.alert(t('identify.alerts.errorTitle'), message);
    },
    [t]
  );

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
          Alert.alert(t('identify.alerts.noPermissionTitle'), t('identify.alerts.noPermissionBody'));
        } else {
          const asset = await MediaLibrary.createAssetAsync(targetFile.uri);
          const albumName = 'SpeciesID';
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
    [handlePickerError, normalizeUri, t]
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
      Alert.alert(t('identify.alerts.limitTitle'), t('identify.alerts.limitBody', { max: MAX_IMAGES }));
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
  }, [addImages, handlePickerError, images.length, t]);

  const takePhoto = useCallback(async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(t('identify.alerts.limitTitle'), t('identify.alerts.limitBody', { max: MAX_IMAGES }));
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
  }, [addImages, handlePickerError, images.length, t]);

  const handleIdentify = useCallback(async () => {
    if (!IDENTIFY_API_URL) {
      Alert.alert(t('identify.alerts.errorTitle'), t('identify.alerts.missingApiUrl'));
      return;
    }

    setIsIdentifying(true);
    setIdentifyResponseText('');
    setIdentifyResults([]);
    try {
      const today = new Date().toISOString().slice(0, 10);

      const payloadImages: string[] = [];
      for (const item of images) {
        const uri = normalizeUri(item.savedUri ?? item.picker.path);
        const base64 = await buildPayloadBase64Image({ uri, width: item.picker.width, height: item.picker.height });
        payloadImages.push(base64);
      }

      const payload = {
        images: payloadImages,
        lat: 47.33965229871837,
        lon: 7.8931488585743645,
        date: today,
        num_taxon_ids: 5,
        req_taxon_ids: [1000000],
      };

      const response = await fetch(IDENTIFY_API_URL, {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(details ? `${response.status} ${response.statusText}: ${details}` : `${response.status} ${response.statusText}`);
      }

      const raw = await response.text();
      const contentType = response.headers.get('content-type') ?? '';
      const trimmed = raw.trim();
      const looksLikeJson = contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[');

      if (looksLikeJson) {
        try {
          const parsed = JSON.parse(raw) as IdentifyResponse;

          const taxa = parsed?.top_n?.by_combined;
          if (taxa?.id?.length && taxa?.name?.length && taxa?.combined_model?.length) {
            const len = Math.min(taxa.id.length, taxa.name.length, taxa.combined_model.length);
            const rows: Array<{ id: number; name: string; percent: number }> = [];
            for (let i = 0; i < len; i++) {
              const id = taxa.id[i];
              const name = taxa.name[i];
              const score = taxa.combined_model[i];
              const percent = typeof score === 'number' ? (score <= 1 ? score * 100 : score) : NaN;
              rows.push({ id, name, percent });
            }
            setIdentifyResults(rows);
          } else {
            setIdentifyResults([]);
          }

          setIdentifyResponseText(JSON.stringify(parsed, null, 2));
        } catch {
          setIdentifyResponseText(raw);
          setIdentifyResults([]);
        }
      } else {
        setIdentifyResponseText(raw);
        setIdentifyResults([]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('identify.alerts.requestFailed');
      Alert.alert(t('identify.alerts.errorTitle'), message);
    } finally {
      setIsIdentifying(false);
    }
  }, [images, normalizeUri, t]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: 0 }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('identify.title')}</Text>

        <Text style={styles.modeHint}>Choose what you want to identify</Text>
        <View style={styles.modeSwitcherWrap}>
          <ModeSwitcher mode={mode} onChange={setMode} />
        </View>

        <Text style={styles.subtitle}>{t('identify.subtitle')}</Text>

        <View style={styles.actionsRow}>
          <Pressable onPress={pickFromGallery} style={[styles.button, styles.buttonLeft]}>
            <Text style={styles.buttonText}>{t('identify.actions.pickGallery')}</Text>
          </Pressable>

          <Pressable onPress={takePhoto} style={styles.button}>
            <Text style={styles.buttonText}>{t('identify.actions.takePhoto')}</Text>
          </Pressable>
        </View>

        <Text style={styles.counter}>{t('identify.counters.selected', { count: selectedCountText })}</Text>
        {images.length > 0 ? <Text style={styles.counter}>{t('identify.counters.saved', { count: savedCountText })}</Text> : null}
        {images.length > 0 ? <Text style={styles.hint}>{t('identify.hints.cropTip')}</Text> : null}

        {images.length === 0 ? (
          <Text style={styles.emptyState}>{t('identify.empty.noImages')}</Text>
        ) : (
          <View style={styles.gridWrap}>
            {images.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <Pressable onPress={() => cropImage(item)} style={styles.thumbnailPressable}>
                  <Image
                    source={{ uri: item.savedUri ?? normalizeUri(item.picker.path) }}
                    style={styles.thumbnail}
                    accessibilityLabel={t('identify.accessibility.selectedImage')}
                  />
                </Pressable>

                <Pressable
                  onPress={() => removeImage(item.id)}
                  hitSlop={10}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('identify.accessibility.removeImage')}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleIdentify}
            disabled={isIdentifying}
            style={({ pressed }) => [
              styles.identifyButton,
              pressed ? styles.identifyButtonPressed : null,
              isIdentifying ? styles.identifyButtonDisabled : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('identify.actions.identify')}
          >
            <MaterialCommunityIcons name="message-text" size={18} color={colors.buttonText} />
            <Text style={styles.identifyButtonText}>{t('identify.actions.identify')}</Text>
          </Pressable>

          {identifyResults.length > 0 ? (
            <View style={styles.resultsWrap}>
              {identifyResults.map((row) => (
                <Text key={`${row.id}-${row.name}`} style={styles.resultRowText}>
                  {row.id} {row.name} {Number.isFinite(row.percent) ? `${row.percent.toFixed(1)}%` : ''}
                </Text>
              ))}
            </View>
          ) : null}

          {identifyResponseText ? (
            <Text style={styles.identifyResponseText} selectable>
              {identifyResponseText}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {isIdentifying ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={colors.green} />
        </View>
      ) : null}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  modeHint: {
    marginTop: 10,
    fontSize: 14,
    color: colors.text,
  },
  modeSwitcherWrap: {
    marginTop: 10,
    marginBottom: 12,
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
  gridWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridItem: {
    width: '33.3333%',
    padding: 5,
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
  bottomBar: {
    marginTop: 12,
  },
  resultsWrap: {
    marginTop: 10,
  },
  resultRowText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  identifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
    gap: 8,
  },
  identifyButtonPressed: {
    backgroundColor: colors.greenLight,
  },
  identifyButtonDisabled: {
    opacity: 0.7,
  },
  identifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.buttonText,
  },
  identifyResponseText: {
    marginTop: 6,
    fontSize: 8,
    lineHeight: 10,
    color: colors.gray1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
