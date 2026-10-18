import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Change = RealtimePostgresChangesPayload<Record<string, unknown>>;

type Spec = {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  /** Örn. `user_a=eq.<id>`. DELETE olayları süzülemez; orada `onChange` içinde `old` kontrol edilir. */
  filter?: string;
};

/**
 * Tablo değişikliklerine abone olur, kapatma işlevini döner. Aynı adlı kanal
 * varsa önce kapatılır; böylece bir kanala iki kez abone olunmaz.
 */
export function subscribeChanges(name: string, specs: readonly Spec[], onChange: (change: Change) => void) {
  const topic = `realtime:${name}`;
  supabase
    .getChannels()
    .filter((c) => c.topic === topic)
    .forEach((c) => void supabase.removeChannel(c));

  let channel = supabase.channel(name);
  for (const s of specs) {
    channel = channel.on(
      'postgres_changes',
      { event: s.event, schema: 'public', table: s.table, ...(s.filter ? { filter: s.filter } : {}) },
      onChange,
    );
  }
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
