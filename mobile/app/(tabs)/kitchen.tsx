import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import Toast from 'react-native-toast-message';

const COLUMNS = ['new', 'preparing', 'ready'] as const;
type KitchenCol = typeof COLUMNS[number];

const COL_CONFIG: Record<KitchenCol, { label: string; color: string; next: string | null; nextLabel: string }> = {
  new:       { label: 'ออร์เดอร์ใหม่', color: '#DC2626', next: 'preparing', nextLabel: 'เริ่มทำ' },
  preparing: { label: 'กำลังทำ',       color: '#D97706', next: 'ready',     nextLabel: 'พร้อมแล้ว' },
  ready:     { label: 'พร้อมเสิร์ฟ',  color: '#059669', next: 'delivered',  nextLabel: 'ส่งแล้ว' },
};

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function elapsedStr(createdAt: string, now: number): string {
  const secs = Math.floor((now - new Date(createdAt).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function urgencyColor(createdAt: string, now: number): string {
  const mins = (now - new Date(createdAt).getTime()) / 60000;
  if (mins < 5)  return '#059669';
  if (mins < 10) return '#D97706';
  return '#DC2626';
}

export default function KitchenScreen() {
  const { profile } = useAuthStore();
  const qc = useQueryClient();
  const now = useNow();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders = [], isRefetching, refetch } = useQuery({
    queryKey: ['kitchen-orders', profile?.hotel_id],
    queryFn: () => apiFetch<any[]>(`/api/kitchen?hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.hotel_id,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/kitchen/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
      Toast.show({ type: 'success', text1: 'อัพเดทสถานะแล้ว' });
    },
  });

  const moveNext = (order: any, col: KitchenCol) => {
    const next = COL_CONFIG[col].next;
    if (next) updateMutation.mutate({ id: order.id, status: next });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kitchen Display</Text>
        <Text style={styles.count}>{orders.length} ออร์เดอร์</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kanban}
      >
        {COLUMNS.map(col => {
          const cfg = COL_CONFIG[col];
          const colOrders = orders.filter((o: any) => o.status === col);
          return (
            <View key={col} style={styles.column}>
              <View style={[styles.colHeader, { backgroundColor: cfg.color }]}>
                <Text style={styles.colTitle}>{cfg.label}</Text>
                <View style={styles.colBadge}>
                  <Text style={styles.colCount}>{colOrders.length}</Text>
                </View>
              </View>

              <ScrollView
                refreshControl={
                  <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#fff" />
                }
                contentContainerStyle={styles.colContent}
              >
                {colOrders.length === 0 && (
                  <Text style={styles.emptyCol}>ไม่มีออร์เดอร์</Text>
                )}
                {colOrders.map((order: any) => {
                  const uc = urgencyColor(order.created_at ?? order.ordered_at ?? new Date().toISOString(), now);
                  const elapsed = elapsedStr(order.created_at ?? order.ordered_at ?? new Date().toISOString(), now);
                  const isExpanded = expanded === order.id;
                  const items: any[] = Array.isArray(order.items) ? order.items : [];

                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.orderCard}
                      onPress={() => setExpanded(isExpanded ? null : order.id)}
                      onLongPress={() => moveNext(order, col)}
                      delayLongPress={400}
                    >
                      <View style={styles.orderTop}>
                        <View style={styles.orderMeta}>
                          <Text style={styles.orderNumber}>
                            #{order.order_number ?? order.id?.slice(-4)}
                          </Text>
                          <Text style={styles.tableNo}>
                            โต๊ะ {order.table_number ?? order.table_no ?? order.room_no ?? '—'}
                          </Text>
                        </View>
                        <View style={[styles.timer, { backgroundColor: uc + '30' }]}>
                          <Text style={[styles.timerText, { color: uc }]}>{elapsed}</Text>
                        </View>
                      </View>

                      {items.length > 0 ? (
                        <View style={styles.itemsSummary}>
                          {(isExpanded ? items : items.slice(0, 2)).map((item: any, i: number) => (
                            <View key={i} style={styles.itemRow}>
                              <Text style={styles.itemQty}>×{item.qty ?? item.quantity ?? 1}</Text>
                              <Text style={styles.itemName} numberOfLines={isExpanded ? undefined : 1}>
                                {item.name ?? item.menu_name ?? item.item_name}
                              </Text>
                            </View>
                          ))}
                          {!isExpanded && items.length > 2 && (
                            <Text style={styles.moreItems}>+{items.length - 2} รายการ...</Text>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.orderNotes} numberOfLines={isExpanded ? undefined : 2}>
                          {order.notes ?? '—'}
                        </Text>
                      )}

                      {isExpanded && order.special_instructions && (
                        <View style={styles.specialBox}>
                          <Text style={styles.specialText}>
                            📝 {order.special_instructions}
                          </Text>
                        </View>
                      )}

                      {order.allergies && (
                        <Text style={styles.allergy}>⚠️ {order.allergies}</Text>
                      )}

                      <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: cfg.color }]}
                        onPress={() => moveNext(order, col)}
                      >
                        <Text style={styles.nextBtnText}>{cfg.nextLabel}</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <Text style={styles.hint}>กด-ค้างออร์เดอร์เพื่อเลื่อนสถานะ</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  count: { fontSize: 14, color: '#9CA3AF' },
  kanban: { padding: 12, gap: 12, alignItems: 'flex-start', paddingBottom: 16 },
  column: { width: 270, backgroundColor: '#1F2937', borderRadius: 16, overflow: 'hidden', maxHeight: 600 },
  colHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14,
  },
  colTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  colBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  colCount: { color: '#fff', fontWeight: '800', fontSize: 16 },
  colContent: { padding: 10, gap: 10 },
  emptyCol: { color: '#6B7280', textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  orderCard: { backgroundColor: '#374151', borderRadius: 12, padding: 14 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderMeta: { flex: 1 },
  orderNumber: { color: '#9CA3AF', fontSize: 11, fontWeight: '700' },
  tableNo: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 2 },
  timer: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  timerText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  itemsSummary: { gap: 4, marginBottom: 8 },
  itemRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  itemQty: { color: '#9CA3AF', fontSize: 13, fontWeight: '700', minWidth: 28 },
  itemName: { color: '#F9FAFB', fontSize: 13, flex: 1 },
  moreItems: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  orderNotes: { color: '#D1D5DB', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  specialBox: { backgroundColor: '#1F2937', borderRadius: 8, padding: 10, marginBottom: 8 },
  specialText: { color: '#FCD34D', fontSize: 12 },
  allergy: { color: '#FCD34D', fontSize: 12, marginBottom: 8 },
  nextBtn: { borderRadius: 8, paddingVertical: 9, alignItems: 'center', marginTop: 4 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  hint: { textAlign: 'center', color: '#6B7280', fontSize: 11, paddingBottom: 12 },
});
