import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/**
 * expo-notifications'ı güvenle yükler. Android'deki Expo Go bu paketin yerel
 * modüllerini içermediği için doğrudan import uygulamayı açılmaz hâle getirir.
 * Modül yoksa null döner; bildirimler sessizce atlanır, uygulama normal çalışır.
 */
function load(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  const inExpoGoAndroid =
    Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (inExpoGoAndroid) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

export const Notifications = load();

type LastResponse = ReturnType<NotificationsModule['useLastNotificationResponse']>;

/** Modül yoksa her zaman null döner. Notifications sabit olduğu için hook sırası değişmez. */
export function useLastNotificationResponse(): LastResponse | null {
  return Notifications ? Notifications.useLastNotificationResponse() : null;
}
