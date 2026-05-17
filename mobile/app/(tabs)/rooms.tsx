import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
  Modal, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'dirty' | 'inspecting';

const STATUS_CONFIG: Record<RoomStatus | string, { label: string; color: string; bg: string }> = {
  available:   { label: 'ว่าง',                 color: '#059669', bg: '#D1FAE5' },
  occupied:    { label: 'มีแขก',               color: '#DC2626', bg: '#FEE2E2' },
  cleaning:    { label: 'ทำความสะอาด',         color: '#D97706', bg: '#FEF3C7' },
  maintenance: { label: 'ซ่อมบำรุง',           color: '#6B7280', bg: '#F3F4F6' },
  dirty:       { label: 'รอทำความสะอาด',       color: '#92400E', bg: '#FDE68A' },
  inspecting:  { label: 'กำลังตรวจ',           color: '#7C3AED', bg: '#EDE9FE' },
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all',         label: 'ทั้งหมด' },
  { key: 'available',   label: 'ว่าง' },
  { key: 'occupied',    label: 'มีแขก' },
  { key: 'cleaning',    label: 'ทำความสะอาด' },
  { key: 'maintenance', label: 'ซ่อมบำรุง' },
];

export default function RoomsScreen() {
  const { profile } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);

  const { data: rooms = [], isRefetching, refetch } = useQuery({
    queryKey: ['rooms', profile?.hotel_id],
    queryFn: () => apiFetch<any[]>(`/api/rooms?hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.hotel_id,
  });

  const filtered = filter === 'all' ? rooms : rooms.filter((r: any) => r.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>สถานะห้อง</Text>
        <Text style={styles.count}>{filtered.length} / {rooms.length} ห้อง</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#004B87" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bed-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>ไม่มีห้องในหมวดนี้</Text>
          </View>
        }
        renderItem={({ item: room }) => {
          const cfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.available;
          return (
            <TouchableOpacity
              style={[styles.roomCard, { borderColor: cfg.color + '40' }]}
              onPress={() => setSelected(room)}
            >
              <View style={styles.roomCardTop}>
                <Text style={styles.roomNo}>{room.room_number ?? room.room_no}</Text>
                <Text style={styles.floorTag}>ชั้น {room.floor ?? '—'}</Text>
              </View>
              <Text style={styles.roomType} numberOfLines={1}>
                {room.room_type_name ?? room.room_type ?? room.type ?? '—'}
              </Text>
              {room.current_guest && (
                <Text style={styles.guestName} numberOfLines={1}>
                  {room.current_guest}
                </Text>
              )}
              {room.check_out_date && (
                <Text style={styles.checkOut}>
                  CO: {new Date(room.check_out_date).toLocaleDateString('th-TH', { dateStyle: 'short' })}
                </Text>
              )}
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)} />
        {selected && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>ห้อง {selected.room_number ?? selected.room_no}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {(() => {
              const cfg = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.available;
              return (
                <View style={[styles.statusRow, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              );
            })()}
            <ScrollView contentContainerStyle={styles.sheetBody}>
              <DetailRow label="ประเภทห้อง" value={selected.room_type_name ?? selected.room_type ?? '—'} />
              <DetailRow label="ชั้น" value={selected.floor ? `ชั้น ${selected.floor}` : '—'} />
              {selected.current_guest && <DetailRow label="แขก" value={selected.current_guest} />}
              {selected.check_in_date && (
                <DetailRow label="เช็คอิน" value={new Date(selected.check_in_date).toLocaleDateString('th-TH', { dateStyle: 'long' })} />
              )}
              {selected.check_out_date && (
                <DetailRow label="เช็คเอาท์" value={new Date(selected.check_out_date).toLocaleDateString('th-TH', { dateStyle: 'long' })} />
              )}
              {selected.special_requests && (
                <DetailRow label="คำขอพิเศษ" value={selected.special_requests} />
              )}
              {selected.folio_balance !== undefined && (
                <DetailRow
                  label="ยอดค้างชำระ"
                  value={`฿${Number(selected.folio_balance).toLocaleString()}`}
                />
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 14, color: '#6B7280' },
  filterBar: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#004B87' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  grid: { padding: 12, paddingBottom: 32 },
  row: { gap: 12, marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: '#6B7280' },
  roomCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 3, elevation: 2, gap: 4,
  },
  roomCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomNo: { fontSize: 22, fontWeight: '800', color: '#111827' },
  floorTag: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  roomType: { fontSize: 12, color: '#6B7280' },
  guestName: { fontSize: 12, color: '#374151', fontWeight: '600' },
  checkOut: { fontSize: 11, color: '#9CA3AF' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40, maxHeight: '75%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statusRow: {
    marginHorizontal: 20, borderRadius: 12, paddingVertical: 10,
    paddingHorizontal: 16, marginBottom: 8,
  },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  sheetBody: { paddingHorizontal: 20, gap: 4 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },
});
