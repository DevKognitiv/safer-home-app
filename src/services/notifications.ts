import * as Notifications from 'expo-notifications';
import { Alert } from '@/types';

let handlerConfigured = false;

/** Configure how notifications are presented while the app is foregrounded. */
export function configureNotificationHandler(): void {
  if (handlerConfigured) {
    return;
  }
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Request OS notification permission. Returns whether it was granted. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Present an immediate local notification for an alert. */
export async function presentAlertNotification(alert: Alert): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title:
        alert.severity === 'critical'
          ? `Critical: ${alert.title}`
          : `Alert: ${alert.title}`,
      body: alert.message,
      data: { alertId: alert.id },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Pure selector that decides which alerts warrant a notification. An alert is
 * notified when it is currently active, of warning/critical severity, and has
 * not already been notified while continuously active.
 *
 * Returns the alerts to notify plus the updated set of already-notified ids
 * (pruned to those that are still active).
 */
export function selectAlertsToNotify(
  alreadyNotified: ReadonlySet<string>,
  alerts: Alert[],
): { toNotify: Alert[]; notifiedIds: Set<string> } {
  const toNotify: Alert[] = [];
  const notifiedIds = new Set<string>();

  for (const alert of alerts) {
    if (alert.state !== 'active') {
      continue;
    }
    if (alreadyNotified.has(alert.id)) {
      notifiedIds.add(alert.id);
      continue;
    }
    if (alert.severity !== 'info') {
      toNotify.push(alert);
      notifiedIds.add(alert.id);
    }
  }
  return { toNotify, notifiedIds };
}
