import { Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ModeSwitcher from '../components/ModeSwitcher';
import { useMode } from '../state/mode';
import styles from './screenStyles';

export default function WhatsHereScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { mode, setMode } = useMode();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: 12 + tabBarHeight }]}>
      <ModeSwitcher mode={mode} onChange={setMode} />

      <Text style={styles.title}>What's here?</Text>
      <Text style={styles.subtitle}>Placeholder screen for local observations and suggestions.</Text>
      <Text style={styles.emptyState}>Coming soon.</Text>
    </View>
  );
}
