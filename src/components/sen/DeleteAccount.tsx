import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Sheet } from '@/components/Sheet';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

type Step = 'closed' | 'ask' | 'type';

const clean = (s: string) => s.trim().replace(/^@/, '').toLowerCase();

/** Hesabı sil: önce soru, sonra kullanıcı adını yazdırma. Başarılıysa kök düzen giriş ekranına döner. */
export function DeleteAccount() {
  const { profile, deleteAccount } = useAuth();
  const [step, setStep] = useState<Step>('closed');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = profile?.handle ?? '';
  const matches = handle !== '' && clean(typed) === handle;

  function close() {
    if (busy) return;
    setStep('closed');
    setTyped('');
    setError(null);
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    const ok = await deleteAccount();
    if (!ok) {
      setError('Hesap silinemedi. Bağlantını kontrol edip tekrar dene.');
      setBusy(false);
    }
  }

  return (
    <View>
      <Button variant="ghost" onPress={() => setStep('ask')}>
        Hesabı sil
      </Button>

      <Sheet visible={step === 'ask'} title="Hesabın silinsin mi?" onClose={close}>
        <Text style={styles.text}>
          Hesabını silmek istediğine emin misin? Profilin, duygu kayıtların, Void sohbetlerin ve arkadaşlıkların kalıcı olarak silinir. Bu işlem geri alınamaz.
        </Text>
        <View style={styles.actions}>
          <Button onPress={() => setStep('type')}>Devam et</Button>
          <Button variant="ghost" onPress={close}>
            Vazgeç
          </Button>
        </View>
      </Sheet>

      <Sheet visible={step === 'type'} title="Son adım" onClose={close}>
        <Text style={styles.text}>Onaylamak için kullanıcı adını yaz: @{handle}</Text>
        <Field
          label="Kullanıcı adı"
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          autoCorrect={false}
          note={error ?? undefined}
        />
        <View style={styles.actions}>
          <Button onPress={confirm} disabled={!matches} loading={busy}>
            Hesabımı sil
          </Button>
          <Button variant="ghost" onPress={close} disabled={busy}>
            Vazgeç
          </Button>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 21, color: colors.mute, marginTop: 10 },
  actions: { gap: 8, marginTop: 22 },
});
