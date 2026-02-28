export const MAX_IMAGES = 5;
export const PAYLOAD_IMAGE_MIN_SIDE_PX = 384;
export const IDENTIFY_API_URL =
  (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.EXPO_PUBLIC_IDENTIFY_API_URL ??
  'https://speciesid.wsl.ch/florid';
