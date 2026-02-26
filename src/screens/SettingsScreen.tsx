import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n, type Language } from '../state/language';
import { colors } from '../theme/colors';
import styles from './screenStyles';

const LANGUAGE_OPTIONS: { key: Language; labelKey: 'settings.language.option.de' | 'settings.language.option.fr' | 'settings.language.option.it' | 'settings.language.option.en' }[] = [
  { key: 'de', labelKey: 'settings.language.option.de' },
  { key: 'fr', labelKey: 'settings.language.option.fr' },
  { key: 'it', labelKey: 'settings.language.option.it' },
  { key: 'en', labelKey: 'settings.language.option.en' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { language, setLanguage, t } = useI18n();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: 12 + tabBarHeight }]}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>

      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('settings.language.title')}</Text>
        <Text style={localStyles.sectionDescription}>{t('settings.language.description')}</Text>

        <View style={localStyles.optionsRow} accessibilityRole="radiogroup">
          {LANGUAGE_OPTIONS.map((opt) => {
            const selected = opt.key === language;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setLanguage(opt.key)}
                style={[localStyles.optionButton, selected ? localStyles.optionButtonSelected : null]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t(opt.labelKey)}
              >
                <Text style={[localStyles.optionText, selected ? localStyles.optionTextSelected : null]}>{t(opt.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  section: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.greenDark,
    backgroundColor: colors.yellowBg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDescription: {
    marginTop: 6,
    fontSize: 13,
    color: colors.text,
  },
  optionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.greenDark,
    backgroundColor: colors.white,
  },
  optionButtonSelected: {
    backgroundColor: colors.greenDark,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.linkOnWhite,
  },
  optionTextSelected: {
    color: colors.menuLink,
  },
});
