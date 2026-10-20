import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { formatTopDate, fromDateKey } from '@/lib/date';
import { useSavedList } from '@/lib/saved';
import { useToday } from '@/lib/today';
import { colors, fonts, layout } from '@/theme';

/** Sen › Kaydedilenler: Derine in'de kaydedilen günlük yorumlar; dokununca o günün yorumu açılır. */
export function SavedPanel({ userId }: { userId: string | undefined }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { select, openDeep } = useToday();
  const saved = useSavedList(userId);

  function open(key: string) {
    select(key);
    openDeep();
    router.navigate('/');
  }

  return (
    <Section last>
      {saved.length > 0 ? (
        saved.map((s) => (
          <Pressable key={s.key} style={styles.li} onPress={() => open(s.key)} accessibilityRole="button">
            <View style={styles.grow}>
              <Text style={styles.mono}>{formatTopDate(fromDateKey(s.key))}</Text>
              <Text style={styles.title}>{s.h}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        ))
      ) : (
        <Text style={styles.empty}>{t('gunluk.savedEmpty')}</Text>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  li: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  grow: { flex: 1 },
  mono: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute },
  title: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23, color: colors.fg, marginTop: 4 },
  arrow: { fontFamily: fonts.mono, fontSize: 14, color: colors.fg },
  empty: { fontSize: 14, lineHeight: 22.7, color: colors.body },
});
