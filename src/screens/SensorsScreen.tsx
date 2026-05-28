import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SensorKind } from '@/types';
import { useApp } from '@/state/AppContext';
import { ConnectionBanner } from '@/components/ConnectionBanner';

const KIND_LABEL: Record<SensorKind, string> = {
  motion: 'Motion',
  door: 'Door / Window',
  smoke: 'Smoke',
  water: 'Water / Leak',
  temperature: 'Temperature',
  gas: 'Gas',
  carbon_monoxide: 'Carbon monoxide',
  unknown: 'Sensor',
};

export default function SensorsScreen() {
  const { state, reconnect } = useApp();
  const { sensors, connection } = state;
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

  return (
    <View style={styles.container}>
      <ConnectionBanner connection={connection} onReconnect={reconnect} />
      <FlatList
        data={sensors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          sensors.length === 0 ? styles.emptyContainer : styles.listContent
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
              ? 'No sensors reported.'
              : 'No cached sensors. Pull to reconnect.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.kind}>{KIND_LABEL[item.kind]}</Text>
            </View>
            <View style={styles.rowEnd}>
              <Text style={styles.value}>{String(item.value ?? '—')}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.dot,
                    item.online ? styles.dotOnline : styles.dotOffline,
                  ]}
                />
                <Text style={styles.statusText}>
                  {item.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F33' },
  listContent: { paddingVertical: 8 },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#13314F',
  },
  rowMain: { flex: 1 },
  rowEnd: { alignItems: 'flex-end' },
  name: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  kind: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  value: { color: '#E2E8F0', fontSize: 15, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotOnline: { backgroundColor: '#22C55E' },
  dotOffline: { backgroundColor: '#9CA3AF' },
  statusText: { color: '#94A3B8', fontSize: 12 },
});
