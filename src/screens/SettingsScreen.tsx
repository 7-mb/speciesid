import { Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from './screenStyles';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: 12 + tabBarHeight }]}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Placeholder screen for app preferences.</Text>
      <Text style={styles.emptyState}>Coming soon.</Text>
    </View>
  );
}
