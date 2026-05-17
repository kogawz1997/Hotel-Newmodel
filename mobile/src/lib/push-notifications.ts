import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.warn('[push] Permission not granted');
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (__DEV__) console.log('[push] Expo push token:', token);
    return token;
  } catch (e) {
    if (__DEV__) console.warn('[push] Failed to get token:', e);
    return null;
  }
}

export async function sendLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

export function handleNotification(notification: Notifications.Notification): void {
  switch (notification.request.content.data?.type) {
    case 'task': router.push('/(tabs)/tasks'); break;
    case 'checkin': router.push('/(tabs)/arrivals'); break;
    case 'kitchen_order': router.push('/(tabs)/kitchen'); break;
    case 'room': router.push('/(tabs)/rooms'); break;
    case 'checkout': router.push('/(tabs)/arrivals'); break;
    default: router.push('/(tabs)/');
  }
}

export async function scheduleReminderNotification(title: string, body: string, triggerSeconds: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds: triggerSeconds },
  });
}
