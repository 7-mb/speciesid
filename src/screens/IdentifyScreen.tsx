import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ModeSwitcher from '../components/ModeSwitcher';
import { useI18n } from '../state/language';
import { useMode } from '../state/mode';
import { colors } from '../theme/colors';

import { getInfofloraLocalizedName, getInfofloraLocalizedUrl, getInfofloraTaxonById } from '../data/infofloraTaxa';

import { normalizeUri } from './identify/imageUtils';
import { useIdentifyImages } from './identify/useIdentifyImages';
import { useIdentifyRequest } from './identify/useIdentifyRequest';

export default function IdentifyScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { mode, setMode } = useMode();
  const { t, language } = useI18n();

  const { images, selectedCountText, savedCountText, pickFromGallery, takePhoto, cropImage, removeImage } = useIdentifyImages({ t });

  const { isIdentifying, identifyResponseText, identifyResults, handleIdentify } = useIdentifyRequest({ t, images });

  const openInfoLink = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

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
              {identifyResults.map((row) => {
                const taxon = getInfofloraTaxonById(row.id);
                const localizedName = taxon ? getInfofloraLocalizedName(taxon, language) : undefined;
                const url = taxon ? getInfofloraLocalizedUrl(taxon, language) : undefined;
                const percentText = Number.isFinite(row.percent) ? `${row.percent.toFixed(1)}%` : '';

                return (
                  <View key={`${row.id}-${row.name}`} style={styles.resultRow}>
                    <View style={styles.resultRowLeft}>
                      <Text style={styles.resultRowText}>
                        {row.id} {row.name}
                        {localizedName ? ` (${localizedName})` : ''} {percentText}
                      </Text>
                    </View>

                    {url ? (
                      <Pressable
                        onPress={() => openInfoLink(url)}
                        hitSlop={10}
                        style={styles.resultRowLinkButton}
                        accessibilityRole="link"
                        accessibilityLabel={t('identify.accessibility.openInfoLink')}
                      >
                        <MaterialCommunityIcons name="link-variant" size={18} color={colors.text} />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
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
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultRowLeft: {
    flex: 1,
    paddingRight: 8,
  },
  resultRowText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  resultRowLinkButton: {
    padding: 6,
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
