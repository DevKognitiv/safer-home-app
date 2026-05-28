import {
  Alert,
  ConnectionConfig,
  ConnectionState,
  SensorStatus,
} from '@/types';
import { DEFAULT_CONNECTION } from '@/constants/config';

export interface AppState {
  config: ConnectionConfig;
  connection: ConnectionState;
  alerts: Alert[];
  sensors: SensorStatus[];
  /** Whether cached data has been loaded from storage. */
  hydrated: boolean;
}

export type AppAction =
  | { type: 'HYDRATE'; alerts: Alert[]; sensors: SensorStatus[] }
  | { type: 'SET_CONFIG'; config: ConnectionConfig }
  | { type: 'SET_CONNECTION'; connection: ConnectionState }
  | { type: 'SET_ALERTS'; alerts: Alert[] }
  | { type: 'SET_SENSORS'; sensors: SensorStatus[] };

export const initialAppState: AppState = {
  config: DEFAULT_CONNECTION,
  connection: 'disconnected',
  alerts: [],
  sensors: [],
  hydrated: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      // Cached data only seeds the view before the first live snapshot.
      if (state.connection === 'connected') {
        return { ...state, hydrated: true };
      }
      return {
        ...state,
        alerts: state.alerts.length ? state.alerts : action.alerts,
        sensors: state.sensors.length ? state.sensors : action.sensors,
        hydrated: true,
      };
    case 'SET_CONFIG':
      return { ...state, config: action.config };
    case 'SET_CONNECTION':
      return { ...state, connection: action.connection };
    case 'SET_ALERTS':
      return { ...state, alerts: action.alerts };
    case 'SET_SENSORS':
      return { ...state, sensors: action.sensors };
    default:
      return state;
  }
}
