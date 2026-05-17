import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

const ROLE_LABELS: Record<string, string> = {
  hotel_owner: 'เจ้าของโรงแรม',
  general_manager: 'ผู้จัดการทั่วไป',
  operations_manager: 'ผู้จัดการฝ่ายปฏิบัติการ',
  front_desk: 'พนักงาน Front Desk',
  housekeeping: 'แม่บ้าน',
  technician: 'ช่างเทคนิค',
  kitchen_staff: 'พ่อครัว',
  bellboy: 'พนักงานยกกระเป๋า',
  room_service_staff: 'Room Service',
  security_staff: 'รักษาความปลอดภัย',
  concierge: 'Concierge',
  transport_driver: 'คนขับรถ',
};

export default function ProfileScreen() {
  const { profile, signOut, session } = useAuthStore();
  const [lang, setLang] = useState<'TH' | 'EN'>('TH');
  const [darkMode, setDarkMode] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

  const email = session?.user?.email ?? '—';

  const handleSignOut = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleChangePassword = () => {
    Alert.alert('เปลี่ยนรหัสผ่าน', 'กรุณาเข้าใช้งานผ่านเว็บเบราว์เซอร์เพื่อเปลี่ยนรหัสผ่าน');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'พนักงาน'}</Text>
          <Text style={styles.role}>{ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'}</Text>
          {profile?.hotel_name && <Text style={styles.hotel}>{profile.hotel_name}</Text>}
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color="#9CA3AF" />
            <Text style={styles.email}>{email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ตั้งค่า</Text>

          <View style={styles.settingRow}>
            <Ionicons name="language-outline" size={20} color="#374151" />
            <Text style={styles.settingLabel}>ภาษา / Language</Text>
            <TouchableOpacity
              style={styles.langToggle}
              onPress={() => setLang(l => (l === 'TH' ? 'EN' : 'TH'))}
            >
              <View style={[styles.langOption, lang === 'TH' && styles.langActive]}>
                <Text style={[styles.langText, lang === 'TH' && styles.langTextActive]}>TH</Text>
              </View>
              <View style={[styles.langOption, lang === 'EN' && styles.langActive]}>
                <Text style={[styles.langText, lang === 'EN' && styles.langTextActive]}>EN</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Ionicons name="moon-outline" size={20} color="#374151" />
            <Text style={styles.settingLabel}>โหมดมืด (เร็วๆ นี้)</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ true: '#004B87' }}
              disabled
            />
          </View>

          <View style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={20} color="#374151" />
            <Text style={styles.settingLabel}>รับการแจ้งเตือน</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ true: '#004B87' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>บัญชี</Text>
          <TouchableOpacity style={styles.menuRow} onPress={handleChangePassword}>
            <Ionicons name="lock-closed-outline" size={20} color="#374151" />
            <Text style={styles.menuLabel}>เปลี่ยนรหัสผ่าน</Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลแอป</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เวอร์ชัน</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ระบบ</Text>
            <Text style={styles.infoValue}>Maitri Hotel OS</Text>
          </View>
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
  profileCard: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 20,
    padding: 28, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 3,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#004B87',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  role: { fontSize: 14, color: '#004B87', fontWeight: '600', marginTop: 4 },
  hotel: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  email: { fontSize: 13, color: '#6B7280' },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 4,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  settingLabel: { flex: 1, fontSize: 15, color: '#111827' },
  langToggle: {
    flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 10, padding: 2,
  },
  langOption: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  langActive: { backgroundColor: '#004B87' },
  langText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  langTextActive: { color: '#fff' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#111827' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 16,
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
});
