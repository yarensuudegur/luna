import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';

const COUNT = 140;
const FOAM = 26;
const GRAVITY = 430;

type Particle = { foam: boolean; size: number; vx: number; vy: number; dur: number; delay: number };

function makeParticles(): Particle[] {
  const base = -80;
  return Array.from({ length: COUNT }, (_, i) => {
    const foam = i < FOAM;
    const size = foam ? 7 + Math.random() * 12 : 2 + Math.random() * 6;
    const ang = ((base + (Math.random() * 46 - 23)) * Math.PI) / 180;
    const speed = (foam ? 120 : 170) + Math.random() * 230;
    return {
      foam,
      size,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      dur: 1.5 + Math.random(),
      delay: Math.random() * 260,
    };
  });
}

function Drop({ p, x, y }: { p: Particle; x: number; y: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(p.delay, withTiming(1, { duration: p.dur * 1000, easing: Easing.linear }));
  }, [progress, p.delay, p.dur]);

  const style = useAnimatedStyle(() => {
    const t = progress.value * p.dur;
    return {
      opacity: progress.value < 0.5 ? 1 : Math.max(0, 1 - (progress.value - 0.5) * 2),
      transform: [{ translateX: p.vx * t }, { translateY: p.vy * t + 0.5 * GRAVITY * t * t }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.drop,
        p.foam && styles.foam,
        { left: x - p.size / 2, top: y - p.size / 2, width: p.size, height: p.size, borderRadius: p.size / 2 },
        style,
      ]}
    />
  );
}

/** Şampanya gibi fışkıran damlalar ve köpük; (x, y) şişe ağzının bölüm içindeki konumu. */
export function Spray({ x, y }: { x: number; y: number }) {
  const particles = useMemo(makeParticles, []);
  return (
    <>
      {particles.map((p, i) => (
        <Drop key={i} p={p} x={x} y={y} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  drop: { position: 'absolute', backgroundColor: colors.black, zIndex: 6, pointerEvents: 'none' },
  foam: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.black },
});
