import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { NotificationBanner } from '@/components/NotificationBanner';
import { useAuth } from '@/lib/auth';
import { subscribeChanges } from '@/lib/realtime';
import type { Change } from '@/lib/realtime';
import { fetchMembers } from '@/lib/members';
import { supabase } from '@/lib/supabase';

/** Bildirime dokununca gidilecek yer. */
export type NoticeTarget =
  | { kind: 'group'; groupId: string }
  | { kind: 'groups' }
  | { kind: 'friend'; friendId: string };

type Notice = { id: number; text: string; target: NoticeTarget };

export type LiveMessage = { id: string; roomId: string; sender: string | null; body: string; createdAt: string };

/** Uygulamadaki tek Realtime bağlantısından dağıtılan olaylar. */
export type RealtimeEvent = { kind: 'friends' } | { kind: 'groups' } | { kind: 'message'; message: LiveMessage };

type Listener = (event: RealtimeEvent) => void;

type NotificationsState = {
  /** Arkadaşlar sekmesinde nokta gösterilsin mi. */
  badge: boolean;
  /** Okunmamış mesajı olan grupların kimlikleri. */
  unreadRooms: ReadonlySet<string>;
  /** Bildirime dokunulunca bırakılan hedef; ekran uygulayınca `clearIntent` çağırır. */
  intent: NoticeTarget | null;
  clearIntent: () => void;
  /** Şu an görünen sohbet odası (yoksa null); o odanın bildirimi gösterilmez, okunmuş sayılır. */
  setActiveRoom: (roomId: string | null) => void;
  /** Arkadaşlar sekmesi odakta mı. Odaktayken yeni olaylar noktayı yakmaz. */
  setTabFocused: (focused: boolean) => void;
  /** "Arkadaş ekle" ekranı açık mı. Kendi eşleşme ekranı olduğu için arkadaş bildirimi gösterilmez. */
  setAddingFriend: (adding: boolean) => void;
  /** Kendi sildiğim grubun "çıkarıldın" bildirimini bastırır; silmeden önce çağır. */
  ignoreRemoval: (groupId: string) => void;
  addListener: (listener: Listener) => () => void;
};

const Ctx = createContext<NotificationsState | null>(null);

const readKey = (userId: string) => `luna.read.${userId}.v1`;

async function readLastRead(userId: string): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(readKey(userId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

const clip = (text: string, n: number) => (text.length > n ? text.slice(0, n) + '…' : text);

type MessageRow = { id: string; room_id: string; sender: string | null; body: string; created_at: string };

/**
 * Oturum açıkken tüm Realtime aboneliklerini tek yerden yönetir, uygulama içi
 * bildirimleri üretir ve okunmamış durumunu tutar. `useFriends`, `useGroups` ve
 * `useRoom` kendi kanallarını açmaz; olayları buradan `useRealtime` ile alır.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const router = useRouter();

  const [queue, setQueue] = useState<Notice[]>([]);
  const [unread, setUnread] = useState<ReadonlySet<string>>(new Set());
  const [fresh, setFresh] = useState(0);
  const [intent, setIntent] = useState<NoticeTarget | null>(null);
  const [groupIds, setGroupIds] = useState<string[]>([]);

  const listeners = useRef(new Set<Listener>());
  const groupNames = useRef(new Map<string, string>());
  const memberNames = useRef(new Map<string, Map<string, string>>());
  const lastRead = useRef<Record<string, string>>({});
  const active = useRef<string | null>(null);
  const tabFocused = useRef(false);
  const adding = useRef(false);
  const ignored = useRef(new Set<string>());
  const nextId = useRef(1);

  /** Bir grupta kullanıcının adı (group_member_info); üyelik değişmişse yeniden okur. */
  const nameInGroup = useCallback(async (groupId: string, who: string): Promise<string> => {
    let names = memberNames.current.get(groupId);
    if (!names?.has(who)) {
      const list = await fetchMembers(groupId);
      names = new Map(list.map((m) => [m.id, m.name]));
      memberNames.current.set(groupId, names);
    }
    return names.get(who) ?? 'Biri';
  }, []);

  const ready = useRef<Promise<void>>(Promise.resolve());

  const emit = useCallback((event: RealtimeEvent) => listeners.current.forEach((l) => l(event)), []);

  const notify = useCallback((text: string, target: NoticeTarget, social: boolean) => {
    setQueue((q) => [...q, { id: nextId.current++, text, target }]);
    if (social && !tabFocused.current) setFresh((n) => n + 1);
  }, []);

  const markRead = useCallback(
    (roomId: string) => {
      if (!userId) return;
      lastRead.current = { ...lastRead.current, [roomId]: new Date().toISOString() };
      AsyncStorage.setItem(readKey(userId), JSON.stringify(lastRead.current)).catch(() => {});
      setUnread((prev) => {
        if (!prev.has(roomId)) return prev;
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    },
    [userId],
  );

  const setActiveRoom = useCallback(
    (roomId: string | null) => {
      const prev = active.current;
      active.current = roomId;
      if (prev) markRead(prev);
      if (roomId) markRead(roomId);
    },
    [markRead],
  );

  const setTabFocused = useCallback((focused: boolean) => {
    tabFocused.current = focused;
    if (focused) setFresh(0);
  }, []);
  const setAddingFriend = useCallback((value: boolean) => {
    adding.current = value;
  }, []);
  const ignoreRemoval = useCallback((groupId: string) => {
    ignored.current.add(groupId);
  }, []);
  const addListener = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  // Oturum değişince her şeyi sıfırla.
  useEffect(() => {
    setQueue([]);
    setUnread(new Set());
    setFresh(0);
    setIntent(null);
    setGroupIds([]);
    groupNames.current = new Map();
    memberNames.current = new Map();
    lastRead.current = {};
  }, [userId]);

  // Sosyal olaylar: arkadaşlıklar, üyelikler ve grup adları. Tek kanal.
  useEffect(() => {
    if (!userId) return;
    let alive = true;

    const loadGroups = async () => {
      const { data } = await supabase.from('groups').select('id, name');
      if (!alive || !data) return;
      const rows = data as { id: string; name: string }[];
      groupNames.current = new Map(rows.map((g) => [g.id, g.name]));
      const ids = rows.map((g) => g.id).sort();
      setGroupIds((prev) => (prev.join() === ids.join() ? prev : ids));
    };


    ready.current = readLastRead(userId).then((stored) => {
      if (alive) lastRead.current = stored;
    });
    void loadGroups();

    const unsubscribe = subscribeChanges(
      `social:${userId}`,
      [
        { event: 'INSERT', table: 'friendships', filter: `user_a=eq.${userId}` },
        { event: 'UPDATE', table: 'friendships', filter: `user_a=eq.${userId}` },
        { event: 'DELETE', table: 'friendships' },
        { event: 'INSERT', table: 'group_members', filter: `user_id=eq.${userId}` },
        { event: 'DELETE', table: 'group_members' },
        { event: 'UPDATE', table: 'groups' },
      ],
      async (change: Change) => {
        const row = (change.eventType === 'DELETE' ? change.old : change.new) as Record<string, string | null>;

        if (change.table === 'friendships') {
          // DELETE olayları süzülemez; yalnızca benim satırım ilgilendirir.
          if (change.eventType === 'DELETE' && row.user_a !== userId) return;
          emit({ kind: 'friends' });
          // İlişki türü değişikliği (UPDATE) kişiseldir, bildirilmez.
          if (change.eventType !== 'INSERT' || adding.current) return;
          const friendId = row.user_b;
          if (!friendId) return;
          const { data } = await supabase.rpc('friend_list');
          const friend = ((data ?? []) as { id: string; name: string | null }[]).find((f) => f.id === friendId);
          notify(`${friend?.name ?? 'Biri'} ile artık arkadaşsınız.`, { kind: 'friend', friendId }, true);
          return;
        }

        if (change.table === 'group_members') {
          const groupId = row.group_id;
          if (!groupId || row.user_id !== userId) return;
          if (change.eventType === 'INSERT') {
            await loadGroups();
            emit({ kind: 'groups' });
            const by = row.added_by;
            if (!by || by === userId) return;
            const adder = await nameInGroup(groupId, by);
            const group = groupNames.current.get(groupId);
            notify(
              `${adder} seni ${group ? `${group} grubuna` : 'bir gruba'} ekledi.`,
              { kind: 'group', groupId },
              true,
            );
          } else if (change.eventType === 'DELETE') {
            const group = groupNames.current.get(groupId);
            memberNames.current.delete(groupId);
            await loadGroups();
            emit({ kind: 'groups' });
            if (ignored.current.delete(groupId)) return;
            notify(group ? `${group} grubundan çıkarıldın.` : 'Bir gruptan çıkarıldın.', { kind: 'groups' }, true);
          }
          return;
        }

        if (change.table === 'groups') {
          await loadGroups();
          emit({ kind: 'groups' });
        }
      },
    );

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [userId, emit, notify, nameInGroup]);

  // Üyesi olduğum gruplardaki mesajlar: yalnızca bu gruplar süzülür (herkese açık oda gelmez).
  const groupKey = groupIds.join(',');
  useEffect(() => {
    if (!userId || groupIds.length === 0) return;
    let alive = true;

    // Okunmamışlar: son okumadan sonra başkasından gelen mesajı olan gruplar.
    // Hiç kaydı olmayan oda, şimdiden okunmuş sayılır (eski geçmiş nokta yakmasın).
    (async () => {
      await ready.current;
      const { data } = await supabase
        .from('messages')
        .select('room_id, created_at')
        .in('room_id', groupIds)
        .not('sender', 'is', null)
        .neq('sender', userId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!alive) return;
      const latest = new Map<string, string>();
      for (const m of (data ?? []) as { room_id: string; created_at: string }[]) {
        if (!latest.has(m.room_id)) latest.set(m.room_id, m.created_at);
      }
      const next = new Set<string>();
      let changed = false;
      const store = { ...lastRead.current };
      for (const id of groupIds) {
        if (!store[id]) {
          store[id] = new Date().toISOString();
          changed = true;
        } else if (id !== active.current && (latest.get(id) ?? '') > store[id]) {
          next.add(id);
        }
      }
      lastRead.current = store;
      if (changed) AsyncStorage.setItem(readKey(userId), JSON.stringify(store)).catch(() => {});
      setUnread(next);
    })();

    const unsubscribe = subscribeChanges(
      `chat:${userId}`,
      [{ event: 'INSERT', table: 'messages', filter: `room_id=in.(${groupIds.join(',')})` }],
      async (change: Change) => {
        const r = change.new as MessageRow;
        emit({
          kind: 'message',
          message: { id: r.id, roomId: r.room_id, sender: r.sender, body: r.body, createdAt: r.created_at },
        });
        // Sistem mesajları ve kendi mesajlarım bildirim üretmez.
        if (!r.sender || r.sender === userId) return;
        if (active.current === r.room_id) {
          markRead(r.room_id);
          return;
        }
        setUnread((prev) => new Set(prev).add(r.room_id));
        const who = await nameInGroup(r.room_id, r.sender);
        const group = groupNames.current.get(r.room_id) ?? 'Grup';
        notify(`${group} · ${who}: ${clip(r.body, 60)}`, { kind: 'group', groupId: r.room_id }, false);
      },
    );


    return () => {
      alive = false;
      unsubscribe();
    };
    // groupIds yerine groupKey: aynı küme için kanal yeniden kurulmaz.
  }, [userId, groupKey, emit, notify, markRead, nameInGroup]);

  const current = queue[0] ?? null;
  const shift = useCallback((id: number) => setQueue((q) => q.filter((n) => n.id !== id)), []);

  const value = useMemo<NotificationsState>(
    () => ({
      badge: unread.size > 0 || fresh > 0,
      unreadRooms: unread,
      intent,
      clearIntent: () => setIntent(null),
      setActiveRoom,
      setTabFocused,
      setAddingFriend,
      ignoreRemoval,
      addListener,
    }),
    [unread, fresh, intent, setActiveRoom, setTabFocused, setAddingFriend, ignoreRemoval, addListener],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {current && (
        <NotificationBanner
          key={current.id}
          text={current.text}
          onPress={() => {
            setIntent(current.target);
            router.navigate('/arkadaslar');
          }}
          onDone={() => shift(current.id)}
        />
      )}
    </Ctx.Provider>
  );
}

export function useNotifications(): NotificationsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications, NotificationsProvider içinde kullanılmalı.');
  return ctx;
}

/** Tek Realtime bağlantısından gelen olayları dinler; kendi kanalını açmaz. */
export function useRealtime(handler: Listener) {
  const { addListener } = useNotifications();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => addListener((e) => ref.current(e)), [addListener]);
}
