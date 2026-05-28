import {
  deriveCollections,
  domainOf,
  sensorKindFromDeviceClass,
  severityForEntity,
  toAlert,
} from '@/services/entityMapping';
import { DEFAULT_CONNECTION } from '@/constants/config';
import { HassEntityState } from '@/types';

function entity(
  entity_id: string,
  state: string,
  attributes: HassEntityState['attributes'] = {},
): HassEntityState {
  return { entity_id, state, attributes, last_changed: '2026-05-28T00:00:00Z' };
}

describe('domainOf', () => {
  it('returns the domain prefix', () => {
    expect(domainOf('alert.fire')).toBe('alert');
    expect(domainOf('binary_sensor.front_door')).toBe('binary_sensor');
  });

  it('returns the whole id when there is no separator', () => {
    expect(domainOf('weird')).toBe('weird');
  });
});

describe('sensorKindFromDeviceClass', () => {
  it('maps device classes to sensor kinds', () => {
    expect(sensorKindFromDeviceClass('motion')).toBe('motion');
    expect(sensorKindFromDeviceClass('window')).toBe('door');
    expect(sensorKindFromDeviceClass('co')).toBe('carbon_monoxide');
    expect(sensorKindFromDeviceClass('moisture')).toBe('water');
  });

  it('falls back to unknown', () => {
    expect(sensorKindFromDeviceClass(undefined)).toBe('unknown');
    expect(sensorKindFromDeviceClass('battery')).toBe('unknown');
  });
});

describe('severityForEntity', () => {
  it('prefers an explicit severity attribute', () => {
    expect(severityForEntity(entity('alert.x', 'on', { severity: 'warning' }))).toBe(
      'warning',
    );
  });

  it('derives critical from life-safety device classes', () => {
    expect(severityForEntity(entity('alert.x', 'on', { device_class: 'smoke' }))).toBe(
      'critical',
    );
  });

  it('defaults to info', () => {
    expect(severityForEntity(entity('alert.x', 'on'))).toBe('info');
  });
});

describe('toAlert', () => {
  it('is active when firing and not acknowledged', () => {
    const result = toAlert(entity('alert.fire', 'on'), new Set());
    expect(result.state).toBe('active');
  });

  it('is acknowledged when in the acknowledged set', () => {
    const result = toAlert(entity('alert.fire', 'on'), new Set(['alert.fire']));
    expect(result.state).toBe('acknowledged');
  });

  it('is resolved when not firing', () => {
    const result = toAlert(entity('alert.fire', 'off'), new Set(['alert.fire']));
    expect(result.state).toBe('resolved');
  });
});

describe('deriveCollections', () => {
  it('classifies entities and sorts alerts by priority', () => {
    const entities: HassEntityState[] = [
      entity('alert.info_one', 'on', { severity: 'info' }),
      entity('alert.fire', 'on', { device_class: 'smoke' }),
      entity('binary_sensor.door', 'off', { device_class: 'door' }),
      entity('sensor.temp', '21', { unit_of_measurement: '°C' }),
      entity('light.lamp', 'on'),
    ];

    const { alerts, sensors } = deriveCollections(
      entities,
      DEFAULT_CONNECTION,
      new Set(),
    );

    expect(alerts.map((a) => a.id)).toEqual(['alert.fire', 'alert.info_one']);
    expect(sensors.map((s) => s.id).sort()).toEqual([
      'binary_sensor.door',
      'sensor.temp',
    ]);
    // light.lamp is neither an alert nor a configured sensor domain.
    expect(sensors.find((s) => s.id === 'light.lamp')).toBeUndefined();
  });

  it('formats sensor values with their unit', () => {
    const { sensors } = deriveCollections(
      [entity('sensor.temp', '21', { unit_of_measurement: '°C' })],
      DEFAULT_CONNECTION,
      new Set(),
    );
    expect(sensors[0].value).toBe('21°C');
  });
});
