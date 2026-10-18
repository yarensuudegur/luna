import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stars } from '@/components/void/Stars';
import { useAuth } from '@/lib/auth';
import { up } from '@/lib/bottle';
import { MAX_QUESTION, VOID_CATS, VOID_CAT_NAMES, useVoid } from '@/lib/void';
import type { VoidCategory } from '@/lib/void';
import { colors, fonts, layout } from '@/theme';

const IMAGES: Record<VoidCategory, { source: ImageSourcePropType; height: number }> = {
  Ben: { source: require('../../../assets/void/ben.webp'), height: 50 },
  Aşk: { source: require('../../../assets/void/ask.webp'), height: 52 },
  İş: { source: require('../../../assets/void/is.webp'), height: 52 },
  Sosyal: { source: require('../../../assets/void/sosyal.webp'), height: 42 },
};

export default function VoidScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { messages, loading, loadError, reload, asking, left, ask, newChat } = useVoid(profile?.id);
  const [cat, setCat] = useState<VoidCategory>('Ben');
  const [text, setText] = useState('');
  const scroll = useRef<ScrollView>(null);

  // Siyah zeminde durum çubuğu açık renk olmalı; sekmeden çıkınca geri alınır.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  const empty = messages.length === 0 && !asking;
  const canAsk = left > 0 && !asking && !loading && text.trim().length > 0;

  useEffect(() => {
    if (messages.length > 0 || asking) scroll.current?.scrollToEnd({ animated: true });
  }, [messages.length, asking]);

  function send(question: string) {
    if (left <= 0 || asking) return;
    setText('');
    void ask(question);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stars />

      <View style={[styles.head, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headSide} />
        <Text style={styles.headTitle}>VOID’E HOŞ GELDİN</Text>
        <View style={styles.count} accessibilityLabel={`Kalan soru: ${left}`}>
          <Text style={styles.countText}>{left}</Text>
        </View>
      </View>

      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <Text style={styles.status}>Yükleniyor…</Text>
        ) : loadError ? (
          <View style={styles.statusBox}>
            <Text style={styles.status}>Geçmişin yüklenemedi. Bağlantını kontrol et.</Text>
            <Pressable onPress={reload} accessibilityRole="button" hitSlop={10}>
              <Text style={styles.link}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {empty && (
              <>
                <View style={styles.cats}>
                  {VOID_CAT_NAMES.map((k) => (
                    <Pressable
                      key={k}
                      onPress={() => setCat(k)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: k === cat }}
                      style={[styles.catBtn, k !== cat && styles.catDim]}
                    >
                      <View style={styles.catImg}>
                        <Image
                          source={IMAGES[k].source}
                          style={{ height: IMAGES[k].height, width: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={[styles.catLabel, k === cat && styles.catLabelOn]}>{up(k)}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.qs}>
                  {VOID_CATS[cat].map((q) => (
                    <Pressable key={q} onPress={() => send(q)} disabled={left <= 0} accessibilityRole="button">
                      <Text style={styles.qText}>{up(q)}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <View style={styles.log}>
              {messages.map((m) =>
                m.role === 'user' ? (
                  <Text key={m.id} style={styles.vq}>
                    {up(m.body)}
                  </Text>
                ) : (
                  <View key={m.id}>
                    <Text style={styles.who}>VOID</Text>
                    <Text style={m.err ? styles.vaErr : styles.va}>{m.body}</Text>
                  </View>
                ),
              )}
              {asking && (
                <View style={styles.thinking} accessibilityLiveRegion="polite">
                  <ActivityIndicator size="small" color={colors.spaceMute} />
                  <Text style={styles.vaErr}>Void düşünüyor…</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.comp}>
        <View style={styles.form}>
          <TextInput
            value={text}
            onChangeText={setText}
            editable={left > 0 && !asking}
            maxLength={MAX_QUESTION}
            multiline
            placeholder={left > 0 ? 'BİR ŞEY SOR...' : 'YENİ SORULAR 00:00’DA'}
            placeholderTextColor="#777777"
            style={styles.input}
            accessibilityLabel="Soru"
          />
          <Pressable
            onPress={() => send(text)}
            disabled={!canAsk}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAsk }}
            style={[styles.askBtn, !canAsk && styles.askOff]}
          >
            <Text style={styles.askText}>SOR</Text>
          </Pressable>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{left} SORU · 00:00’DA YENİLENİR</Text>
          {messages.length > 0 && (
            <Pressable onPress={newChat} accessibilityRole="button" hitSlop={8}>
              <Text style={[styles.metaText, styles.underline]}>YENİ SOHBET</Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.space },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 24 },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 14,
  },
  headSide: { width: 30 },
  headTitle: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 2.1, color: colors.white, textAlign: 'center' },
  count: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: fonts.mono, fontSize: 10, color: colors.white },

  status: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.spaceMute, textAlign: 'center', paddingTop: 40 },
  statusBox: { alignItems: 'center', gap: 14 },
  link: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.white, textDecorationLine: 'underline' },

  cats: { flexDirection: 'row', paddingHorizontal: layout.screenPadding, paddingTop: 22, paddingBottom: 6, gap: 6 },
  catBtn: { flex: 1, alignItems: 'center', gap: 12, paddingVertical: 10 },
  catDim: { opacity: 0.5 },
  catImg: { width: '100%', height: 56, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.subtle },
  catLabelOn: { color: colors.white },

  qs: { alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 26 },
  qText: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.3,
    lineHeight: 17,
    color: colors.spaceText,
    textAlign: 'center',
    paddingVertical: 12,
  },

  log: { gap: 24, paddingHorizontal: layout.screenPadding, paddingTop: 18 },
  vq: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.3,
    lineHeight: 18,
    color: colors.spaceSoft,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  who: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.6, color: colors.spaceFaint, marginBottom: 8 },
  va: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 28, paddingBottom: 10, color: colors.white },
  vaErr: { fontSize: 13, lineHeight: 20, color: colors.spaceMute },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  comp: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.space,
    borderTopWidth: layout.hairline,
    borderTopColor: colors.spaceLine,
  },
  form: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 110,
    paddingVertical: 9,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.3,
    color: colors.white,
  },
  askBtn: { paddingVertical: 9, paddingHorizontal: 12, backgroundColor: colors.spaceButton },
  askOff: { opacity: 0.5 },
  askText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.white },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metaText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.3, color: colors.spaceFaint },
  underline: { textDecorationLine: 'underline' },
});
