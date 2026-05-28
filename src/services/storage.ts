import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert, ConnectionConfig, SensorStatus } from '@/types';
import { withDefaults } from '@/constants/config';

const CONFIG_KEY = 'safer.connection.config';
const TOKEN_KEY = 'safer_access_token';
const ALERTS_CACHE_KEY = 'safer.cache.alerts';
const SENSORS_CACHE_KEY = 'safer.cache.sensors';

/**
 * Load the persisted connection config, merging the non-secret part (stored in
 * AsyncStorage) with the access token (stored in expo-secure-store) over the
 * built-in defaults.
 */
export async function loadConnectionConfig(): Promise<ConnectionConfig> {
  const [rawConfig, token] = await Promise.all([
    AsyncStorage.getItem(CONFIG_KEY),
    SecureStore.getItemAsync(TOKEN_KEY),
  ]);

  let parsed: Partial<ConnectionConfig> | null = null;
  if (rawConfig) {
    try {
      parsed = JSON.parse(rawConfig) as Partial<ConnectionConfig>;
    } catch {
      parsed = null;
    }
  }
  return withDefaults({ ...parsed, token: token ?? undefined });
}

/**
 * Persist the connection config. The token is written to secure storage; the
 * remaining fields are written to AsyncStorage.
 */
export async function saveConnectionConfig(
  config: ConnectionConfig,
): Promise<void> {
  const { token, ...rest } = config;
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(rest));
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

/** Load the last-known alerts and sensors for offline display. */
export async function loadCachedCollections(): Promise<{
  alerts: Alert[];
  sensors: SensorStatus[];
}> {
  const [rawAlerts, rawSensors] = await Promise.all([
    AsyncStorage.getItem(ALERTS_CACHE_KEY),
    AsyncStorage.getItem(SENSORS_CACHE_KEY),
  ]);
  return {
    alerts: parseArray<Alert>(rawAlerts),
    sensors: parseArray<SensorStatus>(rawSensors),
  };
}

export async function cacheAlerts(alerts: Alert[]): Promise<void> {
  await AsyncStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify(alerts));
}

export async function cacheSensors(sensors: SensorStatus[]): Promise<void> {
  await AsyncStorage.setItem(SENSORS_CACHE_KEY, JSON.stringify(sensors));
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
