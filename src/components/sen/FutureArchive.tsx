import { useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '@/components/AppModal';
import { SongArt } from '@/components/music/SongArt';
import { SongLinks } from '@/components/music/SongLinks';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import { useAuth } from '@/lib/auth';
import { up, weekLabel, weekStartKey } from '@/lib/bottle';
import { formatDayMonth, fromDateKey, monthName } from '@/lib/date';
import { useSongDays, weekSong } from '@/lib/songs';
import type { Song, SongDay } from '@/lib/songs';
import { groupByMonth } from '@/lib/future-archive';
import type { ArchivedMessage, CalendarMonth, FutureArchive as Archive } from '@/lib/future-archive';
import { colors, fonts, layout } from '@/theme';
import { useFrameWidth } from '@/lib/use-frame-width';

type Props = { visible: boolean; onClose: () => void; archive: Archive };

const CELL = 44;

/** Bir günün story sayfası: o günün şarkısı ya da teslim edilen bir mesaj. */
type Page = { kind: 'song'; id: string; song: Song; date: Date } | { kind: 'msg'; id: string; m: ArchivedMessage };

/** Haftalara göre "haftanın şarkısı" (her hafta o haftanın şarkılarından sistemin seçtiği), en yeni önce. */
function weeklyPicks(days: readonly SongDay[]): { weekStart: string; pick: SongDay }[] {
  const byWeek = new Map<string, SongDay[]>();
  for (const d of days) {
    const w = weekStartKey(d.date);
    byWeek.set(w, [...(byWeek.get(w) ?? []), d]);
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .flatMap(([weekStart, list]) => {
      const pick = weekSong(weekStart, list);
      return pick ? [{ weekStart, pick }] : [];
    });
}

/**
 * Arşiv: aylara ayrılmış takvim. Mesajın teslim edildiği günler dolu siyah daire, günlüğe şarkı
 * eklenen günler o şarkının kapağı. Üstte her haftanın şarkısı bir raf gibi dizilir.
 */
export function FutureArchive({ visible, onClose, archive }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const songDays = useSongDays(profile?.id, visible);
  const [openDay, setOpenDay] = useState<{ year: number; month: number; day: number } | null>(null);
  const months = groupByMonth(archive.messages, songDays);
  const shelf = weeklyPicks(songDays);

  const { reload } = archive;
  useEffect(() => {
    if (visible) void reload();
  }, [visible, reload]);

  // Açık günün sayfaları canlı listeden okunur; mesaj silinince kendiliğinden güncellenir.
  const openMonth = openDay ? months.find((m) => m.year === openDay.year && m.month === openDay.month) : undefined;
  const daySong = openDay ? openMonth?.songs.get(openDay.day) : undefined;
  const pages: Page[] = openDay
    ? [
        ...(daySong
          ? [{ kind: 'song' as const, id: `song-${openDay.day}`, song: daySong, date: new Date(openDay.year, openDay.month, openDay.day) }]
          : []),
        ...(openMonth?.byDay.get(openDay.day) ?? []).map((m) => ({ kind: 'msg' as const, id: m.id, m })),
      ]
    : [];
  useEffect(() => {
    if (openDay && pages.length === 0) setOpenDay(null);
  }, [openDay, pages.length]);

  function openDate(key: string) {
    const d = fromDateKey(key);
    setOpenDay({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
  }

  return (
    <AppModal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 14 }]}>
        <View style={styles.head}>
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.link}>{`← ${t('common.back')}`.toLocaleUpperCase(locale())}</Text>
          </Pressable>
          <Text style={styles.title}>{t('archive.title')}</Text>
          <View style={styles.headSide} />
        </View>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          {archive.error ? (
            <Text style={styles.empty}>{t('archive.loadError')}</Text>
          ) : !archive.loading && months.length === 0 ? (
            <Text style={styles.empty}>{t('archive.empty')}</Text>
          ) : (
            <>
              {shelf.length > 0 && (
                <View style={styles.shelfWrap}>
                  <Text style={styles.shelfLbl}>{t('music.shelf')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
                    {shelf.map(({ weekStart, pick }) => (
                      <Pressable
                        key={weekStart}
                        onPress={() => openDate(pick.date)}
                        accessibilityRole="button"
                        accessibilityLabel={`${weekLabel(weekStart)}: ${pick.song.title}, ${pick.song.artist}`}
                        style={styles.record}
                      >
                        <SongArt song={pick.song} size={118} />
                        <Text style={styles.recordWeek}>{up(weekLabel(weekStart))}</Text>
                        <Text style={styles.recordTitle} numberOfLines={1}>
                          {pick.song.title}
                        </Text>
                        <Text style={styles.recordArtist} numberOfLines={1}>
                          {pick.song.artist}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              {months.map((m) => (
                <MonthGrid
                  key={`${m.year}-${m.month}`}
                  month={m}
                  onPick={(day) => setOpenDay({ year: m.year, month: m.month, day })}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>
      <MessageStory
        messages={pages}
        onClose={() => setOpenDay(null)}
        onDelete={(m) => archive.remove(m)}
      />
    </AppModal>
  );
}

function MonthGrid({ month, onPick }: { month: CalendarMonth; onPick: (day: number) => void }) {
  const { t } = useTranslation();
  const dows = (t('date.dowShort', { returnObjects: true }) as unknown as string[]);
  // Hafta Pazartesi'den başlar: Pzt..Cmt, Paz.
  const header = [1, 2, 3, 4, 5, 6, 0].map((i) => dows[i]);
  const cells: (number | null)[] = [
    ...Array.from({ length: month.lead }, () => null),
    ...Array.from({ length: month.daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  return (
    <View style={styles.month}>
      <Text style={styles.monthTitle}>
        {t('date.monthYear', { month: monthName(new Date(month.year, month.month, 1)), year: month.year })}
      </Text>
      <View style={styles.row}>
        {header.map((h) => (
          <Text key={h} style={styles.dow}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((day, c) => {
            if (day === null) return <View key={c} style={styles.cell} />;
            const has = month.byDay.has(day);
            const song = month.songs.get(day);
            const label = formatDayMonth(new Date(month.year, month.month, day));
            if (song && !has) {
              return (
                <Pressable
                  key={c}
                  onPress={() => onPick(day)}
                  accessibilityRole="button"
                  accessibilityLabel={t('archive.songDayA11y', { date: label, title: song.title })}
                  style={styles.cell}
                >
                  <View style={styles.songCell}>
                    <SongArt song={song} size={36} round style={styles.songArt} />
                    <View style={styles.songShade} />
                    <Text style={styles.dotText}>{day}</Text>
                  </View>
                </Pressable>
              );
            }
            return has ? (
              <Pressable
                key={c}
                onPress={() => onPick(day)}
                accessibilityRole="button"
                accessibilityLabel={t('archive.dayA11y', { date: label })}
                style={styles.cell}
              >
                <View style={styles.dot}>
                  <Text style={styles.dotText}>{day}</Text>
                  {song && <Text style={styles.note8}>♪</Text>}
                </View>
              </Pressable>
            ) : (
              <View key={c} style={styles.cell}>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Bir günün şarkısı ve mesajları tam ekran: yatay kaydırma, üstte ilerleme çizgileri, mesajda Sil. */
function MessageStory({
  messages,
  onClose,
  onDelete,
}: {
  messages: Page[];
  onClose: () => void;
  onDelete: (m: ArchivedMessage) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const width = useFrameWidth();
  const scroll = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const visible = messages.length > 0;
  const current = messages[Math.min(index, messages.length - 1)];

  useEffect(() => {
    if (visible) return;
    setIndex(0);
    setConfirming(false);
    setFailed(false);
  }, [visible]);

  // Bir mesaj silinince dizin sınırın içinde kalsın.
  useEffect(() => {
    if (index > 0 && index >= messages.length) {
      const next = messages.length - 1;
      setIndex(next);
      scroll.current?.scrollTo({ x: next * width, animated: false });
    }
  }, [messages.length, index, width]);

  function settleAt(i: number) {
    if (i === index) return;
    setIndex(i);
    setConfirming(false);
    setFailed(false);
  }

  function onSettle(e: NativeSyntheticEvent<NativeScrollEvent>) {
    settleAt(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  // Webde fareyle kaydırılamaz: Instagram'daki gibi sola/sağa dokunarak geçilir.
  function step(dir: -1 | 1) {
    const next = Math.max(0, Math.min(messages.length - 1, index + dir));
    scroll.current?.scrollTo({ x: next * width, animated: true });
    settleAt(next);
  }

  async function confirmDelete() {
    if (!current || current.kind !== 'msg') return;
    setBusy(true);
    setFailed(false);
    const ok = await onDelete(current.m);
    setBusy(false);
    if (ok) setConfirming(false);
    else setFailed(true);
  }

  return (
    <AppModal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.storyRoot, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.bars}>
          {messages.map((m, i) => (
            <View key={m.id} style={[styles.bar, i <= index && styles.barOn]} />
          ))}
        </View>
        <View style={styles.storyHead}>
          <Text style={styles.label}>
            {!current
              ? ''
              : current.kind === 'song'
                ? t('archive.songOn', { date: up(formatDayMonth(current.date)) })
                : t('archive.writtenOn', {
                    day: current.m.createdAt.getDate(),
                    month: t(`date.monthLocative.${current.m.createdAt.getMonth()}`),
                  })}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12}>
            <Text style={styles.label}>✕</Text>
          </Pressable>
        </View>
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onSettle}
          style={styles.pager}
        >
          {messages.map((p) =>
            p.kind === 'song' ? (
              <View key={p.id} style={[styles.songPage, { width }]}>
                <SongArt song={p.song} size={Math.min(250, width - 100)} />
                <Text style={styles.songTitle}>{p.song.title}</Text>
                <Text style={styles.label}>{up(p.song.artist)}</Text>
                <SongLinks song={p.song} style={styles.songLinks} />
              </View>
            ) : (
              <ScrollView key={p.id} style={{ width }} contentContainerStyle={styles.page}>
                <Text style={styles.body}>{p.m.body}</Text>
              </ScrollView>
            ),
          )}
        </ScrollView>
        {Platform.OS === 'web' && messages.length > 1 && (
          <View style={styles.tapZones} pointerEvents="box-none">
            <Pressable style={styles.tapZone} onPress={() => step(-1)} accessibilityRole="button" accessibilityLabel={t('archive.prev')} />
            <Pressable style={styles.tapZone} onPress={() => step(1)} accessibilityRole="button" accessibilityLabel={t('archive.next')} />
          </View>
        )}
        <View style={styles.foot}>
          {failed && <Text style={styles.note}>{t('archive.deleteFailed')}</Text>}
          {current?.kind === 'song' ? (
            <Text style={styles.note}>{t('archive.songNote')}</Text>
          ) : confirming ? (
            <>
              <Text style={styles.note}>{t('archive.deleteAsk')}</Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirming(false)} disabled={busy} accessibilityRole="button" hitSlop={10}>
                  <Text style={styles.action}>{t('future.discard')}</Text>
                </Pressable>
                <Pressable onPress={confirmDelete} disabled={busy} accessibilityRole="button" hitSlop={10}>
                  <Text style={[styles.action, busy && styles.off]}>{t('archive.delete').toLocaleUpperCase(locale())}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable onPress={() => setConfirming(true)} accessibilityRole="button" hitSlop={10} style={styles.deleteBtn}>
              <Text style={styles.action}>{t('archive.delete').toLocaleUpperCase(locale())}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 14,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  headSide: { width: 60 },
  link: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: colors.fg, width: 60 },
  title: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 30, paddingBottom: 4, color: colors.fg },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 12 },
  empty: { fontSize: 14, lineHeight: 22, color: colors.body, textAlign: 'center', paddingTop: 80 },
  month: { marginTop: 22 },
  monthTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, paddingBottom: 6, color: colors.fg, marginBottom: 6 },
  row: { flexDirection: 'row' },
  dow: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 8.5,
    letterSpacing: 0.6,
    color: colors.faint,
    paddingBottom: 6,
  },
  cell: { flex: 1, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, color: colors.faint },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 14, color: colors.white },

  storyRoot: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: layout.screenPadding },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 2, backgroundColor: colors.line },
  barOn: { backgroundColor: colors.black },
  storyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  label: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute },
  pager: { flex: 1, marginHorizontal: -layout.screenPadding },
  tapZones: { position: 'absolute', top: 80, bottom: 120, left: 0, right: 0, flexDirection: 'row' },
  tapZone: { flex: 1 },
  page: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: layout.screenPadding, paddingVertical: 30 },
  body: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 34, paddingBottom: 10, color: colors.fg },
  foot: { alignItems: 'center', gap: 12, minHeight: 56, justifyContent: 'flex-end' },
  note: { fontSize: 13, lineHeight: 19, color: colors.body, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  deleteBtn: { paddingVertical: 8 },
  songPage: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.screenPadding, gap: 6 },
  songTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 36, color: colors.fg, textAlign: 'center', marginTop: 22 },
  songLinks: { marginTop: 18 },
  songCell: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  songArt: { position: 'absolute', top: 0, left: 0 },
  songShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.backdropStrong },
  note8: { position: 'absolute', right: 5, top: 1, fontSize: 8, color: colors.white },
  shelfWrap: { marginTop: 18, marginHorizontal: -layout.screenPadding, paddingBottom: 8, borderBottomWidth: layout.hairline, borderBottomColor: colors.line },
  shelfLbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute, paddingHorizontal: layout.screenPadding, marginBottom: 12 },
  shelf: { paddingHorizontal: layout.screenPadding, gap: 16, paddingBottom: 14 },
  record: { width: 118 },
  recordWeek: { fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: 1, color: colors.mute, marginTop: 10 },
  recordTitle: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 20, color: colors.fg, marginTop: 4 },
  recordArtist: { fontSize: 12, color: colors.body },
  action: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.5, color: colors.fg },
  off: { color: colors.faint },
});
