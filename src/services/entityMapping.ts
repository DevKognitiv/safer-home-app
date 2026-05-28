import {
  Alert,
  AlertSeverity,
  ConnectionConfig,
  HassEntityState,
  SensorKind,
  SensorStatus,
} from '@/types';

/** Home Assistant states that mean "no usable value". */
const UNAVAILABLE_STATES = new Set(['unavailable', 'unknown', 'none', '']);

/** device_class values that imply a life-safety, critical alert. */
const CRITICAL_DEVICE_CLASSES = new Set([
  'smoke',
  'gas',
  'carbon_monoxide',
  'co',
]);

const WARNING_DEVICE_CLASSES = new Set(['moisture', 'safety', 'heat']);

export function domainOf(entityId: string): string {
  const idx = entityId.indexOf('.');
  return idx === -1 ? entityId : entityId.slice(0, idx);
}

export function displayName(entity: HassEntityState): string {
  return entity.attributes.friendly_name ?? entity.entity_id;
}

export function isAlertEntity(
  entity: HassEntityState,
  config: ConnectionConfig,
): boolean {
  return config.alertDomains.includes(domainOf(entity.entity_id));
}

export function isSensorEntity(
  entity: HassEntityState,
  config: ConnectionConfig,
): boolean {
  return config.sensorDomains.includes(domainOf(entity.entity_id));
}

export function sensorKindFromDeviceClass(
  deviceClass: string | undefined,
): SensorKind {
  switch (deviceClass) {
    case 'motion':
    case 'occupancy':
    case 'presence':
      return 'motion';
    case 'door':
    case 'window':
    case 'opening':
    case 'garage_door':
      return 'door';
    case 'smoke':
      return 'smoke';
    case 'moisture':
      return 'water';
    case 'temperature':
      return 'temperature';
    case 'gas':
      return 'gas';
    case 'carbon_monoxide':
    case 'co':
      return 'carbon_monoxide';
    default:
      return 'unknown';
  }
}

export function severityForEntity(entity: HassEntityState): AlertSeverity {
  const declared = entity.attributes.severity;
  if (declared === 'info' || declared === 'warning' || declared === 'critical') {
    return declared;
  }
  const deviceClass = entity.attributes.device_class;
  if (deviceClass && CRITICAL_DEVICE_CLASSES.has(deviceClass)) {
    return 'critical';
  }
  if (deviceClass && WARNING_DEVICE_CLASSES.has(deviceClass)) {
    return 'warning';
  }
  return 'info';
}

export function isAvailable(entity: HassEntityState): boolean {
  return !UNAVAILABLE_STATES.has(entity.state.toLowerCase());
}

/** True when an alert entity is currently firing. */
export function isAlertActive(entity: HassEntityState): boolean {
  return entity.state.toLowerCase() === 'on';
}

export function toAlert(
  entity: HassEntityState,
  acknowledgedIds: ReadonlySet<string>,
): Alert {
  const active = isAlertActive(entity);
  const acknowledged = acknowledgedIds.has(entity.entity_id);
  return {
    id: entity.entity_id,
    title: displayName(entity),
    message:
      (entity.attributes.message as string | undefined) ??
      `${displayName(entity)} is ${entity.state}`,
    severity: severityForEntity(entity),
    state: !active ? 'resolved' : acknowledged ? 'acknowledged' : 'active',
    raisedAt:
      entity.last_changed ?? entity.last_updated ?? new Date().toISOString(),
    sourceSensorId: entity.attributes.source_entity_id as string | undefined,
  };
}

export function toSensor(entity: HassEntityState): SensorStatus {
  const unit = entity.attributes.unit_of_measurement;
  const numeric = Number(entity.state);
  const value =
    unit && !Number.isNaN(numeric)
      ? `${numeric}${unit}`
      : entity.state;
  return {
    id: entity.entity_id,
    name: displayName(entity),
    kind: sensorKindFromDeviceClass(entity.attributes.device_class),
    online: isAvailable(entity),
    value,
    lastUpdated:
      entity.last_updated ?? entity.last_changed ?? new Date().toISOString(),
  };
}

/** Derive sorted alert + sensor lists from a map of raw entity states. */
export function deriveCollections(
  entities: Iterable<HassEntityState>,
  config: ConnectionConfig,
  acknowledgedIds: ReadonlySet<string>,
): { alerts: Alert[]; sensors: SensorStatus[] } {
  const alerts: Alert[] = [];
  const sensors: SensorStatus[] = [];
  for (const entity of entities) {
    if (isAlertEntity(entity, config)) {
      alerts.push(toAlert(entity, acknowledgedIds));
    } else if (isSensorEntity(entity, config)) {
      sensors.push(toSensor(entity));
    }
  }
  const severityRank: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  const stateRank: Record<Alert['state'], number> = {
    active: 0,
    acknowledged: 1,
    resolved: 2,
  };
  alerts.sort(
    (a, b) =>
      stateRank[a.state] - stateRank[b.state] ||
      severityRank[a.severity] - severityRank[b.severity] ||
      b.raisedAt.localeCompare(a.raisedAt),
  );
  sensors.sort((a, b) => a.name.localeCompare(b.name));
  return { alerts, sensors };
}
