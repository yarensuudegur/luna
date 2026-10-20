import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setLanguage, useLang, useTranslation } from '@/i18n';
import type { Lang } from '@/i18n';
import { colors, fonts } from '@/theme';

const LANGS: readonly Lang[] = ['tr', 'en'];

/** Kayıt ve giriş ekranlarının sağ üstündeki "TR | EN" dil seçimi; seçim kaydedilir ve uygulamada sürer. */
export function LangSwitch() {
  const lang = useLang();
  const { t } = useTranslation();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t('settings.language')}>
      {LANGS.map((l, i) => (
        <View key={l} style={styles.row}>
          {i > 0 && <Text style={styles.sep}>|</Text>}
          <Pressable
            onPress={() => void setLanguage(l)}
            accessibilityRole="radio"
            accessibilityState={{ selected: l === lang }}
            hitSlop={10}
          >
            <Text style={[styles.text, l === lang ? styles.on : styles.off]}>{l.toUpperCase()}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.6 },
  on: { color: colors.fg, textDecorationLine: 'underline' },
  off: { color: colors.faint },
  sep: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.faint },
});
