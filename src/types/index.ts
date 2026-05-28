export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertState = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  state: AlertState;
  /** ISO-8601 timestamp of when the alert was raised. */
  raisedAt: string;
  /** Identifier of the sensor that triggered the alert, if any. */
  sourceSensorId?: string;
}

export type SensorKind =
  | 'motion'
  | 'door'
  | 'smoke'
  | 'water'
  | 'temperature'
  | 'unknown';

export interface SensorStatus {
  id: string;
  name: string;
  kind: SensorKind;
  online: boolean;
  /** Last reported value, units depend on sensor kind. */
  value?: number | boolean | string;
  /** ISO-8601 timestamp of the last update. */
  lastUpdated: string;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  /** WebSocket path on the SafeR CI / Home Assistant instance. */
  wsPath: string;
  /** Whether to use a secure (wss://) connection. */
  secure: boolean;
  /** Optional long-lived access token. */
  token?: string;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/** Navigation parameter list for the root native stack. */
export type RootStackParamList = {
  Home: undefined;
  AlertDetail: { alertId: string };
};
