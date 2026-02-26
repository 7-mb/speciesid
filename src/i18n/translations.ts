export type Language = 'de' | 'fr' | 'it' | 'en';

export type TranslationKey =
  | 'tabs.identify'
  | 'tabs.whatsHere'
  | 'tabs.settings'
  | 'modeSwitcher.accessibility'
  | 'modes.plants'
  | 'modes.moths'
  | 'modes.mushrooms'
  | 'identify.title'
  | 'identify.subtitle'
  | 'identify.actions.pickGallery'
  | 'identify.actions.takePhoto'
  | 'identify.counters.selected'
  | 'identify.counters.saved'
  | 'identify.hints.cropTip'
  | 'identify.empty.noImages'
  | 'identify.alerts.errorTitle'
  | 'identify.alerts.unknownPickerError'
  | 'identify.alerts.noPermissionTitle'
  | 'identify.alerts.noPermissionBody'
  | 'identify.alerts.limitTitle'
  | 'identify.alerts.limitBody'
  | 'identify.accessibility.selectedImage'
  | 'identify.accessibility.removeImage'
  | 'whatsHere.title'
  | 'whatsHere.subtitle'
  | 'whatsHere.empty'
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.language.title'
  | 'settings.language.description'
  | 'settings.language.option.de'
  | 'settings.language.option.fr'
  | 'settings.language.option.it'
  | 'settings.language.option.en';

type Dictionary = Record<TranslationKey, string>;

export const DEFAULT_LANGUAGE: Language = 'de';

export const TRANSLATIONS: Record<Language, Dictionary> = {
  de: {
    'tabs.identify': 'Bestimmen',
    'tabs.whatsHere': "Was gibt's hier?",
    'tabs.settings': 'Einstellungen',

    'modeSwitcher.accessibility': 'Modus wechseln',

    'modes.plants': 'Pflanzen',
    'modes.moths': 'Nachtfalter',
    'modes.mushrooms': 'Pilze',

    'identify.title': 'Bilder auswählen',
    'identify.subtitle': 'Wähle 1–5 Bilder aus deiner Galerie oder mache ein Foto mit der Kamera.',
    'identify.actions.pickGallery': 'Aus Galerie wählen',
    'identify.actions.takePhoto': 'Foto aufnehmen',
    'identify.counters.selected': 'Ausgewählt: {{count}}',
    'identify.counters.saved': 'Gespeichert: {{count}}',
    'identify.hints.cropTip': 'Tipp: Tippe ein Bild an, um es zuzuschneiden.',
    'identify.empty.noImages': 'Noch keine Bilder ausgewählt.',
    'identify.alerts.errorTitle': 'Fehler',
    'identify.alerts.unknownPickerError': 'Unbekannter Fehler beim Öffnen der Medienauswahl.',
    'identify.alerts.noPermissionTitle': 'Keine Berechtigung',
    'identify.alerts.noPermissionBody': 'Ohne Foto-Berechtigung kann die App nicht in deine Mediathek speichern.',
    'identify.alerts.limitTitle': 'Limit erreicht',
    'identify.alerts.limitBody': 'Du kannst bis zu {{max}} Bilder auswählen.',
    'identify.accessibility.selectedImage': 'Ausgewähltes Bild',
    'identify.accessibility.removeImage': 'Bild entfernen',

    'whatsHere.title': "Was gibt's hier?",
    'whatsHere.subtitle': 'Platzhalter für lokale Beobachtungen und Vorschläge.',
    'whatsHere.empty': 'Kommt bald.',

    'settings.title': 'Einstellungen',
    'settings.subtitle': 'App-Einstellungen und Präferenzen.',
    'settings.language.title': 'Sprache',
    'settings.language.description': 'Wähle die Sprache der Benutzeroberfläche.',
    'settings.language.option.de': 'Deutsch',
    'settings.language.option.fr': 'Français',
    'settings.language.option.it': 'Italiano',
    'settings.language.option.en': 'English',
  },
  en: {
    'tabs.identify': 'Identify',
    'tabs.whatsHere': "What's here?",
    'tabs.settings': 'Settings',

    'modeSwitcher.accessibility': 'Mode switcher',

    'modes.plants': 'Plants',
    'modes.moths': 'Moths',
    'modes.mushrooms': 'Mushrooms',

    'identify.title': 'Select images',
    'identify.subtitle': 'Choose 1–5 images from your gallery, or take a photo with the camera.',
    'identify.actions.pickGallery': 'Pick from gallery',
    'identify.actions.takePhoto': 'Take a photo',
    'identify.counters.selected': 'Selected: {{count}}',
    'identify.counters.saved': 'Saved: {{count}}',
    'identify.hints.cropTip': 'Tip: Tap an image to crop it.',
    'identify.empty.noImages': 'No images selected yet.',
    'identify.alerts.errorTitle': 'Error',
    'identify.alerts.unknownPickerError': 'Unknown error while opening the media picker.',
    'identify.alerts.noPermissionTitle': 'No permission',
    'identify.alerts.noPermissionBody': 'Without photo permission, the app cannot save to your photo library.',
    'identify.alerts.limitTitle': 'Limit reached',
    'identify.alerts.limitBody': 'You can select up to {{max}} images.',
    'identify.accessibility.selectedImage': 'Selected image',
    'identify.accessibility.removeImage': 'Remove image',

    'whatsHere.title': "What's here?",
    'whatsHere.subtitle': 'Placeholder screen for local observations and suggestions.',
    'whatsHere.empty': 'Coming soon.',

    'settings.title': 'Settings',
    'settings.subtitle': 'App preferences.',
    'settings.language.title': 'Language',
    'settings.language.description': 'Choose the app language.',
    'settings.language.option.de': 'Deutsch',
    'settings.language.option.fr': 'Français',
    'settings.language.option.it': 'Italiano',
    'settings.language.option.en': 'English',
  },
  fr: {
    'tabs.identify': 'Identifier',
    'tabs.whatsHere': "Qu’y a-t-il ici ?",
    'tabs.settings': 'Paramètres',

    'modeSwitcher.accessibility': 'Sélecteur de mode',

    'modes.plants': 'Plantes',
    'modes.moths': 'Papillons de nuit',
    'modes.mushrooms': 'Champignons',

    'identify.title': 'Sélectionner des images',
    'identify.subtitle': "Choisissez 1 à 5 images dans votre galerie, ou prenez une photo avec l’appareil.",
    'identify.actions.pickGallery': 'Choisir dans la galerie',
    'identify.actions.takePhoto': 'Prendre une photo',
    'identify.counters.selected': 'Sélectionnées : {{count}}',
    'identify.counters.saved': 'Enregistrées : {{count}}',
    'identify.hints.cropTip': 'Astuce : touchez une image pour la recadrer.',
    'identify.empty.noImages': "Aucune image sélectionnée pour l’instant.",
    'identify.alerts.errorTitle': 'Erreur',
    'identify.alerts.unknownPickerError': 'Erreur inconnue lors de l’ouverture du sélecteur de médias.',
    'identify.alerts.noPermissionTitle': 'Aucune autorisation',
    'identify.alerts.noPermissionBody': "Sans autorisation Photos, l’app ne peut pas enregistrer dans votre photothèque.",
    'identify.alerts.limitTitle': 'Limite atteinte',
    'identify.alerts.limitBody': "Vous pouvez sélectionner jusqu’à {{max}} images.",
    'identify.accessibility.selectedImage': 'Image sélectionnée',
    'identify.accessibility.removeImage': 'Supprimer l’image',

    'whatsHere.title': "Qu’y a-t-il ici ?",
    'whatsHere.subtitle': 'Écran provisoire pour les observations locales et des suggestions.',
    'whatsHere.empty': 'Bientôt disponible.',

    'settings.title': 'Paramètres',
    'settings.subtitle': "Préférences de l’application.",
    'settings.language.title': 'Langue',
    'settings.language.description': "Choisissez la langue de l’interface.",
    'settings.language.option.de': 'Deutsch',
    'settings.language.option.fr': 'Français',
    'settings.language.option.it': 'Italiano',
    'settings.language.option.en': 'English',
  },
  it: {
    'tabs.identify': 'Identifica',
    'tabs.whatsHere': "Cosa c’è qui?",
    'tabs.settings': 'Impostazioni',

    'modeSwitcher.accessibility': 'Selettore modalità',

    'modes.plants': 'Piante',
    'modes.moths': 'Falene',
    'modes.mushrooms': 'Funghi',

    'identify.title': 'Seleziona immagini',
    'identify.subtitle': 'Scegli 1–5 immagini dalla galleria o scatta una foto con la fotocamera.',
    'identify.actions.pickGallery': 'Scegli dalla galleria',
    'identify.actions.takePhoto': 'Scatta una foto',
    'identify.counters.selected': 'Selezionate: {{count}}',
    'identify.counters.saved': 'Salvate: {{count}}',
    'identify.hints.cropTip': 'Suggerimento: tocca un’immagine per ritagliarla.',
    'identify.empty.noImages': 'Nessuna immagine selezionata.',
    'identify.alerts.errorTitle': 'Errore',
    'identify.alerts.unknownPickerError': "Errore sconosciuto durante l’apertura del selettore multimediale.",
    'identify.alerts.noPermissionTitle': 'Nessuna autorizzazione',
    'identify.alerts.noPermissionBody': "Senza il permesso Foto, l’app non può salvare nella libreria fotografica.",
    'identify.alerts.limitTitle': 'Limite raggiunto',
    'identify.alerts.limitBody': 'Puoi selezionare fino a {{max}} immagini.',
    'identify.accessibility.selectedImage': 'Immagine selezionata',
    'identify.accessibility.removeImage': 'Rimuovi immagine',

    'whatsHere.title': "Cosa c’è qui?",
    'whatsHere.subtitle': 'Schermata segnaposto per osservazioni locali e suggerimenti.',
    'whatsHere.empty': 'Prossimamente.',

    'settings.title': 'Impostazioni',
    'settings.subtitle': "Preferenze dell’app.",
    'settings.language.title': 'Lingua',
    'settings.language.description': "Scegli la lingua dell’interfaccia.",
    'settings.language.option.de': 'Deutsch',
    'settings.language.option.fr': 'Français',
    'settings.language.option.it': 'Italiano',
    'settings.language.option.en': 'English',
  },
};

export function translate(language: Language, key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
  const fallback = TRANSLATIONS.en;

  const template = dict[key] ?? fallback[key] ?? key;

  if (!vars) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? '' : String(value);
  });
}
