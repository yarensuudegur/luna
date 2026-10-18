import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

export type SavedReading = { key: string; h: string };

const storageKey = (userId: string) => `luna.saved.${userId}.v1`;

async function read(userId: string): Promise<SavedReading[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list as SavedReading[]) : [];
  } catch {
    return [];
  }
}

/** Kaydedilen yorumlar, yeniden eskiye; sekme her odaklandığında yenilenir. */
export function useSavedList(userId: string | undefined): SavedReading[] {
  const [list, setList] = useState<SavedReading[]>([]);
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let alive = true;
      read(userId).then((l) => alive && setList([...l].sort((a, b) => b.key.localeCompare(a.key))));
      return () => {
        alive = false;
      };
    }, [userId]),
  );
  return list;
}

/** Günün yorumunu kaydetme durumu; liste cihazda tutulur. */
export function useSavedReading(userId: string | undefined, key: string, title: string) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    read(userId).then((list) => alive && setSaved(list.some((s) => s.key === key)));
    return () => {
      alive = false;
    };
  }, [userId, key]);

  const toggle = useCallback(async () => {
    if (!userId) return false;
    const list = await read(userId);
    const next = list.some((s) => s.key === key)
      ? list.filter((s) => s.key !== key)
      : [{ key, h: title }, ...list];
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch(() => {});
    const now = next.some((s) => s.key === key);
    setSaved(now);
    return now;
  }, [userId, key, title]);

  return { saved, toggle };
}
