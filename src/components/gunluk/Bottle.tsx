import MaskedView from '@react-native-masked-view/masked-view';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BOTTLE } from '@/lib/bottle';
import type { OrbSpec } from '@/lib/bottle';
import { colors } from '@/theme';

const bottleImg = require('../../../assets/bottle/bottle.png');
const corkImg = require('../../../assets/bottle/cork.png');
const maskImg = require('../../../assets/bottle/mask.png');

const { width: W, height: H, orb: OS, mouth } = BOTTLE;

/** Şişenin hafif eğimi (prototipte rotate(3deg)). */
export const BOTTLE_TILT = 3;

/** Topların maskesiz uçabilmesi için maskeli katman şişeden bu kadar taşar. */
const PAD = { left: 40, right: 120, top: 340, bottom: 40 };

/** Tıpanın şişe ağzındaki kesim çizgisi: prototipteki clip-path'in eğimi ve geçtiği nokta. */
const CORK_CLIP = { x: 170, y: 58.8, angle: (Math.atan2(81 - 29, 520 + 300) * 180) / Math.PI };
const CORK_BOX = { left: 153.8, top: 6.2, width: 40, height: 46 };

const SHAKE: ReadonlyArray<readonly [rotate: number, scale: number, ms: number]> = [
  [-2, 1, 114],
  [8, 1.01, 133],
  [-1, 1.02, 133],
  [7, 1.02, 133],
  [0, 1.03, 133],
  [6, 1.03, 133],
  [BOTTLE_TILT, 1, 171],
];
const SHAKE_MS = SHAKE.reduce((a, s) => a + s[2], 0);

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type BottleHandle = {
  /** Bir günün toplarını ağızdan düşürmeye hazırlar; ardından `drop` çağrılır. */
  arm: (key: string) => void;
  disarm: () => void;
  /** Hazırlanan günün topları tıpa açıkken ağızdan düşüp yerine oturur, tıpa kapanır. */
  drop: () => Promise<void>;
  /** Şişe çalkalanır, tıpa fırlar, toplar uçar. `onBurst` tıpanın fırladığı anda çağrılır. */
  pop: (onBurst: () => void) => Promise<void>;
};

type OrbMode = 'rest' | 'mouth' | 'popped';

function BottleOrb({ spec, mode, index }: { spec: OrbSpec; mode: OrbMode; index: number }) {
  const startX = mouth[0] - OS / 2;
  const startY = mouth[1] - OS / 2;
  const x = useSharedValue(mode === 'mouth' ? startX : spec.x);
  const y = useSharedValue(mode === 'mouth' ? startY : spec.y);
  const opacity = useSharedValue(mode === 'mouth' ? 0 : 1);
  const bob = useSharedValue(0);
  const first = useRef(true);
  const target = useRef({ x: mouth[0] - 10 + Math.random() * 110, y: mouth[1] - 140 - Math.random() * 220 });

  // Hafif sallanma: 0→1 sonsuz döngü; her top döngüye farklı bir yerden (faz) başlar.
  const phase = ((-spec.d / spec.t) % 1 + 1) % 1;
  useEffect(() => {
    bob.value = 0;
    bob.value = withRepeat(withTiming(1, { duration: spec.t * 1000, easing: Easing.linear }), -1, false);
  }, [bob, spec.t]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (mode !== 'popped') return;
    }
    if (mode === 'mouth') {
      x.value = startX;
      y.value = startY;
      opacity.value = 0;
    } else if (mode === 'rest') {
      const delay = 250 + spec.nth * 160;
      const ease = Easing.bezier(0.35, 0.6, 0.35, 1);
      opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
      x.value = withDelay(delay, withTiming(spec.x, { duration: 1000, easing: ease }));
      y.value = withDelay(delay, withTiming(spec.y, { duration: 1000, easing: ease }));
    } else {
      const ease = Easing.bezier(0.2, 0.7, 0.3, 1);
      const delay = index * 14;
      opacity.value = withDelay(delay, withTiming(0, { duration: 1000 }));
      x.value = withDelay(delay, withTiming(target.current.x, { duration: 1000, easing: ease }));
      y.value = withDelay(delay, withTiming(target.current.y, { duration: 1000, easing: ease }));
    }
  }, [mode, index, spec.nth, spec.x, spec.y, startX, startY, x, y, opacity]);

  const style = useAnimatedStyle(() => {
    const b = (bob.value + phase) % 1;
    return {
    opacity: opacity.value,
    transform: [
      {
        translateX:
          PAD.left + x.value + interpolate(b, [0, 0.33, 0.66, 1], [0, spec.dx, spec.dx * -0.6, 0]),
      },
      {
        translateY:
          PAD.top + y.value + interpolate(b, [0, 0.33, 0.66, 1], [0, spec.dy, spec.dy * 0.5, 0]),
      },
    ],
    };
  });

  return <Animated.View style={[styles.orb, style]} />;
}

type Props = {
  orbs: readonly OrbSpec[];
};

/** Webde require() bir adres metni ya da { uri } döndürür. */
function webUri(src: unknown): string | null {
  if (typeof src === 'string') return src;
  if (src && typeof src === 'object') {
    const o = src as { uri?: unknown; default?: unknown };
    if (typeof o.uri === 'string') return o.uri;
    if (typeof o.default === 'string') return o.default;
    if (o.default && typeof o.default === 'object') return webUri(o.default);
  }
  return null;
}

/**
 * Topları şişenin cam şeklinde kırpar; `open` olunca (patlama) kırpma kalkar.
 * Telefonda MaskedView, webde CSS mask-image (MaskedView webde çalışmaz, maskeyi siyah boyar).
 */
function OrbMask({ open, children }: { open: boolean; children: ReactNode }) {
  const webRef = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Webde View'un ref'i DOM öğesidir; maske CSS'i doğrudan ona yazılır.
    const el = webRef.current as unknown as { style?: Record<string, string> } | null;
    const css = el?.style;
    if (!css) return;
    const uri = webUri(maskImg);
    const on = !open && uri;
    const values: Record<string, string> = {
      maskImage: on ? `url("${uri}")` : 'none',
      maskSize: `${W}px ${H}px`,
      maskPosition: `${PAD.left}px ${PAD.top}px`,
      maskRepeat: 'no-repeat',
    };
    for (const [k, v] of Object.entries(values)) {
      css[k] = v;
      css[`webkit${k[0].toUpperCase()}${k.slice(1)}`] = v;
    }
  }, [open]);

  if (Platform.OS === 'web') {
    return (
      <View ref={webRef} style={styles.masked}>
        {children}
      </View>
    );
  }
  return (
    <MaskedView
      style={styles.masked}
      maskElement={
        <View style={styles.maskRoot}>
          {open ? (
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.solid} />
            </View>
          ) : (
            <Image source={maskImg} style={styles.maskImg} />
          )}
        </View>
      }
    >
      {children}
    </MaskedView>
  );
}

/** 205×360 duygu şişesi: toplar, cam, tıpa. Prototipteki bottleHtml ile aynı yapı. */
export const Bottle = forwardRef<BottleHandle, Props>(function Bottle({ orbs }, ref) {
  const [armed, setArmed] = useState<string | null>(null);
  const [go, setGo] = useState(false);
  const [popped, setPopped] = useState(false);

  const rot = useSharedValue(BOTTLE_TILT);
  const scl = useSharedValue(1);
  const corkX = useSharedValue(-10);
  const corkY = useSharedValue(28);
  const corkRot = useSharedValue(0);
  const corkOp = useSharedValue(1);

  const armedRef = useRef<string | null>(null);

  const arm = useCallback((key: string) => {
    armedRef.current = key;
    setGo(false);
    setArmed(key);
  }, []);
  const disarm = useCallback(() => {
    armedRef.current = null;
    setArmed(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      arm,
      disarm,
      drop: async () => {
        const key = armedRef.current;
        if (!key) return;
        const ease = Easing.bezier(0.25, 0.8, 0.35, 1);
        corkX.value = withTiming(0, { duration: 1000, easing: ease });
        corkY.value = withTiming(0, { duration: 1000, easing: ease });
        await wait(80);
        setGo(true);
        const mine = orbs.filter((o) => o.key === key).length;
        await wait(250 + mine * 160 + 1000);
        corkX.value = withTiming(-10, { duration: 1000, easing: ease });
        corkY.value = withTiming(28, { duration: 1000, easing: ease });
        await wait(1000);
        armedRef.current = null;
        setArmed(null);
        setGo(false);
      },
      pop: async (onBurst) => {
        const ease = Easing.inOut(Easing.ease);
        rot.value = withSequence(...SHAKE.map(([r, , ms]) => withTiming(r, { duration: ms, easing: ease })));
        scl.value = withSequence(...SHAKE.map(([, s, ms]) => withTiming(s, { duration: ms, easing: ease })));
        corkX.value = withTiming(0, { duration: 1000 });
        corkY.value = withTiming(0, { duration: 1000 });
        await wait(SHAKE_MS);
        setPopped(true);
        const fly = Easing.bezier(0.15, 0.7, 0.3, 1);
        corkX.value = withTiming(110, { duration: 1100, easing: fly });
        corkY.value = withTiming(-230, { duration: 1100, easing: fly });
        corkRot.value = withTiming(260, { duration: 1100, easing: fly });
        corkOp.value = withTiming(0, { duration: 1100, easing: Easing.in(Easing.ease) });
        onBurst();
        await wait(2300);
      },
    }),
    [arm, disarm, orbs, rot, scl, corkX, corkY, corkRot, corkOp],
  );

  const bottleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }, { scale: scl.value }],
  }));
  const corkStyle = useAnimatedStyle(() => ({
    opacity: corkOp.value,
    transform: [{ translateX: corkX.value }, { translateY: corkY.value }, { rotate: `${corkRot.value}deg` }],
  }));

  const modeOf = (o: OrbSpec): OrbMode =>
    popped ? 'popped' : armed === o.key && !go ? 'mouth' : 'rest';

  return (
    <Animated.View style={[styles.bottle, bottleStyle]}>
      {/* Toplar şişenin cam şeklinde kırpılır; patlayınca maske tamamen açılır. */}
      <OrbMask open={popped}>
        {orbs.map((o, i) => (
          <BottleOrb key={o.key + o.field} spec={o} mode={modeOf(o)} index={i} />
        ))}
      </OrbMask>

      <Image source={bottleImg} style={styles.glass} />

      <View style={styles.corkAnchor}>
        <View style={styles.corkClip}>
          <View style={styles.corkInner}>
            <Animated.Image source={corkImg} style={[styles.cork, corkStyle]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bottle: { width: W, height: H, pointerEvents: 'none' },
  masked: {
    position: 'absolute',
    left: -PAD.left,
    top: -PAD.top,
    width: W + PAD.left + PAD.right,
    height: H + PAD.top + PAD.bottom,
  },
  maskRoot: { flex: 1, backgroundColor: 'transparent' },
  maskImg: { position: 'absolute', left: PAD.left, top: PAD.top, width: W, height: H },
  solid: { flex: 1, backgroundColor: colors.black },
  orb: { position: 'absolute', left: 0, top: 0, width: OS, height: OS, borderRadius: OS / 2, backgroundColor: colors.black },
  glass: { position: 'absolute', left: 0, top: 0, width: W, height: H },
  corkAnchor: {
    position: 'absolute',
    left: CORK_CLIP.x,
    top: CORK_CLIP.y,
    width: 0,
    height: 0,
    transform: [{ rotate: `${CORK_CLIP.angle}deg` }],
  },
  corkClip: { position: 'absolute', left: -500, top: -700, width: 1000, height: 700, overflow: 'hidden' },
  corkInner: {
    position: 'absolute',
    left: 500,
    top: 700,
    width: 0,
    height: 0,
    transform: [{ rotate: `${-CORK_CLIP.angle}deg` }],
  },
  cork: {
    position: 'absolute',
    left: CORK_BOX.left - CORK_CLIP.x,
    top: CORK_BOX.top - CORK_CLIP.y,
    width: CORK_BOX.width,
    height: CORK_BOX.height,
  },
});
