import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { ART } from '@/lib/art';
import { colors } from '@/theme';

/** Açılışta sırayla gösterilen grunge görseller (assets/art içinden). */
const FRAMES = [0, 2, 4, 6, 9, 11] as const;
const SIZE = 64;
const FRAME_MS = 200;
const FADE_MS = 300;

type Props = {
  /** Oturum, profil ve yazı tipleri yüklendi mi? Yüklenmeden animasyon kapanmaz. */
  ready: boolean;
  /** İlk kare çizildiğinde (splash ekranı bu noktada kapanır). */
  onShown?: () => void;
};

/**
 * Splash'tan sonra 1,5 saniyelik giriş: kırık beyaz zeminin ortasında görseller hızla değişir,
 * sonuncudan sonra (ve yükleme bittiyse) ana ekran yumuşakça belirir.
 */
export function Intro({ ready, onShown }: Props) {
  const [frame, setFrame] = useState(0);
  const [played, setPlayed] = useState(false);
  const [gone, setGone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    onShown?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (frame >= FRAMES.length - 1) {
      const id = setTimeout(() => setPlayed(true), FRAME_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setFrame((f) => f + 1), FRAME_MS);
    return () => clearTimeout(id);
  }, [frame]);

  useEffect(() => {
    if (!played || !ready) return;
    Animated.timing(fade, {
      toValue: 0,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setGone(true));
  }, [played, ready, fade]);

  if (gone) return null;

  return (
    <Animated.View
      style={[styles.root, { opacity: fade }]}
      pointerEvents={played && ready ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.box}>
        <Image source={ART[FRAMES[frame]].source} style={styles.image} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: { width: SIZE, height: SIZE },
  image: { width: SIZE, height: SIZE },
});
