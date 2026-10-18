import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { trAuthError } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

const MIN_SIFRE = 6;

export default function KayitScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length >= MIN_SIFRE;

  async function submit() {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    if (err) setError(trAuthError(err.message));
    // Oturum geldiyse yönlendirme otomatik; gelmediyse e-posta doğrulaması bekleniyor demektir.
    else if (!data.session) router.replace({ pathname: '/dogrula', params: { email: email.trim() } });
    setBusy(false);
  }

  return (
    <FormScreen
      title="Haritanı birlikte çıkaralım."
      subtitle="Önce bir hesap aç; sonra doğum bilgilerini soracağız."
      footer={
        <>
          <Button onPress={submit} disabled={!canSubmit} loading={busy}>
            Kayıt ol
          </Button>
          <Pressable onPress={() => router.replace('/giris')} style={styles.switch}>
            <Text style={styles.switchText}>ZATEN HESABIN VAR MI? GİRİŞ YAP</Text>
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
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={canSubmit ? submit : undefined}
        note={error ?? `En az ${MIN_SIFRE} karakter.`}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  switch: { paddingVertical: 12, alignItems: 'center' },
  switchText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, color: colors.fg },
});
