import { locale } from '@/i18n/lang';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout } from '@/theme';

const SLIDE_MS = 220;
const VISIBLE_MS = 4000;

type Props = {
  text: string;
  onPress: () => void;
  /** Bant kendiliğinden kapanınca ya da dokunulunca (çıkış animasyonu bittikten sonra). */
  onDone: () => void;
  /** Bandın ekranda kalma süresi (ms); varsayılan 4 sn. */
  duration?: number;
};

/** Ekranın üstünden kayarak inen siyah bildirim bandı; 4 saniye sonra kendiliğinden kapanır. */
export function NotificationBanner({ text, onPress, onDone, duration = VISIBLE_MS }: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const closed = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  function close(after?: () => void) {
    if (closed.current) return;
    closed.current = true;
    Animated.timing(slide, { toValue: 0, duration: SLIDE_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
      () => {
        after?.();
        doneRef.current();
      },
    );
  }

  useEffect(() => {
    Animated.timing(slide, { toValue: 1, duration: SLIDE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    const timer = setTimeout(() => close(), duration - SLIDE_MS * 2);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] }) }],
        },
      ]}
    >
      <Pressable
        onPress={() => close(onPress)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={text}
        style={[styles.band, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.text} numberOfLines={3}>
          {text.toLocaleUpperCase(locale())}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  band: {
    backgroundColor: colors.black,
    paddingBottom: 14,
    paddingHorizontal: layout.screenPadding,
  },
  text: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 16, letterSpacing: 1.2, color: colors.white },
});
