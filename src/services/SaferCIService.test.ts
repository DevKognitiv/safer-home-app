import { SaferCIService } from '@/services/SaferCIService';
import { DEFAULT_CONNECTION } from '@/constants/config';

interface SentMessage {
  type: string;
  id?: number;
  [key: string]: unknown;
}

class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.OPEN;
  sent: SentMessage[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data) as SentMessage);
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  receive(message: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('SaferCIService (Home Assistant protocol)', () => {
  let original: typeof globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    original = globalThis.WebSocket;
    (globalThis as { WebSocket: unknown }).WebSocket = FakeWebSocket;
  });

  afterEach(() => {
    (globalThis as { WebSocket: unknown }).WebSocket = original;
  });

  async function connectAndAuthenticate(service: SaferCIService) {
    service.connect();
    const ws = FakeWebSocket.instances[0];
    ws.receive({ type: 'auth_required' });
    ws.receive({ type: 'auth_ok' });
    await flush();
    return ws;
  }

  it('performs the auth handshake with the configured token', () => {
    const service = new SaferCIService({ ...DEFAULT_CONNECTION, token: 'tok' });
    service.connect();
    const ws = FakeWebSocket.instances[0];

    ws.receive({ type: 'auth_required' });

    expect(ws.sent).toContainEqual({ type: 'auth', access_token: 'tok' });
  });

  it('requests states then subscribes to state_changed', async () => {
    const service = new SaferCIService({ ...DEFAULT_CONNECTION, token: 'tok' });
    const ws = await connectAndAuthenticate(service);

    const getStates = ws.sent.find((m) => m.type === 'get_states');
    expect(getStates).toBeDefined();

    ws.receive({
      type: 'result',
      id: getStates!.id,
      success: true,
      result: [
        {
          entity_id: 'alert.fire',
          state: 'on',
          attributes: { device_class: 'smoke', friendly_name: 'Kitchen smoke' },
        },
      ],
    });
    await flush();

    expect(ws.sent.find((m) => m.type === 'subscribe_events')).toMatchObject({
      event_type: 'state_changed',
    });
    expect(service.getAlerts()).toHaveLength(1);
    expect(service.getAlerts()[0].severity).toBe('critical');
  });

  it('updates entities from state_changed events', async () => {
    const service = new SaferCIService({ ...DEFAULT_CONNECTION, token: 'tok' });
    const ws = await connectAndAuthenticate(service);
    const getStates = ws.sent.find((m) => m.type === 'get_states');
    ws.receive({ type: 'result', id: getStates!.id, success: true, result: [] });
    await flush();

    ws.receive({
      type: 'event',
      event: {
        event_type: 'state_changed',
        data: {
          entity_id: 'binary_sensor.door',
          new_state: {
            entity_id: 'binary_sensor.door',
            state: 'on',
            attributes: { device_class: 'door', friendly_name: 'Front door' },
          },
        },
      },
    });

    expect(service.getSensors()).toHaveLength(1);
    expect(service.getSensors()[0].kind).toBe('door');
  });

  it('acknowledges an alert via call_service', async () => {
    const service = new SaferCIService({
      ...DEFAULT_CONNECTION,
      token: 'tok',
      acknowledgeService: 'safer_ci.acknowledge',
    });
    const ws = await connectAndAuthenticate(service);
    const getStates = ws.sent.find((m) => m.type === 'get_states');
    ws.receive({ type: 'result', id: getStates!.id, success: true, result: [] });
    await flush();

    void service.acknowledgeAlert('alert.fire');

    const call = ws.sent.find((m) => m.type === 'call_service');
    expect(call).toMatchObject({
      domain: 'safer_ci',
      service: 'acknowledge',
      service_data: { entity_id: 'alert.fire' },
    });
  });
});
