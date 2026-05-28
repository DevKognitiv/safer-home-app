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
  /** Identifier of the sensor/entity that triggered the alert. */
  sourceSensorId?: string;
}

export type SensorKind =
  | 'motion'
  | 'door'
  | 'smoke'
  | 'water'
  | 'temperature'
  | 'gas'
  | 'carbon_monoxide'
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
  /** Long-lived access token used for the auth handshake. */
  token?: string;
  /** Entity domains treated as alerts (e.g. "alert"). */
  alertDomains: string[];
  /** Entity domains surfaced as sensors (e.g. "binary_sensor", "sensor"). */
  sensorDomains: string[];
  /** Service invoked to acknowledge an alert, as "domain.service". */
  acknowledgeService: string;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'error';

/** Raw entity state as delivered by the Home Assistant WebSocket API. */
export interface HassEntityState {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    device_class?: string;
    severity?: AlertSeverity | string;
    unit_of_measurement?: string;
    [key: string]: unknown;
  };
  last_changed?: string;
  last_updated?: string;
}

/** Navigation parameter list for the root native stack. */
export type RootStackParamList = {
  Home: undefined;
  AlertDetail: { alertId: string };
};
