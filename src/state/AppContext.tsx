import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { Alert, ConnectionConfig } from '@/types';
import { saferCIService } from '@/services/SaferCIService';
import {
  cacheAlerts,
  cacheSensors,
  loadCachedCollections,
  loadConnectionConfig,
  saveConnectionConfig,
} from '@/services/storage';
import {
  configureNotificationHandler,
  presentAlertNotification,
  requestNotificationPermissions,
  selectAlertsToNotify,
} from '@/services/notifications';
import { AppState, appReducer, initialAppState } from '@/state/appReducer';

interface AppContextValue {
  state: AppState;
  acknowledge: (alertId: string) => Promise<void>;
  updateConfig: (config: ConnectionConfig) => Promise<void>;
  reconnect: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // Notification bookkeeping kept in refs so it survives re-renders.
  const notifiedIds = useRef<Set<string>>(new Set());
  const connectedOnce = useRef(false);
  const baselineTaken = useRef(false);
  const notificationsEnabled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    configureNotificationHandler();

    const unsubState = saferCIService.onStateChange((connection) => {
      if (connection === 'connected') {
        connectedOnce.current = true;
      }
      dispatch({ type: 'SET_CONNECTION', connection });
    });

    const unsubAlerts = saferCIService.onAlerts((alerts) => {
      const result = selectAlertsToNotify(notifiedIds.current, alerts);
      notifiedIds.current = result.notifiedIds;

      if (!connectedOnce.current) {
        return; // ignore pre-connection emissions; keep cached view
      }
      if (
        notificationsEnabled.current &&
        baselineTaken.current
      ) {
        result.toNotify.forEach((alert) => {
          void presentAlertNotification(alert);
        });
      }
      baselineTaken.current = true;
      dispatch({ type: 'SET_ALERTS', alerts });
      void cacheAlerts(alerts);
    });

    const unsubSensors = saferCIService.onSensors((sensors) => {
      if (!connectedOnce.current) {
        return;
      }
      dispatch({ type: 'SET_SENSORS', sensors });
      void cacheSensors(sensors);
    });

    (async () => {
      const cached = await loadCachedCollections();
      if (!cancelled) {
        dispatch({
          type: 'HYDRATE',
          alerts: cached.alerts,
          sensors: cached.sensors,
        });
      }
      notificationsEnabled.current = await requestNotificationPermissions();
      const config = await loadConnectionConfig();
      if (cancelled) {
        return;
      }
      dispatch({ type: 'SET_CONFIG', config });
      saferCIService.setConfig(config);
      saferCIService.connect();
    })();

    return () => {
      cancelled = true;
      unsubState();
      unsubAlerts();
      unsubSensors();
      saferCIService.disconnect();
    };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      acknowledge: (alertId: string) => saferCIService.acknowledgeAlert(alertId),
      updateConfig: async (config: ConnectionConfig) => {
        await saveConnectionConfig(config);
        dispatch({ type: 'SET_CONFIG', config });
        saferCIService.setConfig(config);
        saferCIService.connect();
      },
      reconnect: () => saferCIService.connect(),
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}

/** Convenience selector for an alert by id. */
export function useAlert(alertId: string): Alert | undefined {
  const { state } = useApp();
  return state.alerts.find((alert) => alert.id === alertId);
}
