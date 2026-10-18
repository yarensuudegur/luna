import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useTranslation } from '@/i18n';
import { authErrorText, isUnconfirmed } from '@/lib/auth-errors';
import { useResendConfirmation } from '@/lib/resend';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

export default function GirisScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const resend = useResendConfirmation(email.trim());

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function submit() {
    setBusy(true);
    setError(null);
    setUnconfirmed(false);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(authErrorText(err.message));
      setUnconfirmed(isUnconfirmed(err.message));
    }
    setBusy(false);
  }

  return (
    <FormScreen
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          <Button onPress={submit} disabled={!canSubmit} loading={busy}>
            {t('auth.signIn')}
          </Button>
          <Pressable onPress={() => router.replace('/kayit')} style={styles.switch}>
            <Text style={styles.switchText}>{t('auth.noAccount')}</Text>
          </Pressable>
        </>
      }
    >
      <Field
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={canSubmit ? submit : undefined}
        note={error ?? undefined}
      />
      {unconfirmed && (
        <Pressable onPress={resend.resend} disabled={resend.busy || resend.cooldown > 0} style={styles.switch}>
          <Text style={styles.switchText}>
            {resend.message ??
              (resend.cooldown > 0 ? t('auth.resendCooldownCaps', { n: resend.cooldown }) : t('auth.resendUnconfirmed'))}
          </Text>
        </Pressable>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  switch: { paddingVertical: 12, alignItems: 'center' },
  switchText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, color: colors.fg },
});
