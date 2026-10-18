import { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bottle } from '@/components/gunluk/Bottle';
import { BOTTLE, MOODS, orbsFor, up } from '@/lib/bottle';
import type { WeekData } from '@/lib/bottle';
import { low } from '@/lib/bottle';
import { colors, fonts } from '@/theme';

/** Prototipteki .story.big genişliği; tüm ölçüler buna göre ölçeklenir. */
const BASE = 290;

type Props = {
  data: WeekData;
  /** Kullanıcının adı; kartın üstünde görünür. */
  name: string;
  width: number;
};

/** 9:16 story kartı (prototipteki storyCard). Paylaşılan görüntü bu görünümden alınır. */
export const StoryCard = forwardRef<View, Props>(function StoryCard({ data, name, width }, ref) {
  const f = width / BASE;
  const orbs = useMemo(() => orbsFor(data.keys), [data.keys]);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { width, aspectRatio: 9 / 16, paddingVertical: 16 * f, paddingHorizontal: 14 * f }]}
    >
      <View style={styles.head}>
        <Text style={[styles.mono, { fontSize: 9.5 * f }]}>{up(`${name} · Haftanın şişesi`)}</Text>
        <Text style={[styles.mono, styles.mute, { fontSize: 9.5 * f, marginTop: 4 }]}>{up(data.label)}</Text>
      </View>

      <View style={[styles.bottleBox, { height: 250 * f }]}>
        <View
          style={[
            styles.bottlePos,
            { marginLeft: -BOTTLE.width / 2, marginTop: -BOTTLE.height / 2, transform: [{ scale: 0.68 * f }] },
          ]}
        >
          <Bottle orbs={orbs} />
        </View>
      </View>

      <Text style={[styles.line, { fontSize: 23 * f, lineHeight: 30 * f }]}>
        Bu haftanın duygusu: {low(data.best)}.
      </Text>

      <View style={styles.avg}>
        {MOODS.map(([k, label]) => (
          <View key={k} style={styles.avgItem}>
            <Text style={[styles.avgVal, { fontSize: 17 * f, lineHeight: 23 * f }]}>{data.avg[k]}</Text>
            <Text style={[styles.avgLabel, { fontSize: 8 * f }]}>{up(label)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.fg,
    backgroundColor: colors.bg,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  head: { alignItems: 'center' },
  mono: { fontFamily: fonts.mono, letterSpacing: 1.3, color: colors.fg, textAlign: 'center' },
  mute: { color: colors.mute },
  bottleBox: { width: '100%' },
  bottlePos: { position: 'absolute', left: '50%', top: '50%' },
  line: { fontFamily: fonts.serif, color: colors.fg, textAlign: 'center' },
  avg: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', rowGap: 8 },
  avgItem: { width: '33.33%', alignItems: 'center' },
  avgVal: { fontFamily: fonts.serif, color: colors.fg },
  avgLabel: { fontFamily: fonts.mono, letterSpacing: 0.7, color: colors.mute },
});
