import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BOTTLE_TILT, Bottle } from '@/components/gunluk/Bottle';
import type { BottleHandle } from '@/components/gunluk/Bottle';
import { MoodForm } from '@/components/gunluk/MoodForm';
import { Spray } from '@/components/gunluk/Spray';
import { StorySheet } from '@/components/gunluk/StorySheet';
import { WeekSummary } from '@/components/gunluk/WeekSummary';
import { Wrapped } from '@/components/gunluk/Wrapped';
import { Label, LinkText, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth';
import {
  BOTTLE,
  eveningCountdown,
  isEvening,
  isSunday,
  low,
  moodLabel,
  monthName,
  monthSlides,
  orbsFor,
  up,
  weekData,
  weekInsights,
  weekKeys,
  weekLabel,
} from '@/lib/bottle';
import type { MoodEntry, WeekData } from '@/lib/bottle';
import { formatTopDate, fromDateKey } from '@/lib/date';
import { moonSignOf, useBottleArchive, useClosedWeeks, useMoods, useOpenedWeeks } from '@/lib/moods';
import { useReminders } from '@/lib/reminders';
import { useSavedList } from '@/lib/saved';
import { useSettings } from '@/lib/settings';
import { useCardMap } from '@/lib/tarot';
import { useToday } from '@/lib/today';
import { colors, fonts, layout } from '@/theme';

const { width: BW, height: BH, mouth: MOUTH } = BOTTLE;
/** Şişe düğmesi bölümün sağ üstünde durur (prototipteki .bottlebtn). */
const BOTTLE_RIGHT = 26;
const BOTTLE_TOP = 110;

/** Demo patlamada şişeyi dolduran yedi sahte gün. */
const DEMO_KEYS = Array.from({ length: 7 }, (_, i) => `demo-${i}`);

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Şişe ağzının bölüm içindeki konumu: şişe merkezinden eğim kadar döndürülür. */
function mouthInSection(sectionWidth: number) {
  const a = (BOTTLE_TILT * Math.PI) / 180;
  const vx = MOUTH[0] - BW / 2;
  const vy = MOUTH[1] - BH / 2;
  return {
    x: sectionWidth - BOTTLE_RIGHT - BW + BW / 2 + vx * Math.cos(a) - vy * Math.sin(a),
    y: BOTTLE_TOP + BH / 2 + vx * Math.sin(a) + vy * Math.cos(a),
  };
}

export default function GunlukScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { profile } = useAuth();
  const userId = profile?.id;
  const name = profile?.name ?? '';
  const { today, select, openDeep } = useToday();
  const { eveningTime } = useSettings();
  const { moods, loading, error, reload, save } = useMoods(userId);
  const archive = useBottleArchive(userId);
  const openedWeeks = useOpenedWeeks(userId);
  const closedWeeks = useClosedWeeks(userId);
  const saved = useSavedList(userId);
  const { noteMoodSaved } = useReminders();

  const [now, setNow] = useState(() => new Date());
  const [demoEve, setDemoEve] = useState(false);
  const [spray, setSpray] = useState<{ x: number; y: number } | null>(null);
  const [story, setStory] = useState<WeekData | null>(null);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Patlamayı tekrar izlemek için şişeyi baştan kurar. */
  const [bottleRun, setBottleRun] = useState(0);

  const scroll = useRef<ScrollView>(null);
  const bottle = useRef<BottleHandle>(null);
  const bottleY = useRef(0);
  const summaryY = useRef(0);
  const sectionW = useRef(0);
  const busy = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const days = useMemo(() => weekKeys(today), [today]);
  const weekStart = days[0];
  const filledDays = useMemo(() => days.filter((k) => moods[k]), [days, moods]);
  const todayDone = !!moods[today];
  const sunday = isSunday(today);
  const opened = openedWeeks.weeks.includes(weekStart);
  /** "Yeni şişeye geç" ile kapatılan hafta: özet gizlenir, boş yeni şişe görünür. */
  const closed = closedWeeks.weeks.includes(weekStart);
  const summaryOpen = opened && !closed;
  /** Demo: derste göstermek için şişe sahte bir haftayla dolar ve hemen patlar. */
  const [demoPop, setDemoPop] = useState(false);
  const orbs = useMemo(
    () => orbsFor(demoPop ? DEMO_KEYS : closed ? [] : filledDays),
    [demoPop, closed, filledDays],
  );
  const evening = demoEve || isEvening(now, eveningTime);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const current = useMemo(() => weekData(weekStart, days, moods), [weekStart, days, moods, lang]);

  const tarot = useCardMap(userId, summaryOpen || wrappedOpen);
  const insights = useMemo(
    () => (summaryOpen ? weekInsights(filledDays, moods, tarot, moonSignOf) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summaryOpen, filledDays, moods, tarot, lang],
  );
  const slides = useMemo(
    () => (wrappedOpen ? monthSlides(fromDateKey(today), moods, tarot, moonSignOf, name) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wrappedOpen, today, moods, tarot, name, lang],
  );
  const archived = archive.list.some((a) => a.weekStart === weekStart);

  async function popBottle() {
    if (busy.current || !bottle.current) return;
    busy.current = true;
    await bottle.current.pop(() => setSpray(mouthInSection(sectionW.current)));
    setSpray(null);
    openedWeeks.mark(weekStart, true);
    busy.current = false;
    await wait(120);
    scroll.current?.scrollTo({ y: Math.max(0, summaryY.current - 6), animated: true });
  }

  async function onSaveMood(entry: MoodEntry) {
    const key = today;
    const sundayNow = sunday;
    bottle.current?.arm(key);
    if (!(await save(key, entry))) {
      bottle.current?.disarm();
      return false;
    }
    noteMoodSaved();
    busy.current = true;
    // Form kalkıp yerine "Bugün şişende." gelince şişenin yeri değişir.
    await wait(120);
    scroll.current?.scrollTo({ y: Math.max(0, bottleY.current - 120), animated: true });
    await bottle.current?.drop();
    busy.current = false;
    if (sundayNow) {
      await wait(900);
      await popBottle();
    } else {
      showToast(t('gunluk.toastIn'));
    }
    return true;
  }

  async function onSaveBottle() {
    if (await archive.add(weekStart, current)) showToast(t('gunluk.toastArchived'));
    else showToast(t('gunluk.toastFailed'));
  }

  async function replay() {
    openedWeeks.mark(weekStart, false);
    setBottleRun((n) => n + 1);
    await wait(500);
    scroll.current?.scrollTo({ y: Math.max(0, bottleY.current - 120), animated: true });
    await wait(700);
    await popBottle();
  }

  /** Hafta ya da gün beklemeden patlamayı gösterir; kayıtlara ve haftanın durumuna dokunmaz. */
  async function demoBurst() {
    if (busy.current) return;
    busy.current = true;
    setDemoPop(true);
    await wait(150);
    scroll.current?.scrollTo({ y: Math.max(0, bottleY.current - 120), animated: true });
    await wait(1100);
    await bottle.current?.pop(() => setSpray(mouthInSection(sectionW.current)));
    setSpray(null);
    setDemoPop(false);
    setBottleRun((n) => n + 1);
    busy.current = false;
  }

  /** Bu haftanın özetini kapatır; boş yeni şişe görünür ve hafta kapandı olarak işaretlenir. */
  async function startNewBottle() {
    closedWeeks.mark(weekStart, true);
    await wait(150);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  function onBottlePress() {
    if (busy.current) return;
    if (closed) showToast(t('gunluk.toastNewBottle'));
    else if (sunday && todayDone) popBottle();
    else showToast(sunday ? t('gunluk.toastSundayWait') : t('gunluk.toastSundayOnly'));
  }

  function openSaved(key: string) {
    select(key);
    openDeep();
    router.navigate('/');
  }

  const countdown = eveningCountdown(now, eveningTime);

  return (
    <View style={styles.root}>
      <ScrollView ref={scroll} style={styles.root} contentContainerStyle={styles.content}>
        {loading ? (
          <Section>
            <Label>{t('gunluk.today')}</Label>
            <Text style={styles.body}>{t('common.loading')}</Text>
          </Section>
        ) : error ? (
          <Section>
            <Label>{t('gunluk.today')}</Label>
            <Text style={styles.body}>{t('gunluk.loadError')}</Text>
            <LinkText onPress={reload} accessibilityRole="button" style={styles.retry}>
              {t('common.retry')}
            </LinkText>
          </Section>
        ) : !todayDone ? (
          evening ? (
            <MoodForm dateLabel={formatTopDate(now)} onSave={onSaveMood} />
          ) : (
            <Section style={styles.center}>
              <Label>{t('gunluk.today')}</Label>
              <Text style={[styles.h1, styles.centerText]}>{t('gunluk.comeBack', { time: eveningTime })}</Text>
              {!!countdown && <Text style={styles.count}>{t('gunluk.countdown', { time: countdown })}</Text>}
              {__DEV__ && (
                <LinkText onPress={() => setDemoEve(true)} accessibilityRole="button" style={styles.demo}>
                  {t('gunluk.tryNow')}
                </LinkText>
              )}
            </Section>
          )
        ) : closed ? (
          <Section style={styles.center}>
            <Label>{t('gunluk.today')}</Label>
            <Text style={[styles.h1, styles.centerText]}>{t('gunluk.newBottleTitle')}</Text>
            <Text style={[styles.body, styles.mute, styles.centerText, styles.doneNote]}>
              {t('gunluk.newBottleNote')}
            </Text>
          </Section>
        ) : !opened ? (
          <Section style={styles.center}>
            <Label>{t('gunluk.today')}</Label>
            <Text style={[styles.h1, styles.centerText]}>{t('gunluk.inBottle')}</Text>
            <Text style={[styles.body, styles.mute, styles.centerText, styles.doneNote]}>
              {sunday ? t('gunluk.full') : t('gunluk.tomorrow', { time: eveningTime })}
            </Text>
          </Section>
        ) : null}

        {!loading && !error && summaryOpen ? (
          <View onLayout={(e) => (summaryY.current = e.nativeEvent.layout.y)}>
            <WeekSummary
              data={current}
              name={name}
              days={days}
              moods={moods}
              insights={insights}
              saved={archived}
              onShare={() => setStory(current)}
              onSave={onSaveBottle}
              onReplay={replay}
              onNewBottle={startNewBottle}
            />
          </View>
        ) : (
          <View
            style={styles.bsec}
            onLayout={(e) => {
              sectionW.current = e.nativeEvent.layout.width;
              bottleY.current = e.nativeEvent.layout.y;
            }}
          >
            <Text style={[styles.lbl, styles.above]}>{t('gunluk.daysFilled', { n: closed ? 0 : filledDays.length })}</Text>
            <Text style={[styles.bt, styles.above]}>{t('gunluk.bottleTitle')}</Text>
            <Pressable
              style={styles.bottleBtn}
              onPress={onBottlePress}
              accessibilityRole="button"
              accessibilityLabel={t('gunluk.bottleLabel')}
            >
              <Bottle key={bottleRun} ref={bottle} orbs={orbs} />
            </Pressable>
            <View style={[styles.bmeta, styles.above]}>
              <Text style={styles.mono}>
                {closed
                  ? t('gunluk.bottleNew')
                  : sunday
                    ? todayDone
                      ? t('gunluk.bottleFull')
                      : t('gunluk.bottleTonight')
                    : t('gunluk.bottleOpensSunday')}
              </Text>
              <Text style={[styles.mono, styles.mute]}>
                {closed
                  ? t('gunluk.bottleNewSub')
                  : sunday
                    ? todayDone
                      ? t('gunluk.bottleTapOpen')
                      : t('gunluk.bottleAddToday')
                    : t('gunluk.daysLeft', { n: 7 - filledDays.length })}
              </Text>
              <Pressable onPress={demoBurst} accessibilityRole="button" hitSlop={10} style={styles.demoBtn}>
                <Text style={styles.demoText}>{t('gunluk.demoPop')}</Text>
              </Pressable>
            </View>
            {spray && <Spray x={spray.x} y={spray.y} />}
          </View>
        )}

        {archive.list.length > 0 && (
          <Section>
            <Label>{t('gunluk.archive')}</Label>
            {archive.list.map((a) => (
              <Pressable
                key={a.weekStart}
                style={styles.li}
                onPress={() => setStory({ ...a.summary, label: weekLabel(a.weekStart) })}
                accessibilityRole="button"
              >
                <View style={styles.grow}>
                  <Text style={[styles.mono, styles.mute]}>{up(weekLabel(a.weekStart))}</Text>
                  <Text style={styles.liTitle}>{t('gunluk.archiveMood', { mood: low(moodLabel(a.summary.best)) })}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </Pressable>
            ))}
          </Section>
        )}

        <Section>
          <Label>{t('gunluk.savedTitle')}</Label>
          {saved.length > 0 ? (
            saved.map((s) => (
              <Pressable key={s.key} style={styles.li} onPress={() => openSaved(s.key)} accessibilityRole="button">
                <View style={styles.grow}>
                  <Text style={[styles.mono, styles.mute]}>{formatTopDate(fromDateKey(s.key))}</Text>
                  <Text style={styles.liTitle}>{s.h}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.body, styles.mute]}>{t('gunluk.savedEmpty')}</Text>
          )}
        </Section>

        <Section last>
          <Pressable style={styles.room} onPress={() => setWrappedOpen(true)} accessibilityRole="button">
            <Text style={[styles.mono, styles.onDark]}>{t('gunluk.monthly')}</Text>
            <Text style={styles.roomTitle}>{t('gunluk.monthReady', { month: monthName(fromDateKey(today)) })}</Text>
            <Text style={[styles.mono, styles.onDark, styles.roomOpen]}>{t('gunluk.open')}</Text>
          </Pressable>
        </Section>
      </ScrollView>

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <StorySheet data={story} name={name} onClose={() => setStory(null)} />
      <Wrapped
        visible={wrappedOpen}
        month={monthName(fromDateKey(today))}
        name={name}
        slides={slides}
        onClose={() => setWrappedOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1 },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, letterSpacing: -0.34, color: colors.fg },
  body: { fontSize: 14, lineHeight: 22.7, color: colors.body },
  mute: { color: colors.body },
  doneNote: { marginTop: 10 },
  count: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.mute,
    marginTop: 14,
    fontVariant: ['tabular-nums'],
  },
  demo: { marginTop: 18, color: colors.faint },
  retry: { marginTop: 14 },
  mono: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },

  // Şişe bölümü (prototipteki .bsec)
  bsec: {
    height: 520,
    paddingVertical: 28,
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
    overflow: 'visible',
    zIndex: 5,
  },
  above: { zIndex: 2 },
  bt: {
    position: 'absolute',
    left: layout.screenPadding,
    top: 78,
    fontFamily: fonts.serif,
    fontSize: 50,
    lineHeight: 66,
    letterSpacing: 0.5,
    color: colors.fg,
  },
  bottleBtn: { position: 'absolute', zIndex: 3, right: BOTTLE_RIGHT, top: BOTTLE_TOP, width: BW, height: BH },
  bmeta: { position: 'absolute', left: layout.screenPadding, bottom: 26, gap: 6 },
  demoBtn: { marginTop: 10, alignSelf: 'flex-start' },
  demoText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.3,
    color: colors.fg,
    textDecorationLine: 'underline',
  },

  li: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  grow: { flex: 1 },
  liTitle: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23, color: colors.fg, marginTop: 4 },
  arrow: { fontFamily: fonts.mono, fontSize: 14, color: colors.fg },

  room: { backgroundColor: colors.black, padding: 24, gap: 8 },
  onDark: { color: colors.white },
  roomTitle: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 40, color: colors.white },
  roomOpen: { marginTop: 6 },

  toast: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
  toastText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.white,
    backgroundColor: colors.black,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
});
