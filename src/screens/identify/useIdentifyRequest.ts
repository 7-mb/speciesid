import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { IDENTIFY_API_URL } from './config';
import type { IdentifyResponse, IdentifyResultRow, StoredImage } from './types';
import { buildPayloadBase64Image, normalizeUri } from './imageUtils';

import type { TranslationKey } from '../../i18n/translations';

type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function useIdentifyRequest(params: { t: TFunction; images: StoredImage[] }) {
  const { t, images } = params;

  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyResponseText, setIdentifyResponseText] = useState<string>('');
  const [identifyResults, setIdentifyResults] = useState<IdentifyResultRow[]>([]);

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
            const rows: IdentifyResultRow[] = [];
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
  }, [images, t]);

  return {
    isIdentifying,
    identifyResponseText,
    identifyResults,
    handleIdentify,
  };
}
