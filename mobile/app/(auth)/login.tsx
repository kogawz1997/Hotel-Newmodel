import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  isBiometricAvailable,
  getBiometricCredentials,
  authenticateWithBiometric,
  saveBiometricCredentials,
} from '@/lib/biometric';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const available = await isBiometricAvailable();
        if (!available) return;
        const creds = await getBiometricCredentials();
        if (creds) setBiometricReady(true);
      } catch {
        // biometric not available — ignore
      }
    })();
  }, []);

  async function signInWithBiometric() {
    try {
      const success = await authenticateWithBiometric('เข้าสู่ระบบ Maitri PMS');
      if (!success) return;
      const creds = await getBiometricCredentials();
      if (!creds) return;
      setLoading(true);
      const { error } = await supabase.auth.setSession({
        access_token: creds.token,
        refresh_token: creds.token,
      });
      setLoading(false);
      if (error) {
        // Session expired — fall back silently to password login
        setBiometricReady(false);
        return;
      }
      router.replace('/(tabs)');
    } catch {
      setLoading(false);
      // biometric error — fall back silently to password login
    }
  }

  async function signIn() {
    if (!email || !password) { Alert.alert('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message); return; }
    try {
      const token = data.session?.access_token;
      if (token) await saveBiometricCredentials(email, token);
    } catch {
      // biometric save failed — non-critical
    }
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Maitri</Text>
          <Text style={styles.logoSub}>Hotel PMS</Text>
        </View>

        <Text style={styles.title}>เข้าสู่ระบบ</Text>
        <Text style={styles.subtitle}>สำหรับพนักงานโรงแรม</Text>

        <TextInput
          style={styles.input}
          placeholder="อีเมล"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="รหัสผ่าน"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>}
        </TouchableOpacity>

        {biometricReady && (
          <TouchableOpacity style={styles.biometricButton} onPress={signInWithBiometric} disabled={loading}>
            <Text style={styles.biometricButtonText}>Login with Face/Fingerprint</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#004B87', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  logo: { alignItems: 'center', marginBottom: 28 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#004B87' },
  logoSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    color: '#111827', marginBottom: 14,
  },
  button: {
    backgroundColor: '#004B87', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  biometricButton: {
    borderWidth: 1, borderColor: '#004B87', borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', marginTop: 12,
  },
  biometricButtonText: { color: '#004B87', fontSize: 15, fontWeight: '600' },
});
