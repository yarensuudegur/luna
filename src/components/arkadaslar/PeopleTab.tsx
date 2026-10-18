import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Initial } from '@/components/arkadaslar/Initial';
import { signsLine } from '@/components/arkadaslar/FriendSheet';
import { Label, Section } from '@/components/Section';
import type { Friend } from '@/lib/friends';
import { colors, fonts, layout } from '@/theme';

type Props = {
  friends: Friend[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onAdd: () => void;
  onOpen: (friend: Friend) => void;
};

/** Kişiler alt sekmesi: "Ekle +" ve arkadaş listesi. */
export function PeopleTab({ friends, loading, error, onRetry, onAdd, onOpen }: Props) {
  return (
    <>
      <Section style={styles.intro}>
        <View style={styles.introText}>
          <Label style={styles.noMargin}>YAKININDAKİLER</Label>
          <Text style={styles.h2}>Haritalarınızı yan yana koyun.</Text>
        </View>
        <View style={styles.add}>
          <Button onPress={onAdd}>Ekle +</Button>
        </View>
      </Section>

      <Section last>
        {error ? (
          <>
            <Text style={styles.body}>Arkadaşların yüklenemedi.</Text>
            <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>TEKRAR DENE</Text>
            </Pressable>
          </>
        ) : loading ? (
          <Label style={styles.noMargin}>YÜKLENİYOR</Label>
        ) : friends.length === 0 ? (
          <Text style={styles.body}>Henüz kimse yok. “Ekle +” ile ilk arkadaşını ekle.</Text>
        ) : (
          <>
            <Label>{friends.length} KİŞİ</Label>
            {friends.map((f, i) => (
              <Pressable
                key={f.id}
                onPress={() => onOpen(f)}
                accessibilityRole="button"
                accessibilityLabel={`${f.name}, ${f.rel}`}
                style={[styles.li, i === friends.length - 1 && styles.liLast]}
              >
                <Initial name={f.name} />
                <View style={styles.grow}>
                  <Text style={styles.name}>{f.name}</Text>
                  {signsLine(f) !== '' && <Text style={styles.signs}>{signsLine(f)}</Text>}
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{f.rel.toLocaleUpperCase('tr')}</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  introText: { flex: 1 },
  add: { flexShrink: 0 },
  noMargin: { marginBottom: 0 },
  h2: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, color: colors.fg, marginTop: 14 },
  body: { fontSize: 14, lineHeight: 22, color: colors.mute },
  retry: { marginTop: 14 },
  retryText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.fg,
    textDecorationLine: 'underline',
  },
  li: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  liLast: { borderBottomWidth: 0 },
  grow: { flex: 1 },
  name: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 24, color: colors.fg },
  signs: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.mute, marginTop: 3 },
  chip: { borderWidth: 1, borderColor: colors.fg, paddingVertical: 5, paddingHorizontal: 8 },
  chipText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.1, color: colors.fg },
});
