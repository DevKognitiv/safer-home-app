import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConnectionState } from '@/types';

const LABEL: Record<ConnectionState, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  authenticating: 'Authenticating…',
  connected: 'Connected',
  error: 'Connection error',
};

export function ConnectionBanner({
  connection,
  onReconnect,
}: {
  connection: ConnectionState;
  onReconnect: () => void;
}) {
  const connected = connection === 'connected';
  const busy = connection === 'connecting' || connection === 'authenticating';
  const reconnectable = connection === 'disconnected' || connection === 'error';

  return (
    <TouchableOpacity
      activeOpacity={reconnectable ? 0.6 : 1}
      disabled={!reconnectable}
      onPress={onReconnect}
      style={styles.bar}
    >
      <View
        style={[
          styles.dot,
          connected
            ? styles.dotOnline
            : connection === 'error'
              ? styles.dotError
              : styles.dotOffline,
        ]}
      />
      <Text style={styles.text}>{LABEL[connection]}</Text>
      {busy ? (
        <ActivityIndicator size="small" color="#94A3B8" style={styles.spinner} />
      ) : null}
      {reconnectable ? <Text style={styles.action}>Tap to reconnect</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOnline: { backgroundColor: '#22C55E' },
  dotOffline: { backgroundColor: '#9CA3AF' },
  dotError: { backgroundColor: '#EF4444' },
  text: { color: '#E2E8F0', fontSize: 14 },
  spinner: { marginLeft: 8 },
  action: { color: '#22C55E', fontSize: 13, marginLeft: 'auto' },
});
