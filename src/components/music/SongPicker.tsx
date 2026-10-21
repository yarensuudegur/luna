import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '@/components/AppModal';
import { SongArt } from '@/components/music/SongArt';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import { searchSongs } from '@/lib/songs';
import type { Song } from '@/lib/songs';
import { colors, fonts, layout } from '@/theme';

type Props = {
  visible: boolean;
  /** Başlıktaki etiket, örn. "GÜNÜN ŞARKISI". */
  title: string;
  onPick: (song: Song) => void;
  onClose: () => void;
};

/** Şarkı arama: yazdıkça (yarım saniye bekleyip) arar, dokununca seçer. */
export function SongPicker({ visible, title, onPick, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (!visible) {
      setQ('');
      setResults([]);
      setFailed(false);
    }
  }, [visible]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const list = await searchSongs(query);
      if (id !== seq.current) return;
      setLoading(false);
      setFailed(list === null);
      setResults(list ?? []);
    }, 500);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <AppModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
      <View style={[styles.panel, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.head}>
          <Text style={styles.lbl}>{title.toLocaleUpperCase(locale())}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.x}>
            <Text style={styles.xText}>✕</Text>
          </Pressable>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('music.searchPlaceholder')}
          placeholderTextColor={colors.faint}
          selectionColor={colors.black}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {loading ? (
            <ActivityIndicator color={colors.fg} style={styles.spin} />
          ) : failed ? (
            <Text style={styles.note}>{t('music.searchError')}</Text>
          ) : q.trim().length >= 2 && results.length === 0 ? (
            <Text style={styles.note}>{t('music.noResults')}</Text>
          ) : results.length === 0 ? (
            <Text style={styles.note}>{t('music.searchHint')}</Text>
          ) : (
            results.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => onPick(s)}
                accessibilityRole="button"
                accessibilityLabel={`${s.title}, ${s.artist}`}
                style={styles.row}
              >
                <SongArt song={s} size={46} />
                <View style={styles.grow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Text style={styles.artist} numberOfLines={1}>
                    {s.artist.toLocaleUpperCase(locale())}
                  </Text>
                </View>
                <Text style={styles.plus}>+</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.backdrop },
  panel: {
    height: '82%',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.black,
    paddingTop: 22,
    paddingHorizontal: layout.screenPadding,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },
  x: { width: 30, height: 30, borderWidth: 1, borderColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  xText: { fontFamily: fonts.mono, fontSize: 11, color: colors.fg },
  input: {
    marginTop: 18,
    paddingVertical: 10,
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.fg,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  list: { flex: 1, marginTop: 8 },
  spin: { marginTop: 30 },
  note: { fontSize: 13.5, lineHeight: 21, color: colors.body, paddingTop: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  grow: { flex: 1 },
  title: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23, color: colors.fg },
  artist: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, color: colors.mute, marginTop: 2 },
  plus: { fontFamily: fonts.mono, fontSize: 18, color: colors.fg, paddingHorizontal: 4 },
});
