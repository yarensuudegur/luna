import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from '@/i18n';
import { rng } from '@/lib/daily';
import { colors, fonts } from '@/theme';
import { useFrameWidth } from '@/lib/use-frame-width';

/** Prototipteki theEnd ile aynı çizim uzayı; SVG "xMidYMax slice" ile ekrana oturur. */
const W = 400;
const H = 290;
const CX = 200;
/** Eski genişlikteki yay: kenarları ekranın iki yanına değer. Alt kısmı H ile kırpılır. */
const R0 = 250;
const TOP = 150;
const CY = TOP + R0;
/** Siyah alanın tab bar'a doğru uzanan kısa payı. */
const TAIL = 16;
const MOTE_COUNT = 34;
const STAR_COUNT = 55;

type MoteSpec = {
  x: number;
  y: number;
  size: number;
  /** Bir turun süresi, ms. */
  duration: number;
  /** Başlangıçta turun ne kadarı geçmiş olsun [0, 1). */
  phase: number;
  dx: number;
  dy: number;
  opacity: number;
};

function buildScene(seed: string) {
  const r = rng(`end${seed}`);
  const stars: Array<{ x: number; y: number; r: number; o: number }> = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const x = r() * W;
    const y = r() * 130;
    const rr = r() < 0.15 ? 1.3 : 0.7;
    stars.push({ x, y, r: rr, o: 0.35 + r() * 0.65 });
  }

  // Elle çizilmiş gibi: dairenin yarısına, farklı sıklıkta küçük dalgalar bindirilir.
  const p1 = r() * 6.28;
  const p2 = r() * 6.28;
  const p3 = r() * 6.28;
  const p4 = r() * 6.28;
  let hill = '';
  for (let a = 180; a <= 360; a += 1.2) {
    const t = (a * Math.PI) / 180;
    const rad =
      R0 +
      1.1 * Math.sin(4 * t + p1) +
      0.8 * Math.sin(9 * t + p2) +
      0.55 * Math.sin(19 * t + p3) +
      0.35 * Math.sin(37 * t + p4) +
      0.25 * Math.sin(61 * t + p1);
    hill += `${hill ? 'L' : 'M'}${(CX + rad * Math.cos(t)).toFixed(2)} ${(CY + rad * Math.sin(t)).toFixed(2)} `;
  }
  hill += `L ${W + 40} ${H + 10} L -40 ${H + 10} Z`;

  const r2 = rng(`motes${seed}`);
  const motes: MoteSpec[] = [];
  for (let i = 0; i < MOTE_COUNT; i++) {
    const x = 60 + r2() * 280;
    const y = CY - Math.sqrt(R0 * R0 - (x - CX) * (x - CX)) - 2;
    const size = 1.2 + r2() * 2.2;
    const t = 7 + r2() * 7;
    const delay = r2() * 14;
    motes.push({
      x,
      y,
      size,
      duration: t * 1000,
      phase: (delay % t) / t,
      dx: r2() * 24 - 12,
      dy: -90 - r2() * 90,
      opacity: 0.45 + r2() * 0.55,
    });
  }
  return { stars, hill, motes };
}

/** Tepeden yukarı süzülüp sönen tek parçacık; yalnızca native sürücülü dönüşümler kullanır. */
const Mote = memo(function Mote({ spec, left, top, active }: { spec: MoteSpec; left: number; top: number; active: boolean }) {
  const v = useRef(new Animated.Value(spec.phase)).current;

  useEffect(() => {
    if (!active) return;
    v.setValue(spec.phase);
    let loop: Animated.CompositeAnimation | null = null;
    const first = Animated.timing(v, {
      toValue: 1,
      duration: (1 - spec.phase) * spec.duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    first.start(({ finished }) => {
      if (!finished) return;
      v.setValue(0);
      loop = Animated.loop(
        Animated.timing(v, { toValue: 1, duration: spec.duration, easing: Easing.linear, useNativeDriver: true }),
      );
      loop.start();
    });
    return () => {
      first.stop();
      loop?.stop();
    };
  }, [active, spec, v]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        {
          left,
          top,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          opacity: v.interpolate({ inputRange: [0, 0.12, 0.75, 1], outputRange: [0, spec.opacity, spec.opacity, 0] }),
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, spec.dx] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, spec.dy] }) },
          ],
        },
      ]}
    />
  );
});

type Props = {
  /** Çizimi güne göre değiştiren tohum (seçili gün). */
  seed: string;
  /** Sekme görünür değilken animasyon durur. */
  active: boolean;
  /** "Gelecekteki kendine bir mesaj gönder" bağlantısına basılınca. */
  onFuture: () => void;
};

/** "Bugünlük bu kadar." tepesi: dalgalı siyah yarım daire, yıldızlar ve yükselen parçacıklar. */
export function TheEnd({ seed, active, onFuture }: Props) {
  const width = useFrameWidth();
  const { t } = useTranslation();
  const scene = useMemo(() => buildScene(seed), [seed]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const scale = Math.max(width / W, 1);
  const toScreenX = (x: number) => width / 2 + (x - CX) * scale;
  const toScreenY = (y: number) => H - (H - y) * scale;

  return (
    <View style={styles.end}>
      <Svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
        style={styles.svg}
      >
        {scene.stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={colors.black} opacity={s.o} />
        ))}
        <Path d={scene.hill} fill={colors.black} />
      </Svg>
      <View style={styles.fill} />
      {!reduceMotion &&
        scene.motes.map((m, i) => (
          <Mote key={i} spec={m} left={toScreenX(m.x)} top={toScreenY(m.y)} active={active} />
        ))}
      <View style={styles.txt} pointerEvents="box-none">
        <Text style={styles.line}>{t('today.end')}</Text>
        <Pressable onPress={onFuture} accessibilityRole="button" hitSlop={12} style={styles.future}>
          <Text style={styles.futureText}>{t('future.link')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  end: { height: H + TAIL, overflow: 'hidden', backgroundColor: colors.bg },
  svg: { position: 'absolute', top: 0, left: 0 },
  fill: { position: 'absolute', left: 0, right: 0, top: H - 2, bottom: 0, backgroundColor: colors.black },
  mote: { position: 'absolute', backgroundColor: colors.black },
  txt: { position: 'absolute', left: 0, right: 0, top: TOP + 40, alignItems: 'center' },
  line: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 38, paddingBottom: 6, color: colors.white },
  future: { marginTop: 22, paddingHorizontal: 20 },
  futureText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textAlign: 'center',
    color: colors.white,
    textDecorationLine: 'underline',
  },
});
