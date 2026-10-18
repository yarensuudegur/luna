import { StyleSheet, Text, View } from 'react-native';
import { MoonIcon } from '@/components/bugun/MoonIcon';
import { BURC_DA } from '@/lib/astro';
import type { MoonEvent } from '@/lib/astro';
import { formatDayMonth } from '@/lib/date';
import { colors, fonts, layout } from '@/theme';

/** Bir sonraki yeni ay ya da dolunay. */
export function CosmicBanner({ event, now }: { event: MoonEvent; now: Date }) {
  const days = Math.max(0, Math.round((event.date.getTime() - now.getTime()) / 86400000));
  return (
    <View style={styles.banner} accessibilityRole="summary">
      <MoonIcon elongation={event.name === 'Dolunay' ? 180 : 0} size={34} inverse />
      <View style={styles.text}>
        <Text style={styles.when}>{days === 0 ? 'BUGÜN' : `${days} GÜN SONRA`}</Text>
        <Text style={styles.name}>
          {event.name} {BURC_DA[event.sign]}
        </Text>
        <Text style={styles.date}>{formatDayMonth(event.date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: layout.screenPadding,
    backgroundColor: colors.fg,
  },
  text: { flex: 1, gap: 2 },
  when: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.white, opacity: 0.7 },
  name: { fontFamily: fonts.serif, fontSize: 19, color: colors.white },
  date: { fontSize: 12.5, color: colors.white, opacity: 0.75 },
});
