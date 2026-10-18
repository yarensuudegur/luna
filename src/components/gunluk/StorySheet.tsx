import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { Button } from '@/components/Button';
import { StoryCard } from '@/components/gunluk/StoryCard';
import type { WeekData } from '@/lib/bottle';
import { colors, fonts, layout } from '@/theme';

type Props = {
  data: WeekData | null;
  name: string;
  onClose: () => void;
};

/** Story önizlemesi (prototipteki storySheet) ve görüntü olarak paylaşım. */
export function StorySheet({ data, name, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
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
        setError('Bu cihazda paylaşım açılamıyor.');
        return;
      }
      // Ekrandaki küçük kartı değil, story boyutunda (1080×1920) bir görüntü üretir.
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Story’de paylaş' });
    } catch {
      setError('Görüntü hazırlanamadı. Tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!data} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.head}>
          <Text style={styles.lbl}>STORY ÖNİZLEME</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={10}>
            <Text style={styles.close}>KAPAT</Text>
          </Pressable>
        </View>
        <View style={styles.cardWrap}>{data && <StoryCard ref={card} data={data} name={name} width={width} />}</View>
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <Button onPress={share} loading={busy}>
            Story’de paylaş
          </Button>
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
