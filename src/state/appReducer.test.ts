import { appReducer, initialAppState, AppState } from '@/state/appReducer';
import { Alert, SensorStatus } from '@/types';

const sampleAlert: Alert = {
  id: 'alert.a',
  title: 'A',
  message: 'm',
  severity: 'critical',
  state: 'active',
  raisedAt: '2026-05-28T00:00:00Z',
};

const sampleSensor: SensorStatus = {
  id: 'sensor.s',
  name: 'S',
  kind: 'motion',
  online: true,
  lastUpdated: '2026-05-28T00:00:00Z',
};

describe('appReducer', () => {
  it('updates connection state', () => {
    const next = appReducer(initialAppState, {
      type: 'SET_CONNECTION',
      connection: 'connected',
    });
    expect(next.connection).toBe('connected');
  });

  it('hydrates cached data when empty and disconnected', () => {
    const next = appReducer(initialAppState, {
      type: 'HYDRATE',
      alerts: [sampleAlert],
      sensors: [sampleSensor],
    });
    expect(next.alerts).toHaveLength(1);
    expect(next.sensors).toHaveLength(1);
    expect(next.hydrated).toBe(true);
  });

  it('does not overwrite live data on late hydration', () => {
    const live: AppState = {
      ...initialAppState,
      connection: 'connected',
      alerts: [sampleAlert],
    };
    const next = appReducer(live, {
      type: 'HYDRATE',
      alerts: [{ ...sampleAlert, id: 'alert.cached' }],
      sensors: [sampleSensor],
    });
    expect(next.alerts.map((a) => a.id)).toEqual(['alert.a']);
    expect(next.hydrated).toBe(true);
  });

  it('replaces alerts on SET_ALERTS', () => {
    const next = appReducer(initialAppState, {
      type: 'SET_ALERTS',
      alerts: [sampleAlert],
    });
    expect(next.alerts).toEqual([sampleAlert]);
  });
});
