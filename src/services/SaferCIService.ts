import {
  Alert,
  ConnectionConfig,
  ConnectionState,
  SensorStatus,
} from '@/types';
import {
  DEFAULT_CONNECTION,
  RECONNECT_DELAY_MS,
  buildWebSocketUrl,
} from '@/constants/config';

type AlertsListener = (alerts: Alert[]) => void;
type SensorsListener = (sensors: SensorStatus[]) => void;
type StateListener = (state: ConnectionState) => void;

/**
 * WebSocket client stub for the SafeR CI emergency-response platform.
 *
 * This is a scaffold: the transport is wired up but the SafeR CI / Home
 * Assistant message protocol is not yet implemented. Methods that would talk
 * to the backend are marked with TODO and currently operate on local state so
 * the UI can be developed against realistic data.
 */
export class SaferCIService {
  private config: ConnectionConfig;
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private alertsListeners = new Set<AlertsListener>();
  private sensorsListeners = new Set<SensorsListener>();
  private stateListeners = new Set<StateListener>();

  private alerts: Alert[] = [];
  private sensors: SensorStatus[] = [];

  constructor(config: ConnectionConfig = DEFAULT_CONNECTION) {
    this.config = config;
  }

  getState(): ConnectionState {
    return this.state;
  }

  getAlerts(): Alert[] {
    return this.alerts;
  }

  getSensors(): SensorStatus[] {
    return this.sensors;
  }

  connect(): void {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }
    this.setState('connecting');

    const url = buildWebSocketUrl(this.config);
    try {
      this.socket = new WebSocket(url);
    } catch (err) {
      this.setState('error');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.setState('connected');
      // TODO: send auth handshake using this.config.token, then subscribe
      // to SafeR CI alert and sensor state-change events.
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.socket.onerror = () => {
      this.setState('error');
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.state !== 'disconnected') {
        this.setState('disconnected');
        this.scheduleReconnect();
      }
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.setState('disconnected');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /** Acknowledge an alert. Updates local state and notifies the backend. */
  acknowledgeAlert(alertId: string): void {
    this.alerts = this.alerts.map((alert) =>
      alert.id === alertId ? { ...alert, state: 'acknowledged' } : alert,
    );
    this.emitAlerts();
    // TODO: send acknowledge command to SafeR CI over the WebSocket.
  }

  onAlerts(listener: AlertsListener): () => void {
    this.alertsListeners.add(listener);
    listener(this.alerts);
    return () => this.alertsListeners.delete(listener);
  }

  onSensors(listener: SensorsListener): () => void {
    this.sensorsListeners.add(listener);
    listener(this.sensors);
    return () => this.sensorsListeners.delete(listener);
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  private handleMessage(_data: unknown): void {
    // TODO: parse SafeR CI / Home Assistant event payloads and update
    // this.alerts / this.sensors, then emit to listeners.
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  private emitAlerts(): void {
    this.alertsListeners.forEach((listener) => listener(this.alerts));
  }
}

/** Shared singleton instance used across screens. */
export const saferCIService = new SaferCIService();
