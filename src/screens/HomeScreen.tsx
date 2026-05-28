import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  Alert,
  ConnectionState,
  RootStackParamList,
  RootTabParamList,
} from '@/types';
import { saferCIService } from '@/services/SaferCIService';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Alerts'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SEVERITY_COLOR: Record<Alert['severity'], string> = {
  info: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
};

const STATE_LABEL: Record<ConnectionState, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  authenticating: 'Authenticating…',
  connected: 'Connected',
  error: 'Connection error',
};

export default function HomeScreen({ navigation }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connection, setConnection] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    const unsubAlerts = saferCIService.onAlerts(setAlerts);
    const unsubState = saferCIService.onStateChange(setConnection);
    saferCIService.connect();
    return () => {
      unsubAlerts();
      unsubState();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <View
          style={[
            styles.statusDot,
            connection === 'connected' ? styles.dotOnline : styles.dotOffline,
          ]}
        />
        <Text style={styles.statusText}>{STATE_LABEL[connection]}</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          alerts.length === 0 ? styles.emptyContainer : undefined
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active alerts.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('AlertDetail', { alertId: item.id })
            }
          >
            <View
              style={[
                styles.severityBar,
                { backgroundColor: SEVERITY_COLOR[item.severity] },
              ]}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {item.severity.toUpperCase()} · {item.state}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F33' },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOnline: { backgroundColor: '#22C55E' },
  dotOffline: { backgroundColor: '#9CA3AF' },
  statusText: { color: '#E2E8F0', fontSize: 14 },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16 },
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#13314F',
  },
  severityBar: { width: 6 },
  cardBody: { flex: 1, padding: 14 },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  cardMeta: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
});
