import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '@/types';
import HomeScreen from '@/screens/HomeScreen';
import AlertDetailScreen from '@/screens/AlertDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

export default function App() {
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
          name="Home"
          component={HomeScreen}
          options={{ title: 'SafeR Home' }}
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
