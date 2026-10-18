import { Fragment } from 'react';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BURC_DA, degreeInSign, signIndex } from '@/lib/astro';
import { ascText, planetText } from '@/lib/astro/texts';
import type { PlanetKey } from '@/lib/astro';
import { ART } from '@/lib/art';
import { colors, fonts, layout } from '@/theme';

export type CardItem = {
  key: PlanetKey | 'Yükselen';
  glyph: string;
  lon: number;
  /** Doğum saati bilinmiyorsa null. */
  house: number | null;
};

const ART_MAX_H = 130;

function Art({ n, first }: { n: number; first?: boolean }) {
  const art = ART[n % ART.length];
  const left = n % 2 === 1;
  const src = Image.resolveAssetSource(art.source);
  const height = Math.min(ART_MAX_H, (art.width * src.height) / src.width);
  const tilt = (left ? -1 : 1) * (((n * 7) % 9) - 4);
  return (
    <View
      pointerEvents="none"
      style={[styles.art, left ? styles.artLeft : styles.artRight, first && styles.artFirst]}
    >
      <Image
        source={art.source}
        resizeMode="contain"
        style={{ width: art.width, height, transform: [{ rotate: `${tilt}deg` }] }}
      />
    </View>
  );
}

function SimilarRow() {
  const router = useRouter();
  return (
    <View style={styles.sim}>
      <Svg width={22} height={14} viewBox="0 0 22 14">
        <Circle cx={7} cy={7} r={6} fill="none" stroke={colors.subtle} />
        <Circle cx={15} cy={7} r={6} fill="none" stroke={colors.subtle} />
      </Svg>
      <Text style={styles.simText}>
        <Text style={styles.simLink} onPress={() => router.push('/arkadaslar')}>
          Arkadaş ekle
        </Text>
        , kimin benzediğini gör
      </Text>
    </View>
  );
}

/** Yükselen ve gezegenler için çerçeveli kartlar; aralarında grunge görseller. */
export function PlanetCards({ items }: { items: CardItem[] }) {
  return (
    <View style={styles.cards}>
      <Art n={items.length} first />
      {items.map((item, n) => {
        const sign = signIndex(item.lon);
        const meta = [item.glyph + '︎', item.house !== null ? `${item.house}. EV` : null, `${degreeInSign(item.lon)}°`]
          .filter(Boolean)
          .join(' · ');
        return (
          <Fragment key={item.key}>
            <View style={styles.card}>
              <Text style={styles.meta}>{meta}</Text>
              <Text style={styles.title}>{`${item.key} ${BURC_DA[sign]}`}</Text>
              <Text style={styles.body}>
                {item.key === 'Yükselen' ? ascText(sign) : planetText(item.key, sign)}
              </Text>
              <SimilarRow />
            </View>
            <Art n={n} />
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cards: { paddingTop: 26, paddingHorizontal: layout.screenPadding, paddingBottom: 40 },
  card: {
    zIndex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.bg,
    padding: 22,
    paddingVertical: 26,
  },
  meta: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.3,
    color: colors.fg,
    marginTop: 10,
    marginBottom: 14,
  },
  body: { fontSize: 15, lineHeight: 24, color: colors.ink },
  sim: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  simText: { flex: 1, fontSize: 13.5, color: colors.subtle },
  simLink: { color: colors.inkSoft, textDecorationLine: 'underline' },
  art: { zIndex: 2, flexDirection: 'row', marginTop: -16, marginBottom: -12 },
  artRight: { justifyContent: 'flex-end', paddingRight: 6 },
  artLeft: { justifyContent: 'flex-start', paddingLeft: 2 },
  artFirst: { marginTop: -10 },
});
