import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

const THUMB = 18;

type Props = {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
  max?: number;
};

/** 0–10 arası, 1'er adımlı kaydırıcı (prototipteki input[type=range]). */
export function MoodSlider({ value, onChange, label, min = 0, max = 10 }: Props) {
  const [width, setWidth] = useState(0);
  const live = useRef({ width: 0, value, onChange });
  live.current = { width, value, onChange };

  const setFromX = (x: number) => {
    const { width: w, value: cur, onChange: cb } = live.current;
    const span = w - THUMB;
    if (span <= 0) return;
    const next = Math.round(min + (Math.min(span, Math.max(0, x - THUMB / 2)) / span) * (max - min));
    if (next !== cur) cb(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Dikey kaydırmayı kaydırıcı çalarsa form sayfası takılır.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    }),
  ).current;

  const left = width > THUMB ? ((value - min) / (max - min)) * (width - THUMB) : 0;

  return (
    <View
      style={styles.hit}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === 'increment' ? 1 : -1;
        onChange(Math.min(max, Math.max(min, value + step)));
      }}
      {...pan.panHandlers}
    >
      <View style={styles.track} pointerEvents="none" />
      <View style={[styles.fill, { width: left + THUMB / 2 }]} pointerEvents="none" />
      <View style={[styles.thumb, { left }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 32, justifyContent: 'center' },
  track: { height: 1, backgroundColor: colors.border },
  fill: { position: 'absolute', left: 0, height: 1, backgroundColor: colors.black },
  thumb: {
    position: 'absolute',
    top: (32 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.black,
  },
});
