import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CRED_EMAIL_KEY = 'biometric_email';
const CRED_TOKEN_KEY = 'biometric_token';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticateWithBiometric(prompt: string): Promise<boolean> {
  const available = await isBiometricAvailable();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    fallbackLabel: 'ใช้รหัสผ่าน',
    cancelLabel: 'ยกเลิก',
    disableDeviceFallback: false,
  });

  return result.success;
}

export async function saveBiometricCredentials(
  email: string,
  token: string
): Promise<void> {
  await SecureStore.setItemAsync(CRED_EMAIL_KEY, email);
  await SecureStore.setItemAsync(CRED_TOKEN_KEY, token);
}

export async function getBiometricCredentials(): Promise<{
  email: string;
  token: string;
} | null> {
  const email = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
  const token = await SecureStore.getItemAsync(CRED_TOKEN_KEY);
  if (!email || !token) return null;
  return { email, token };
}
