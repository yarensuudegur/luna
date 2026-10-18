import { locale } from '@/i18n/lang';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextProps, ViewStyle } from 'react-native';
import { colors, fonts, layout } from '@/theme';

/** Prototipteki .sec: yatay boşluklu, altında ince çizgi olan bölüm. */
export function Section({
  children,
  style,
  last,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Alt çizgiyi kaldırır. */
  last?: boolean;
}) {
  return <View style={[styles.sec, last && styles.last, style]}>{children}</View>;
}

/** Prototipteki .lbl: Space Mono, büyük harfli gri etiket. */
export function Label({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.lbl, style]}>
      {typeof children === 'string' ? children.toLocaleUpperCase(locale()) : children}
    </Text>
  );
}

/** Prototipteki .link: altı çizili küçük mono metin. */
export function LinkText({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.link, style]}>
      {typeof children === 'string' ? children.toLocaleUpperCase(locale()) : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  sec: {
    paddingVertical: 28,
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  last: { borderBottomWidth: 0 },
  lbl: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.mute,
    marginBottom: 14,
  },
  link: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.fg,
    textDecorationLine: 'underline',
  },
});
