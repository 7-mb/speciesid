import type { Image as PickerImage } from 'react-native-image-crop-picker';

export type TaxaData = {
  id: number[];
  name: string[];
  image_model: number[];
  ecological_model: number[];
  relative_eco_score: number[];
  combined_model: number[];
  coverage: number[];
};

export type IdentifyResponse = {
  top_n?: {
    by_combined?: TaxaData;
  };
  requested_taxa?: TaxaData;
  Warnings?: string[];
};

export type StoredImage = {
  id: string;
  picker: PickerImage;
  savedUri?: string;
  saving: boolean;
};

export type IdentifyResultRow = {
  id: number;
  name: string;
  percent: number;
};
