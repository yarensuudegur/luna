import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import { formatFullDate } from '@/lib/date';
import type { FutureMessage as Message } from '@/lib/future';
import { colors, fonts, layout } from '@/theme';

/** Vakti gelmiş ve açılmamış mesaj varsa Bugün sekmesinin üstünde duran siyah bant. */
export function FutureBanner({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.banner}>
      <Text style={styles.bannerText}>{t('future.banner').toLocaleUpperCase(locale())}</Text>
      <Text style={styles.bannerText}>→</Text>
    </Pressable>
  );
}

/** Mesaj tam ekran, gönderildiği tarihle görünür. */
export function FutureMessageView({
  message,
  onClose,
  onArchive,
}: {
  message: Message | null;
  onClose: () => void;
  /** "Arşivde gör" bağlantısına basılınca. */
  onArchive: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!message} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.head}>
          <Text style={styles.label}>
            {message ? t('future.fullLabel', { date: formatFullDate(message.createdAt) }).toLocaleUpperCase(locale()) : ''}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12}>
            <Text style={styles.label}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.text}>{message?.body}</Text>
        </ScrollView>
        <Pressable onPress={onArchive} accessibilityRole="button" hitSlop={12} style={styles.archive}>
          <Text style={styles.archiveText}>{t('archive.seeArchive').toLocaleUpperCase(locale())}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: layout.screenPadding,
    backgroundColor: colors.black,
  },
  bannerText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.3, color: colors.white },
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: layout.screenPadding },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute },
  archive: { alignSelf: 'center', paddingVertical: 8 },
  archiveText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: colors.fg,
    textDecorationLine: 'underline',
  },
  body: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  text: {
    fontFamily: fonts.serifItalic,
    fontSize: 26,
    lineHeight: 36,
    paddingBottom: 10,
    color: colors.fg,
  },
});
