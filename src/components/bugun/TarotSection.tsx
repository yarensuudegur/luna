import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Label, Section } from '@/components/Section';
import { TAROT } from '@/lib/daily';
import { countdownToMidnight } from '@/lib/date';
import type { TarotState } from '@/lib/tarot';
import { colors, fonts } from '@/theme';

const CARD_COUNT = 22;
const FAN_SPAN = 56;
/** Yelpazenin dönme merkezi, kart yüksekliğinin %230'u kadar aşağıda. */
const CARD_W = 62;
const CARD_H = 102;
const PIVOT = CARD_H * 2.3;
const FAN_RADIUS = PIVOT - CARD_H / 2;

/** Prototipteki tarotArt: kartın numarasına göre değişen çizgisel desen. */
export function TarotArt({ index, size }: { index: number; size: number }) {
  const s = size;
  const c = s / 2;
  const m = index % 6;
  const n = 6 + (index % 5) * 2;
  const stroke = { stroke: colors.fg, fill: 'none', strokeWidth: 1 } as const;
  const items: React.ReactNode[] = [];

  if (m === 0) {
    items.push(<Circle key="c" cx={c} cy={c} r={s * 0.16} {...stroke} />);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      items.push(
        <Line
          key={k}
          x1={c + Math.cos(a) * s * 0.22}
          y1={c + Math.sin(a) * s * 0.22}
          x2={c + Math.cos(a) * s * 0.4}
          y2={c + Math.sin(a) * s * 0.4}
          stroke={colors.fg}
        />,
      );
    }
  } else if (m === 1) {
    const x = c + s * 0.08;
    items.push(
      <Path
        key="p"
        d={`M ${x} ${c - s * 0.3} A ${s * 0.3} ${s * 0.3} 0 1 0 ${x} ${c + s * 0.3} A ${s * 0.22} ${s * 0.3} 0 1 1 ${x} ${c - s * 0.3} Z`}
        {...stroke}
      />,
    );
    for (let k = 0; k < 3; k++) {
      items.push(<Circle key={k} cx={c + s * (0.22 + k * 0.06)} cy={c - s * (0.2 - k * 0.18)} r={1.4} fill={colors.fg} />);
    }
  } else if (m === 2) {
    const pts = n / 2 + 3;
    let d = '';
    for (let k = 0; k < pts * 2; k++) {
      const a = (k / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 ? s * 0.14 : s * 0.38;
      d += `${k ? 'L' : 'M'}${(c + Math.cos(a) * r).toFixed(1)} ${(c + Math.sin(a) * r).toFixed(1)}`;
    }
    items.push(<Path key="p" d={`${d}Z`} {...stroke} />);
  } else if (m === 3) {
    for (let k = 1; k <= 4; k++) items.push(<Circle key={k} cx={c} cy={c} r={s * 0.09 * k} {...stroke} />);
    items.push(<Circle key="dot" cx={c} cy={c} r={2} fill={colors.fg} />);
  } else if (m === 4) {
    items.push(
      <Path key="p" d={`M ${c} ${c - s * 0.38} L ${c + s * 0.3} ${c + s * 0.3} L ${c - s * 0.3} ${c + s * 0.3} Z`} {...stroke} />,
    );
    for (let k = 1; k < 4; k++) {
      const y = c - s * 0.38 + (s * 0.68 * k) / 4;
      items.push(<Line key={k} x1={c - (s * 0.3 * k) / 4} y1={y} x2={c + (s * 0.3 * k) / 4} y2={y} stroke={colors.fg} />);
    }
  } else {
    items.push(<Circle key="c" cx={c} cy={c} r={s * 0.36} {...stroke} />);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI;
      items.push(
        <Line
          key={k}
          x1={c - Math.cos(a) * s * 0.36}
          y1={c - Math.sin(a) * s * 0.36}
          x2={c + Math.cos(a) * s * 0.36}
          y2={c + Math.sin(a) * s * 0.36}
          stroke={colors.fg}
          strokeWidth={0.7}
        />,
      );
    }
  }
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${s} ${s}`}>
      {items}
    </Svg>
  );
}

/** Siyah kart arkası: çerçeve ve ortada halkalar. */
function CardBack({ radius }: { radius: number }) {
  return (
    <View style={[styles.back, { borderRadius: radius }]}>
      <View style={styles.backFrame} />
      <Svg style={styles.backMark} viewBox="0 0 40 40">
        <Circle cx={20} cy={20} r={9} fill="none" stroke={colors.white} strokeWidth={0.7} />
        <Circle cx={20} cy={20} r={15} fill="none" stroke={colors.white} strokeWidth={0.5} strokeDasharray="1 2" />
        <Circle cx={20} cy={20} r={1.5} fill={colors.white} />
      </Svg>
    </View>
  );
}

function CardFace({ index, reversed }: { index: number; reversed: boolean }) {
  const [num, name] = TAROT[index];
  return (
    <View style={styles.face}>
      <Text style={styles.faceNum}>{num}</Text>
      <View style={[styles.faceArt, reversed && { transform: [{ rotate: '180deg' }] }]}>
        <TarotArt index={index} size={90} />
      </View>
      <View style={styles.faceNameWrap}>
        <Text style={styles.faceName}>{name}</Text>
        {reversed && <Text style={styles.faceRev}>TERS</Text>}
      </View>
    </View>
  );
}

/** Seçilen kartın arkası çevrilip önü görünür. */
function FlipCard({ index, reversed, animate }: { index: number; reversed: boolean; animate: boolean }) {
  const t = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.timing(t, {
      toValue: 1,
      duration: 900,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [animate, t]);

  const backRot = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const frontRot = t.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <View style={styles.flipWrap}>
      <Animated.View style={[styles.flipSide, { transform: [{ perspective: 900 }, { rotateY: backRot }] }]}>
        <CardBack radius={5} />
      </Animated.View>
      <Animated.View style={[styles.flipSide, { transform: [{ perspective: 900 }, { rotateY: frontRot }] }]}>
        <CardFace index={index} reversed={reversed} />
      </Animated.View>
    </View>
  );
}

function FanCard({ i, picked, lift, fade, onPress }: {
  i: number;
  picked: number | null;
  lift: Animated.Value;
  fade: Animated.Value;
  onPress: (i: number) => void;
}) {
  const angle = -FAN_SPAN / 2 + i * (FAN_SPAN / (CARD_COUNT - 1));
  const rad = (angle * Math.PI) / 180;
  const tx = FAN_RADIUS * Math.sin(rad);
  const ty = FAN_RADIUS * (1 - Math.cos(rad));
  const isPicked = picked === i;

  const transform = isPicked
    ? [
        { translateX: lift.interpolate({ inputRange: [0, 1], outputRange: [tx, 0] }) },
        { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [ty, -30] }) },
        { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: [`${angle}deg`, '0deg'] }) },
        { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
      ]
    : [{ translateX: tx }, { translateY: ty }, { rotate: `${angle}deg` }];

  return (
    <Animated.View style={[styles.fanCard, { opacity: picked !== null && !isPicked ? fade : 1, transform }]}>
      <Pressable
        onPress={() => onPress(i)}
        disabled={picked !== null}
        accessibilityRole="button"
        accessibilityLabel={`${i + 1}. kart`}
        style={styles.fill}
      >
        <CardBack radius={4} />
      </Pressable>
    </Animated.View>
  );
}

function Fan({ onPick }: { onPick: () => Promise<boolean> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const lift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  const press = (i: number) => {
    setPicked(i);
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(async () => {
      const ok = await onPick();
      if (!ok) {
        lift.setValue(0);
        fade.setValue(1);
        setPicked(null);
      }
    });
  };

  return (
    <View style={styles.fan}>
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <FanCard key={i} i={i} picked={picked} lift={lift} fade={fade} onPress={press} />
      ))}
    </View>
  );
}

function Countdown() {
  const [text, setText] = useState(countdownToMidnight);
  useEffect(() => {
    const id = setInterval(() => setText(countdownToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  return <Text style={styles.count}>YENİ KART {text}</Text>;
}

/** Günün tarot kartı: 22 kartlık yelpaze, seçilince çevrilir. Günde bir kart. */
export function TarotSection({ tarot }: { tarot: TarotState }) {
  const { loading, drawn, error, draw } = tarot;
  // Bu oturumda çekildiyse çevirme animasyonu oynar, kayıttan geldiyse kart açık gelir.
  const freshlyDrawn = useRef(false);

  if (drawn) {
    const c = TAROT[drawn.card];
    return (
      <Section style={styles.center}>
        <View style={styles.headRow}>
          <Label style={styles.noMargin}>Günün kartı</Label>
          <Countdown />
        </View>
        <View style={{ marginTop: 18 }}>
          <FlipCard index={drawn.card} reversed={drawn.reversed} animate={freshlyDrawn.current} />
        </View>
        <View style={styles.stack}>
          <Text style={styles.h1}>
            {c[1]}
            {drawn.reversed ? ', ters' : ''}.
          </Text>
          <Text style={styles.body}>
            Bugün bu enerji olabilir: {(drawn.reversed ? c[3] : c[2]).toLocaleLowerCase('tr')}
          </Text>
          <Text style={[styles.body, { color: colors.mute }]}>{c[4]}</Text>
        </View>
      </Section>
    );
  }

  return (
    <Section style={styles.center}>
      <Label>Günün kartı</Label>
      <Text style={styles.h1}>Desteden bir kart seç.</Text>
      {loading ? (
        <View style={styles.fan} />
      ) : (
        <Fan
          onPick={() => {
            freshlyDrawn.current = true;
            return draw();
          }}
        />
      )}
      {error && <Text style={styles.error}>Kart şu an kaydedilemedi. Biraz sonra tekrar dene.</Text>}
    </Section>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  fill: { flex: 1 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch' },
  noMargin: { marginBottom: 0 },
  count: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: colors.mute },
  h1: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 39, letterSpacing: -0.3, color: colors.fg, textAlign: 'center' },
  stack: { marginTop: 20, gap: 12, alignItems: 'center' },
  body: { fontSize: 14, lineHeight: 22.7, color: colors.fg, textAlign: 'center' },
  error: { marginTop: 8, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.mute, textAlign: 'center' },
  fan: { alignSelf: 'stretch', height: 200, marginTop: 10, marginHorizontal: -20, overflow: 'hidden' },
  fanCard: { position: 'absolute', left: '50%', top: 34, width: CARD_W, height: CARD_H, marginLeft: -CARD_W / 2 },
  back: { flex: 1, backgroundColor: colors.fg, borderWidth: 1, borderColor: colors.fg, overflow: 'hidden' },
  backFrame: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 2,
    opacity: 0.55,
  },
  backMark: { position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%' },
  flipWrap: { width: 170, height: 280 },
  flipSide: { ...StyleSheet.absoluteFill, backfaceVisibility: 'hidden' },
  face: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.fg,
    borderRadius: 5,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  faceNum: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.fg },
  faceArt: { width: '86%', flex: 1 },
  faceNameWrap: { alignItems: 'center' },
  faceName: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 20, color: colors.fg, textAlign: 'center' },
  faceRev: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
});
