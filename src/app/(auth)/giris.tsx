import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { trAuthError } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

export default function GirisScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function submit() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) setError(trAuthError(err.message));
    setBusy(false);
  }

  return (
    <FormScreen
      title="Tekrar hoş geldin."
      subtitle="Gökyüzü bıraktığın yerde seni bekliyor."
      footer={
        <>
          <Button onPress={submit} disabled={!canSubmit} loading={busy}>
            Giriş yap
          </Button>
          <Pressable onPress={() => router.replace('/kayit')} style={styles.switch}>
            <Text style={styles.switchText}>HESABIN YOK MU? KAYIT OL</Text>
          </Pressable>
        </>
      }
    >
      <Field
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={canSubmit ? submit : undefined}
        note={error ?? undefined}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  switch: { paddingVertical: 12, alignItems: 'center' },
  switchText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, color: colors.fg },
});
