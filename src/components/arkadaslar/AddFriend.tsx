import { locale } from '@/i18n/lang';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '@/components/AppModal';
import { Button } from '@/components/Button';
import { useTranslation } from '@/i18n';
import { addFriendByCode, fetchMyFriendCode } from '@/lib/friends';
import { codeFromQr, qrValueFor } from '@/lib/relations';
import { colors, fonts, layout } from '@/theme';
import { useShare } from '@/lib/share';

type Step = 'bump' | 'qr' | 'scan';

type Props = {
  visible: boolean;
  /** Kendi kullanıcı adın (QR'ın içeriği). */
  handle: string;
  /** Biri kodunu okutup arkadaş olduysa onun adı; eşleşme ekranı gösterilir. */
  arrived: string | null;
  onClose: () => void;
  /** Arkadaş eklendi; liste yenilensin. */
  onAdded: () => void;
};

/** Tam ekran, beyaz "Arkadaş ekle" akışı: bump animasyonu, kendi QR'ın ve QR okutma. */
export function AddFriend({ visible, handle, arrived, onClose, onAdded }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('bump');

  useEffect(() => {
    if (visible) setStep('bump');
  }, [visible]);

  useEffect(() => {
    if (!visible || !arrived) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [visible, arrived, onClose]);

  const title = t(step === 'bump' ? 'friends.add.titleBump' : step === 'qr' ? 'friends.add.titleQr' : 'friends.add.titleScan');

  return (
    <AppModal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 26 }]}>
        <View style={styles.row}>
          <Text style={styles.lbl}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.x}>
            <Text style={styles.xText}>✕</Text>
          </Pressable>
        </View>
        {arrived ? (
          <View style={styles.center}>
            <Text style={styles.h1}>{t('friends.add.matched', { name: arrived })}</Text>
            <Text style={[styles.mute, styles.centerText]}>{t('friends.add.addedToList')}</Text>
          </View>
        ) : null}
        {!arrived && step === 'bump' && <Bump onQr={() => setStep('qr')} />}
        {!arrived && step === 'qr' && <Qr handle={handle} onScan={() => setStep('scan')} onBump={() => setStep('bump')} />}
        {!arrived && step === 'scan' && <Scan onBack={() => setStep('qr')} onAdded={onAdded} onDone={onClose} />}
      </View>
    </AppModal>
  );
}

/** İki telefon birbirine yaklaşıp uzaklaşır. Expo Go'da bump çalışmadığı için yalnızca animasyon. */
function Bump({ onQr }: { onQr: () => void }) {
  const { t } = useTranslation();
  const slide = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const move = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.2, duration: 600, useNativeDriver: true }),
      ]),
    );
    move.start();
    blink.start();
    return () => {
      move.stop();
      blink.stop();
    };
  }, [slide, pulse]);

  const left = {
    transform: [
      { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-46, -1] }) },
      { rotate: slide.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] }) },
    ],
  };
  const right = {
    transform: [
      { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [46, 1] }) },
      { rotate: slide.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '0deg'] }) },
    ],
  };

  return (
    <>
      <View style={styles.center}>
        <View style={styles.bump} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View style={[styles.phone, left]} />
          <Animated.View style={[styles.phone, right]} />
        </View>
        <Text style={styles.h1}>{t('friends.add.bump')}</Text>
        <View style={styles.searching}>
          <Animated.View style={[styles.pulse, { opacity: pulse }]} />
          <Text style={styles.mute}>{t('friends.add.searching')}</Text>
        </View>
      </View>
      <Pressable onPress={onQr} accessibilityRole="button" style={styles.linkWrap}>
        <Text style={styles.link}>{t('friends.add.tryQr')}</Text>
      </Pressable>
    </>
  );
}

function Qr({ handle, onScan, onBump }: { handle: string; onScan: () => void; onBump: () => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { share, copied } = useShare();

  // Açılınca yeni kod alır; süresi dolunca (10 dk) yenisini alır.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    fetchMyFriendCode().then((c) => {
      if (!alive) return;
      if (!c) return setFailed(true);
      setFailed(false);
      setValue(qrValueFor(c.code));
      timer = setTimeout(() => setAttempt((n) => n + 1), Math.max(1000, c.expiresAt.getTime() - Date.now()));
    });
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [attempt]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.centerScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.qr} accessibilityLabel={t('friends.add.qrA11y', { handle })}>
          {value ? (
            <QRCode value={value} size={190} color={colors.fg} backgroundColor={colors.bg} />
          ) : (
            <View style={styles.qrEmpty} />
          )}
        </View>
        <Text style={styles.handle}>@{handle.toLocaleUpperCase(locale())}</Text>
        <Text style={styles.h2}>{t('friends.add.showCode')}</Text>
        <Text style={[styles.mute, styles.centerText]}>
          {failed ? t('friends.add.codeFailed') : t('friends.add.codeValid')}
        </Text>
        {failed && (
          <Pressable onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button">
            <Text style={styles.link}>{t('friends.add.retry')}</Text>
          </Pressable>
        )}
        <View style={styles.buttons}>
          <View style={styles.buttonCell}>
            <Button onPress={onScan}>{t(Platform.OS === 'web' ? 'friends.add.pasteBtn' : 'friends.add.scanBtn')}</Button>
          </View>
          <View style={styles.buttonCell}>
            <Button
              variant="ghost"
              disabled={!value}
              onPress={() => value && share(value)}
            >
              {copied ? t('common.copied') : t('friends.add.sendLink')}
            </Button>
          </View>
        </View>
      </ScrollView>
      <Pressable onPress={onBump} accessibilityRole="button" style={styles.linkWrap}>
        <Text style={styles.link}>{t('friends.add.backToBump')}</Text>
      </Pressable>
    </>
  );
}

function Scan({ onBack, onAdded, onDone }: { onBack: () => void; onAdded: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState<string | null>(null);
  const [matched, setMatched] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  async function onScanned(data: string) {
    if (busy.current) return;
    busy.current = true;
    const code = codeFromQr(data);
    if (!code) {
      setMessage(t('friends.add.notLuna'));
      later(() => (busy.current = false), 1500);
      return;
    }
    setMessage(null);
    const res = await addFriendByCode(code);
    if (res.ok) {
      setMatched(res.name);
      onAdded();
      later(onDone, 1600);
      return;
    }
    setMessage(t(`friends.add.${res.reason}`));
    later(() => (busy.current = false), 1500);
  }

  if (matched) {
    return (
      <View style={styles.center}>
        <Text style={styles.h1}>{t('friends.add.matched', { name: matched })}</Text>
        <Text style={[styles.mute, styles.centerText]}>{t('friends.add.addedToList')}</Text>
      </View>
    );
  }

  // Web'de kamera yok: arkadaşın gönderdiği link (ya da kod) yapıştırılır.
  if (Platform.OS === 'web') {
    return (
      <>
        <View style={styles.center}>
          <Text style={[styles.h2, styles.centerText]}>{t('friends.add.webPaste')}</Text>
          <TextInput
            value={pasted}
            onChangeText={setPasted}
            onSubmitEditing={() => void onScanned(pasted)}
            placeholder={t('friends.add.webPastePh')}
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.pasteInput}
          />
          <View style={styles.buttonCell}>
            <Button disabled={!pasted.trim()} onPress={() => void onScanned(pasted)}>
              {t('friends.add.webAdd')}
            </Button>
          </View>
          {message && <Text style={[styles.mute, styles.centerText]}>{message.toLocaleUpperCase(locale())}</Text>}
        </View>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.linkWrap}>
          <Text style={styles.link}>{t('friends.add.backToCode')}</Text>
        </Pressable>
      </>
    );
  }

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <>
        <View style={styles.center}>
          <Text style={styles.h2}>{t('friends.add.needCamera')}</Text>
          <View style={styles.buttonCell}>
            <Button onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}>
              {permission.canAskAgain ? t('friends.add.allow') : t('friends.add.openSettings')}
            </Button>
          </View>
        </View>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.linkWrap}>
          <Text style={styles.link}>{t('friends.add.backToCode')}</Text>
        </Pressable>
      </>
    );
  }

  return (
    <>
      <View style={styles.center}>
        <View style={styles.camera}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              void onScanned(data);
            }}
          />
        </View>
        <Text style={[styles.mute, styles.centerText]}>
          {(message ?? t('friends.add.frame')).toLocaleUpperCase(locale())}
        </Text>
      </View>
      <Pressable onPress={onBack} accessibilityRole="button" style={styles.linkWrap}>
        <Text style={styles.link}>{t('friends.add.backToCode')}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: layout.screenPadding },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },
  x: { width: 30, height: 30, borderWidth: 1, borderColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  xText: { fontFamily: fonts.mono, fontSize: 11, color: colors.fg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  centerScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 18, paddingVertical: 12 },
  centerText: { textAlign: 'center' },
  bump: { height: 190, width: '100%', alignItems: 'center', justifyContent: 'center' },
  phone: {
    position: 'absolute',
    width: 62,
    height: 118,
    borderWidth: 1.5,
    borderColor: colors.black,
    borderRadius: 13,
    backgroundColor: colors.bg,
  },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, color: colors.fg, textAlign: 'center' },
  h2: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, color: colors.fg, textAlign: 'center' },
  searching: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.black },
  mute: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute },
  linkWrap: { alignItems: 'center', paddingVertical: 8 },
  link: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.fg,
    textDecorationLine: 'underline',
  },
  qrEmpty: { width: 190, height: 190 },
  pasteInput: {
    width: '100%',
    maxWidth: 340,
    borderBottomWidth: 1,
    borderColor: colors.black,
    paddingVertical: 10,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.fg,
    textAlign: 'center',
  },
  qr: { padding: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.black },
  handle: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.3, color: colors.fg },
  buttons: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  buttonCell: { minWidth: 150 },
  camera: { width: 260, height: 260, overflow: 'hidden', borderWidth: 1, borderColor: colors.black },
});
