import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { addDays, dateKey, fromDateKey } from '@/lib/date';
import { colors, fonts, layout } from '@/theme';

const GUNLER = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS'] as const;
const ITEM_W = 46;
const GAP = 2;
const PAD = 14;

type Props = {
  today: string;
  selected: string;
  onSelect: (key: string) => void;
};

/** Bugünden ±7 gün; seçili günün altında ince çizgi. */
export function DayStrip({ today, selected, onSelect }: Props) {
  const scroll = useRef<ScrollView>(null);
  const width = useRef(0);
  const base = fromDateKey(today);
  const days = Array.from({ length: 15 }, (_, i) => addDays(base, i - 7));

  const center = (animated: boolean) => {
    const i = days.findIndex((d) => dateKey(d) === selected);
    if (i < 0 || !width.current) return;
    const x = PAD + i * (ITEM_W + GAP) + ITEM_W / 2 - width.current / 2;
    scroll.current?.scrollTo({ x: Math.max(0, x), animated });
  };

  useEffect(() => center(true), [selected]);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.content}
      onLayout={(e) => {
        width.current = e.nativeEvent.layout.width;
        center(false);
      }}
      accessibilityRole="tablist"
    >
      {days.map((d) => {
        const key = dateKey(d);
        const isToday = key === today;
        const on = key === selected;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={styles.day}
          >
            <Text style={[styles.w, isToday && styles.today, on && styles.on]}>
              {isToday ? 'BGN' : GUNLER[d.getDay()]}
            </Text>
            <Text style={[styles.n, isToday && styles.today, on && styles.on]}>{d.getDate()}</Text>
            {on && <View style={styles.underline} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexGrow: 0,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  content: { gap: GAP, paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 10 },
  day: { width: ITEM_W, alignItems: 'center', gap: 4, paddingTop: 6, paddingBottom: 8 },
  w: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.1, color: colors.faint },
  n: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 26, color: colors.faint },
  today: { color: colors.mute },
  on: { color: colors.fg },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: layout.hairline,
    backgroundColor: colors.fg,
  },
});
