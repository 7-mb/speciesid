import { Image } from 'react-native';
import type { ExifTags } from '@lodev09/react-native-exify';
import type { Image as PickerImage } from 'react-native-image-crop-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import { PAYLOAD_IMAGE_MIN_SIDE_PX } from './config';

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildDummyExifTags(): ExifTags {
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

export function normalizeUri(path: string): string {
  if (path.startsWith('file://') || path.startsWith('content://') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `file://${path}`;
}

export function guessFileExtension(picker: PickerImage): string {
  const match = picker.path.match(/\.([a-zA-Z0-9]+)$/);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }
  if (picker.mime === 'image/png') {
    return 'png';
  }
  return 'jpg';
}

export function ensureImagesDir(): FileSystem.Directory {
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

export async function buildPayloadBase64Image(params: {
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
