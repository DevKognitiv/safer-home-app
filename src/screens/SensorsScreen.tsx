import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SensorKind, SensorStatus } from '@/types';
import { saferCIService } from '@/services/SaferCIService';

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
  const [sensors, setSensors] = useState<SensorStatus[]>([]);

  useEffect(() => saferCIService.onSensors(setSensors), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={sensors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          sensors.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sensors reported.</Text>
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
