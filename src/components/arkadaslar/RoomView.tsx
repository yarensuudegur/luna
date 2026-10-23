import { locale } from '@/i18n/lang';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Initial } from '@/components/arkadaslar/Initial';
import { useTranslation } from '@/i18n';
import { useRoom } from '@/lib/rooms';
import type { RoomMessage } from '@/lib/rooms';
import { MAX_MESSAGE, cleanMessage } from '@/lib/room-utils';
import { colors, fonts, layout } from '@/theme';
import { systemText } from '@/lib/system-message';

type Props = {
  roomId: string;
  title: string;
  /** Başlığın sağı: grupta DÜZENLE, herkese açık odada küçük açıklama. */
  right: { kind: 'edit'; onPress: () => void } | { kind: 'text'; text: string };
  /** Grup sohbeti mi (üye adları gösterilir) yoksa herkese açık oda mı (anonim). */
  group: boolean;
  userId: string;
  /** Başlığın altında "SEN · AYŞE · CAN" satırı gösterilsin mi. */
  showMembers?: boolean;
  /** Odanın başındaki sabit karşılama satırı (veritabanında değil). */
  intro?: string;
  /** Üye listesi değişince (sistem mesajı) üst bileşen yenilensin. */
  onMembersChanged?: () => void;
  onBack: () => void;
};

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Sohbet odası: Realtime ile anlık mesajlar, sistem mesajları ve yazı alanı. */
export function RoomView({ roomId, title, right, group, userId, showMembers, intro, onMembersChanged, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { messages, members, loading, send } = useRoom(roomId, group);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const lastSystem = useRef<string | null>(null);

  // iOS'ta klavye sekme çubuğunun da üstüne biner; yalnızca fazlası kadar boşluk bırak.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const tabBar = layout.navHeight + insets.bottom;
    const show = Keyboard.addListener('keyboardWillShow', (e) =>
      setKeyboard(Math.max(0, e.endCoordinates.height - tabBar)),
    );
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);

  // Yeni sistem mesajı gelince üyeler değişmiştir.
  useEffect(() => {
    const sys = [...messages].reverse().find((m) => m.sender === null);
    if (!sys) return;
    if (lastSystem.current !== null && lastSystem.current !== sys.id) onMembersChanged?.();
    lastSystem.current = sys.id;
  }, [messages, onMembersChanged]);

  const memberLine = [
    t('common.you'),
    ...[...members.values()].filter((m) => m.id !== userId).map((m) => m.name),
  ].join(' · ');

  function nameOf(m: RoomMessage): string {
    if (m.sender === userId) return t('common.you');
    if (!group) return t('common.member');
    return members.get(m.sender ?? '')?.name ?? t('common.someone');
  }

  async function submit() {
    const body = cleanMessage(text);
    if (!body || sending) return;
    setSending(true);
    setFailed(false);
    const ok = await send(userId, body);
    setSending(false);
    if (ok) setText('');
    else setFailed(true);
  }

  return (
    <View style={[styles.root, { paddingBottom: keyboard }]}>
      <View style={styles.top}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.link}>{t('friends.room.back')}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title.toLocaleUpperCase(locale())}
        </Text>
        {right.kind === 'edit' ? (
          <Pressable onPress={right.onPress} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.monoS}>{t('friends.room.edit')}</Text>
          </Pressable>
        ) : (
          <Text style={[styles.monoS, styles.mute]}>{right.text.toLocaleUpperCase(locale())}</Text>
        )}
      </View>
      {showMembers ? (
        <View style={styles.members}>
          <Text style={[styles.monoS, styles.mute]}>{memberLine.toLocaleUpperCase(locale())}</Text>
        </View>
      ) : null}

      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={styles.msgs}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      >
        {intro ? <Text style={styles.sys}>{intro.toLocaleUpperCase(locale())}</Text> : null}
        {loading && messages.length === 0 && <Text style={styles.sys}>{t('friends.room.loading')}</Text>}
        {messages.map((m) =>
          m.sender === null ? (
            <Text key={m.id} style={styles.sys}>
              {systemText(m.body).toLocaleUpperCase(locale())}
            </Text>
          ) : (
            <View key={m.id} style={styles.msg}>
              <Initial name={nameOf(m)} size={30} outline={m.sender === userId} />
              <View style={styles.flex}>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{nameOf(m).toLocaleUpperCase(locale())}</Text>
                  <Text style={styles.metaText}>{hhmm(m.createdAt)}</Text>
                </View>
                <Text style={styles.txt}>{m.body}</Text>
              </View>
            </View>
          ),
        )}
      </ScrollView>

      <View style={styles.composer}>
        {failed && <Text style={styles.error}>{t('friends.room.sendFailed')}</Text>}
        <View style={styles.form}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('friends.room.placeholder')}
            placeholderTextColor={colors.faint}
            selectionColor={colors.black}
            maxLength={MAX_MESSAGE}
            multiline
            accessibilityLabel={t('friends.room.message')}
            style={styles.input}
          />
          <Pressable
            onPress={submit}
            disabled={sending || cleanMessage(text) === null}
            accessibilityRole="button"
            style={[styles.send, (sending || cleanMessage(text) === null) && styles.sendOff]}
          >
            <Text style={styles.sendText}>{t('friends.room.send')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  link: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.fg,
    textDecorationLine: 'underline',
  },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.3, color: colors.fg },
  monoS: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  mute: { color: colors.mute },
  members: {
    paddingVertical: 10,
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  msgs: { gap: 14, paddingTop: 20, paddingBottom: 20, paddingHorizontal: layout.screenPadding },
  sys: {
    textAlign: 'center',
    marginVertical: 6,
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.3,
    color: colors.mute,
  },
  msg: { flexDirection: 'row', gap: 10 },
  meta: { flexDirection: 'row', gap: 10 },
  metaText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.1, color: colors.mute },
  txt: { fontSize: 14.5, lineHeight: 22, color: colors.fg, marginTop: 2 },
  composer: {
    borderTopWidth: layout.hairline,
    borderTopColor: colors.line,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: layout.screenPadding,
    backgroundColor: colors.bg,
  },
  error: { fontSize: 12.5, color: colors.fg, marginBottom: 6 },
  form: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 15,
    color: colors.fg,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  send: { backgroundColor: colors.black, paddingVertical: 11, paddingHorizontal: 12 },
  sendOff: { opacity: 0.35 },
  sendText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, color: colors.white },
});
