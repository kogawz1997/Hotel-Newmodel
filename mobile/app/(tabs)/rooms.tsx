import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'ว่าง', color: '#059669', bg: '#D1FAE5' },
  occupied: { label: 'มีแขก', color: '#004B87', bg: '#DBEAFE' },
  cleaning: { label: 'กำลังทำความสะอาด', color: '#D97706', bg: '#FEF3C7' },
  maintenance: { label: 'ซ่อมบำรุง', color: '#DC2626', bg: '#FEE2E2' },
  dirty: { label: 'รอทำความสะอาด', color: '#6B7280', bg: '#F3F4F6' },
  inspecting: { label: 'กำลังตรวจ', color: '#7C3AED', bg: '#EDE9FE' },
};

export default function RoomsScreen() {
  const { profile } = useAuthStore();

  const { data: rooms = [], isRefetching, refetch } = useQuery({
    queryKey: ['rooms', profile?.hotel_id],
    queryFn: () => apiFetch<any[]>(`/api/rooms?hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.hotel_id,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>สถานะห้อง</Text>
        <Text style={styles.count}>{rooms.length} ห้อง</Text>
      </View>
      <FlatList
        data={rooms}
        keyExtractor={r => r.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#004B87" />}
        renderItem={({ item: room }) => {
          const cfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.available;
          return (
            <TouchableOpacity style={[styles.roomCard, { borderColor: cfg.color + '30' }]}>
              <Text style={styles.roomNo}>{room.room_no}</Text>
              <Text style={styles.roomType} numberOfLines={1}>{room.room_type_name ?? room.type}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 14, color: '#6B7280' },
  grid: { padding: 12, paddingBottom: 32 },
  row: { gap: 12, marginBottom: 12 },
  roomCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  roomNo: { fontSize: 24, fontWeight: '800', color: '#111827' },
  roomType: { fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
