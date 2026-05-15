import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import Toast from 'react-native-toast-message';

type View = 'arrivals' | 'departures';

export default function ArrivalsScreen() {
  const { profile } = useAuthStore();
  const qc = useQueryClient();
  const [view, setView] = useState<View>('arrivals');

  const { data = [], isRefetching, refetch } = useQuery({
    queryKey: ['arrivals', view, profile?.hotel_id],
    queryFn: () => apiFetch<any[]>(`/api/reservations?hotelId=${profile?.hotel_id}&type=${view}&date=${new Date().toISOString().slice(0, 10)}`),
    enabled: !!profile?.hotel_id,
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/reservations/${id}/check-in`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['arrivals'] }); Toast.show({ type: 'success', text1: 'เช็คอินสำเร็จ' }); },
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/reservations/${id}/check-out`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['arrivals'] }); Toast.show({ type: 'success', text1: 'เช็คเอาท์สำเร็จ' }); },
  });

  const handleCheckIn = (res: any) => {
    Alert.alert('ยืนยันเช็คอิน', `${res.guest_name}\nห้อง ${res.room_no}`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'เช็คอิน', style: 'default', onPress: () => checkInMutation.mutate(res.id) },
    ]);
  };

  const handleCheckOut = (res: any) => {
    Alert.alert('ยืนยันเช็คเอาท์', `${res.guest_name}\nห้อง ${res.room_no}`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'เช็คเอาท์', style: 'destructive', onPress: () => checkOutMutation.mutate(res.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>วันนี้</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</Text>
      </View>

      {/* Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'arrivals' && styles.toggleActive]}
          onPress={() => setView('arrivals')}
        >
          <Ionicons name="enter-outline" size={16} color={view === 'arrivals' ? '#fff' : '#6B7280'} />
          <Text style={[styles.toggleText, view === 'arrivals' && styles.toggleTextActive]}>เช็คอิน</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'departures' && styles.toggleActive]}
          onPress={() => setView('departures')}
        >
          <Ionicons name="exit-outline" size={16} color={view === 'departures' ? '#fff' : '#6B7280'} />
          <Text style={[styles.toggleText, view === 'departures' && styles.toggleTextActive]}>เช็คเอาท์</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#004B87" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={view === 'arrivals' ? 'enter-outline' : 'exit-outline'} size={52} color="#D1D5DB" />
            <Text style={styles.emptyText}>ไม่มีรายการ{view === 'arrivals' ? 'เช็คอิน' : 'เช็คเอาท์'}วันนี้</Text>
          </View>
        }
        renderItem={({ item: res }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(res.guest_name ?? '?')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.guestName}>{res.guest_name}</Text>
                {res.nationality && <Text style={styles.meta}>{res.nationality}</Text>}
                <Text style={styles.meta}>ห้อง {res.room_no ?? '—'} · {res.nights ?? '?'} คืน</Text>
              </View>
              {res.is_vip && (
                <View style={styles.vipBadge}><Text style={styles.vipText}>VIP</Text></View>
              )}
            </View>
            <View style={styles.dates}>
              <Text style={styles.dateText}>
                {new Date(res.check_in).toLocaleDateString('th-TH', { dateStyle: 'short' })} →{' '}
                {new Date(res.check_out).toLocaleDateString('th-TH', { dateStyle: 'short' })}
              </Text>
              {res.special_requests && <Text style={styles.special} numberOfLines={1}>📝 {res.special_requests}</Text>}
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: view === 'arrivals' ? '#004B87' : '#059669' }]}
              onPress={() => view === 'arrivals' ? handleCheckIn(res) : handleCheckOut(res)}
            >
              <Ionicons name={view === 'arrivals' ? 'enter-outline' : 'exit-outline'} size={16} color="#fff" />
              <Text style={styles.actionText}>{view === 'arrivals' ? 'เช็คอิน' : 'เช็คเอาท์'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  toggle: { flexDirection: 'row', margin: 16, marginTop: 4, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  toggleActive: { backgroundColor: '#004B87' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  toggleTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#004B87', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  info: { flex: 1 },
  guestName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  vipBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  vipText: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  dates: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, marginBottom: 12 },
  dateText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  special: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
