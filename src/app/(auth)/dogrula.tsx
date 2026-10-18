import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { useTranslation } from '@/i18n';
import { useResendConfirmation } from '@/lib/resend';

export default function DogrulaScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const address = email ?? '';
  const { resend, cooldown, busy, message } = useResendConfirmation(address);

  return (
    <FormScreen
      title={t('auth.verifyTitle')}
      subtitle={`${t('auth.verifyBody', { to: address ? t('auth.verifyAddress', { email: address }) : t('auth.verifyYour') })}${message ? `\n\n${message}` : ''}`}
      footer={
        <>
          <Button onPress={() => router.replace('/giris')}>{t('auth.signIn')}</Button>
          <Button variant="ghost" onPress={resend} loading={busy} disabled={cooldown > 0 || !address}>
            {cooldown > 0 ? t('auth.resendCooldown', { n: cooldown }) : t('auth.resend')}
          </Button>
          <Button variant="ghost" onPress={() => router.replace('/kayit')}>
            {t('auth.otherEmail')}
          </Button>
        </>
      }
    >
      {null}
    </FormScreen>
  );
}
