import { useCallback, useEffect, useState } from 'react';
import type { ArchivedMessage } from '@/lib/future-calendar';
import { cancelFutureNotification } from '@/lib/reminder-native';
import { supabase } from '@/lib/supabase';

export type { ArchivedMessage, CalendarMonth } from '@/lib/future-calendar';
export { groupByMonth } from '@/lib/future-calendar';

type Row = { id: string; body: string; created_at: string; deliver_at: string };

/** Teslim edilmiş mesajlar (RLS vakti gelmeyeni göstermez), en yeni teslim önce. */
export function useFutureArchive(userId: string | undefined) {
  const [messages, setMessages] = useState<ArchivedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) return;
    const { data, error: err } = await supabase
      .from('future_messages')
      .select('id, body, created_at, deliver_at')
      .order('deliver_at', { ascending: false });
    if (err) setError(true);
    else {
      setError(false);
      setMessages(
        ((data ?? []) as Row[]).map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: new Date(r.created_at),
          deliverAt: new Date(r.deliver_at),
        })),
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Kalıcı siler ve o mesajın zamanlanmış bildirimini iptal eder; silinemezse false. */
  const remove = useCallback(
    async (message: ArchivedMessage) => {
      if (!userId) return false;
      const { data, error: err } = await supabase.from('future_messages').delete().eq('id', message.id).select('id');
      if (err || !data || data.length === 0) return false;
      setMessages((list) => list.filter((m) => m.id !== message.id));
      await cancelFutureNotification(message.deliverAt);
      return true;
    },
    [userId],
  );

  return { messages, loading, error, reload, remove };
}

export type FutureArchive = ReturnType<typeof useFutureArchive>;
