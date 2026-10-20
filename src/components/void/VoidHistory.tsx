import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import { formatTopDate } from '@/lib/date';
import { useFrameWidth } from '@/lib/use-frame-width';
import type { VoidDay } from '@/lib/void';
import { colors, fonts, layout } from '@/theme';

const HOUR = 3_600_000;

/** Günün İstanbul gece yarısından o günün tarih etiketi ("SAL 20 EKİ"). */
export function dayLabel(dayStart: number): string {
  return formatTopDate(new Date(dayStart + 12 * HOUR)).toLocaleUpperCase(locale());
}

type Props = {
  open: boolean;
  days: readonly VoidDay[];
  /** Açık olan geçmiş gün (null = bugün). */
  selected: number | null;
  onSelect: (dayStart: number | null) => void;
  onClose: () => void;
};

/** Claude'daki gibi soldan açılan geçmiş paneli: bugün ve son 7 günün sohbetleri. */
export function VoidHistory({ open, days, selected, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const width = Math.round(useFrameWidth() * 0.8);
  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) setShown(true);
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 260 : 200,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      if (!open) setShown(false);
    });
  }, [open, progress]);

  if (!shown) return null;

  function pick(day: number | null) {
    onSelect(day);
    onClose();
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.close')} />
      </Animated.View>
      <Animated.View
        style={[
          styles.panel,
          {
            width,
            paddingTop: insets.top + 18,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }],
          },
        ]}
      >
        <View style={styles.head}>
          <Text style={styles.title}>{t('void.history')}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12}>
            <Text style={styles.title}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          <Pressable
            onPress={() => pick(null)}
            accessibilityRole="button"
            accessibilityState={{ selected: selected === null }}
            style={styles.item}
          >
            <Text style={[styles.date, selected === null && styles.on]}>{t('void.today')}</Text>
          </Pressable>

          <Text style={styles.section}>{t('void.lastDays')}</Text>
          {days.length === 0 ? (
            <Text style={styles.empty}>{t('void.historyEmpty')}</Text>
          ) : (
            days.map((d) => (
              <Pressable
                key={d.dayStart}
                onPress={() => pick(d.dayStart)}
                accessibilityRole="button"
                accessibilityState={{ selected: selected === d.dayStart }}
                style={styles.item}
              >
                <Text style={[styles.date, selected === d.dayStart && styles.on]}>{dayLabel(d.dayStart)}</Text>
                {!!d.preview && (
                  <Text style={styles.preview} numberOfLines={2}>
                    {d.preview}
                  </Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.backdropStrong },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.space,
    borderRightWidth: layout.hairline,
    borderRightColor: colors.spaceLine,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 18,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.spaceLine,
  },
  title: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 2.1, color: colors.white },
  list: { paddingBottom: 40 },
  section: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.spaceFaint,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 22,
    paddingBottom: 4,
  },
  item: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.spaceLine,
  },
  date: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.spaceMute },
  on: { color: colors.white, textDecorationLine: 'underline' },
  preview: { fontSize: 13, lineHeight: 19, color: colors.spaceSoft },
  empty: { fontSize: 13, lineHeight: 19, color: colors.spaceMute, paddingHorizontal: layout.screenPadding, paddingTop: 10 },
});
