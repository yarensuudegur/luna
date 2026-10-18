import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, layout } from '@/theme';

export function ScreenTitle({ children }: { children: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: layout.screenPadding, paddingTop: 28 },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.fg },
});
