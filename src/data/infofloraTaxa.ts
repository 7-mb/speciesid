import type { Language } from '../i18n/translations';

export type InfofloraTaxon = {
  ID: number;
  Scientific_name?: string;
  German_name?: string;
  French_name?: string;
  Italian_name?: string;
  English_name?: string;
  German_URL?: string;
  French_URL?: string;
  Italian_URL?: string;
  English_URL?: string;
};

let index: Map<number, InfofloraTaxon> | null = null;
let data: InfofloraTaxon[] | null = null;

function loadData(): InfofloraTaxon[] {
  if (!data) {
    data = require('./infofloraTaxa.json') as InfofloraTaxon[];
  }
  return data;
}

function ensureIndex(): Map<number, InfofloraTaxon> {
  if (index) {
    return index;
  }

  const map = new Map<number, InfofloraTaxon>();
  for (const item of loadData()) {
    if (typeof item?.ID === 'number') {
      map.set(item.ID, item);
    }
  }

  index = map;
  return map;
}

export function getInfofloraTaxonById(id: number): InfofloraTaxon | undefined {
  return ensureIndex().get(id);
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getInfofloraLocalizedName(taxon: InfofloraTaxon, language: Language): string | undefined {
  if (language === 'de') return nonEmpty(taxon.German_name);
  if (language === 'fr') return nonEmpty(taxon.French_name);
  if (language === 'it') return nonEmpty(taxon.Italian_name);
  return nonEmpty(taxon.English_name);
}

export function getInfofloraLocalizedUrl(taxon: InfofloraTaxon, language: Language): string | undefined {
  if (language === 'de') return nonEmpty(taxon.German_URL);
  if (language === 'fr') return nonEmpty(taxon.French_URL);
  if (language === 'it') return nonEmpty(taxon.Italian_URL);
  return nonEmpty(taxon.English_URL);
}
