import { locale } from '@/i18n/lang';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { Button } from '@/components/Button';
import { StoryCard } from '@/components/gunluk/StoryCard';
import { useTranslation } from '@/i18n';
import type { WeekData } from '@/lib/bottle';
import { colors, fonts, layout } from '@/theme';
import { useFrameWidth } from '@/lib/use-frame-width';

type Props = {
  data: WeekData | null;
  name: string;
  onClose: () => void;
};

/** Story önizlemesi (prototipteki storySheet) ve görüntü olarak paylaşım. */
export function StorySheet({ data, name, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const screenW = useFrameWidth();
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kart 9:16; ekranın kalanına sığacak en büyük genişlik, en çok 290.
  const room = screenH - insets.top - insets.bottom - 190;
  const width = Math.min(290, screenW - 2 * layout.screenPadding, (room * 9) / 16);

  async function share() {
    if (!card.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setError(t('gunluk.story.noShare'));
        return;
      }
      // Ekrandaki küçük kartı değil, story boyutunda (1080×1920) bir görüntü üretir.
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: t('gunluk.story.dialog') });
    } catch {
      setError(t('gunluk.story.noImage'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!data} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.head}>
          <Text style={styles.lbl}>{t('gunluk.story.preview')}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={10}>
            <Text style={styles.close}>{t('common.close').toLocaleUpperCase(locale())}</Text>
          </Pressable>
        </View>
        <View style={styles.cardWrap}>{data && <StoryCard ref={card} data={data} name={name} width={width} />}</View>
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          {Platform.OS === 'web' ? (
            <Text style={styles.error}>{t('gunluk.story.webShare')}</Text>
          ) : (
            <Button onPress={share} loading={busy}>
              {t('gunluk.story.dialog')}
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: layout.screenPadding },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },
  close: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  cardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  error: { fontSize: 13, color: colors.fg, textAlign: 'center', marginBottom: 10 },
  actions: { alignItems: 'center' },
});
