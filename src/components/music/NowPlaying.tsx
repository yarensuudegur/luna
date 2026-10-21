import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '@/components/AppModal';
import { Avatar } from '@/components/Avatar';
import { SongArt } from '@/components/music/SongArt';
import { SongLinks } from '@/components/music/SongLinks';
import { SongPicker } from '@/components/music/SongPicker';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import type { NowPlaying, Song, SongReply } from '@/lib/songs';
import { colors, fonts, layout } from '@/theme';

/** "3 dk önce", "2 sa önce", "dün" gibi kısa zaman. */
export function useAgo() {
  const { t } = useTranslation();
  return (at: Date) => {
    const min = Math.max(0, Math.round((Date.now() - at.getTime()) / 60_000));
    if (min < 1) return t('music.ago.now');
    if (min < 60) return t('music.ago.min', { n: min });
    const h = Math.round(min / 60);
    if (h < 24) return t('music.ago.hour', { n: h });
    return t('music.ago.day', { n: Math.round(h / 24) });
  };
}

type BubbleProps = {
  song: Song | null;
  /** Okunmamış cevap sayısı. */
  unread?: number;
  onPress?: () => void;
  /** Kendi profilimde boşken "Ne dinliyorsun?" daveti gösterilir. */
  placeholder?: string;
};

/** Profil fotoğrafının üstündeki not baloncuğu (Instagram notu gibi), altında iki küçük kuyruk. */
export function SongBubble({ song, unread = 0, onPress, placeholder }: BubbleProps) {
  const { t } = useTranslation();
  if (!song && !placeholder) return null;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={song ? t('music.bubbleA11y', { title: song.title, artist: song.artist }) : placeholder}
      style={styles.bubbleWrap}
    >
      <View style={[styles.bubble, !song && styles.bubbleEmpty]}>
        {song ? (
          <>
            <Text style={styles.bubbleNote}>♫</Text>
            <View style={styles.bubbleText}>
              <Text style={styles.bubbleTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.bubbleArtist} numberOfLines={1}>
                {song.artist}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.bubblePlaceholder}>{placeholder}</Text>
        )}
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread}</Text>
          </View>
        )}
      </View>
      <View style={[styles.tail1, !song && styles.tailEmpty]} />
      <View style={[styles.tail2, !song && styles.tailEmpty]} />
    </Pressable>
  );
}

type SheetProps = {
  visible: boolean;
  current: NowPlaying | null;
  replies: SongReply[];
  onSet: (song: Song | null) => Promise<boolean>;
  onClose: () => void;
};

/** Kendi notum: şarkıyı değiştir/kaldır, gelen cevaplar ve "Yakında" müzik platformu bağlama. */
export function NowPlayingSheet({ visible, current, replies, onSet, onClose }: SheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ago = useAgo();
  const [picking, setPicking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function set(song: Song | null) {
    setPicking(false);
    setFailed(!(await onSet(song)));
  }

  return (
    <AppModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
      <View style={[styles.panel, { paddingBottom: insets.bottom + 26 }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.row}>
            <Text style={styles.lbl}>{t('music.nowTitle').toLocaleUpperCase(locale())}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.x}>
              <Text style={styles.xText}>✕</Text>
            </Pressable>
          </View>

          {current ? (
            <View style={styles.now}>
              <SongArt song={current.song} size={84} />
              <View style={styles.grow}>
                <Text style={styles.title}>{current.song.title}</Text>
                <Text style={styles.artist}>{current.song.artist.toLocaleUpperCase(locale())}</Text>
                <Text style={styles.meta}>{t('music.setAgo', { ago: ago(current.setAt) })}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>{t('music.nowEmpty')}</Text>
          )}
          {current && <SongLinks song={current.song} style={styles.links} />}

          <View style={styles.actions}>
            <Pressable onPress={() => setPicking(true)} accessibilityRole="button" style={styles.btn}>
              <Text style={styles.btnText}>{t(current ? 'music.change' : 'music.pickNow')}</Text>
            </Pressable>
            {current && (
              <Pressable onPress={() => void set(null)} accessibilityRole="button" style={[styles.btn, styles.btnGhost]}>
                <Text style={[styles.btnText, styles.btnGhostText]}>{t('music.remove')}</Text>
              </Pressable>
            )}
          </View>
          {failed && <Text style={styles.note}>{t('common.saveFailed')}</Text>}
          <Text style={styles.note}>{t('music.nowNote')}</Text>

          <Text style={[styles.lbl, styles.section]}>{t('music.replies').toLocaleUpperCase(locale())}</Text>
          {replies.length === 0 ? (
            <Text style={styles.note}>{t('music.repliesEmpty')}</Text>
          ) : (
            replies.map((r) => (
              <View key={r.id} style={styles.reply}>
                <Avatar avatar={r.avatar} size={36} />
                <View style={styles.grow}>
                  <Text style={styles.replyHead}>
                    {r.name} · <Text style={styles.meta}>{ago(r.at)}</Text>
                  </Text>
                  <Text style={styles.replyBody}>{r.body}</Text>
                  {r.song && <Text style={styles.replySong}>♫ {r.song.title}</Text>}
                </View>
              </View>
            ))
          )}

          <View style={styles.soon}>
            <Text style={[styles.lbl, styles.onDark]}>{t('music.soon').toLocaleUpperCase(locale())}</Text>
            <Text style={styles.soonTitle}>{t('music.soonTitle')}</Text>
            <Text style={styles.soonBody}>{t('music.soonBody')}</Text>
            <View style={styles.pills}>
              {['Spotify', 'Apple Music', 'YouTube Music'].map((p) => (
                <View key={p} style={styles.pill}>
                  <Text style={styles.pillText}>{p.toLocaleUpperCase(locale())}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      <SongPicker visible={picking} title={t('music.nowTitle')} onPick={(s) => void set(s)} onClose={() => setPicking(false)} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: { alignItems: 'center', marginBottom: 4, zIndex: 2 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 230,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  bubbleEmpty: { borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.bg },
  bubbleNote: { fontSize: 15, color: colors.fg },
  bubbleText: { flexShrink: 1 },
  bubbleTitle: { fontFamily: fonts.serif, fontSize: 14, lineHeight: 18, color: colors.fg },
  bubbleArtist: { fontSize: 11, lineHeight: 14, color: colors.body },
  bubblePlaceholder: { fontSize: 12.5, color: colors.mute },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.mono, fontSize: 9, color: colors.white },
  tail1: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: colors.black,
    backgroundColor: colors.white,
    marginTop: 3,
    marginLeft: 24,
  },
  tail2: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1,
    borderColor: colors.black,
    backgroundColor: colors.white,
    marginTop: 2,
    marginLeft: 34,
  },
  tailEmpty: { borderColor: colors.border, backgroundColor: colors.bg },

  backdrop: { flex: 1, backgroundColor: colors.backdrop },
  panel: {
    maxHeight: '92%',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.black,
    paddingTop: 22,
    paddingHorizontal: layout.screenPadding,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },
  section: { marginTop: 30, marginBottom: 10 },
  x: { width: 30, height: 30, borderWidth: 1, borderColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  xText: { fontFamily: fonts.mono, fontSize: 11, color: colors.fg },
  now: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  grow: { flex: 1 },
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 31, color: colors.fg },
  artist: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.1, color: colors.mute, marginTop: 4 },
  meta: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, color: colors.faint, marginTop: 8 },
  empty: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 30, color: colors.fg, marginTop: 18 },
  links: { marginTop: 16 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  btn: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.black,
  },
  btnText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.white },
  btnGhost: { backgroundColor: 'transparent' },
  btnGhostText: { color: colors.fg },
  note: { fontSize: 12.5, lineHeight: 19, color: colors.body, marginTop: 10 },
  reply: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  replyHead: { fontFamily: fonts.serif, fontSize: 15, color: colors.fg },
  replyBody: { fontSize: 14, lineHeight: 20, color: colors.fg, marginTop: 4 },
  replySong: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, color: colors.mute, marginTop: 6 },
  soon: { backgroundColor: colors.black, padding: 22, marginTop: 30 },
  onDark: { color: colors.spaceMute },
  soonTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 31, color: colors.white, marginTop: 10 },
  soonBody: { fontSize: 13.5, lineHeight: 21, color: colors.spaceSoft, marginTop: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  pill: { borderWidth: 1, borderColor: colors.spaceFaint, paddingVertical: 6, paddingHorizontal: 10 },
  pillText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.1, color: colors.spaceMute },
});
