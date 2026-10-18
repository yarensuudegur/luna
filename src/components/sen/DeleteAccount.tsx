import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Sheet } from '@/components/Sheet';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

type Step = 'closed' | 'ask' | 'type';

const clean = (s: string) => s.trim().replace(/^@/, '').toLowerCase();

/** Hesabı sil: önce soru, sonra kullanıcı adını yazdırma. Başarılıysa kök düzen giriş ekranına döner. */
export function DeleteAccount() {
  const { t } = useTranslation();
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
      setError(t('settings.delete.error'));
      setBusy(false);
    }
  }

  return (
    <View>
      <Button variant="ghost" onPress={() => setStep('ask')}>
        {t('settings.delete.button')}
      </Button>

      <Sheet visible={step === 'ask'} title={t('settings.delete.askTitle')} onClose={close}>
        <Text style={styles.text}>{t('settings.delete.askText')}</Text>
        <View style={styles.actions}>
          <Button onPress={() => setStep('type')}>{t('settings.delete.continue')}</Button>
          <Button variant="ghost" onPress={close}>
            {t('common.cancel')}
          </Button>
        </View>
      </Sheet>

      <Sheet visible={step === 'type'} title={t('settings.delete.lastTitle')} onClose={close}>
        <Text style={styles.text}>{t('settings.delete.typeHandle', { handle })}</Text>
        <Field
          label={t('onboarding.handleLabel')}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          autoCorrect={false}
          note={error ?? undefined}
        />
        <View style={styles.actions}>
          <Button onPress={confirm} disabled={!matches} loading={busy}>
            {t('settings.delete.confirm')}
          </Button>
          <Button variant="ghost" onPress={close} disabled={busy}>
            {t('common.cancel')}
          </Button>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 21, color: colors.body, marginTop: 10 },
  actions: { gap: 8, marginTop: 22 },
});
