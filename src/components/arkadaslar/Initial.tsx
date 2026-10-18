import { locale } from '@/i18n/lang';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme';

type Props = {
  name: string;
  size?: number;
  /** Beyaz zeminli, çerçeveli hâl (prototipteki .avatar.o: "Sen"). */
  outline?: boolean;
};

/** Prototipteki .avatar: siyah daire, içinde adın baş harfi. Yüz ya da emoji yok. */
export function Initial({ name, size = 34, outline }: Props) {
  const letter = (name.trim()[0] ?? '?').toLocaleUpperCase(locale());
  const fontSize = Math.round(size * 0.44);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }, outline && styles.outline]}
    >
      <Text style={[styles.letter, { fontSize, lineHeight: Math.ceil(fontSize * 1.3) }, outline && styles.letterOutline]}>
        {letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  outline: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.black },
  letter: { fontFamily: fonts.serif, color: colors.bg },
  letterOutline: { color: colors.fg },
});
