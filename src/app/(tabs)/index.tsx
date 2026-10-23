import { locale } from '@/i18n/lang';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CosmicBanner } from '@/components/bugun/CosmicBanner';
import { DayStrip } from '@/components/bugun/DayStrip';
import { DeepDive } from '@/components/bugun/DeepDive';
import { LuckList } from '@/components/bugun/LuckList';
import { TarotSection } from '@/components/bugun/TarotSection';
import { FutureSheet } from '@/components/bugun/FutureSheet';
import { FutureBanner, FutureMessageView } from '@/components/bugun/FutureMessage';
import { TheEnd } from '@/components/bugun/TheEnd';
import { Label, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { nextMoonEvent } from '@/lib/astro';
import { useAuth } from '@/lib/auth';
import { dayName, formatDayMonth, fromDateKey } from '@/lib/date';
import { FutureArchive } from '@/components/sen/FutureArchive';
import { sendFutureDemo, sendFutureMessage, useDueFutureMessages } from '@/lib/future';
import { useNotifications } from '@/lib/notifications';
import { useFutureArchive } from '@/lib/future-archive';
import type { FutureMessage } from '@/lib/future';
import { useDailyTarot } from '@/lib/tarot';
import { useToday } from '@/lib/today';
import { useDaily } from '@/lib/use-daily';
import { colors, fonts } from '@/theme';

export default function BugunScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { today, selected, select, daysOpen, deepOpen, deepTab, setDeepTab, openDeep, closeDeep } = useToday();
  const daily = useDaily(profile, selected);
  const tarot = useDailyTarot(profile?.id, today);
  const event = useMemo(() => nextMoonEvent(new Date()), [today]);
  const [focused, setFocused] = useState(true);
  const future = useDueFutureMessages(profile?.id);
  const archive = useFutureArchive(profile?.id);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [reading, setReading] = useState<FutureMessage | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  async function sendFuture(body: string) {
    if (!(await sendFutureMessage(body))) return false;
    setComposing(false);
    setToast(t('future.sent'));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
    return true;
  }

  const { pushNotice, intent, clearIntent } = useNotifications();
  const demoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(demoTimer.current), []);

  /** Demo: mesaj 10 saniye sonra teslim edilir, uygulama içi bildirim düşer ve arşive girer. */
  async function sendFutureDemoMessage(body: string) {
    const at = await sendFutureDemo(body);
    if (!at) return false;
    setComposing(false);
    setToast(t('future.demoSent'));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
    clearTimeout(demoTimer.current);
    demoTimer.current = setTimeout(
      () => {
        void future.reload();
        void archive.reload();
        pushNotice(t('future.banner'), { kind: 'future' });
      },
      Math.max(0, at.getTime() - Date.now()) + 300,
    );
    return true;
  }

  // Bildirime dokunulunca: mesajlar yenilenir ve sıradaki açılır.
  const [openPending, setOpenPending] = useState(false);
  useEffect(() => {
    if (intent?.kind !== 'future') return;
    clearIntent();
    closeDeep();
    void future.reload().then(() => setOpenPending(true));
  }, [intent, clearIntent, closeDeep, future.reload]);
  useEffect(() => {
    if (!openPending || future.messages.length === 0) return;
    setOpenPending(false);
    // Bildirimdeki mesaj en son teslim edilendir.
    openFuture(future.messages[future.messages.length - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPending, future.messages]);

  function openFuture(message?: FutureMessage) {
    const next = message ?? future.messages[0];
    if (!next) return;
    setReading(next);
    void future.markOpened(next.id);
  }
  const scroll = useRef<ScrollViewInstance>(null);

  // Sekmeden çıkınca Derine in kapanır ve animasyonlar durur.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void future.reload();
      return () => {
        setFocused(false);
        closeDeep();
      };
    }, [closeDeep, future.reload]),
  );

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [deepOpen]);

  const isToday = selected === today;
  const date = fromDateKey(selected);

  return (
    <View style={styles.root}>
    <ScrollView
      ref={scroll}
      // Webde sayfa sonundan aşağı çekince görünen alan siyah olsun (içerik kendi zeminini taşır).
      style={[styles.root, Platform.OS === 'web' && !deepOpen && styles.rootWeb]}
      contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.contentWeb]}
    >
      {future.messages.length > 0 && !deepOpen && <FutureBanner onPress={() => openFuture()} />}
      {!daily || !profile ? (
        <Section last>
          <Text style={styles.body}>{t('today.missingBirth')}</Text>
        </Section>
      ) : deepOpen ? (
        <DeepDive
          userId={profile.id}
          dateKey={selected}
          reading={daily.reading}
          transits={daily.transits}
          tarot={isToday ? tarot.drawn : null}
          tab={deepTab}
          onTab={setDeepTab}
          onBack={closeDeep}
        />
      ) : (
        <>
          {daysOpen && <DayStrip today={today} selected={selected} onSelect={select} />}

          <Section>
            <View style={styles.bust}>
              <Avatar avatar={profile.avatar} size={112} />
            </View>
            <Label>{isToday ? t('today.summary') : `${dayName(date)} ${formatDayMonth(date)}`}</Label>
            <Text style={styles.h1}>{daily.reading.h}</Text>
            <Text style={[styles.body, { marginTop: 18 }]}>{daily.reading.body}</Text>

            <View style={styles.doDont}>
              <View style={styles.col}>
                <Text style={styles.colTitle}>{t('today.do')}</Text>
                {daily.reading.dos.map((x) => (
                  <Text key={x} style={styles.li}>
                    {x}
                  </Text>
                ))}
              </View>
              <View style={styles.col}>
                <Text style={styles.colTitle}>{t('today.dont')}</Text>
                {daily.reading.donts.map((x) => (
                  <Text key={x} style={styles.li}>
                    {x}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.dive}>
              <Button onPress={() => openDeep()}>{t('today.deepBtn')}</Button>
            </View>
          </Section>

          <LuckList deep={daily.reading.deep} onOpen={openDeep} />

          {event && <CosmicBanner event={event} now={new Date()} />}

          {isToday && <TarotSection tarot={tarot} />}

          <TheEnd seed={selected} active={focused} onFuture={() => setComposing(true)} />
          {/* Sayfa sonundan aşağı çekince (iOS esnemesi) beyaz değil siyah görünsün. */}
          {Platform.OS !== 'web' && <View style={styles.underEnd} pointerEvents="none" />}
        </>
      )}
    </ScrollView>
    <FutureSheet
      visible={composing}
      onClose={() => setComposing(false)}
      onSend={sendFuture}
      onSendDemo={sendFutureDemoMessage}
    />
    <FutureMessageView
      message={reading}
      onClose={() => setReading(null)}
      onArchive={() => {
        setReading(null);
        setArchiveOpen(true);
      }}
    />
    <FutureArchive visible={archiveOpen} onClose={() => setArchiveOpen(false)} archive={archive} />
    {toast && (
      <View style={styles.toast} pointerEvents="none">
        <Text style={styles.toastText}>{toast.toLocaleUpperCase(locale())}</Text>
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1 },
  rootWeb: { backgroundColor: colors.black },
  contentWeb: { backgroundColor: colors.bg },
  underEnd: { position: 'absolute', left: 0, right: 0, bottom: -1000, height: 1000, backgroundColor: colors.black },
  bust: { alignSelf: 'flex-end', marginTop: 6, marginBottom: 22 },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, letterSpacing: -0.34, color: colors.fg },
  body: { fontSize: 14, lineHeight: 22.7, color: colors.body },
  doDont: { flexDirection: 'row', gap: 18, marginTop: 24 },
  col: { flex: 1 },
  colTitle: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute, marginBottom: 8 },
  li: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.fg },
  dive: { marginTop: 26, alignSelf: 'flex-start' },
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
