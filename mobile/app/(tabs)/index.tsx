import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

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
  const { profile, signOut } = useAuthStore();

  const { data: stats, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats', profile?.hotel_id],
    queryFn: () => apiFetch<any>(`/api/dashboard?hotelId=${profile?.hotel_id}`),
    enabled: !!profile?.hotel_id,
    retry: false,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#004B87" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.name}>{profile?.full_name || 'พนักงาน'}</Text>
            <Text style={styles.role}>{ROLE_LABEL[profile?.role ?? ''] ?? profile?.role}</Text>
            <Text style={styles.hotel}>{profile?.hotel_name}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'เช็คอินวันนี้', value: stats?.checkIns ?? '—', icon: 'enter-outline', color: '#004B87' },
            { label: 'เช็คเอาท์วันนี้', value: stats?.checkOuts ?? '—', icon: 'exit-outline', color: '#059669' },
            { label: 'ห้องว่าง', value: stats?.availableRooms ?? '—', icon: 'bed-outline', color: '#D97706' },
            { label: 'งานค้าง', value: stats?.openTasks ?? '—', icon: 'alert-circle-outline', color: '#DC2626' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={24} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>เมนูด่วน</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'qr-code-outline', label: 'สแกน QR', color: '#004B87' },
            { icon: 'camera-outline', label: 'ถ่ายรูปงาน', color: '#7C3AED' },
            { icon: 'chatbubble-outline', label: 'แจ้งปัญหา', color: '#DC2626' },
            { icon: 'notifications-outline', label: 'การแจ้งเตือน', color: '#D97706' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon as any} size={26} color={a.color} />
              </View>
              <Text style={styles.quickActionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#6B7280' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2 },
  role: { fontSize: 13, color: '#004B87', fontWeight: '600', marginTop: 2 },
  hotel: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  signOutBtn: { padding: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: 8, flex: 1 },
  quickActionIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center' },
});
