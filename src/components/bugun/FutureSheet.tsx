import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '@/components/AppModal';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import { MAX_FUTURE_MESSAGE, canSendFuture } from '@/lib/future-plan';
import { colors, fonts, layout } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Mesajı gönderir; gönderilemezse false. */
  onSend: (body: string) => Promise<boolean>;
};

/** Gelecekteki kendine mesaj: arka plan kararır, alttan beyaz bir pencere kayar. */
export function FutureSheet({ visible, onClose, onSend }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const [shown, setShown] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const canSend = canSendFuture(text) && !busy;

  useEffect(() => {
    if (visible) {
      setShown(true);
      setText('');
      setFailed(false);
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (shown) {
      Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
        () => setShown(false),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Klavye açılınca pencere klavyenin üstüne çıkar.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboard(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  async function submit() {
    if (!canSend) return;
    setBusy(true);
    setFailed(false);
    const ok = await onSend(text.trim());
    setBusy(false);
    if (!ok) setFailed(true);
  }

  return (
    <AppModal visible={shown} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('future.discard')} />
      </Animated.View>
      <View style={[styles.anchor, { paddingBottom: keyboard }]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.panel,
            {
              paddingBottom: keyboard > 0 ? 16 : insets.bottom + 16,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }],
            },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('future.hint')}
            placeholderTextColor={colors.faint}
            selectionColor={colors.black}
            maxLength={MAX_FUTURE_MESSAGE}
            multiline
            accessibilityLabel={t('future.inputA11y')}
            style={styles.input}
          />
          {failed && <Text style={styles.error}>{t('future.error')}</Text>}
          <View style={styles.actions}>
            <Pressable onPress={onClose} disabled={busy} accessibilityRole="button" hitSlop={10}>
              <Text style={styles.action}>{t('future.discard')}</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend }}
              hitSlop={10}
            >
              <Text style={[styles.action, !canSend && styles.off]}>{t('future.submit').toLocaleUpperCase(locale())}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.backdrop },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: colors.white,
    paddingTop: 30,
    paddingHorizontal: layout.screenPadding,
  },
  input: {
    marginTop: 0,
    minHeight: 130,
    maxHeight: 220,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 15,
    lineHeight: 22,
    color: colors.fg,
    textAlignVertical: 'top',
  },
  error: { fontSize: 12.5, color: colors.fg, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  action: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.5, color: colors.fg },
  off: { color: colors.faint },
});
