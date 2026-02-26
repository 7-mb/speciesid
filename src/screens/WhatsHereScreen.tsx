import { Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ModeSwitcher from '../components/ModeSwitcher';
import { useI18n } from '../state/language';
import { useMode } from '../state/mode';
import styles from './screenStyles';

export default function WhatsHereScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { mode, setMode } = useMode();
  const { t } = useI18n();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: 12 + tabBarHeight }]}>
      <ModeSwitcher mode={mode} onChange={setMode} />

      <Text style={styles.title}>{t('whatsHere.title')}</Text>
      <Text style={styles.subtitle}>{t('whatsHere.subtitle')}</Text>
      <Text style={styles.emptyState}>{t('whatsHere.empty')}</Text>
    </View>
  );
}
