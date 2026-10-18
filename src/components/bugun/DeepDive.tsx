import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DeepDot } from '@/components/bugun/Dot';
import { Label, LinkText, Section } from '@/components/Section';
import { BURCLAR, degreeInSign } from '@/lib/astro';
import { STATES, TAROT } from '@/lib/daily';
import type { Reading, Transits } from '@/lib/daily';
import { formatDayMonth, fromDateKey } from '@/lib/date';
import { useSavedReading } from '@/lib/saved';
import type { DrawnCard } from '@/lib/tarot';
import type { DeepTab } from '@/lib/today';
import { colors, fonts, layout } from '@/theme';

const TABS: readonly DeepTab[] = ['Tümü', 'Aşk', 'Arkadaşlar', 'İş & para', 'Ev & aile'];

type Props = {
  userId: string;
  dateKey: string;
  reading: Reading;
  transits: Transits;
  /** Bugünün kartı çekildiyse uzun yoruma eklenir. */
  tarot: DrawnCard | null;
  tab: DeepTab;
  onTab: (tab: DeepTab) => void;
  onBack: () => void;
};

function Bookmark({ on }: { on: boolean }) {
  return (
    <Svg width={11} height={14} viewBox="0 0 11 14">
      <Path d="M1 1h9v12l-4.5-3.2L1 13z" fill={on ? colors.fg : 'none'} stroke={colors.fg} />
    </Svg>
  );
}

function TransitRow({ glyph, name, right, last }: { glyph: string; name: string; right: string; last?: boolean }) {
  return (
    <View style={[styles.transit, last && styles.transitLast]}>
      <Text style={styles.transitText}>{glyph}</Text>
      <Text style={[styles.transitText, styles.transitName]}>{name.toLocaleUpperCase('tr')}</Text>
      <Text style={styles.transitText}>{right}</Text>
    </View>
  );
}

const signAndDegree = (lon: number) => `${BURCLAR[Math.floor(lon / 30) % 12]} ${degreeInSign(lon)}°`;

export function DeepDive({ userId, dateKey, reading, transits, tarot, tab, onTab, onBack }: Props) {
  const date = fromDateKey(dateKey);
  const { saved, toggle } = useSavedReading(userId, dateKey, reading.h);
  const { moon, sun, aspects, phase } = transits;
  const list = reading.deep.filter((d) => tab === 'Tümü' || d.k === tab);
  const card = tarot ? TAROT[tarot.card] : null;

  const share = () =>
    Share.share({
      message: `${reading.h}\n\n${reading.body}\n\nYap: ${reading.dos.join(', ')}\nYapma: ${reading.donts.join(', ')}\n\nLuna · ${formatDayMonth(date)}`,
    }).catch(() => {});

  return (
    <View>
      <Section style={styles.back}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={10}>
          <LinkText>← Bugün</LinkText>
        </Pressable>
      </Section>

      <Section>
        <Label>{`Derine in · ${formatDayMonth(date)}`}</Label>
        <Text style={styles.h1}>{reading.h}</Text>
        {reading.long.map((p, i) => (
          <Text key={i} style={[styles.body, { marginTop: i === 0 ? 18 : 12 }]}>
            {p}
          </Text>
        ))}
        {card && tarot && (
          <Text style={[styles.body, { marginTop: 12 }]}>
            Günün kartı {card[1]}
            {tarot.reversed ? ', ters' : ''}. {card[4]}
          </Text>
        )}
      </Section>

      <Section>
        <Label>Gökyüzünde bugün</Label>
        <TransitRow
          glyph="☽︎"
          name={`Ay · ${signAndDegree(moon.lon)}`}
          right={moon.house ? `${moon.house}. EV` : ''}
        />
        <TransitRow
          glyph="☉︎"
          name={`Güneş · ${signAndDegree(sun.lon)}`}
          right={sun.house ? `${sun.house}. EV` : ''}
        />
        {aspects.map((a) => (
          <TransitRow
            key={`${a.transit}-${a.natal}-${a.kind}`}
            glyph={a.glyph}
            name={`${a.transit} ${a.aspectGlyph} ${a.natal}`}
            right={`${a.orb.toFixed(1).replace('.', ',')}°`}
          />
        ))}
        <TransitRow glyph="◐" name={phase} right="" last />
      </Section>

      <Section>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabs}
          contentContainerStyle={styles.tabsContent}
          accessibilityRole="tablist"
        >
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => onTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              style={styles.tab}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t.toLocaleUpperCase('tr')}</Text>
              {tab === t && <View style={styles.tabLine} />}
            </Pressable>
          ))}
        </ScrollView>
        {list.map((d, i) => (
          <View key={d.k} style={[styles.item, i === list.length - 1 && styles.itemLast]}>
            <Text style={styles.itemTitle}>{d.k}</Text>
            <View style={styles.state}>
              <DeepDot state={d.st} />
              <Text style={styles.stateText}>{STATES[d.st].toLocaleUpperCase('tr')}</Text>
            </View>
            <Text style={styles.itemText}>{d.txt}</Text>
          </View>
        ))}
      </Section>

      <Section last>
        <View style={styles.actions}>
          <Pressable onPress={toggle} accessibilityRole="button" style={styles.action}>
            <Bookmark on={saved} />
            <Text style={styles.actionText}>{saved ? 'KAYDEDİLDİ' : 'KAYDET'}</Text>
          </Pressable>
          <Pressable onPress={share} accessibilityRole="button" style={styles.action}>
            <Text style={styles.actionText}>PAYLAŞ ↗</Text>
          </Pressable>
        </View>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { paddingTop: 16, paddingBottom: 16, alignItems: 'flex-start' },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, letterSpacing: -0.34, color: colors.fg },
  body: { fontSize: 14, lineHeight: 22.7, color: colors.fg },
  transit: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  transitLast: { borderBottomWidth: 0 },
  transitText: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.6, color: colors.fg },
  transitName: { flex: 1 },
  tabs: { marginHorizontal: -layout.screenPadding, flexGrow: 0 },
  tabsContent: { gap: 18, paddingHorizontal: layout.screenPadding },
  tab: { paddingTop: 10, paddingBottom: 11 },
  tabText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.faint },
  tabTextOn: { color: colors.fg },
  tabLine: { position: 'absolute', left: 0, right: 0, bottom: 0, height: layout.hairline, backgroundColor: colors.fg },
  item: {
    paddingVertical: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: 4,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  itemLast: { borderBottomWidth: 0 },
  itemTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.fg },
  state: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stateText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  itemText: { width: '100%', fontSize: 13.5, lineHeight: 21.6, color: colors.mute },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  actionText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.2, color: colors.fg },
});
