import { useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddFriend } from '@/components/arkadaslar/AddFriend';
import { FriendSheet } from '@/components/arkadaslar/FriendSheet';
import { GroupEditor } from '@/components/arkadaslar/GroupEditor';
import type { Person } from '@/components/arkadaslar/GroupEditor';
import { GroupMapTab } from '@/components/arkadaslar/GroupMapTab';
import { PeopleTab } from '@/components/arkadaslar/PeopleTab';
import { RoomView } from '@/components/arkadaslar/RoomView';
import { RoomsTab } from '@/components/arkadaslar/RoomsTab';
import { useToast } from '@/components/arkadaslar/Toast';
import { TransitionCard } from '@/components/arkadaslar/TransitionCard';
import { nextMoonEvent, signIndex } from '@/lib/astro';
import { useAuth } from '@/lib/auth';
import { useFriends } from '@/lib/friends';
import type { Friend } from '@/lib/friends';
import { isRomanticTransition } from '@/lib/relations';
import type { RelType } from '@/lib/relations';
import { EVENT_OPEN_BEFORE_MS, eventRoomId, isEventRoomOpen } from '@/lib/room-utils';
import { fetchMembers } from '@/lib/members';
import { useNotifications } from '@/lib/notifications';
import { useGroups } from '@/lib/rooms';
import type { Group, MemberInfo } from '@/lib/rooms';
import { useToday } from '@/lib/today';
import { useProfileChart } from '@/lib/use-chart';
import { colors, fonts, layout } from '@/theme';

type Sub = 'kisiler' | 'odalar' | 'grup';

const SUBS: readonly (readonly [Sub, string])[] = [
  ['kisiler', 'Kişiler'],
  ['odalar', 'Sohbet & odalar'],
  ['grup', 'Grup haritası'],
];

type Editor = { mode: 'new' } | { mode: 'edit'; groupId: string; others: MemberInfo[] };
type Room = { kind: 'group'; groupId: string } | { kind: 'event' };
type Transition = { friend: Friend; from: RelType; to: RelType };

export default function ArkadaslarScreen() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { today } = useToday();
  const toast = useToast();

  const myChart = useProfileChart(profile)?.chart ?? null;
  const mySunLon = myChart?.planets.find((p) => p.key === 'Güneş')?.lon;
  const mySun = mySunLon === undefined ? null : signIndex(mySunLon);

  const focused = useIsFocused();
  const friends = useFriends(userId);
  const groups = useGroups(userId);

  const notif = useNotifications();
  const { intent, clearIntent, setActiveRoom, setTabFocused, setAddingFriend, ignoreRemoval } = notif;
  const [sub, setSub] = useState<Sub>('kisiler');
  const [adding, setAdding] = useState(false);
  const [openFriendId, setOpenFriendId] = useState<string | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  // Sekmeye her dönüşte listeleri yenile (ilk açılışta kancalar zaten yükler).
  const first = useRef(true);
  const { reload: reloadFriends } = friends;
  const { reload: reloadGroups } = groups;
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      reloadFriends();
      reloadGroups();
    }, [reloadFriends, reloadGroups]),
  );

  // Kozmik olay: odanın açık kalması için 36 saat öncesinden bakılır.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const hour = Math.floor(now.getTime() / 3600000);
  const event = useMemo(() => nextMoonEvent(new Date(now.getTime() - EVENT_OPEN_BEFORE_MS)), [hour]);
  const eventOpen = event ? isEventRoomOpen(event.date, now) : false;

  const openFriend = friends.friends.find((f) => f.id === openFriendId) ?? null;
  const group = room?.kind === 'group' ? (groups.groups.find((g) => g.id === room.groupId) ?? null) : null;
  // Açık gruptan çıkarıldıysam (ya da grup silindiyse) odadan çık ve haber ver.
  const { show: showToast } = toast;
  useEffect(() => {
    if (groups.loading) return;
    const exists = (id: string) => groups.groups.some((g) => g.id === id);
    if (room?.kind === 'group' && !exists(room.groupId)) {
      setRoom(null);
      setEditor(null);
      showToast('Bu gruptan çıkarıldın');
    } else if (editor?.mode === 'edit' && !exists(editor.groupId)) {
      setEditor(null);
    }
  }, [room, editor, groups.groups, groups.loading, showToast]);

  // Biri kodumu okutup arkadaş olunca ekleme ekranı bunu gösterir.
  const [arrived, setArrived] = useState<string | null>(null);
  const arrival = friends.arrival;
  useEffect(() => {
    if (arrival && adding) setArrived(arrival.name);
  }, [arrival, adding]);

  const [refreshing, setRefreshing] = useState(false);
  async function refresh() {
    setRefreshing(true);
    await Promise.all([reloadFriends(), reloadGroups()]);
    setRefreshing(false);
  }

  useEffect(() => setTabFocused(focused), [focused, setTabFocused]);
  useEffect(() => setAddingFriend(adding), [adding, setAddingFriend]);

  // Görünen grup odası okunmuş sayılır ve bildirimi gösterilmez.
  const activeGroupId = room?.kind === 'group' && focused ? room.groupId : null;
  useEffect(() => {
    setActiveRoom(activeGroupId);
    return () => setActiveRoom(null);
  }, [activeGroupId, setActiveRoom]);

  // Bildirime dokunulunca ilgili yere git. Grup henüz listede yoksa gelene kadar bekle.
  const [pendingRoom, setPendingRoom] = useState<string | null>(null);
  useEffect(() => {
    if (!intent) return;
    clearIntent();
    setAdding(false);
    if (intent.kind === 'friend') {
      setSub('kisiler');
      setOpenFriendId(intent.friendId);
      void reloadFriends();
    } else {
      setSub('odalar');
      setRoom(null);
      if (intent.kind === 'group') setPendingRoom(intent.groupId);
      void reloadGroups();
    }
  }, [intent, clearIntent, reloadFriends, reloadGroups]);
  useEffect(() => {
    if (pendingRoom && groups.groups.some((g) => g.id === pendingRoom)) {
      setRoom({ kind: 'group', groupId: pendingRoom });
      setPendingRoom(null);
    }
  }, [pendingRoom, groups.groups]);

  async function changeRel(friend: Friend, to: RelType) {
    const from = friend.rel;
    const ok = await friends.setRel(friend.id, to);
    if (ok && isRomanticTransition(from, to)) setTransition({ friend, from, to });
    return ok;
  }

  async function removeFriend(friend: Friend) {
    const ok = await friends.remove(friend.id);
    if (ok) {
      setOpenFriendId(null);
      toast.show(`${friend.name} arkadaşlıktan çıkarıldı`);
    }
    return ok;
  }

  async function openEditor(g: Group | null) {
    if (!g) return setEditor({ mode: 'new' });
    const members = await fetchMembers(g.id);
    setEditor({ mode: 'edit', groupId: g.id, others: members.filter((m) => m.id !== userId) });
  }

  const editing = editor?.mode === 'edit' ? (groups.groups.find((g) => g.id === editor.groupId) ?? null) : null;

  const people: Person[] = useMemo(() => {
    const list: Person[] = friends.friends.map((f) => ({ id: f.id, name: f.name }));
    if (editor?.mode === 'edit') {
      for (const m of editor.others) if (!list.some((p) => p.id === m.id)) list.push({ id: m.id, name: m.name });
    }
    return list;
  }, [friends.friends, editor]);

  async function saveGroup(name: string, ids: string[]) {
    if (!userId) return false;
    if (editor?.mode === 'edit' && editing) {
      const ok = await groups.update(editing, name, [userId, ...ids]);
      if (ok) {
        setEditor(null);
        toast.show('Grup güncellendi');
      }
      return ok;
    }
    const id = await groups.create(name, ids);
    if (!id) return false;
    setEditor(null);
    toast.show('Grup oluşturuldu');
    return true;
  }

  async function deleteGroup() {
    if (!editing) return false;
    ignoreRemoval(editing.id);
    const ok = await groups.remove(editing.id);
    if (ok) {
      setEditor(null);
      setRoom(null);
      setSub('odalar');
      toast.show('Grup silindi');
    }
    return ok;
  }

  const groupMap = useMemo(
    () => [
      { id: 'me', name: 'Sen', sun: mySun, me: true },
      ...friends.friends.map((f) => ({ id: f.id, name: f.name, sun: f.sun })),
    ],
    [mySun, friends.friends],
  );

  const roomNode =
    room && userId ? (
      room.kind === 'event' && event ? (
        <RoomView
          key="event"
          roomId={eventRoomId(event.date)}
          title="Olay odası"
          right={{ kind: 'text', text: 'Herkese açık' }}
          group={false}
          userId={userId}
          intro="Oda açıldı. Bu ay neyi bırakmak istiyorsun?"
          onBack={() => setRoom(null)}
        />
      ) : group ? (
        <RoomView
          key={group.id}
          roomId={group.id}
          title={group.name}
          right={{ kind: 'edit', onPress: () => void openEditor(group) }}
          group
          userId={userId}
          showMembers
          onMembersChanged={reloadGroups}
          onBack={() => {
            setRoom(null);
            reloadGroups();
          }}
        />
      ) : null
    ) : null;

  return (
    <View style={styles.root}>
      {roomNode ?? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.fg} colors={[colors.fg]} />}
        >
          <View style={styles.tabs} accessibilityRole="tablist">
            {SUBS.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setSub(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: sub === key }}
                style={styles.tab}
              >
                <Text style={[styles.tabText, sub === key && styles.tabTextOn]}>{label.toLocaleUpperCase('tr')}</Text>
                {sub === key && <View style={styles.tabLine} />}
              </Pressable>
            ))}
          </View>

          {sub === 'kisiler' && (
            <PeopleTab
              friends={friends.friends}
              loading={friends.loading}
              error={friends.error}
              onRetry={friends.reload}
              onAdd={() => {
                setArrived(null);
                setAdding(true);
              }}
              onOpen={(f) => setOpenFriendId(f.id)}
            />
          )}
          {sub === 'odalar' && (
            <RoomsTab
              event={event}
              eventOpen={eventOpen}
              now={now}
              groups={groups.groups}
              last={groups.last}
              unread={notif.unreadRooms}
              loading={groups.loading}
              error={groups.error}
              onRetry={groups.reload}
              onOpenEvent={() => setRoom({ kind: 'event' })}
              onLockedEvent={() => toast.show('Oda olay günü açılır')}
              onOpenGroup={(g) => setRoom({ kind: 'group', groupId: g.id })}
              onNewGroup={() => void openEditor(null)}
            />
          )}
          {sub === 'grup' && <GroupMapTab people={groupMap} />}
        </ScrollView>
      )}

      <AddFriend
        visible={adding}
        handle={profile?.handle ?? ''}
        arrived={arrived}
        onClose={() => {
          if (arrived) setSub('kisiler');
          setAdding(false);
        }}
        onAdded={() => {
          setSub('kisiler');
          void friends.reload();
        }}
      />
      <FriendSheet
        friend={transition ? null : openFriend}
        today={today}
        myChart={myChart}
        onClose={() => setOpenFriendId(null)}
        onRelChange={changeRel}
        onRemove={removeFriend}
      />
      {transition && (
        <TransitionCard
          friend={transition.friend}
          from={transition.from}
          to={transition.to}
          mySun={mySun}
          onClose={() => setTransition(null)}
        />
      )}
      <GroupEditor
        visible={editor !== null}
        group={
          editing && userId
            ? {
                id: editing.id,
                name: editing.name,
                memberIds: editing.memberIds.filter((id) => id !== userId),
                canDelete: editing.owner === userId,
              }
            : null
        }
        people={people}
        onClose={() => setEditor(null)}
        onSave={saveGroup}
        onDelete={deleteGroup}
      />
      {toast.node}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingBottom: 32 },
  tabs: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  tab: { paddingTop: 10, paddingBottom: 11 },
  tabText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.faint },
  tabTextOn: { color: colors.fg },
  tabLine: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 1, backgroundColor: colors.fg },
});
