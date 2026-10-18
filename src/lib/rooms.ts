import { useCallback, useEffect, useRef, useState } from 'react';
import { diffMembers } from '@/lib/room-utils';
import { fetchMembers } from '@/lib/members';
import type { MemberInfo } from '@/lib/members';
import { useRealtime } from '@/lib/notifications';
import { subscribeChanges } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';

export type { MemberInfo };

export type Group = {
  id: string;
  name: string;
  owner: string;
  /** Sen dahil tüm üyeler. */
  memberIds: string[];
};

export type RoomMessage = {
  id: string;
  /** null: sistem mesajı. */
  sender: string | null;
  body: string;
  createdAt: string;
};

type MessageRow = { id: string; sender: string | null; body: string; created_at: string };

const toMessage = (r: MessageRow): RoomMessage => ({
  id: r.id,
  sender: r.sender,
  body: r.body,
  createdAt: r.created_at,
});

export type GroupsState = {
  groups: Group[];
  /** Grup kimliği → son mesaj (gönderen adıyla). */
  last: Record<string, string>;
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
  create: (name: string, friendIds: string[]) => Promise<string | null>;
  /** Adı ve üye farkını yazar; hepsi yazılamazsa false. */
  update: (group: Group, name: string, memberIds: string[]) => Promise<boolean>;
  remove: (groupId: string) => Promise<boolean>;
};

/** Üyesi olduğun gruplar ve her birinin son mesajı. */
export function useGroups(userId: string | undefined): GroupsState {
  const [groups, setGroups] = useState<Group[]>([]);
  const [last, setLast] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const waiters = useRef<(() => void)[]>([]);
  const flush = () => waiters.current.splice(0).forEach((done) => done());

  useEffect(() => {
    if (!userId) {
      flush();
      return;
    }
    let alive = true;
    (async () => {
      setError(false);
      const g = await supabase.from('groups').select('id, name, owner, group_members(user_id)').order('created_at');
      if (!alive) return;
      if (g.error) {
        setError(true);
        setLoading(false);
        return;
      }
      const rows = (g.data ?? []) as {
        id: string;
        name: string;
        owner: string;
        group_members: { user_id: string }[];
      }[];
      const list = rows.map<Group>((r) => ({
        id: r.id,
        name: r.name,
        owner: r.owner,
        memberIds: r.group_members.map((m) => m.user_id),
      }));
      setGroups(list);

      if (list.length === 0) {
        setLast({});
        setLoading(false);
        return;
      }
      const ids = list.map((x) => x.id);
      const [msgs, ...infos] = await Promise.all([
        supabase
          .from('messages')
          .select('room_id, sender, body')
          .in('room_id', ids)
          .order('created_at', { ascending: false })
          .limit(Math.max(50, ids.length * 5)),
        ...ids.map(fetchMembers),
      ]);
      if (!alive) return;
      const names = new Map<string, string>();
      infos.forEach((arr) => arr.forEach((m) => names.set(m.id, m.name)));
      const preview: Record<string, string> = {};
      for (const m of (msgs.data ?? []) as { room_id: string; sender: string | null; body: string }[]) {
        if (preview[m.room_id] !== undefined) continue;
        preview[m.room_id] = m.sender ? `${names.get(m.sender) ?? 'Biri'}: ${m.body}` : m.body;
      }
      setLast(preview);
      setLoading(false);
    })()
      .catch(() => {
        if (!alive) return;
        setError(true);
        setLoading(false);
      })
      .finally(() => {
        if (alive) flush();
      });
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const reload = useCallback(
    () =>
      new Promise<void>((done) => {
        waiters.current.push(done);
        setAttempt((n) => n + 1);
      }),
    [],
  );

  // Üyelik ya da ad değişince (Realtime, NotificationsProvider'dan) liste yenilenir.
  useRealtime((event) => {
    if (event.kind === 'groups') setAttempt((n) => n + 1);
  });

  const create = useCallback(
    async (name: string, friendIds: string[]) => {
      const { data, error: err } = await supabase.rpc('create_group', { p_name: name, p_members: friendIds });
      if (err || typeof data !== 'string') return null;
      setAttempt((n) => n + 1);
      return data;
    },
    [],
  );

  const update = useCallback(async (group: Group, name: string, memberIds: string[]) => {
    const { added, removed } = diffMembers(group.memberIds, memberIds);
    let ok = true;
    if (name !== group.name) {
      const r = await supabase.from('groups').update({ name }).eq('id', group.id);
      ok = ok && !r.error;
    }
    if (added.length) {
      const r = await supabase
        .from('group_members')
        .insert(added.map((user_id) => ({ group_id: group.id, user_id })));
      ok = ok && !r.error;
    }
    if (removed.length) {
      const r = await supabase.from('group_members').delete().eq('group_id', group.id).in('user_id', removed);
      ok = ok && !r.error;
    }
    setAttempt((n) => n + 1);
    return ok;
  }, []);

  const remove = useCallback(async (groupId: string) => {
    const { error: err } = await supabase.from('groups').delete().eq('id', groupId);
    setAttempt((n) => n + 1);
    return !err;
  }, []);

  return { groups, last, loading, error, reload, create, update, remove };
}

export type RoomState = {
  messages: RoomMessage[];
  /** Grup sohbetinde üye adları; herkese açık odada boş. */
  members: Map<string, MemberInfo>;
  loading: boolean;
  /** Gönderilemezse false. */
  send: (userId: string, body: string) => Promise<boolean>;
};

const PAGE = 100;

/**
 * Bir odanın son mesajları ve anlık akışı (Supabase Realtime).
 * `group` true ise üye bilgisi de okunur; sistem mesajı gelince üyeler yenilenir.
 */
export function useRoom(roomId: string, group: boolean): RoomState {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [members, setMembers] = useState<Map<string, MemberInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const seen = useRef(new Set<string>());
  const pushRef = useRef<(m: RoomMessage) => void>(() => {});

  // Grup mesajları tek Realtime bağlantısından gelir (NotificationsProvider).
  useRealtime((event) => {
    if (group && event.kind === 'message' && event.message.roomId === roomId) {
      const m = event.message;
      pushRef.current({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt });
    }
  });

  const loadMembers = useCallback(() => {
    if (!group) return;
    fetchMembers(roomId).then((list) => setMembers(new Map(list.map((m) => [m.id, m]))));
  }, [group, roomId]);

  useEffect(() => {
    let alive = true;
    seen.current = new Set();
    setMessages([]);
    setLoading(true);

    const push = (m: RoomMessage) => {
      if (seen.current.has(m.id)) return;
      seen.current.add(m.id);
      setMessages((prev) => [...prev, m].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      if (m.sender === null) loadMembers();
    };

    pushRef.current = (m) => alive && push(m);

    // Herkese açık olay odası grup değildir; yalnızca açıkken kendi kanalını kurar.
    const unsubscribe = group
      ? undefined
      : subscribeChanges(
          `room:${roomId}`,
          [{ event: 'INSERT', table: 'messages', filter: `room_id=eq.${roomId}` }],
          (change) => pushRef.current(toMessage(change.new as MessageRow)),
        );

    supabase
      .from('messages')
      .select('id, sender, body, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(PAGE)
      .then(({ data }) => {
        if (!alive) return;
        const rows = ((data ?? []) as MessageRow[]).map(toMessage).reverse();
        // Yüklenirken gelen canlı mesajları da koru.
        setMessages((prev) => {
          const byId = new Map<string, RoomMessage>();
          for (const m of [...rows, ...prev]) byId.set(m.id, m);
          byId.forEach((_m, id) => seen.current.add(id));
          return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
        setLoading(false);
      });

    loadMembers();

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [roomId, group, loadMembers]);

  const send = useCallback(
    async (userId: string, body: string) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ room_id: roomId, sender: userId, body })
        .select('id, sender, body, created_at')
        .single();
      if (error || !data) return false;
      const m = toMessage(data as MessageRow);
      if (!seen.current.has(m.id)) {
        seen.current.add(m.id);
        setMessages((prev) => [...prev, m].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      }
      return true;
    },
    [roomId],
  );

  return { messages, members, loading, send };
}
