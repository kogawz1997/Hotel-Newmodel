import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

const ROLE_LABEL: Record<string, string> = {
  front_desk: 'พนักงาน Front Desk',
  housekeeping: 'แม่บ้าน',
  technician: 'ช่างเทคนิค',
  bellboy: 'พนักงานยกกระเป๋า',
  transport_driver: 'คนขับรถ',
  kitchen_staff: 'พ่อครัว',
  room_service_staff: 'Room Service',
  security_staff: 'รักษาความปลอดภัย',
  concierge: 'Concierge',
};

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  const { data: summary, refetch: refetchSummary, isRefetching: refetchingSummary } = useQuery({
    queryKey: ['analytics-summary', profile?.hotel_id],
    queryFn: () => apiFetch<any>(`/api/analytics/summary?hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.hotel_id,
    retry: false,
  });

  const { data: taskData } = useQuery({
    queryKey: ['my-tasks', profile?.id],
    queryFn: () => apiFetch<any[]>(`/api/my-tasks?staffId=${profile?.id}&hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.id,
    retry: false,
  });

  const { data: activity = [], refetch: refetchActivity } = useQuery({
    queryKey: ['recent-activity', profile?.hotel_id],
    queryFn: () => apiFetch<any[]>(`/api/audit-log?hotelId=${profile?.hotel_id}&limit=5`),
    enabled: !!profile?.hotel_id,
    retry: false,
  });

  const openTasks = Array.isArray(taskData)
    ? taskData.filter((t: any) => t.status !== 'completed').length
    : (summary?.openTasks ?? '—');

  const metrics = [
    {
      label: 'เช็คอินวันนี้',
      value: summary?.todayArrivals ?? summary?.checkIns ?? '—',
      icon: 'enter-outline' as const,
      color: '#004B87',
    },
    {
      label: 'เช็คเอาท์วันนี้',
      value: summary?.todayDepartures ?? summary?.checkOuts ?? '—',
      icon: 'exit-outline' as const,
      color: '#059669',
    },
    {
      label: 'อัตราเข้าพัก',
      value: summary?.occupancyRate != null ? `${Math.round(summary.occupancyRate)}%` : '—',
      icon: 'stats-chart-outline' as const,
      color: '#7C3AED',
    },
    {
      label: 'ห้องว่าง',
      value: summary?.availableRooms ?? '—',
      icon: 'bed-outline' as const,
      color: '#D97706',
    },
  ];

  const onRefresh = () => {
    refetchSummary();
    refetchActivity();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refetchingSummary} onRefresh={onRefresh} tintColor="#004B87" />
        }
      >
        <View style={styles.header}>
          <View style={styles.greetBlock}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{profile?.full_name ?? 'พนักงาน'}</Text>
            <Text style={styles.roleText}>{ROLE_LABEL[profile?.role ?? ''] ?? profile?.role}</Text>
            {profile?.hotel_name && <Text style={styles.hotel}>{profile.hotel_name}</Text>}
          </View>
          <View style={styles.taskBadgeWrap}>
            <View style={styles.taskBadge}>
              <Text style={styles.taskBadgeNum}>{openTasks}</Text>
            </View>
            <Text style={styles.taskBadgeLabel}>งานค้าง</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ภาพรวมวันนี้</Text>
        <View style={styles.metricsGrid}>
          {metrics.map(m => (
            <View key={m.label} style={styles.metricCard}>
              <Ionicons name={m.icon} size={22} color={m.color} />
              <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>เมนูด่วน</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'add-circle-outline' as const, label: 'Walk-in ใหม่', color: '#004B87', route: '/arrivals' },
            { icon: 'enter-outline' as const,      label: 'เช็คอินแขก',  color: '#059669', route: '/arrivals' },
            { icon: 'bed-outline' as const,        label: 'สถานะห้อง',   color: '#D97706', route: '/rooms' },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickAction}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon} size={26} color={a.color} />
              </View>
              <Text style={styles.quickActionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>กิจกรรมล่าสุด</Text>
        <View style={styles.activityFeed}>
          {activity.length === 0 && (
            <Text style={styles.noActivity}>ไม่มีกิจกรรมล่าสุด</Text>
          )}
          {activity.map((ev: any, idx: number) => (
            <View key={ev.id ?? idx} style={styles.activityRow}>
              <View style={styles.activityDot} />
              <View style={styles.activityBody}>
                <Text style={styles.activityText} numberOfLines={2}>
                  {ev.description ?? ev.action ?? ev.event_type ?? 'กิจกรรม'}
                </Text>
                {ev.created_at && (
                  <Text style={styles.activityTime}>
                    {new Date(ev.created_at).toLocaleTimeString('th-TH', { timeStyle: 'short' })}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
  },
  greetBlock: { flex: 1 },
  greeting: { fontSize: 14, color: '#6B7280' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2 },
  roleText: { fontSize: 13, color: '#004B87', fontWeight: '600', marginTop: 2 },
  hotel: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  taskBadgeWrap: { alignItems: 'center', gap: 4 },
  taskBadge: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
  },
  taskBadgeNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  taskBadgeLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  metricCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  metricValue: { fontSize: 26, fontWeight: '800' },
  metricLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  quickActionIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center' },
  activityFeed: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 4, elevation: 2,
  },
  noActivity: { color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  activityRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#004B87', marginTop: 6 },
  activityBody: { flex: 1 },
  activityText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  activityTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
