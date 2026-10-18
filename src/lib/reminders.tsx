import { useLang } from '@/i18n';
import { useLastNotificationResponse } from '@/lib/notif-module';
import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/lib/auth';
import { askPermission, readPermission, scheduleReminders } from '@/lib/reminder-native';
import type { PermissionState } from '@/lib/reminder-native';
import { isReminderTab } from '@/lib/reminder-plan';
import type { ReminderTab } from '@/lib/reminder-plan';
import { useSettings } from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { useToday } from '@/lib/today';

type RemindersState = {
  permission: PermissionState;
  requestPermission: () => Promise<PermissionState>;
  /** Bugünün duygusu kaydedilince çağrılır; bugünkü akşam hatırlatması iptal edilir. */
  noteMoodSaved: () => void;
};

const Ctx = createContext<RemindersState | null>(null);

/** Yerel hatırlatmaları ayarlara ve bugünün duygu durumuna göre zamanlar; bildirime dokunmayı sekmeye çevirir. */
export function RemindersProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { eveningTime, cardReminder } = useSettings();
  const { today } = useToday();
  const lang = useLang();
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  /** Duygu durumu hangi gün için okundu / hangi gün kayıtlı. */
  const [checkedDay, setCheckedDay] = useState<string | null>(null);
  const [doneDay, setDoneDay] = useState<string | null>(null);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    void readPermission().then(setPermission);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void readPermission().then(setPermission);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase
      .from('moods')
      .select('date')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        if (data) setDoneDay(today);
        setCheckedDay(today);
      });
    return () => {
      alive = false;
    };
  }, [userId, today]);

  useEffect(() => {
    if (permission !== 'granted' || checkedDay !== today) return;
    scheduleReminders({ eveningTime, cardReminder, moodDoneToday: doneDay === today }).catch(() => {});
    // Dil değişince bildirim metinleri yeni dille yeniden zamanlanır.
  }, [permission, checkedDay, today, doneDay, eveningTime, cardReminder, lang]);

  // Bildirime dokunma (uygulama kapalıyken de): ilgili sekmeyi aç.
  const last = useLastNotificationResponse();
  useEffect(() => {
    if (!last) return;
    const id = `${last.notification.request.identifier}|${last.notification.date}`;
    if (handled.current === id) return;
    handled.current = id;
    const tab: unknown = last.notification.request.content.data?.tab;
    if (!isReminderTab(tab)) return;
    const target: Record<ReminderTab, '/' | '/gunluk'> = { index: '/', gunluk: '/gunluk' };
    router.navigate(target[tab]);
  }, [last, router]);

  const requestPermission = useCallback(async () => {
    const next = await askPermission();
    setPermission(next);
    return next;
  }, []);
  const noteMoodSaved = useCallback(() => setDoneDay(today), [today]);

  const value = useMemo<RemindersState>(
    () => ({ permission, requestPermission, noteMoodSaved }),
    [permission, requestPermission, noteMoodSaved],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReminders(): RemindersState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReminders, RemindersProvider içinde kullanılmalı.');
  return ctx;
}
