import { locale } from '@/i18n/lang';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MoonIcon } from '@/components/bugun/MoonIcon';
import { Label, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { moonEvent } from '@/i18n/names';
import type { MoonEvent } from '@/lib/astro';
import { formatDayMonth } from '@/lib/date';
import type { Group } from '@/lib/rooms';
import { colors, fonts } from '@/theme';

type Props = {
  event: MoonEvent | null;
  eventOpen: boolean;
  now: Date;
  groups: Group[];
  last: Record<string, string>;
  /** Okunmamış mesajı olan gruplar. */
  unread: ReadonlySet<string>;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpenEvent: () => void;
  onLockedEvent: () => void;
  onOpenGroup: (group: Group) => void;
  onNewGroup: () => void;
};

/** Sohbet & odalar alt sekmesi: kozmik olay odası ve gruplar. */
export function RoomsTab({
  event,
  eventOpen,
  now,
  groups,
  last,
  unread,
  loading,
  error,
  onRetry,
  onOpenEvent,
  onLockedEvent,
  onOpenGroup,
  onNewGroup,
}: Props) {
  const { t } = useTranslation();
  const days = event ? Math.round((event.date.getTime() - now.getTime()) / 86400000) : 0;

  return (
    <Section last>
      <Label>{t('friends.rooms.cosmic')}</Label>
      {event && (
        <Pressable
          onPress={eventOpen ? onOpenEvent : onLockedEvent}
          accessibilityRole="button"
          accessibilityState={{ disabled: !eventOpen }}
          style={[styles.room, styles.dark]}
        >
          <View style={styles.row}>
            <Text style={styles.monoLight}>
              {eventOpen ? t('friends.rooms.open') : t('friends.rooms.opensIn', { n: days })}
            </Text>
            <MoonIcon elongation={event.name === 'Dolunay' ? 180 : 0} size={26} inverse />
          </View>
          <Text style={styles.eventTitle}>{t('friends.rooms.roomName', { name: moonEvent(event.name) })}</Text>
          <Text style={styles.eventSub}>
            {t('friends.rooms.sub', { date: formatDayMonth(event.date), sign: t(`signs.in.${event.sign}`) })}
          </Text>
        </Pressable>
      )}

      <View style={[styles.row, styles.groupHead]}>
        <Label style={styles.noMargin}>{t('friends.rooms.groups')}</Label>
        <Pressable onPress={onNewGroup} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.monoS}>{t('friends.rooms.newGroup')}</Text>
        </Pressable>
      </View>

      {error ? (
        <>
          <Text style={styles.body}>{t('friends.rooms.loadError')}</Text>
          <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
            <Text style={styles.retryText}>{t('common.retry').toLocaleUpperCase(locale())}</Text>
          </Pressable>
        </>
      ) : loading ? (
        <Text style={styles.body}>{t('common.loading')}</Text>
      ) : groups.length === 0 ? (
        <Text style={styles.body}>{t('friends.rooms.none')}</Text>
      ) : (
        groups.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => onOpenGroup(g)}
            accessibilityRole="button"
            style={[styles.room, styles.light]}
          >
            <Text style={[styles.monoS, styles.mute]}>{t(g.memberIds.length === 1 ? 'friends.rooms.groupMetaOne' : 'friends.rooms.groupMeta', { n: g.memberIds.length })}</Text>
            <View style={styles.titleRow}>
              <Text style={[styles.groupTitle, styles.flex]}>{g.name}</Text>
              {unread.has(g.id) && <View style={styles.dot} accessibilityLabel={t('friends.rooms.unread')} />}
            </View>
            <Text style={styles.preview} numberOfLines={1}>
              {last[g.id] ?? t('friends.rooms.noMessages')}
            </Text>
          </Pressable>
        ))
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  room: { padding: 16, gap: 8, borderWidth: 1, marginBottom: 12 },
  dark: { backgroundColor: colors.black, borderColor: colors.black },
  light: { borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  groupHead: { marginTop: 12, marginBottom: 14 },
  noMargin: { marginBottom: 0 },
  monoLight: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.white },
  monoS: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  mute: { color: colors.mute },
  eventTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 29, color: colors.white },
  eventSub: { fontSize: 12.5, lineHeight: 18, color: colors.white, opacity: 0.75 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.black },
  groupTitle: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26, color: colors.fg },
  preview: { fontSize: 12.5, color: colors.body },
  body: { fontSize: 14, lineHeight: 22, color: colors.body },
  retry: { marginTop: 14 },
  retryText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.fg,
    textDecorationLine: 'underline',
  },
});
