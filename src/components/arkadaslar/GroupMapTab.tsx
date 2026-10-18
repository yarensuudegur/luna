import { Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Bar } from '@/components/arkadaslar/Bar';
import { Initial } from '@/components/arkadaslar/Initial';
import { Label, Section } from '@/components/Section';
import { ELEMENTS, ROLES, elementOf, groupMix } from '@/lib/astro';
import { colors, fonts, layout } from '@/theme';

export type MapPerson = { id: string; name: string; sun: number | null; me?: boolean };

/** Grup haritası alt sekmesi: element dağılımı ve roller (sen + arkadaşların). */
export function GroupMapTab({ people }: { people: MapPerson[] }) {
  const known = people.filter((p): p is MapPerson & { sun: number } => p.sun !== null);
  const mix = groupMix(known.map((p) => p.sun));
  const lowName = ELEMENTS[mix.dominant].toLocaleLowerCase('tr');

  function share() {
    Share.share({
      message: `Grubumuz %${mix.percent} ${lowName}. Haritamıza Luna’da bak.`,
    }).catch(() => {});
  }

  if (known.length < 2) {
    return (
      <Section last>
        <Label>GRUP HARİTASI</Label>
        <Text style={styles.body}>
          Grup haritası için en az bir arkadaşının doğum haritası gerekir. Arkadaş ekledikçe burada belirir.
        </Text>
      </Section>
    );
  }

  return (
    <>
      <Section>
        <Label>GRUP HARİTASI · {mix.total} KİŞİ</Label>
        <Text style={styles.h2}>
          Grubunuz %{mix.percent} {lowName}.
        </Text>
        <View style={styles.elements}>
          {ELEMENTS.map((e, i) => (
            <View key={e} style={styles.row}>
              <Text style={[styles.mono, styles.elementName]}>{e.toLocaleUpperCase('tr')}</Text>
              <View style={styles.flex}>
                <Bar filled={mix.counts[i]} total={mix.total} label={`${e}: ${mix.counts[i]} kişi`} />
              </View>
              <Text style={styles.mono}>{mix.counts[i]}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section last>
        <Label>ROLLER</Label>
        {known.map((p, i) => {
          const e = elementOf(p.sun);
          return (
            <View key={p.id} style={[styles.li, i === known.length - 1 && styles.liLast]}>
              <Initial name={p.name} outline={p.me} />
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.monoS}>
                {ROLES[e].toLocaleUpperCase('tr')} · {ELEMENTS[e].toLocaleUpperCase('tr')}
              </Text>
            </View>
          );
        })}
        <View style={styles.share}>
          <Button variant="ghost" onPress={share}>
            Grup kartını paylaş
          </Button>
        </View>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, color: colors.fg },
  body: { fontSize: 14, lineHeight: 22, color: colors.mute },
  elements: { marginTop: 20, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  mono: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.3, color: colors.fg },
  elementName: { width: 70 },
  monoS: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  li: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  liLast: { borderBottomWidth: 0 },
  name: { flex: 1, fontFamily: fonts.serif, fontSize: 16, lineHeight: 21, color: colors.fg },
  share: { marginTop: 16, alignItems: 'flex-start' },
});
