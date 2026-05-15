import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import Toast from 'react-native-toast-message';

const COLUMNS = ['new', 'preparing', 'ready'] as const;
const COL_LABEL: Record<string, string> = { new: 'ออร์เดอร์ใหม่', preparing: 'กำลังทำ', ready: 'พร้อมเสิร์ฟ' };
const COL_COLOR: Record<string, string> = { new: '#DC2626', preparing: '#D97706', ready: '#059669' };

export default function KitchenScreen() {
  const { profile } = useAuthStore();
  const qc = useQueryClient();

  const { data: orders = [], isRefetching, refetch } = useQuery({
    queryKey: ['kitchen-orders', profile?.hotel_id],
    queryFn: () => apiFetch<any[]>(`/api/kitchen?hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.hotel_id,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/kitchen/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kitchen-orders'] }); Toast.show({ type: 'success', text1: 'อัพเดทสถานะแล้ว' }); },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kitchen Display</Text>
        <Text style={styles.count}>{orders.length} ออร์เดอร์</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanban}>
        {COLUMNS.map(col => {
          const colOrders = orders.filter((o: any) => o.status === col);
          return (
            <View key={col} style={styles.column}>
              <View style={[styles.colHeader, { backgroundColor: COL_COLOR[col] }]}>
                <Text style={styles.colTitle}>{COL_LABEL[col]}</Text>
                <Text style={styles.colCount}>{colOrders.length}</Text>
              </View>
              <ScrollView
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#fff" />}
              >
                {colOrders.map((order: any) => (
                  <View key={order.id} style={styles.orderCard}>
                    <Text style={styles.orderTable}>โต๊ะ {order.table_no ?? order.room_no ?? '—'}</Text>
                    <Text style={styles.orderItems} numberOfLines={3}>{
                      Array.isArray(order.items) ? order.items.map((i: any) => `${i.name} ×${i.qty}`).join(', ') : order.notes
                    }</Text>
                    {order.allergies && <Text style={styles.allergy}>⚠️ {order.allergies}</Text>}
                    <View style={styles.orderActions}>
                      {col === 'new' && (
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#D97706' }]} onPress={() => updateMutation.mutate({ id: order.id, status: 'preparing' })}>
                          <Text style={styles.btnText}>เริ่มทำ</Text>
                        </TouchableOpacity>
                      )}
                      {col === 'preparing' && (
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#059669' }]} onPress={() => updateMutation.mutate({ id: order.id, status: 'ready' })}>
                          <Text style={styles.btnText}>พร้อมแล้ว</Text>
                        </TouchableOpacity>
                      )}
                      {col === 'ready' && (
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#6B7280' }]} onPress={() => updateMutation.mutate({ id: order.id, status: 'delivered' })}>
                          <Text style={styles.btnText}>ส่งแล้ว</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  count: { fontSize: 14, color: '#9CA3AF' },
  kanban: { padding: 12, gap: 12, alignItems: 'flex-start' },
  column: { width: 260, backgroundColor: '#1F2937', borderRadius: 16, overflow: 'hidden' },
  colHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  colTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  colCount: { color: '#fff', fontWeight: '800', fontSize: 18 },
  orderCard: { margin: 10, backgroundColor: '#374151', borderRadius: 12, padding: 14 },
  orderTable: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  orderItems: { color: '#fff', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  allergy: { color: '#FCD34D', fontSize: 12, marginBottom: 8 },
  orderActions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
