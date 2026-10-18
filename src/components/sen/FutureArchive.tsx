import { useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import { formatDayMonth, monthName } from '@/lib/date';
import { groupByMonth } from '@/lib/future-archive';
import type { ArchivedMessage, CalendarMonth, FutureArchive as Archive } from '@/lib/future-archive';
import { colors, fonts, layout } from '@/theme';
import { useFrameWidth } from '@/lib/use-frame-width';

type Props = { visible: boolean; onClose: () => void; archive: Archive };

const CELL = 44;

/** Mesaj arşivi: aylara ayrılmış takvim; mesajın teslim edildiği günler dolu siyah daire. */
export function FutureArchive({ visible, onClose, archive }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [openDay, setOpenDay] = useState<{ year: number; month: number; day: number } | null>(null);
  const months = groupByMonth(archive.messages);

  const { reload } = archive;
  useEffect(() => {
    if (visible) void reload();
  }, [visible, reload]);

  // Açık günün mesajları canlı listeden okunur; silince kendiliğinden güncellenir.
  const dayMessages = openDay
    ? (months.find((m) => m.year === openDay.year && m.month === openDay.month)?.byDay.get(openDay.day) ?? [])
    : [];
  useEffect(() => {
    if (openDay && dayMessages.length === 0) setOpenDay(null);
  }, [openDay, dayMessages.length]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
            months.map((m) => (
              <MonthGrid key={`${m.year}-${m.month}`} month={m} onPick={(day) => setOpenDay({ year: m.year, month: m.month, day })} />
            ))
          )}
        </ScrollView>
      </View>
      <MessageStory
        messages={dayMessages}
        onClose={() => setOpenDay(null)}
        onDelete={(m) => archive.remove(m)}
      />
    </Modal>
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
            const label = formatDayMonth(new Date(month.year, month.month, day));
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

/** Bir günün mesajları tam ekran: yatay kaydırma, üstte ilerleme çizgileri, altta Sil. */
function MessageStory({
  messages,
  onClose,
  onDelete,
}: {
  messages: ArchivedMessage[];
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

  function onSettle(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    setConfirming(false);
    setFailed(false);
  }

  async function confirmDelete() {
    if (!current) return;
    setBusy(true);
    setFailed(false);
    const ok = await onDelete(current);
    setBusy(false);
    if (ok) setConfirming(false);
    else setFailed(true);
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.storyRoot, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.bars}>
          {messages.map((m, i) => (
            <View key={m.id} style={[styles.bar, i <= index && styles.barOn]} />
          ))}
        </View>
        <View style={styles.storyHead}>
          <Text style={styles.label}>
            {current
              ? t('archive.writtenOn', {
                  day: current.createdAt.getDate(),
                  month: t(`date.monthLocative.${current.createdAt.getMonth()}`),
                })
              : ''}
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
          {messages.map((m) => (
            <ScrollView key={m.id} style={{ width }} contentContainerStyle={styles.page}>
              <Text style={styles.body}>{m.body}</Text>
            </ScrollView>
          ))}
        </ScrollView>
        <View style={styles.foot}>
          {failed && <Text style={styles.note}>{t('archive.deleteFailed')}</Text>}
          {confirming ? (
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
    </Modal>
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
  page: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: layout.screenPadding, paddingVertical: 30 },
  body: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 34, paddingBottom: 10, color: colors.fg },
  foot: { alignItems: 'center', gap: 12, minHeight: 56, justifyContent: 'flex-end' },
  note: { fontSize: 13, lineHeight: 19, color: colors.body, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  deleteBtn: { paddingVertical: 8 },
  action: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.5, color: colors.fg },
  off: { color: colors.faint },
});
