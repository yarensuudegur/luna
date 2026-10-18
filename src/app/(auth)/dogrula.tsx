import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { useResendConfirmation } from '@/lib/resend';

export default function DogrulaScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const address = email ?? '';
  const { resend, cooldown, busy, message } = useResendConfirmation(address);

  return (
    <FormScreen
      title="E-postanı kontrol et."
      subtitle={`${address ? `${address} adresine` : 'E-postana'} gönderdiğimiz bağlantıya tıkla. Hesabın doğrulandıktan sonra giriş yapabilirsin.${message ? `\n\n${message}` : ''}`}
      footer={
        <>
          <Button onPress={() => router.replace('/giris')}>Giriş yap</Button>
          <Button variant="ghost" onPress={resend} loading={busy} disabled={cooldown > 0 || !address}>
            {cooldown > 0 ? `Tekrar gönder (${cooldown})` : 'Tekrar gönder'}
          </Button>
          <Button variant="ghost" onPress={() => router.replace('/kayit')}>
            Farklı e-posta kullan
          </Button>
        </>
      }
    >
      {null}
    </FormScreen>
  );
}
