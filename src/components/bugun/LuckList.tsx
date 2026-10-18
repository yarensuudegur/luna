import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Section } from '@/components/Section';
import { LuckDot } from '@/components/bugun/Dot';
import { LUCK_ORDER, LUCK_PRE, LUCK_TXT, LUCK_WORD } from '@/lib/daily';
import type { DeepEntry, LuckCategory } from '@/lib/daily';
import { colors, fonts, layout } from '@/theme';

type Props = {
  deep: readonly DeepEntry[];
  onOpen: (category: LuckCategory) => void;
};

/** Ev & aile, Arkadaşlar, İş & para, Aşk: o günün durumu ve kısa yorumu. */
export function LuckList({ deep, onOpen }: Props) {
  return (
    <Section style={styles.sec}>
      {LUCK_ORDER.map((k, i) => {
        const st = deep.find((d) => d.k === k)?.st ?? 3;
        return (
          <Pressable
            key={k}
            onPress={() => onOpen(k)}
            accessibilityRole="button"
            style={[styles.item, i === LUCK_ORDER.length - 1 && styles.itemLast]}
          >
            <View style={styles.row}>
              <View style={styles.title}>
                <LuckDot state={st} />
                <Text style={styles.titleText}>
                  {LUCK_PRE[k]} {LUCK_WORD[st]}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
            <Text style={styles.text}>{LUCK_TXT[k][st]}</Text>
          </Pressable>
        );
      })}
    </Section>
  );
}

const styles = StyleSheet.create({
  sec: { paddingTop: 6, paddingBottom: 6 },
  item: {
    gap: 8,
    paddingVertical: 20,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  itemLast: { borderBottomWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  titleText: { fontFamily: fonts.serif, fontSize: 18, color: colors.fg, flexShrink: 1 },
  arrow: { fontFamily: fonts.mono, fontSize: 12, color: colors.fg },
  text: { fontSize: 13.5, lineHeight: 21.6, color: colors.mute },
});
