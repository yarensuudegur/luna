import { locale } from '@/i18n/lang';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { planetName, signName } from '@/i18n/names';
import { norm, signIndex } from '@/lib/astro';
import { colors, fonts } from '@/theme';

export type TableRow = {
  key: string;
  glyph: string;
  lon: number;
  /** Doğum saati bilinmiyorsa null; o zaman ev sütunu çizilmez. */
  house: number | null;
};

const ROW_H = 48;

type Group = { value: number; start: number; count: number };

/** Ardışık aynı değerli satırları tek hücrede birleştirir. */
function groupBy(rows: TableRow[], pick: (r: TableRow) => number): Group[] {
  const groups: Group[] = [];
  rows.forEach((r, i) => {
    const last = groups[groups.length - 1];
    if (last && last.value === pick(r)) last.count += 1;
    else groups.push({ value: pick(r), start: i, count: 1 });
  });
  return groups;
}

function Vertical({ text, style }: { text: string; style: object }) {
  return (
    <View style={[styles.vt, style]}>
      {[...text].map((c, i) => (
        <Text key={i} style={styles.vtChar}>
          {c}
        </Text>
      ))}
    </View>
  );
}

/**
 * Burç / gezegen / ev tablosu. Yükselen biliniyorsa satırlar Yükselen'den başlayarak
 * sıralanır, aksi halde Koç'tan.
 */
export function ChartTable({ rows: rows0, asc }: { rows: TableRow[]; asc: number | null }) {
  const { t } = useTranslation();
  const rows = [...rows0].sort((a, b) => norm(a.lon - (asc ?? 0)) - norm(b.lon - (asc ?? 0)));
  const showHouses = rows.every((r) => r.house !== null);
  const signGroups = groupBy(rows, (r) => signIndex(r.lon));
  const houseGroups = showHouses ? groupBy(rows, (r) => r.house ?? 0) : [];

  return (
    <View style={styles.wrap}>
      <Vertical text={t('sen.signsCol')} style={styles.top} />
      <View style={styles.table}>
        <View style={styles.colSign}>
          {signGroups.map((g) => (
            <View key={g.start} style={[styles.signCell, { height: g.count * ROW_H }]}>
              <Text style={styles.signText}>{signName(g.value)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.colPlanet}>
          {rows.map((r) => (
            <View key={r.key} style={styles.planetCell}>
              <Text style={styles.glyph}>{r.glyph}︎</Text>
              <Text style={styles.planetText}>{planetName(r.key).toLocaleUpperCase(locale())}</Text>
            </View>
          ))}
        </View>
        {showHouses && (
          <View style={styles.colHouse}>
            {houseGroups.map((g) => (
              <View key={g.start} style={[styles.houseCell, { height: g.count * ROW_H }]}>
                <Text style={styles.houseText}>{g.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {showHouses ? <Vertical text={t('sen.housesCol')} style={styles.bottom} /> : <View style={styles.vt} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  vt: { width: 22, alignItems: 'center', gap: 6 },
  top: { alignSelf: 'flex-start', paddingTop: 6 },
  bottom: { alignSelf: 'flex-end', paddingBottom: 6 },
  vtChar: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 17, color: colors.inkSoft },
  table: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  colSign: { flex: 1 },
  colPlanet: { flex: 1 },
  colHouse: { flex: 0.52 },
  signCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingTop: 15,
    paddingHorizontal: 14,
  },
  signText: { fontSize: 15, color: colors.ink },
  planetCell: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  glyph: { width: 14, textAlign: 'center', fontSize: 14, color: colors.fg },
  planetText: { fontFamily: fonts.mono, fontSize: 12.5, letterSpacing: 0.5, color: colors.ink },
  houseCell: {
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  houseText: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 40, includeFontPadding: false, color: colors.ink },
});
