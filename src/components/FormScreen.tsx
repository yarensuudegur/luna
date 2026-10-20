import { locale } from '@/i18n/lang';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LangSwitch } from '@/components/LangSwitch';
import { isProfileComplete, useAuth } from '@/lib/auth';
import { colors, fonts, layout } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Başlığın üstündeki küçük etiket, örn. "ADIM 2 / 5". */
  eyebrow?: string;
  children: ReactNode;
  /** Ekranın altına yapışan alan (butonlar). */
  footer?: ReactNode;
  /** false ise içerik kaydırılmaz; içeride kendi listesi olan ekranlar için. */
  scroll?: boolean;
};

export function FormScreen({ title, subtitle, eyebrow, children, footer, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  // Dil seçimi yalnızca kayıt/giriş ve ilk kurulumda; uygulamanın içinde Ayarlar'dan değişir.
  const { profile } = useAuth();
  const showLang = !isProfileComplete(profile);
  const head = (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.eyebrow}>{(eyebrow ?? 'LU — NA').toLocaleUpperCase(locale())}</Text>
        {showLang && <LangSwitch />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {head}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>
          {head}
          {children}
        </View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 24 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 2.4, color: colors.mute },
  title: { marginTop: 14, fontFamily: fonts.serif, fontSize: 34, lineHeight: 40, color: colors.fg },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 22, color: colors.body },
  footer: { paddingHorizontal: layout.screenPadding, paddingTop: 12, gap: 8 },
});
