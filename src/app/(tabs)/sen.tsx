import { locale } from '@/i18n/lang';
import { useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { ChartTable } from '@/components/sen/ChartTable';
import { ChartWheel } from '@/components/sen/ChartWheel';
import { PlanetCards } from '@/components/sen/PlanetCards';
import type { CardItem } from '@/components/sen/PlanetCards';
import { SavedPanel } from '@/components/sen/SavedPanel';
import { SettingsPanel } from '@/components/sen/SettingsPanel';
import { useTranslation } from '@/i18n';
import { signName } from '@/i18n/names';
import { signIndex } from '@/lib/astro';
import { useAuth } from '@/lib/auth';
import { useSettings } from '@/lib/settings';
import { useProfileChart } from '@/lib/use-chart';
import { colors, fonts, layout } from '@/theme';
import { useFrameWidth } from '@/lib/use-frame-width';

type Sub = 'harita' | 'kayit' | 'ayar';

const web = Platform.OS === 'web';

export default function SenScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { houseSystem } = useSettings();
  const data = useProfileChart(profile);
  const [sub, setSub] = useState<Sub>('harita');

  const sun = data?.chart.planets.find((p) => p.key === 'Güneş');
  const moon = data?.chart.planets.find((p) => p.key === 'Ay');
  const signs = [
    sun && `☉︎ ${signName(signIndex(sun.lon))}`,
    moon && `☽︎ ${signName(signIndex(moon.lon))}`,
    data?.chart.asc != null && `↑ ${signName(signIndex(data.chart.asc))}`,
  ]
    .filter(Boolean)
    .join('  ');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <Avatar avatar={profile?.avatar} size={104} />
        <Text style={styles.name}>{profile?.name ?? ''}</Text>
        <Text style={styles.handle}>{profile?.handle ? `@${profile.handle}` : ''}</Text>
        {signs !== '' && <Text style={styles.signs}>{signs.toLocaleUpperCase(locale())}</Text>}
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {(
          [
            ['harita', t('sen.chart')],
            ['kayit', t('gunluk.savedTitle')],
            ['ayar', t('sen.settings')],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setSub(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: sub === key }}
            style={styles.tab}
          >
            <Text style={[styles.tabText, sub === key && styles.tabTextOn]}>{label.toLocaleUpperCase(locale())}</Text>
            {sub === key && <View style={styles.tabLine} />}
          </Pressable>
        ))}
      </View>

      {sub === 'ayar' ? (
        <SettingsPanel />
      ) : sub === 'kayit' ? (
        <SavedPanel userId={profile?.id} />
      ) : data ? (
        <HaritaSekmesi data={data} houseSystem={houseSystem} />
      ) : (
        <Text style={styles.empty}>{t('sen.noBirth')}</Text>
      )}
    </ScrollView>
  );
}

function HaritaSekmesi({
  data,
  houseSystem,
}: {
  data: NonNullable<ReturnType<typeof useProfileChart>>;
  houseSystem: string;
}) {
  const { t } = useTranslation();
  const width = useFrameWidth();
  const [page, setPage] = useState(0);
  const pager = useRef<ScrollView>(null);
  const { chart, rows } = data;
  const asc = chart.asc;

  const tableRows = [
    ...(asc !== null ? [{ key: 'Yükselen', glyph: '↑', lon: asc, house: 1 }] : []),
    ...rows.map((r) => ({ key: r.key, glyph: r.glyph, lon: r.lon, house: r.house })),
  ];
  const cards: CardItem[] = [
    ...(asc !== null ? [{ key: 'Yükselen' as const, glyph: '↑', lon: asc, house: 1 }] : []),
    ...rows.map((r) => ({ key: r.key, glyph: r.glyph, lon: r.lon, house: r.house })),
  ];

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  // Webde fareyle kaydırma olmaz; noktalara (ve oklara) basınca sayfa değişir.
  function goTo(i: number) {
    pager.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  }

  return (
    <View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={web && styles.noSelect}
      >
        <View style={{ width }}>
          <ChartTable rows={tableRows} asc={asc} />
          {asc === null && <Text style={styles.note}>{t('sen.noTime')}</Text>}
        </View>
        <View style={[styles.wheelSlide, { width }]}>
          <View style={styles.wheelHead}>
            <Text style={styles.lbl}>{t('sen.birthChart')}</Text>
            <Text style={styles.mono}>{houseSystem.toLocaleUpperCase(locale())}</Text>
          </View>
          {asc !== null ? (
            <ChartWheel planets={rows} asc={asc} width={width - 40} />
          ) : (
            <Text style={styles.note}>{t('sen.noTime')}</Text>
          )}
        </View>
      </ScrollView>
      <View style={styles.dots}>
        {web && (
          <Pressable onPress={() => goTo(0)} disabled={page === 0} accessibilityRole="button" hitSlop={10}>
            <Text style={[styles.arrow, page === 0 && styles.arrowOff]}>‹</Text>
          </Pressable>
        )}
        {[0, 1].map((i) => (
          <Pressable
            key={i}
            onPress={() => goTo(i)}
            accessibilityRole="button"
            accessibilityLabel={t(i === 0 ? 'sen.tableA11y' : 'sen.wheelA11y')}
            hitSlop={8}
          >
            <View style={[styles.dot, page === i && styles.dotOn]} />
          </Pressable>
        ))}
        {web && (
          <Pressable onPress={() => goTo(1)} disabled={page === 1} accessibilityRole="button" hitSlop={10}>
            <Text style={[styles.arrow, page === 1 && styles.arrowOff]}>›</Text>
          </Pressable>
        )}
      </View>
      <PlanetCards items={cards} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  head: { alignItems: 'center', paddingTop: 28, paddingBottom: 18, paddingHorizontal: layout.screenPadding },
  name: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 29, color: colors.fg, marginTop: 10 },
  handle: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.mute, marginTop: 3 },
  signs: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.3, color: colors.fg, marginTop: 8 },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  tab: { paddingTop: 10, paddingBottom: 11 },
  tabText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.faint },
  tabTextOn: { color: colors.fg },
  tabLine: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 1, backgroundColor: colors.black },
  empty: { padding: layout.screenPadding, paddingTop: 28, fontSize: 15, color: colors.body },
  note: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
    textAlign: 'center',
  },
  wheelSlide: { paddingTop: 20, paddingHorizontal: layout.screenPadding, paddingBottom: 8, justifyContent: 'center' },
  wheelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },
  mono: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingTop: 10, paddingBottom: 4 },
  arrow: { fontFamily: fonts.mono, fontSize: 16, lineHeight: 18, color: colors.fg, paddingHorizontal: 8 },
  arrowOff: { color: colors.faint },
  noSelect: { userSelect: 'none' },
  dot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: colors.black },
  dotOn: { backgroundColor: colors.black },
});
