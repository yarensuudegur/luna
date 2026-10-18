import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '@/theme';

type Props = {
  children: string;
  onPress: () => void;
  variant?: 'solid' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ children, onPress, variant = 'solid', disabled, loading }: Props) {
  const ghost = variant === 'ghost';
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      style={[styles.btn, ghost && styles.ghost, inactive && styles.inactive]}
    >
      {loading ? (
        <ActivityIndicator color={ghost ? colors.fg : colors.white} />
      ) : (
        <Text style={[styles.label, ghost && styles.labelGhost]}>{children.toLocaleUpperCase('tr')}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fg,
    borderWidth: 1,
    borderColor: colors.fg,
  },
  ghost: { backgroundColor: 'transparent' },
  inactive: { opacity: 0.35 },
  label: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.5, color: colors.white },
  labelGhost: { color: colors.fg },
});
