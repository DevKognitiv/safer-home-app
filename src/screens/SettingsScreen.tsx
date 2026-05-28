import { useState } from 'react';
import {
  Alert as RNAlert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ConnectionConfig } from '@/types';
import { useApp } from '@/state/AppContext';
import { buildWebSocketUrl } from '@/constants/config';

export default function SettingsScreen() {
  const { state, updateConfig } = useApp();
  const initial = state.config;
  const [host, setHost] = useState(initial.host);
  const [port, setPort] = useState(String(initial.port));
  const [wsPath, setWsPath] = useState(initial.wsPath);
  const [secure, setSecure] = useState(initial.secure);
  const [token, setToken] = useState(initial.token ?? '');
  const [acknowledgeService, setAcknowledgeService] = useState(
    initial.acknowledgeService,
  );
  const [saving, setSaving] = useState(false);

  const portNumber = Number(port);
  const portValid = Number.isInteger(portNumber) && portNumber > 0 && portNumber <= 65535;
  const canSave = host.trim().length > 0 && wsPath.trim().length > 0 && portValid;

  const preview = buildWebSocketUrl({
    ...initial,
    host: host.trim(),
    port: portValid ? portNumber : initial.port,
    wsPath: wsPath.trim(),
    secure,
  });

  async function onSave() {
    if (!canSave || saving) {
      return;
    }
    setSaving(true);
    const next: ConnectionConfig = {
      ...initial,
      host: host.trim(),
      port: portNumber,
      wsPath: wsPath.trim(),
      secure,
      token: token.trim() ? token.trim() : undefined,
      acknowledgeService: acknowledgeService.trim() || initial.acknowledgeService,
    };
    try {
      await updateConfig(next);
      RNAlert.alert('Saved', 'Connection settings updated.');
    } catch {
      RNAlert.alert('Error', 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="Host">
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHost}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="192.168.1.100"
          placeholderTextColor="#64748B"
        />
      </Field>

      <Field label="Port" error={portValid ? undefined : 'Enter 1–65535'}>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          keyboardType="number-pad"
          placeholder="8123"
          placeholderTextColor="#64748B"
        />
      </Field>

      <Field label="WebSocket path">
        <TextInput
          style={styles.input}
          value={wsPath}
          onChangeText={setWsPath}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="/api/websocket"
          placeholderTextColor="#64748B"
        />
      </Field>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Use TLS (wss://)</Text>
        <Switch value={secure} onValueChange={setSecure} />
      </View>

      <Field label="Access token">
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Long-lived access token"
          placeholderTextColor="#64748B"
        />
      </Field>

      <Field label="Acknowledge service">
        <TextInput
          style={styles.input}
          value={acknowledgeService}
          onChangeText={setAcknowledgeService}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="safer_ci.acknowledge"
          placeholderTextColor="#64748B"
        />
      </Field>

      <Text style={styles.preview}>{preview}</Text>

      <TouchableOpacity
        style={[styles.button, (!canSave || saving) && styles.buttonDisabled]}
        disabled={!canSave || saving}
        onPress={onSave}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Saving…' : 'Save & reconnect'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F33' },
  content: { padding: 20 },
  field: { marginBottom: 16 },
  label: { color: '#E2E8F0', fontSize: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#13314F',
    color: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  error: { color: '#F87171', fontSize: 12, marginTop: 4 },
  preview: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#334155' },
  buttonText: { color: '#0B1F33', fontSize: 16, fontWeight: '700' },
});
