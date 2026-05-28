import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList, RootTabParamList } from '@/types';
import HomeScreen from '@/screens/HomeScreen';
import SensorsScreen from '@/screens/SensorsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AlertDetailScreen from '@/screens/AlertDetailScreen';
import { saferCIService } from '@/services/SaferCIService';
import { loadConnectionConfig } from '@/services/storage';
import {
  configureNotificationHandler,
  presentAlertNotification,
  requestNotificationPermissions,
  selectAlertsToNotify,
} from '@/services/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B1F33',
    card: '#0B1F33',
    text: '#F8FAFC',
    primary: '#22C55E',
    border: '#13314F',
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1F33' },
        headerTintColor: '#F8FAFC',
        tabBarStyle: { backgroundColor: '#0B1F33', borderTopColor: '#13314F' },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tab.Screen
        name="Alerts"
        component={HomeScreen}
        options={{ title: 'SafeR Home' }}
      />
      <Tab.Screen name="Sensors" component={SensorsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    let cancelled = false;
    let notifiedIds = new Set<string>();
    let notificationsEnabled = false;

    configureNotificationHandler();

    const unsubscribe = saferCIService.onAlerts((alerts) => {
      const result = selectAlertsToNotify(notifiedIds, alerts);
      notifiedIds = result.notifiedIds;
      if (notificationsEnabled) {
        result.toNotify.forEach((alert) => {
          void presentAlertNotification(alert);
        });
      }
    });

    (async () => {
      notificationsEnabled = await requestNotificationPermissions();
      const config = await loadConnectionConfig();
      if (cancelled) {
        return;
      }
      saferCIService.setConfig(config);
      saferCIService.connect();
    })();

    return () => {
      cancelled = true;
      unsubscribe();
      saferCIService.disconnect();
    };
  }, []);

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0B1F33' },
          headerTintColor: '#F8FAFC',
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AlertDetail"
          component={AlertDetailScreen}
          options={{ title: 'Alert' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
