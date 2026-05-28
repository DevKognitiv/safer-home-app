# SafeR Home

Mobile companion for the **SafeR CI** emergency-response platform.

SafeR Home connects to a SafeR CI / Home Assistant instance over WebSocket and
shows real-time alert status. Users can view active alerts, open an alert for
detail, acknowledge it, and see sensor status.

## Tech stack

- [Expo](https://expo.dev/) SDK 51
- React Native 0.74
- TypeScript (strict)
- React Navigation (native stack)

## Project structure

```
App.tsx                       Entry point + navigation stack
src/
  screens/
    HomeScreen.tsx            Alert list + connection status
    AlertDetailScreen.tsx     Alert detail + acknowledge
  services/
    SaferCIService.ts         WebSocket client for SafeR CI (stub)
  types/
    index.ts                  Alert, SensorStatus, ConnectionConfig, …
  constants/
    config.ts                 Default connection config (host/port/ws path)
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

Type-check the project:

```bash
npm run tsc
```

## Configuration

Default connection settings live in `src/constants/config.ts`:

| Setting   | Default            | Description                              |
| --------- | ------------------ | ---------------------------------------- |
| `host`    | `192.168.1.100`    | SafeR CI / Home Assistant host           |
| `port`    | `8123`             | WebSocket port                           |
| `wsPath`  | `/api/websocket`   | WebSocket path                           |
| `secure`  | `false`            | Use `wss://` instead of `ws://`          |

Update these for your instance, or wire them to a settings screen.

## Status

This is an early scaffold. The WebSocket transport in `SaferCIService` is in
place, but the SafeR CI message protocol (auth handshake, event subscription,
payload parsing) is marked with `TODO` and not yet implemented.
