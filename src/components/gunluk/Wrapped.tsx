import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { up } from '@/lib/bottle';
import type { MonthSlide } from '@/lib/bottle';
import { colors, fonts, layout } from '@/theme';

type Props = {
  visible: boolean;
  /** "Ekim" gibi ay adı. */
  month: string;
  /** Kullanıcının adı. */
  name: string;
  slides: readonly MonthSlide[];
  onClose: () => void;
};

/** Aylık özet story'si (prototipteki wrapped): dokununca ilerler, sonda paylaşılır. */
export function Wrapped({ visible, month, name, slides, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const last = i === slides.length - 1;
  const [label, title, sub] = slides[i] ?? ['', '', ''];

  function close() {
    onClose();
    setI(0);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <Pressable
        style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}
        onPress={() => setI((n) => Math.min(slides.length - 1, n + 1))}
        accessibilityLabel="Sonraki"
      >
        <View>
          <View style={styles.bars}>
            {slides.map((_, j) => (
              <View key={j} style={[styles.bar, j <= i && styles.barOn]} />
            ))}
          </View>
          <View style={styles.head}>
            <Text style={styles.mono}>{up(`${name} · ${month} özeti`)}</Text>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={12}>
              <Text style={styles.mono}>✕</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View key={i} entering={FadeIn.duration(450)}>
          <Text style={[styles.mono, styles.dim]}>{label}</Text>
          <Text style={styles.title}>{title}</Text>
          {!!sub && <Text style={styles.sub}>{sub}</Text>}
        </Animated.View>

        <View style={styles.foot}>
          <Text style={[styles.mono, styles.faint]}>{last ? 'SON' : 'DOKUN · İLERİ'}</Text>
          {last && (
            <Pressable
              style={styles.share}
              accessibilityRole="button"
              onPress={() => Share.share({ message: slides.map((s) => `${s[0]}: ${s[1]}`).join('\n') })}
            >
              <Text style={styles.mono}>PAYLAŞ</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.fg, justifyContent: 'space-between', paddingHorizontal: layout.screenPadding },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  barOn: { backgroundColor: colors.white },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  mono: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.white },
  dim: { opacity: 0.7 },
  faint: { opacity: 0.6 },
  title: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 68, color: colors.white, marginTop: 12 },
  sub: { fontSize: 15, lineHeight: 22, color: colors.white, opacity: 0.85, marginTop: 14, maxWidth: 300 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
  share: { borderWidth: 1, borderColor: colors.white, paddingHorizontal: 18, minHeight: 48, justifyContent: 'center' },
});
