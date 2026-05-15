import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

const ROLE_LABELS: Record<string, string> = {
  hotel_owner: 'เจ้าของโรงแรม', general_manager: 'ผู้จัดการทั่วไป', operations_manager: 'ผู้จัดการฝ่ายปฏิบัติการ',
  front_desk: 'พนักงาน Front Desk', housekeeping: 'แม่บ้าน', technician: 'ช่างเทคนิค',
  kitchen_staff: 'พ่อครัว', bellboy: 'พนักงานยกกระเป๋า', room_service_staff: 'Room Service',
  security_staff: 'รักษาความปลอดภัย', concierge: 'Concierge', transport_driver: 'คนขับรถ',
};

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSignOut = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = profile?.full_name
    ?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'พนักงาน'}</Text>
          <Text style={styles.role}>{ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}</Text>
          <Text style={styles.hotel}>{profile?.hotel_name}</Text>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การแจ้งเตือน</Text>
          <View style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={20} color="#374151" />
            <Text style={styles.settingLabel}>รับการแจ้งเตือน</Text>
            <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ true: '#004B87' }} />
          </View>
          <View style={styles.settingRow}>
            <Ionicons name="volume-high-outline" size={20} color="#374151" />
            <Text style={styles.settingLabel}>เสียงแจ้งเตือน</Text>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: '#004B87' }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>บัญชีของฉัน</Text>
          {[
            { icon: 'person-outline', label: 'แก้ไขโปรไฟล์' },
            { icon: 'lock-closed-outline', label: 'เปลี่ยนรหัสผ่าน' },
            { icon: 'language-outline', label: 'ภาษา' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuRow}>
              <Ionicons name={item.icon as any} size={20} color="#374151" />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลแอป</Text>
          {[
            { label: 'เวอร์ชัน', value: '1.0.0' },
            { label: 'ระบบ', value: 'Maitri Hotel OS' },
          ].map(item => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.signOutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  profileCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 28, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#004B87', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  role: { fontSize: 14, color: '#004B87', fontWeight: '600', marginTop: 4 },
  hotel: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingLabel: { flex: 1, fontSize: 15, color: '#111827' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuLabel: { flex: 1, fontSize: 15, color: '#111827' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 16 },
  signOutText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
});
