import { locale } from '@/i18n/lang';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Initial } from '@/components/arkadaslar/Initial';
import { signsLine } from '@/components/arkadaslar/FriendSheet';
import { Label, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { relName } from '@/i18n/names';
import type { Friend } from '@/lib/friends';
import type { NowPlaying } from '@/lib/songs';
import { colors, fonts, layout } from '@/theme';

type Props = {
  friends: Friend[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onAdd: () => void;
  onOpen: (friend: Friend) => void;
  /** Arkadaş id → son 24 saatte koyduğu şarkı. */
  songs?: Record<string, NowPlaying>;
};

/** Kişiler alt sekmesi: "Ekle +" ve arkadaş listesi. */
export function PeopleTab({ friends, loading, error, onRetry, onAdd, onOpen, songs = {} }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Section style={styles.intro}>
        <View style={styles.introText}>
          <Label style={styles.noMargin}>{t('friends.nearby')}</Label>
          <Text style={styles.h2}>{t('friends.sideBySide')}</Text>
        </View>
        <View style={styles.add}>
          <Button onPress={onAdd}>{t('friends.addButton')}</Button>
        </View>
      </Section>

      <Section last>
        {error ? (
          <>
            <Text style={styles.body}>{t('friends.loadError')}</Text>
            <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>{t('common.retry').toLocaleUpperCase(locale())}</Text>
            </Pressable>
          </>
        ) : loading ? (
          <Label style={styles.noMargin}>{t('common.loading')}</Label>
        ) : friends.length === 0 ? (
          <Text style={styles.body}>{t('friends.empty')}</Text>
        ) : (
          <>
            <Label>{t(friends.length === 1 ? 'common.peopleCountOne' : 'common.peopleCount', { n: friends.length })}</Label>
            {friends.map((f, i) => (
              <Pressable
                key={f.id}
                onPress={() => onOpen(f)}
                accessibilityRole="button"
                accessibilityLabel={`${f.name}, ${relName(f.rel)}`}
                style={[styles.li, i === friends.length - 1 && styles.liLast]}
              >
                <Initial name={f.name} />
                <View style={styles.grow}>
                  <Text style={styles.name}>{f.name}</Text>
                  {signsLine(f) !== '' && <Text style={styles.signs}>{signsLine(f)}</Text>}
                  {songs[f.id] && (
                    <Text style={styles.song} numberOfLines={1}>
                      ♫ {songs[f.id].song.title} · {songs[f.id].song.artist}
                    </Text>
                  )}
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{relName(f.rel).toLocaleUpperCase(locale())}</Text>
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
  body: { fontSize: 14, lineHeight: 22, color: colors.body },
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
  song: { fontSize: 12, lineHeight: 17, color: colors.body, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: colors.black, paddingVertical: 5, paddingHorizontal: 8 },
  chipText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.1, color: colors.fg },
});
