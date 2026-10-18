import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { rng } from '@/lib/daily/rng';
import { colors } from '@/theme';

type Star = { x: number; y: number; size: number; alpha: number };

/** Prototipteki #stars: 180 sabit, 70 yanıp sönen yıldız; %8'i 2 px. */
function makeStars(n: number, seed: string): Star[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    x: r() * 100,
    y: r() * 100,
    size: r() < 0.08 ? 2 : 1,
    alpha: 0.3 + r() * 0.7,
  }));
}

function Layer({ stars }: { stars: Star[] }) {
  return (
    <>
      {stars.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: s.size,
            backgroundColor: colors.white,
            opacity: s.alpha,
          }}
        />
      ))}
    </>
  );
}

export function Stars() {
  const still = useMemo(() => makeStars(180, 'stars-still'), []);
  const twinkle = useMemo(() => makeStars(70, 'stars-twinkle'), []);
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Layer stars={still} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulse }]}>
        <Layer stars={twinkle} />
      </Animated.View>
    </View>
  );
}
