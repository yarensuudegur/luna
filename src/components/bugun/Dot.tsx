import { StyleSheet, View } from 'react-native';
import type { LuckState } from '@/lib/daily';
import { colors } from '@/theme';

type Kind = 'outline' | 'half' | 'filled' | 'dashed';

/** Şans bölümleri ile Derine in listesi durumları farklı doldurur (prototipteki gibi). */
const LUCK_KINDS: Record<LuckState, Kind> = { 0: 'outline', 1: 'half', 2: 'filled', 3: 'dashed' };
const DEEP_KINDS: Record<LuckState, Kind> = { 0: 'filled', 1: 'half', 2: 'outline', 3: 'dashed' };

function Dot({ kind }: { kind: Kind }) {
  return (
    <View
      style={[styles.dot, kind === 'filled' && styles.filled, kind === 'dashed' && styles.dashed]}
    >
      {kind === 'half' && <View style={styles.half} />}
    </View>
  );
}

export function LuckDot({ state }: { state: LuckState }) {
  return <Dot kind={LUCK_KINDS[state]} />;
}

export function DeepDot({ state }: { state: LuckState }) {
  return <Dot kind={DEEP_KINDS[state]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: colors.fg,
    overflow: 'hidden',
  },
  filled: { backgroundColor: colors.fg },
  dashed: { borderStyle: 'dashed' },
  half: { width: 3, height: 7, backgroundColor: colors.fg },
});
