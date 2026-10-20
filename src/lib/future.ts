import { useCallback, useEffect, useState } from 'react';
import { futureDeliveryDate } from '@/lib/future-plan';
import { scheduleFutureMessage } from '@/lib/reminder-native';
import { supabase } from '@/lib/supabase';

export type FutureMessage = { id: string; body: string; createdAt: Date };

/**
 * Mesajı bırakır ve teslim anına yerel bildirim kurar. Başarılıysa true.
 * Teslim tarihini hesaplayan istemcidir; veritabanı yalnızca 28 gün–1 yıl aralığını doğrular.
 */
export async function sendFutureMessage(body: string): Promise<boolean> {
  const deliverAt = futureDeliveryDate(new Date());
  const { error } = await supabase.rpc('send_future_message', {
    p_body: body.trim(),
    p_deliver_at: deliverAt.toISOString(),
  });
  if (error) return false;
  // Vakti gelmeden satır okunamadığı için bildirim yalnızca şimdi kurulabilir.
  await scheduleFutureMessage(deliverAt);
  return true;
}

/**
 * Demo (derste göstermek için): mesaj 28 gün değil 10 saniye sonra teslim edilir.
 * Teslim anını döndürür; gönderilemezse null.
 */
export async function sendFutureDemo(body: string): Promise<Date | null> {
  const { data, error } = await supabase.rpc('send_future_message_demo', { p_body: body.trim() });
  if (error || typeof data !== 'string') return null;
  return new Date(data);
}

type Row = { id: string; body: string; created_at: string };

/** Vakti gelmiş ve henüz açılmamış mesajlar (RLS vakti gelmeyenleri zaten göstermez), eskiden yeniye. */
export function useDueFutureMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<FutureMessage[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('future_messages')
      .select('id, body, created_at')
      .is('opened_at', null)
      .order('deliver_at');
    if (error) return;
    setMessages(((data ?? []) as Row[]).map((r) => ({ id: r.id, body: r.body, createdAt: new Date(r.created_at) })));
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Mesajı açıldı olarak işaretler ve listeden çıkarır; işaretlenemezse false. */
  const markOpened = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('open_future_message', { p_id: id });
    if (error) return false;
    setMessages((list) => list.filter((m) => m.id !== id));
    return true;
  }, []);

  return { messages, reload: load, markOpened };
}
