import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

const ROLE_TABS: Record<string, { name: string; icon: keyof typeof Ionicons.glyphMap; label: string }[]> = {
  front_desk: [
    { name: 'index', icon: 'home-outline', label: 'หน้าหลัก' },
    { name: 'arrivals', icon: 'enter-outline', label: 'เช็คอิน' },
    { name: 'rooms', icon: 'bed-outline', label: 'ห้อง' },
    { name: 'profile', icon: 'person-outline', label: 'โปรไฟล์' },
  ],
  housekeeping: [
    { name: 'index', icon: 'home-outline', label: 'หน้าหลัก' },
    { name: 'tasks', icon: 'list-outline', label: 'งานของฉัน' },
    { name: 'rooms', icon: 'bed-outline', label: 'ห้อง' },
    { name: 'profile', icon: 'person-outline', label: 'โปรไฟล์' },
  ],
  technician: [
    { name: 'index', icon: 'home-outline', label: 'หน้าหลัก' },
    { name: 'tasks', icon: 'construct-outline', label: 'งานซ่อม' },
    { name: 'profile', icon: 'person-outline', label: 'โปรไฟล์' },
  ],
  kitchen_staff: [
    { name: 'index', icon: 'home-outline', label: 'หน้าหลัก' },
    { name: 'kitchen', icon: 'restaurant-outline', label: 'ออร์เดอร์' },
    { name: 'profile', icon: 'person-outline', label: 'โปรไฟล์' },
  ],
  default: [
    { name: 'index', icon: 'home-outline', label: 'หน้าหลัก' },
    { name: 'tasks', icon: 'list-outline', label: 'งาน' },
    { name: 'profile', icon: 'person-outline', label: 'โปรไฟล์' },
  ],
};

export default function TabLayout() {
  const { profile } = useAuthStore();
  const role = profile?.role ?? 'default';
  const tabs = ROLE_TABS[role] ?? ROLE_TABS.default;

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#004B87',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: { borderTopColor: '#E5E7EB', height: 62, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerStyle: { backgroundColor: '#004B87' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    }}>
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
