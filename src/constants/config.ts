import { ConnectionConfig } from '@/types';

/**
 * Default connection settings for a local SafeR CI / Home Assistant instance.
 * Override these from the Settings screen; values are persisted across launches.
 */
export const DEFAULT_CONNECTION: ConnectionConfig = {
  host: '192.168.1.100',
  port: 8123,
  wsPath: '/api/websocket',
  secure: false,
  alertDomains: ['alert'],
  sensorDomains: ['binary_sensor', 'sensor'],
  acknowledgeService: 'safer_ci.acknowledge',
};

export function buildWebSocketUrl(config: ConnectionConfig): string {
  const scheme = config.secure ? 'wss' : 'ws';
  return `${scheme}://${config.host}:${config.port}${config.wsPath}`;
}

/** Merge a partial (e.g. persisted) config over the defaults. */
export function withDefaults(
  partial: Partial<ConnectionConfig> | null | undefined,
): ConnectionConfig {
  return { ...DEFAULT_CONNECTION, ...(partial ?? {}) };
}

/** Milliseconds to wait before attempting to reconnect after a drop. */
export const RECONNECT_DELAY_MS = 5000;
