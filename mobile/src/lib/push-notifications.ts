import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export function handleNotification(notification: Notifications.Notification): {
  screen: string | null;
  params: Record<string, string> | null;
} {
  const data = notification.request.content.data as Record<string, string> | undefined;
  if (!data?.type) return { screen: null, params: null };

  switch (data.type) {
    case 'task':
    case 'work_order':
      return { screen: '/(tabs)/tasks', params: { taskId: data.id } };
    case 'checkin':
    case 'checkout':
      return { screen: '/(tabs)/arrivals', params: { reservationId: data.id } };
    case 'kitchen_order':
      return { screen: '/(tabs)/kitchen', params: { orderId: data.id } };
    case 'room':
      return { screen: '/(tabs)/rooms', params: { roomId: data.id } };
    default:
      return { screen: '/(tabs)', params: null };
  }
}
