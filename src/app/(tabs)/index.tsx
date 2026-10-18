import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CosmicBanner } from '@/components/bugun/CosmicBanner';
import { DayStrip } from '@/components/bugun/DayStrip';
import { DeepDive } from '@/components/bugun/DeepDive';
import { LuckList } from '@/components/bugun/LuckList';
import { TarotSection } from '@/components/bugun/TarotSection';
import { TheEnd } from '@/components/bugun/TheEnd';
import { Label, Section } from '@/components/Section';
import { nextMoonEvent } from '@/lib/astro';
import { useAuth } from '@/lib/auth';
import { dayName, formatDayMonth, fromDateKey } from '@/lib/date';
import { useDailyTarot } from '@/lib/tarot';
import { useToday } from '@/lib/today';
import { useDaily } from '@/lib/use-daily';
import { colors, fonts } from '@/theme';

export default function BugunScreen() {
  const { profile } = useAuth();
  const { today, selected, select, daysOpen, deepOpen, deepTab, setDeepTab, openDeep, closeDeep } = useToday();
  const daily = useDaily(profile, selected);
  const tarot = useDailyTarot(profile?.id, today);
  const event = useMemo(() => nextMoonEvent(new Date()), [today]);
  const [focused, setFocused] = useState(true);
  const scroll = useRef<ScrollView>(null);

  // Sekmeden çıkınca Derine in kapanır ve animasyonlar durur.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        closeDeep();
      };
    }, [closeDeep]),
  );

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [deepOpen]);

  const isToday = selected === today;
  const date = fromDateKey(selected);

  return (
    <ScrollView ref={scroll} style={styles.root} contentContainerStyle={styles.content}>
      {!daily || !profile ? (
        <Section last>
          <Text style={styles.body}>Doğum bilgilerin eksik olduğu için bugünün yorumu hesaplanamadı.</Text>
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
            <Label>{isToday ? 'Günün özeti' : `${dayName(date)} ${formatDayMonth(date)}`}</Label>
            <Text style={styles.h1}>{daily.reading.h}</Text>
            <Text style={[styles.body, { marginTop: 18 }]}>{daily.reading.body}</Text>

            <View style={styles.doDont}>
              <View style={styles.col}>
                <Text style={styles.colTitle}>YAP</Text>
                {daily.reading.dos.map((x) => (
                  <Text key={x} style={styles.li}>
                    {x}
                  </Text>
                ))}
              </View>
              <View style={styles.col}>
                <Text style={styles.colTitle}>YAPMA</Text>
                {daily.reading.donts.map((x) => (
                  <Text key={x} style={styles.li}>
                    {x}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.dive}>
              <Button onPress={() => openDeep()}>Derine in ›</Button>
            </View>
          </Section>

          <LuckList deep={daily.reading.deep} onOpen={openDeep} />

          {event && <CosmicBanner event={event} now={new Date()} />}

          {isToday && <TarotSection tarot={tarot} />}

          <TheEnd seed={selected} active={focused} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1 },
  bust: { alignSelf: 'flex-end', marginTop: 6, marginBottom: 22 },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, letterSpacing: -0.34, color: colors.fg },
  body: { fontSize: 14, lineHeight: 22.7, color: colors.fg },
  doDont: { flexDirection: 'row', gap: 18, marginTop: 24 },
  col: { flex: 1 },
  colTitle: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute, marginBottom: 8 },
  li: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.fg },
  dive: { marginTop: 26, alignSelf: 'flex-start' },
});
