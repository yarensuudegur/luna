import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

/** Prototipteki .bar: `total` kutudan `filled` tanesi dolu. */
export function Bar({ filled, total = 10, label }: { filled: number; total?: number; label?: string }) {
  return (
    <View
      style={styles.bar}
      accessible={label !== undefined}
      accessibilityLabel={label}
      accessibilityRole={label !== undefined ? 'progressbar' : undefined}
      accessibilityValue={label !== undefined ? { min: 0, max: total, now: filled } : undefined}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.cell, i < filled && styles.on]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 3 },
  cell: { width: 9, height: 9, borderWidth: 1, borderColor: colors.fg },
  on: { backgroundColor: colors.fg },
});
