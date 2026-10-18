import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTopDate } from '@/lib/date';
import { colors, fonts, layout } from '@/theme';

export function TopBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.logo}>LU — NA</Text>
      <Text style={styles.date}>{formatTopDate()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  logo: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2.4, color: colors.fg },
  date: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.3, color: colors.fg },
});
