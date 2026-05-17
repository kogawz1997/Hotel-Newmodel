import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import Toast from 'react-native-toast-message';

type View = 'arrivals' | 'departures';

interface WalkInForm {
  guest_name: string;
  phone: string;
  room_type: string;
  check_out: string;
  rate: string;
}

export default function ArrivalsScreen() {
  const { profile } = useAuthStore();
  const qc = useQueryClient();
  const [view, setView] = useState<View>('arrivals');
  const [walkInVisible, setWalkInVisible] = useState(false);
  const [form, setForm] = useState<WalkInForm>({ guest_name: '', phone: '', room_type: '', check_out: '', rate: '' });

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

  const walkInMutation = useMutation({
    mutationFn: (body: object) => apiFetch('/api/reservations', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setWalkInVisible(false);
      setForm({ guest_name: '', phone: '', room_type: '', check_out: '', rate: '' });
      qc.invalidateQueries({ queryKey: ['arrivals'] });
      Toast.show({ type: 'success', text1: 'Walk-in registered successfully' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Failed to register walk-in' });
    },
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

  const handleWalkInSubmit = () => {
    if (!form.guest_name.trim()) {
      Toast.show({ type: 'error', text1: 'Guest name is required' });
      return;
    }
    if (!form.check_out.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.check_out)) {
      Toast.show({ type: 'error', text1: 'Check-out date must be YYYY-MM-DD' });
      return;
    }
    walkInMutation.mutate({
      guest_name: form.guest_name.trim(),
      phone: form.phone.trim(),
      room_type: form.room_type.trim(),
      check_in: new Date().toISOString().slice(0, 10),
      check_out: form.check_out.trim(),
      rate: parseFloat(form.rate) || 0,
      source: 'walk_in',
      hotel_id: profile?.hotel_id,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>วันนี้</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</Text>
        </View>
        <TouchableOpacity style={styles.walkInBtn} onPress={() => setWalkInVisible(true)}>
          <Ionicons name="person-add-outline" size={16} color="#fff" />
          <Text style={styles.walkInBtnText}>Walk-in</Text>
        </TouchableOpacity>
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

      <Modal visible={walkInVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setWalkInVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Walk-in Guest</Text>
              <TouchableOpacity onPress={() => setWalkInVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Guest Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={form.guest_name}
                onChangeText={v => setForm(f => ({ ...f, guest_name: v }))}
              />
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={v => setForm(f => ({ ...f, phone: v }))}
              />
              <Text style={styles.label}>Room Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Deluxe, Superior"
                value={form.room_type}
                onChangeText={v => setForm(f => ({ ...f, room_type: v }))}
              />
              <Text style={styles.label}>Check-out Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-31"
                value={form.check_out}
                onChangeText={v => setForm(f => ({ ...f, check_out: v }))}
              />
              <Text style={styles.label}>Rate per Night (THB)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={form.rate}
                onChangeText={v => setForm(f => ({ ...f, rate: v }))}
              />
              <TouchableOpacity
                style={[styles.submitBtn, walkInMutation.isPending && { opacity: 0.6 }]}
                onPress={handleWalkInSubmit}
                disabled={walkInMutation.isPending}
              >
                <Text style={styles.submitBtnText}>{walkInMutation.isPending ? 'Registering...' : 'Register Walk-in'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  walkInBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  walkInBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
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
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  submitBtn: { backgroundColor: '#004B87', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 28, marginBottom: 40 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
