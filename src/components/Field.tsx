import { locale } from '@/i18n/lang';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors, fonts } from '@/theme';

type Props = TextInputProps & {
  label: string;
  /** Alanın altında gösterilen kısa not veya hata. */
  note?: string;
};

export function Field({ label, note, style, ...input }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toLocaleUpperCase(locale())}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        selectionColor={colors.black}
        style={[styles.input, style]}
        {...input}
      />
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },
  label: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, color: colors.mute },
  input: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.fg,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  note: { marginTop: 8, fontSize: 13, lineHeight: 18, color: colors.body },
});
