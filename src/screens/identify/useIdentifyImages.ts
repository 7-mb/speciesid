import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import ImagePicker, { type Image as PickerImage, type PickerErrorCode } from 'react-native-image-crop-picker';
import * as FileSystem from 'expo-file-system';
import * as Exify from '@lodev09/react-native-exify';
import * as MediaLibrary from 'expo-media-library';

import { MAX_IMAGES } from './config';
import type { StoredImage } from './types';
import { buildDummyExifTags, createId, ensureImagesDir, guessFileExtension, normalizeUri } from './imageUtils';

import type { TranslationKey } from '../../i18n/translations';

type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function useIdentifyImages(params: { t: TFunction }) {
  const { t } = params;

  const [images, setImages] = useState<StoredImage[]>([]);

  const selectedCountText = useMemo(() => `${images.length}/${MAX_IMAGES}`, [images.length]);
  const savedCountText = useMemo(() => `${images.filter((i) => i.savedUri).length}/${images.length || 0}`, [images]);

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
    [handlePickerError, t]
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

  return {
    images,
    selectedCountText,
    savedCountText,
    pickFromGallery,
    takePhoto,
    cropImage,
    removeImage,
  };
}
