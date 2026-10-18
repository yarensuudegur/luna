import { Notifications } from '@/lib/notif-module';
import { Platform } from 'react-native';
import { eveningHour } from '@/lib/bottle';
import { eveningDates } from '@/lib/reminder-plan';

/** unavailable: web gibi bildirimin olmadığı yerler. */
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

const CHANNEL = 'hatirlatici';
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function readPermission(): Promise<PermissionState> {
  if (!Notifications) return 'unavailable';
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.granted) return 'granted';
    return p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** İzni ister (sistem penceresi); sonucu döndürür. Reddedilirse uygulama normal çalışır. */
export async function askPermission(): Promise<PermissionState> {
  if (!Notifications) return 'unavailable';
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Hatırlatmalar',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.requestPermissionsAsync();
  } catch {
    // izin penceresi açılamadıysa mevcut durum okunur
  }
  return readPermission();
}

/** Çıkış ve hesap silmede çağrılır; başka kullanıcıya bildirim gitmesin. */
export async function cancelReminders(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // zamanlanmış bildirim yoksa yapılacak bir şey yok
  }
}

export async function scheduleReminders(opts: {
  eveningTime: string;
  cardReminder: boolean;
  moodDoneToday: boolean;
}): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const channelId = CHANNEL;
  for (const date of eveningDates(new Date(), eveningHour(opts.eveningTime), opts.moodDoneToday)) {
    await Notifications.scheduleNotificationAsync({
      content: { body: 'Bugünü şişene ekle.', data: { tab: 'gunluk' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
    });
  }
  if (opts.cardReminder) {
    await Notifications.scheduleNotificationAsync({
      content: { body: 'Yeni kartın hazır.', data: { tab: 'index' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 0, minute: 0, channelId },
    });
  }
}

/** Yalnızca geliştirmede: iki hatırlatmayı 10 ve 20 saniye sonra gönderir. */
export async function sendTestReminders(): Promise<boolean> {
  if (!Notifications) return false;
  const channelId = CHANNEL;
  await Notifications.scheduleNotificationAsync({
    content: { body: 'Bugünü şişene ekle.', data: { tab: 'gunluk' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId },
  });
  await Notifications.scheduleNotificationAsync({
    content: { body: 'Yeni kartın hazır.', data: { tab: 'index' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 20, channelId },
  });
  return true;
}
