import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BURCLAR, sunPairLine } from '@/lib/astro';
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
  const pair = mySun !== null && friend.sun !== null ? sunPairLine(mySun, friend.sun) : '';
  const signs =
    mySun !== null && friend.sun !== null ? `${BURCLAR[mySun]} ve ${BURCLAR[friend.sun]}.` : '';
  const title = transitionTitle(from, to);
  const date = formatDayMonth(new Date()).toLocaleUpperCase('tr');
  const caption = [pair, signs].filter(Boolean).join(' ');

  function share() {
    Share.share({ message: `${friend.name} ile ${from} → ${to}. ${caption}`.trim() }).catch(() => {});
  }

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 26 }]}>
        <View style={styles.row}>
          <Text style={styles.mono}>LU — NA · {date}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" style={styles.x}>
            <Text style={styles.xText}>✕</Text>
          </Pressable>
        </View>
        <View>
          <Text style={[styles.mono, styles.dim]}>
            {from.toLocaleUpperCase('tr')} → {to.toLocaleUpperCase('tr')}
          </Text>
          <Text style={styles.title}>{title}</Text>
          {caption !== '' && <Text style={styles.body}>{caption}</Text>}
        </View>
        <View style={styles.row}>
          <Text style={[styles.mono, styles.dim]}>SEN & {friend.name.toLocaleUpperCase('tr')}</Text>
          <Pressable onPress={share} accessibilityRole="button" style={styles.share}>
            <Text style={styles.shareText}>PAYLAŞ</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.fg,
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
