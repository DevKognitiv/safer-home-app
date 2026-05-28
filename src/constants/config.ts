import { ConnectionConfig } from '@/types';

/**
 * Default connection settings for a local SafeR CI / Home Assistant instance.
 * Override these from a settings screen or environment-specific build.
 */
export const DEFAULT_CONNECTION: ConnectionConfig = {
  host: '192.168.1.100',
  port: 8123,
  wsPath: '/api/websocket',
  secure: false,
};

export function buildWebSocketUrl(config: ConnectionConfig): string {
  const scheme = config.secure ? 'wss' : 'ws';
  return `${scheme}://${config.host}:${config.port}${config.wsPath}`;
}

/** Milliseconds to wait before attempting to reconnect after a drop. */
export const RECONNECT_DELAY_MS = 5000;
