import { locale } from '@/i18n/lang';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Bar } from '@/components/arkadaslar/Bar';
import { Initial } from '@/components/arkadaslar/Initial';
import { Label, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { elementName, roleName } from '@/i18n/names';
import { elementOf, groupMix } from '@/lib/astro';
import { colors, fonts, layout } from '@/theme';
import { useShare } from '@/lib/share';

export type MapPerson = { id: string; name: string; sun: number | null; me?: boolean };

/** Grup haritası alt sekmesi: element dağılımı ve roller (sen + arkadaşların). */
export function GroupMapTab({ people }: { people: MapPerson[] }) {
  const { t } = useTranslation();
  const known = people.filter((p): p is MapPerson & { sun: number } => p.sun !== null);
  const mix = groupMix(known.map((p) => p.sun));
  const lowName = elementName(mix.dominant).toLocaleLowerCase(locale());

  const { share: shareMsg, copied } = useShare();
  const share = () => shareMsg(t('friends.map.shareMessage', { percent: mix.percent, element: lowName }));

  if (known.length < 2) {
    return (
      <Section last>
        <Label>{t('friends.map.label')}</Label>
        <Text style={styles.body}>{t('friends.map.empty')}</Text>
      </Section>
    );
  }

  return (
    <>
      <Section>
        <Label>{t('friends.map.labelPeople', { n: mix.total })}</Label>
        <Text style={styles.h2}>{t('friends.map.headline', { percent: mix.percent, element: lowName })}</Text>
        <View style={styles.elements}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.mono, styles.elementName]}>{elementName(i).toLocaleUpperCase(locale())}</Text>
              <View style={styles.flex}>
                <Bar
                  filled={mix.counts[i]}
                  total={mix.total}
                  label={t('friends.map.barA11y', { element: elementName(i), n: mix.counts[i] })}
                />
              </View>
              <Text style={styles.mono}>{mix.counts[i]}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section last>
        <Label>{t('friends.map.roles')}</Label>
        {known.map((p, i) => {
          const e = elementOf(p.sun);
          return (
            <View key={p.id} style={[styles.li, i === known.length - 1 && styles.liLast]}>
              <Initial name={p.name} outline={p.me} />
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.monoS}>
                {roleName(e).toLocaleUpperCase(locale())} · {elementName(e).toLocaleUpperCase(locale())}
              </Text>
            </View>
          );
        })}
        <View style={styles.share}>
          <Button variant="ghost" onPress={share}>
            {copied ? t('common.copied') : t('friends.map.shareBtn')}
          </Button>
        </View>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, color: colors.fg },
  body: { fontSize: 14, lineHeight: 22, color: colors.body },
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
