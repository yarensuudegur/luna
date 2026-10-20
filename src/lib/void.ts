import { FunctionsHttpError } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { t } from '@/i18n/core';
import type { Lang } from '@/i18n/lang';
import { supabase } from '@/lib/supabase';

export const VOID_LIMIT = 5;
export const MAX_QUESTION = 600;

export type VoidMessage = {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  createdAt: string;
  /** Yalnızca ekranda gösterilen hata balonu; veritabanında yok. */
  err?: boolean;
  /** Cevap alınamayan soru: sunucuya yazılmadı, hak düşmedi. */
  failed?: boolean;
};

export type VoidCategory = 'Ben' | 'Aşk' | 'İş' | 'Sosyal';

/** Kategori anahtarları (iç adlar Türkçe); görünen ad ve hazır sorular sözlüktedir. */
export const VOID_CAT_NAMES = ['Ben', 'Aşk', 'İş', 'Sosyal'] as const satisfies readonly VoidCategory[];

/** Prototipteki VCATS: kategori başına hazır sorular, seçili dilde. */
export function voidQuestions(cat: VoidCategory): string[] {
  return t(`void.cats.${cat}`, { returnObjects: true }) as unknown as string[];
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Europe/Istanbul gününün başlangıcı (ms). Türkiye UTC+3 sabit, yaz saati yok. */
export function istanbulDayStart(now: number): number {
  return Math.floor((now + 3 * HOUR) / DAY) * DAY - 3 * HOUR;
}

type Row = { id: string; role: 'user' | 'assistant'; body: string; created_at: string };

const fromRow = (r: Row): VoidMessage => ({ id: r.id, role: r.role, body: r.body, createdAt: r.created_at });

/** Geçmiş panelinde kaç gün tutulur (bugün hariç). */
export const VOID_HISTORY_DAYS = 7;

/** Geçmiş günlerden birinin sohbeti. */
export type VoidDay = {
  /** O günün İstanbul gece yarısı (ms); anahtar olarak da kullanılır. */
  dayStart: number;
  messages: VoidMessage[];
  /** İlk soru; panelde önizleme. */
  preview: string;
};

/** Mesajları İstanbul günlerine ayırır; en yeni gün önce. */
export function groupByDay(messages: readonly VoidMessage[]): VoidDay[] {
  const days = new Map<number, VoidMessage[]>();
  for (const m of messages) {
    const key = istanbulDayStart(Date.parse(m.createdAt));
    const list = days.get(key);
    if (list) list.push(m);
    else days.set(key, [m]);
  }
  return [...days.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([dayStart, list]) => ({
      dayStart,
      messages: list,
      preview: list.find((m) => m.role === 'user')?.body ?? '',
    }));
}

/** Cevabın dilini ve bağlamını belirleyen ayarlar. */
export type VoidPrefs = { lang: Lang; relationship: string; lifeStage: string };

export function useVoid(userId: string | undefined, prefs: VoidPrefs) {
  const [messages, setMessages] = useState<VoidMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [asking, setAsking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  /** "Yeni sohbet": bu andan önceki mesajlar ekranda ve Gemini geçmişinde yok sayılır. */
  const [since, setSince] = useState<string | null>(null);
  /** Sunucu 429 verdiyse o günün ms başlangıcı; sayaç sıfıra iner. */
  const [limitDay, setLimitDay] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    setLoadError(false);
    // Bugün ve son 7 günün sohbetleri (geçmiş paneli için).
    const from = new Date(istanbulDayStart(Date.now()) - VOID_HISTORY_DAYS * DAY).toISOString();
    supabase
      .from('void_messages')
      .select('id, role, body, created_at')
      .eq('user_id', userId)
      .gte('created_at', from)
      .order('created_at', { ascending: false })
      .limit(400)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setLoadError(true);
        else setMessages(((data ?? []) as Row[]).reverse().map(fromRow));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const dayStart = istanbulDayStart(now);
  const used = useMemo(
    () => messages.filter((m) => m.role === 'user' && !m.failed && Date.parse(m.createdAt) >= dayStart).length,
    [messages, dayStart],
  );
  const left = limitDay === dayStart ? 0 : Math.max(0, VOID_LIMIT - used);

  // Ekranda yalnızca bugünün sohbeti; gün dönünce önceki sohbet geçmiş paneline geçer.
  const todayIso = new Date(dayStart).toISOString();
  const start = since && since > todayIso ? since : todayIso;
  const visible = useMemo(
    () => messages.filter((m) => Date.parse(m.createdAt) >= Date.parse(start)),
    [messages, start],
  );
  const history = useMemo(
    () =>
      groupByDay(messages.filter((m) => !m.err && Date.parse(m.createdAt) < dayStart)).slice(0, VOID_HISTORY_DAYS),
    [messages, dayStart],
  );

  /** Soruyu gönderir; başarısız olursa soru "failed" işaretlenir ve hata balonu eklenir. */
  const ask = useCallback(
    async (question: string): Promise<void> => {
      const q = question.trim().slice(0, MAX_QUESTION);
      if (!q || asking) return;
      const sentAt = new Date().toISOString();
      const qid = `local-q-${sentAt}`;
      setAsking(true);
      setMessages((m) => [...m.filter((x) => !x.err), { id: qid, role: 'user', body: q, createdAt: sentAt }]);
      const fail = (text: string) =>
        setMessages((m) => [
          ...m.map((x) => (x.id === qid ? { ...x, failed: true } : x)),
          { id: `err-${sentAt}`, role: 'assistant', body: text, createdAt: new Date().toISOString(), err: true },
        ]);
      try {
        const { data, error } = await supabase.functions.invoke<{ answer?: string }>('void', {
          // Void yalnızca bugünün sohbetini (ya da "Yeni sohbet"ten sonrasını) hatırlar.
          body: { question: q, since: start, ...prefs },
        });
        if (error) {
          const status = error instanceof FunctionsHttpError ? error.context.status : 0;
          if (status === 429) setLimitDay(istanbulDayStart(Date.now()));
          fail(t(status === 429 ? 'void.limit' : 'void.failed'));
          return;
        }
        const answer = data?.answer;
        if (!answer) {
          fail(t('void.failed'));
          return;
        }
        setMessages((m) => [
          ...m,
          { id: `local-a-${sentAt}`, role: 'assistant', body: answer, createdAt: new Date().toISOString() },
        ]);
      } catch {
        fail(t('void.failed'));
      } finally {
        setAsking(false);
      }
    },
    [asking, start, prefs.lang, prefs.relationship, prefs.lifeStage],
  );

  const newChat = useCallback(() => setSince(new Date().toISOString()), []);

  return { messages: visible, history, loading, loadError, reload, asking, left, ask, newChat };
}
