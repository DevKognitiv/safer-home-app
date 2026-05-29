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

Every setting lives in `src/constants/config.ts` as a default and is editable at
runtime from the **Settings** tab (changes are persisted and trigger a
reconnect). The entity-mapping settings (`alertDomains`, `sensorDomains`,
`acknowledgeService`) let the app work against any SafeR CI / Home Assistant
deployment without code changes — adjust them to match your entity conventions.

| Setting              | Default                   | Description                                            |
| -------------------- | ------------------------- | ------------------------------------------------------ |
| `host`               | `192.168.1.100`           | SafeR CI / Home Assistant host                         |
| `port`               | `8123`                    | WebSocket port                                         |
| `wsPath`             | `/api/websocket`          | WebSocket path                                         |
| `secure`             | `false`                   | Use `wss://` instead of `ws://`                        |
| `token`              | —                         | Long-lived access token (stored in secure storage)    |
| `acknowledgeService` | `safer_ci.acknowledge`    | `domain.service` called to acknowledge an alert        |
| `alertDomains`       | `alert`                   | Comma-separated entity domains treated as alerts       |
| `sensorDomains`      | `binary_sensor, sensor`   | Comma-separated entity domains surfaced as sensors     |

Alerts are considered active when their entity state is `on`; severity is read
from a `severity` attribute when present, otherwise inferred from the entity's
`device_class`.

## Building

[EAS Build](https://docs.expo.dev/build/introduction/) profiles are defined in
`eas.json` (`development`, `preview`, `production`).

First-time setup — link the project to an Expo account and create an EAS
project id (writes `expo.extra.eas.projectId` into `app.json`):

```bash
npm install --global eas-cli   # or use: npx eas-cli
eas login
eas init                       # one-time, links the repo to an EAS project
```

Then trigger a build:

```bash
eas build --profile preview --platform ios
eas build --profile production --platform android
```

### App assets

`assets/icon.png`, `adaptive-icon.png`, `splash.png`, and `favicon.png` are
**solid-color placeholders** in the brand navy `#0B1F33`. Replace them with
real artwork before public release. They can be regenerated with:

```bash
node scripts/generate-placeholder-assets.js
```
