import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Alert, RootStackParamList, RootTabParamList } from '@/types';
import { useApp } from '@/state/AppContext';
import { ConnectionBanner } from '@/components/ConnectionBanner';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Alerts'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SEVERITY_COLOR: Record<Alert['severity'], string> = {
  info: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
};

export default function HomeScreen({ navigation }: Props) {
  const { state, reconnect } = useApp();
  const { alerts, connection, hydrated } = state;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (connection === 'connected' || connection === 'error') {
      setRefreshing(false);
    }
  }, [connection]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reconnect();
  }, [reconnect]);

  const connecting =
    connection === 'connecting' || connection === 'authenticating';
  const showSpinner = connecting && alerts.length === 0 && hydrated;

  return (
    <View style={styles.container}>
      <ConnectionBanner connection={connection} onReconnect={reconnect} />

      {showSpinner ? (
        <View style={styles.center}>
          <ActivityIndicator color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            alerts.length === 0 ? styles.emptyContainer : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#94A3B8"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {connection === 'connected'
                ? 'No active alerts.'
                : 'No cached alerts. Pull to reconnect.'}
            </Text>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F33' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
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
