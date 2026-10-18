import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme';

/** Kısa süre görünen bildirim; `node` ekranın en altına konur. */
export function useToast() {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setText(message);
    timer.current = setTimeout(() => setText(null), 2400);
  }, []);

  const node = text ? (
    <View style={styles.toast} pointerEvents="none">
      <Text style={styles.text}>{text.toLocaleUpperCase('tr')}</Text>
    </View>
  ) : null;

  return { show, node };
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 16,
    maxWidth: '90%',
    backgroundColor: colors.fg,
    paddingVertical: 11,
    paddingHorizontal: 14,
    zIndex: 70,
  },
  text: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: colors.white },
});
