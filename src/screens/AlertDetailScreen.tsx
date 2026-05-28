import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
import { useAlert, useApp } from '@/state/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AlertDetail'>;

export default function AlertDetailScreen({ route, navigation }: Props) {
  const { alertId } = route.params;
  const { acknowledge } = useApp();
  const alert = useAlert(alertId);

  if (!alert) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.muted}>Alert not found.</Text>
      </View>
    );
  }

  const acknowledged = alert.state === 'acknowledged';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.meta}>
        {alert.severity.toUpperCase()} · {alert.state}
      </Text>
      <Text style={styles.message}>{alert.message}</Text>
      <Text style={styles.timestamp}>Raised: {alert.raisedAt}</Text>

      <TouchableOpacity
        style={[styles.button, acknowledged && styles.buttonDisabled]}
        disabled={acknowledged}
        onPress={() => {
          void acknowledge(alert.id);
          navigation.goBack();
        }}
      >
        <Text style={styles.buttonText}>
          {acknowledged ? 'Acknowledged' : 'Acknowledge alert'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F33', padding: 20 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#94A3B8', fontSize: 16 },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  meta: { color: '#94A3B8', fontSize: 14, marginTop: 6 },
  message: { color: '#E2E8F0', fontSize: 16, marginTop: 16, lineHeight: 22 },
  timestamp: { color: '#64748B', fontSize: 13, marginTop: 16 },
  button: {
    marginTop: 'auto',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#334155' },
  buttonText: { color: '#0B1F33', fontSize: 16, fontWeight: '700' },
});
