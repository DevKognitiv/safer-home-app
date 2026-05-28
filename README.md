# SafeR Home

Mobile companion for the **SafeR CI** emergency-response platform.

SafeR Home connects to a SafeR CI / Home Assistant instance over the Home
Assistant WebSocket API and shows real-time alert status. Users can view active
alerts, open an alert for detail, acknowledge it, see sensor status, and
receive notifications when new alerts fire.

## Tech stack

- [Expo](https://expo.dev/) SDK 51
- React Native 0.74
- TypeScript (strict)
- React Navigation (native stack + bottom tabs)
- React Context + `useReducer` for app state
- expo-secure-store (token) + AsyncStorage (config & offline cache)
- expo-notifications (local alert notifications)
- Jest + @testing-library/react-native

## Features

- **Real-time alerts** via the Home Assistant WebSocket API (auth handshake,
  `get_states` snapshot, `subscribe_events` on `state_changed`).
- **Acknowledge** alerts through a configurable `call_service`, with optimistic
  UI and rollback on failure.
- **Sensor dashboard** with kind, last value, and online status.
- **Notifications** for newly active warning/critical alerts.
- **Settings** to configure host/port/path/TLS/token/acknowledge service,
  persisted across launches (token in secure storage).
- **Offline support**: last-known alerts and sensors are cached and shown while
  reconnecting; pull-to-refresh and tap-to-reconnect throughout.

## Project structure

```
App.tsx                          Providers + navigation
src/
  components/
    ConnectionBanner.tsx         Connection status + reconnect
  constants/
    config.ts                    Default config + URL builder
  screens/
    HomeScreen.tsx               Alert list
    AlertDetailScreen.tsx        Alert detail + acknowledge
    SensorsScreen.tsx            Sensor status
    SettingsScreen.tsx           Connection settings
  services/
    SaferCIService.ts            Home Assistant WebSocket client
    entityMapping.ts             Entity -> Alert/SensorStatus mapping
    notifications.ts             expo-notifications + alert selector
    storage.ts                   Persisted config, token, and cache
  state/
    AppContext.tsx               Provider, lifecycle, actions
    appReducer.ts                Pure reducer
  types/
    index.ts                     Shared types
```

## Getting started

Requires Node.js 18+ and the Expo tooling.

```bash
npm install
npm start          # start the Expo dev server
npm run android    # or: open on Android
npm run ios        # or: open on iOS
npm run web        # or: open in a browser
```

Type-check and test:

```bash
npm run tsc
npm test
```

## Configuration

Defaults live in `src/constants/config.ts` and can be edited at runtime from the
**Settings** tab:

| Setting              | Default            | Description                            |
| -------------------- | ------------------ | -------------------------------------- |
| `host`               | `192.168.1.100`    | SafeR CI / Home Assistant host         |
| `port`               | `8123`             | WebSocket port                         |
| `wsPath`             | `/api/websocket`   | WebSocket path                         |
| `secure`             | `false`            | Use `wss://` instead of `ws://`        |
| `token`              | —                  | Long-lived access token (secure store) |
| `alertDomains`       | `["alert"]`        | Entity domains treated as alerts       |
| `sensorDomains`      | `binary_sensor`, `sensor` | Domains surfaced as sensors     |
| `acknowledgeService` | `safer_ci.acknowledge` | Service called to acknowledge   |

## Building

[EAS Build](https://docs.expo.dev/build/introduction/) profiles are defined in
`eas.json` (`development`, `preview`, `production`):

```bash
npx eas build --profile preview --platform ios
```
