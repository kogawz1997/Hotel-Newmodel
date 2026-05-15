import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import Toast from 'react-native-toast-message';

const PRIORITY_COLOR: Record<string, string> = {
  low: '#6B7280', normal: '#004B87', high: '#D97706', urgent: '#DC2626',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#6B7280', open: '#004B87', in_progress: '#D97706', completed: '#059669',
};

export default function TasksScreen() {
  const { profile } = useAuthStore();
  const qc = useQueryClient();

  const { data: tasks = [], isRefetching, refetch } = useQuery({
    queryKey: ['my-tasks', profile?.id],
    queryFn: () => apiFetch<any[]>(`/api/my-tasks?staffId=${profile?.id}&hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.id,
  });

  const claimMutation = useMutation({
    mutationFn: (taskId: string) => apiFetch(`/api/work-orders/${taskId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'in_progress', claimed_by: profile?.id }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); Toast.show({ type: 'success', text1: 'รับงานแล้ว' }); },
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => apiFetch(`/api/work-orders/${taskId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); Toast.show({ type: 'success', text1: 'เสร็จสิ้นงาน' }); },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>งานของฉัน</Text>
        <Text style={styles.count}>{tasks.length} รายการ</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#004B87" />}
      >
        {tasks.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={56} color="#D1FAE5" />
            <Text style={styles.emptyText}>ไม่มีงานค้าง 🎉</Text>
          </View>
        )}
        {tasks.map(task => (
          <View key={task.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[task.priority] ?? '#6B7280' }]} />
              <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[task.status] ?? '#6B7280') + '15' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[task.status] ?? '#6B7280' }]}>
                  {task.status === 'open' ? 'เปิด' : task.status === 'in_progress' ? 'กำลังทำ' : task.status === 'completed' ? 'เสร็จ' : task.status}
                </Text>
              </View>
            </View>
            {task.description && <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>}
            <View style={styles.meta}>
              {task.room_no && <Text style={styles.metaItem}>🚪 ห้อง {task.room_no}</Text>}
              {task.category && <Text style={styles.metaItem}>📂 {task.category}</Text>}
            </View>
            <View style={styles.actions}>
              {task.status === 'open' && (
                <TouchableOpacity style={styles.btnSecondary} onPress={() => claimMutation.mutate(task.id)}>
                  <Text style={styles.btnSecondaryText}>รับงาน</Text>
                </TouchableOpacity>
              )}
              {task.status === 'in_progress' && (
                <TouchableOpacity style={styles.btnPrimary} onPress={() => completeMutation.mutate(task.id)}>
                  <Text style={styles.btnPrimaryText}>✓ เสร็จสิ้น</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 14, color: '#6B7280' },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 22 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 10 },
  meta: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  metaItem: { fontSize: 12, color: '#6B7280' },
  actions: { flexDirection: 'row', gap: 10 },
  btnPrimary: { flex: 1, backgroundColor: '#004B87', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  btnSecondaryText: { color: '#004B87', fontWeight: '700', fontSize: 14 },
});
