import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import IdentifyScreen from './src/screens/IdentifyScreen';
import WhatsHereScreen from './src/screens/WhatsHereScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ModeProvider } from './src/state/mode';

enableScreens();

type RootTabsParamList = {
  Identify: undefined;
  WhatsHere: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <ModeProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap;
                if (route.name === 'Identify') {
                  iconName = focused ? 'leaf' : 'leaf-outline';
                } else if (route.name === 'WhatsHere') {
                  iconName = focused ? 'map' : 'map-outline';
                } else {
                  iconName = focused ? 'settings' : 'settings-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Identify" component={IdentifyScreen} options={{ tabBarLabel: 'Bestimmen' }} />
            <Tab.Screen name="WhatsHere" component={WhatsHereScreen} options={{ tabBarLabel: "Was gibt's hier?" }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Einstellungen' }} />
          </Tab.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </ModeProvider>
    </SafeAreaProvider>
  );
}
