import { locale } from '@/i18n/lang';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { relName, signName } from '@/i18n/names';
import { sunPairLine } from '@/lib/astro';
import { formatDayMonth } from '@/lib/date';
import type { Friend } from '@/lib/friends';
import { transitionTitle } from '@/lib/relations';
import type { RelType } from '@/lib/relations';
import { colors, fonts, layout } from '@/theme';

type Props = {
  friend: Friend;
  from: RelType;
  to: RelType;
  mySun: number | null;
  onClose: () => void;
};

/** Arkadaş → Flört / Partner geçişinde açılan siyah tam ekran kart. */
export function TransitionCard({ friend, from, to, mySun, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const pair = mySun !== null && friend.sun !== null ? sunPairLine(mySun, friend.sun) : '';
  const signs =
    mySun !== null && friend.sun !== null ? t('friends.transition.signs', { a: signName(mySun), b: signName(friend.sun) }) : '';
  const title = transitionTitle(from, to);
  const date = formatDayMonth(new Date()).toLocaleUpperCase(locale());
  const caption = [pair, signs].filter(Boolean).join(' ');

  function share() {
    Share.share({
      message: t('friends.transition.shareMessage', {
        name: friend.name,
        from: relName(from),
        to: relName(to),
        caption,
      }).trim(),
    }).catch(() => {});
  }

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 26 }]}>
        <View style={styles.row}>
          <Text style={styles.mono}>{t('friends.transition.brand', { date })}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.x}>
            <Text style={styles.xText}>✕</Text>
          </Pressable>
        </View>
        <View>
          <Text style={[styles.mono, styles.dim]}>
            {relName(from).toLocaleUpperCase(locale())} → {relName(to).toLocaleUpperCase(locale())}
          </Text>
          <Text style={styles.title}>{title}</Text>
          {caption !== '' && <Text style={styles.body}>{caption}</Text>}
        </View>
        <View style={styles.row}>
          <Text style={[styles.mono, styles.dim]}>{t('friends.transition.withFriend', { name: friend.name.toLocaleUpperCase(locale()) })}</Text>
          <Pressable onPress={share} accessibilityRole="button" style={styles.share}>
            <Text style={styles.shareText}>{t('common.share').toLocaleUpperCase(locale())}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  mono: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.white },
  dim: { opacity: 0.7 },
  x: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xText: { fontFamily: fonts.mono, fontSize: 11, color: colors.white },
  title: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 58, color: colors.white, marginTop: 10 },
  body: { fontSize: 15, lineHeight: 22, color: colors.white, opacity: 0.85, marginTop: 16, maxWidth: 300 },
  share: { borderWidth: 1, borderColor: colors.white, paddingVertical: 13, paddingHorizontal: 18 },
  shareText: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.5, color: colors.white },
});
