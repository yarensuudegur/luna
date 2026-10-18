import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { useTranslation } from '@/i18n';
import { formatTopDate } from '@/lib/date';
import { useToday } from '@/lib/today';
import { colors, fonts, layout } from '@/theme';

/** Tarihin yanındaki ince ters üçgen ok; gün şeridi açıkken döner. */
function Chevron({ open }: { open: boolean }) {
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: open ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, turn]);

  return (
    <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
      <Svg width={11} height={7} viewBox="0 0 11 7">
        <Polyline points="1,1 5.5,5.8 10,1" fill="none" stroke={colors.black} strokeWidth={1.2} />
      </Svg>
    </Animated.View>
  );
}

/** `routeName`: üst çubuğun bulunduğu sekme. Yalnız Bugün'de tarih gün şeridini açar. */
export function TopBar({ routeName }: { routeName: string }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { daysOpen, toggleDays, deepOpen } = useToday();
  const toggles = routeName === 'index' && !deepOpen;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.logo}>LU — NA</Text>
      {toggles ? (
        <Pressable
          onPress={toggleDays}
          accessibilityRole="button"
          accessibilityState={{ expanded: daysOpen }}
          accessibilityLabel={daysOpen ? t('top.hideDays') : t('top.showDays')}
          hitSlop={10}
          style={styles.dateBtn}
        >
          <Text style={styles.date}>{formatTopDate()}</Text>
          <Chevron open={daysOpen} />
        </Pressable>
      ) : (
        <Text style={styles.date}>{formatTopDate()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  logo: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2.4, color: colors.fg },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.3, color: colors.fg },
});
