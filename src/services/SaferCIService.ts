import {
  Alert,
  ConnectionConfig,
  ConnectionState,
  HassEntityState,
  SensorStatus,
} from '@/types';
import {
  DEFAULT_CONNECTION,
  RECONNECT_DELAY_MS,
  buildWebSocketUrl,
} from '@/constants/config';
import { deriveCollections } from '@/services/entityMapping';

type AlertsListener = (alerts: Alert[]) => void;
type SensorsListener = (sensors: SensorStatus[]) => void;
type StateListener = (state: ConnectionState) => void;

interface PendingResult {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * WebSocket client for the SafeR CI emergency-response platform, speaking the
 * Home Assistant WebSocket API: an auth handshake, an initial `get_states`
 * snapshot, a `subscribe_events` subscription to `state_changed`, and
 * `call_service` for acknowledging alerts.
 *
 * Raw entity states are mapped to {@link Alert} / {@link SensorStatus} domain
 * objects in `entityMapping.ts`.
 */
export class SaferCIService {
  private config: ConnectionConfig;
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;

  private msgId = 1;
  private readonly pending = new Map<number, PendingResult>();

  private readonly entities = new Map<string, HassEntityState>();
  private readonly acknowledgedIds = new Set<string>();

  private readonly alertsListeners = new Set<AlertsListener>();
  private readonly sensorsListeners = new Set<SensorsListener>();
  private readonly stateListeners = new Set<StateListener>();

  private alerts: Alert[] = [];
  private sensors: SensorStatus[] = [];

  constructor(config: ConnectionConfig = DEFAULT_CONNECTION) {
    this.config = config;
  }

  getConfig(): ConnectionConfig {
    return this.config;
  }

  /** Replace the connection config and reconnect if currently connected. */
  setConfig(config: ConnectionConfig): void {
    this.config = config;
    if (this.socket) {
      this.reconnect();
    } else {
      this.recompute();
    }
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
    if (this.state === 'connecting' || this.state === 'authenticating') {
      return;
    }
    this.manualClose = false;
    this.clearReconnect();
    this.setState('connecting');

    let socket: WebSocket;
    try {
      socket = new WebSocket(buildWebSocketUrl(this.config));
    } catch {
      this.setState('error');
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    socket.onerror = () => {
      this.setState('error');
    };
    socket.onclose = () => {
      this.handleClose();
    };
  }

  disconnect(): void {
    this.manualClose = true;
    this.clearReconnect();
    this.rejectAllPending(new Error('Disconnected'));
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setState('disconnected');
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /**
   * Acknowledge an alert. Optimistically marks it acknowledged locally, then
   * invokes the configured Home Assistant service. The optimistic state is
   * rolled back if the service call fails.
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    this.acknowledgedIds.add(alertId);
    this.recompute();

    const [domain, service] = this.config.acknowledgeService.split('.');
    if (!domain || !service) {
      return;
    }
    try {
      await this.sendCommand({
        type: 'call_service',
        domain,
        service,
        service_data: { entity_id: alertId },
        target: { entity_id: alertId },
      });
    } catch (err) {
      this.acknowledgedIds.delete(alertId);
      this.recompute();
      throw err;
    }
  }

  onAlerts(listener: AlertsListener): () => void {
    this.alertsListeners.add(listener);
    listener(this.alerts);
    return () => {
      this.alertsListeners.delete(listener);
    };
  }

  onSensors(listener: SensorsListener): () => void {
    this.sensorsListeners.add(listener);
    listener(this.sensors);
    return () => {
      this.sensorsListeners.delete(listener);
    };
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // --- Internal protocol handling -----------------------------------------

  private handleMessage(raw: unknown): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    switch (msg.type) {
      case 'auth_required':
        this.setState('authenticating');
        this.sendRaw({ type: 'auth', access_token: this.config.token ?? '' });
        break;
      case 'auth_ok':
        this.onAuthenticated();
        break;
      case 'auth_invalid':
        this.setState('error');
        this.manualClose = true;
        this.socket?.close();
        break;
      case 'event':
        this.handleEvent(msg.event as Record<string, unknown> | undefined);
        break;
      case 'result':
        this.resolvePending(msg);
        break;
      default:
        break;
    }
  }

  private async onAuthenticated(): Promise<void> {
    this.setState('connected');
    try {
      const states = (await this.sendCommand({
        type: 'get_states',
      })) as HassEntityState[];
      this.entities.clear();
      for (const entity of states ?? []) {
        this.entities.set(entity.entity_id, entity);
      }
      this.recompute();
      await this.sendCommand({
        type: 'subscribe_events',
        event_type: 'state_changed',
      });
    } catch {
      // Connection dropped mid-handshake; onclose handles reconnect.
    }
  }

  private handleEvent(event: Record<string, unknown> | undefined): void {
    if (!event || event.event_type !== 'state_changed') {
      return;
    }
    const data = event.data as
      | { entity_id?: string; new_state?: HassEntityState | null }
      | undefined;
    if (!data?.entity_id) {
      return;
    }
    if (data.new_state) {
      this.entities.set(data.entity_id, data.new_state);
    } else {
      this.entities.delete(data.entity_id);
      this.acknowledgedIds.delete(data.entity_id);
    }
    this.recompute();
  }

  private handleClose(): void {
    this.socket = null;
    this.rejectAllPending(new Error('Socket closed'));
    if (this.manualClose) {
      this.setState('disconnected');
      return;
    }
    this.setState('disconnected');
    this.scheduleReconnect();
  }

  private sendCommand(payload: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Socket not open'));
        return;
      }
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ ...payload, id }));
    });
  }

  private sendRaw(payload: Record<string, unknown>): void {
    this.socket?.send(JSON.stringify(payload));
  }

  private resolvePending(msg: Record<string, unknown>): void {
    const id = msg.id as number | undefined;
    if (id === undefined) {
      return;
    }
    const pending = this.pending.get(id);
    if (!pending) {
      return;
    }
    this.pending.delete(id);
    if (msg.success === false) {
      const error = msg.error as { message?: string } | undefined;
      pending.reject(new Error(error?.message ?? 'Command failed'));
    } else {
      pending.resolve(msg.result);
    }
  }

  private rejectAllPending(error: Error): void {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }

  private recompute(): void {
    const { alerts, sensors } = deriveCollections(
      this.entities.values(),
      this.config,
      this.acknowledgedIds,
    );
    this.alerts = alerts;
    this.sensors = sensors;
    this.emitAlerts();
    this.emitSensors();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.manualClose) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) {
      return;
    }
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  private emitAlerts(): void {
    this.alertsListeners.forEach((listener) => listener(this.alerts));
  }

  private emitSensors(): void {
    this.sensorsListeners.forEach((listener) => listener(this.sensors));
  }
}

/** Shared singleton instance used across screens and app state. */
export const saferCIService = new SaferCIService();
