import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bar } from '@/components/arkadaslar/Bar';
import { Initial } from '@/components/arkadaslar/Initial';
import { BURCLAR, compatibility } from '@/lib/astro';
import type { Chart } from '@/lib/astro';
import { formatDayMonth, fromDateKey } from '@/lib/date';
import type { Friend } from '@/lib/friends';
import { REL_TYPES, friendDay } from '@/lib/relations';
import type { RelType } from '@/lib/relations';
import { colors, fonts, layout } from '@/theme';

type Props = {
  friend: Friend | null;
  /** Bugünün anahtarı (YYYY-AA-GG). */
  today: string;
  myChart: Chart | null;
  onClose: () => void;
  /** İlişki türü değişir; kaydedilemezse false döner. */
  onRelChange: (friend: Friend, to: RelType) => Promise<boolean>;
  /** Arkadaşlıktan çıkarır; olmazsa false döner. */
  onRemove: (friend: Friend) => Promise<boolean>;
};

export function signsLine(f: Pick<Friend, 'sun' | 'moon' | 'asc'>): string {
  return [
    f.sun !== null && `☉︎ ${BURCLAR[f.sun]}`,
    f.moon !== null && `☽︎ ${BURCLAR[f.moon]}`,
    f.asc !== null && `↑ ${BURCLAR[f.asc]}`,
  ]
    .filter(Boolean)
    .join('  ');
}

/** Arkadaş profili: ilişki türü, bugünün cümlesi ve iki haritadan uyum çubukları. */
export function FriendSheet({ friend, today, myChart, onClose, onRelChange, onRemove }: Props) {
  const insets = useSafeAreaInsets();
  const [picking, setPicking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);

  useEffect(() => {
    setConfirming(false);
    setRemoveFailed(false);
    setPicking(false);
  }, [friend?.id]);

  async function remove() {
    if (!friend) return;
    if (!confirming) return setConfirming(true);
    setRemoveFailed(!(await onRemove(friend)));
  }

  const day = useMemo(() => (friend ? friendDay(friend, today) : null), [friend, today]);
  const compat = useMemo(
    () => (friend?.chart && myChart ? compatibility(myChart, friend.chart) : null),
    [friend?.chart, myChart],
  );

  async function pick(to: RelType) {
    if (!friend) return;
    setPicking(false);
    if (to === friend.rel) return;
    setFailed(false);
    if (!(await onRelChange(friend, to))) setFailed(true);
  }

  return (
    <Modal visible={friend !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />
      {friend && day && (
        <View style={[styles.panel, { paddingBottom: insets.bottom + 26 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.row}>
              <Text style={styles.lbl}>ARKADAŞ</Text>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" style={styles.x}>
                <Text style={styles.xText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.head}>
              <Initial name={friend.name} size={72} />
              <View style={styles.headText}>
                <Text style={styles.name}>{friend.name}</Text>
                <Text style={styles.signs}>@{friend.handle}</Text>
                {signsLine(friend) !== '' && <Text style={styles.signs}>{signsLine(friend)}</Text>}
              </View>
            </View>

            <View style={styles.set}>
              <Pressable
                onPress={() => setPicking((p) => !p)}
                accessibilityRole="button"
                accessibilityState={{ expanded: picking }}
                accessibilityLabel={`İlişki türü: ${friend.rel}`}
                style={styles.srow}
              >
                <Text style={styles.srowLabel}>İLİŞKİ TÜRÜ</Text>
                <Text style={styles.srowValue}>{friend.rel} ▾</Text>
              </Pressable>
              {picking &&
                REL_TYPES.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => pick(r)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: r === friend.rel }}
                    style={styles.option}
                  >
                    <Text style={[styles.optionText, r === friend.rel && styles.optionOn]}>{r}</Text>
                  </Pressable>
                ))}
              {failed && <Text style={styles.note}>Kaydedilemedi, tekrar dene.</Text>}
              {friend.history.length > 0 && (
                <Text style={styles.note}>
                  {friend.history
                    .map((h) => `${h.from} → ${h.to}, ${formatDayMonth(fromDateKey(h.date))}`)
                    .join(' · ')}
                </Text>
              )}
            </View>

            <Text style={[styles.lbl, styles.section]}>BUGÜN</Text>
            <Text style={styles.blurb}>{day.blurb}</Text>
            <View style={styles.chips}>
              {day.tags.map((t) => (
                <View key={t} style={styles.chip}>
                  <Text style={styles.chipText}>{t.toLocaleUpperCase('tr')}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.lbl, styles.section]}>UYUM</Text>
            {compat ? (
              <View style={styles.bars}>
                {(Object.keys(compat) as (keyof typeof compat)[]).map((k) => (
                  <View key={k} style={styles.row}>
                    <Text style={styles.cat}>{k}</Text>
                    <Bar filled={compat[k]} label={`${k}: 10 üzerinden ${compat[k]}`} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.note}>
                Uyum, iki doğum haritasından hesaplanır. {friend.name} doğum bilgisini tamamlayınca burada görünür.
              </Text>
            )}
            <View style={styles.removeWrap}>
              {confirming && (
                <Text style={styles.note}>
                  {friend.name} arkadaş listenden çıkarılır, sen de onun listesinden çıkarsın. Ortak gruplar kalır.
                </Text>
              )}
              {removeFailed && <Text style={styles.note}>Çıkarılamadı, tekrar dene.</Text>}
              <View style={styles.removeRow}>
                <Pressable onPress={remove} accessibilityRole="button" hitSlop={10}>
                  <Text style={styles.removeText}>{confirming ? 'EMİN MİSİN? ÇIKAR' : 'ARKADAŞLIKTAN ÇIKAR'}</Text>
                </Pressable>
                {confirming && (
                  <Pressable onPress={() => setConfirming(false)} accessibilityRole="button" hitSlop={10}>
                    <Text style={styles.removeText}>VAZGEÇ</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,11,11,0.35)' },
  panel: {
    maxHeight: '92%',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.fg,
    paddingTop: 22,
    paddingHorizontal: layout.screenPadding,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },
  section: { marginTop: 20, marginBottom: 14 },
  x: { width: 30, height: 30, borderWidth: 1, borderColor: colors.fg, alignItems: 'center', justifyContent: 'center' },
  xText: { fontFamily: fonts.mono, fontSize: 11, color: colors.fg },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 },
  headText: { flex: 1 },
  name: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, color: colors.fg },
  signs: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.mute, marginTop: 3 },
  set: { marginTop: 18 },
  srow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    minHeight: 50,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  srowLabel: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.8, color: colors.fg },
  srowValue: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.7, color: colors.fg },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  optionText: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.7, color: colors.mute, textAlign: 'right' },
  optionOn: { color: colors.fg },
  note: { fontSize: 12.5, lineHeight: 19, color: colors.mute, paddingTop: 8, paddingBottom: 4 },
  blurb: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 28, color: colors.fg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: colors.fg, paddingVertical: 5, paddingHorizontal: 8 },
  chipText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.1, color: colors.fg },
  bars: { gap: 12 },
  removeWrap: { marginTop: 28 },
  removeRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  removeText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.fg,
    textDecorationLine: 'underline',
  },
  cat: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 21, color: colors.fg },
});
