import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, loading } = useAuthStore();
  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color="#004B87" /></View>;
  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
