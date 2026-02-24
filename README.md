# feb-cropper-1

Expo (TypeScript) Demo-App: Nutzer kann **1–5 Bilder** aus der Galerie auswählen oder **ein Foto mit der Kamera aufnehmen** – umgesetzt mit `react-native-image-crop-picker`.

## Wichtiger Hinweis zu Expo Go

`react-native-image-crop-picker` ist ein **Native Module**. Das läuft **nicht** in der standardmäßigen **Expo Go** App.

Du brauchst stattdessen einen **Expo Dev Client** (Custom Development Build) oder ein Bare-Workflow Setup.

Hinweis: Wenn du neue **Native Module** installierst (z.B. `@lodev09/react-native-exify`), musst du den Dev Client **neu bauen** (EAS Build oder `expo run:*`), sonst ist das Modul zur Laufzeit nicht verfügbar.

## Wo finde ich die gespeicherten Bilder?

- **iOS Fotos-App:** Die App speichert die Bilder (inkl. Dummy-EXIF) in ein Album namens **`feb-cropper-1`**. Du findest sie in **Fotos → Alben**.
- **iOS Dateien-App (optional):** Zusätzlich liegt eine Kopie im App-Dokumente-Ordner. Mit den gesetzten iOS-Keys (`UIFileSharingEnabled`, `LSSupportsOpeningDocumentsInPlace`) erscheint die App unter **Dateien → Auf meinem iPhone → feb-cropper-1**.

Wenn du `app.json` änderst oder neue Native Module installierst, baue den iOS Dev Client erneut (EAS Build), damit die Änderungen im nativen Build landen.

## Start (Android)

1. Dependencies installieren

```bash
npm install
```

2. Dev Client bauen & installieren (erstellt/aktualisiert `android/` via Prebuild)

```bash
npx expo run:android
```

3. Metro im Dev-Client-Modus starten

```bash
npm run start:dev
```

Dann die App auf dem Gerät/Emulator öffnen (der Dev Client wird in Schritt 2 installiert) und das Projekt laden.

## Start (iOS)

### Option A: macOS + Xcode (lokal)

`npx expo run:ios` benötigt macOS + Xcode.

### Option B: Windows/Linux: EAS Build (empfohlen)

Du kannst iOS Builds auch **ohne macOS** erstellen, aber du brauchst dafür i. d. R. einen **Apple Developer Account**.

1. `ios.bundleIdentifier` prüfen/anpassen

In `app.json` ist aktuell ein Platzhalter gesetzt:

- `expo.ios.bundleIdentifier`: `com.example.febcropper1`

Ändere den Identifier auf etwas, das zu deinem Team passt und eindeutig ist.

2. EAS CLI installieren & anmelden

```bash
npm i -g eas-cli
eas login
```

3. Development Build (Dev Client) bauen

```bash
eas build -p ios --profile development
```

4. Dev Client starten

```bash
npm run start:dev
```

Den gebauten iOS Dev Client installierst du anschließend (EAS gibt dir einen Link/QR). Danach öffnest du die App und lädst dein Projekt im Dev-Client-Modus.

## Code

- UI + Logik: `App.tsx`
- Permissions (iOS/Android): `app.json`
