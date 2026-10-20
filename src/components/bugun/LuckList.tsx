import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Section } from '@/components/Section';
import { LuckDot } from '@/components/bugun/Dot';
import { useLang, useTranslation } from '@/i18n';
import { LUCK_ORDER, contentFor } from '@/lib/daily';
import type { DeepEntry, LuckCategory } from '@/lib/daily';
import { colors, fonts, layout } from '@/theme';

type Props = {
  deep: readonly DeepEntry[];
  onOpen: (category: LuckCategory) => void;
};

/** Ev & aile, Arkadaşlar, İş & para, Aşk: o günün durumu ve kısa yorumu. */
export function LuckList({ deep, onOpen }: Props) {
  const { t } = useTranslation();
  const text = contentFor(useLang()).luckText;
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
                  {t('luck.titleFormat', { pre: t(`luck.pre.${k}`), word: t(`luck.word.${st}`) })}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
            <Text style={styles.text}>{text[k][st]}</Text>
          </Pressable>
        );
      })}
    </Section>
  );
}

const styles = StyleSheet.create({
  sec: { paddingTop: 6, paddingBottom: 6 },
  item: {
    gap: 10,
    paddingVertical: 24,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  itemLast: { borderBottomWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  // Co–Star'daki gibi küçük başlık (Bodoni: satır yüksekliği en az 1,3 kat).
  titleText: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 21, color: colors.fg, flexShrink: 1 },
  arrow: { fontFamily: fonts.mono, fontSize: 12, color: colors.fg },
  text: { fontSize: 13.5, lineHeight: 23, color: colors.body },
});
