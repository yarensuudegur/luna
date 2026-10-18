import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useTranslation } from '@/i18n';
import { useOnboarding } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';

const HANDLE_RE = /^[a-z0-9_.]{3,20}$/;

/** Başındaki @ atılır, küçük harfe çevrilir; izin verilmeyen karakterler düşer. */
function cleanHandle(raw: string): string {
  return raw.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
}

type Durum = 'bos' | 'gecersiz' | 'kontrol' | 'musait' | 'dolu' | 'hata';

export default function KullaniciAdiScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { draft, update } = useOnboarding();
  const [handle, setHandle] = useState(draft.handle);
  const [durum, setDurum] = useState<Durum>(draft.handle ? 'kontrol' : 'bos');

  useEffect(() => {
    if (!handle) return setDurum('bos');
    if (!HANDLE_RE.test(handle)) return setDurum('gecersiz');
    setDurum('kontrol');
    let iptal = false;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('handle_available', { p_handle: handle });
      if (iptal) return;
      setDurum(error ? 'hata' : data ? 'musait' : 'dolu');
    }, 400);
    return () => {
      iptal = true;
      clearTimeout(t);
    };
  }, [handle]);

  function next() {
    update({ handle });
    router.push('/dogum-tarihi');
  }

  return (
    <FormScreen
      eyebrow={t('onboarding.step', { n: 2, total: 6 })}
      title={t('onboarding.handleTitle')}
      subtitle={t('onboarding.handleSubtitle')}
      footer={
        <>
          <Button onPress={next} disabled={durum !== 'musait'}>
            {t('common.continue')}
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            {t('common.back')}
          </Button>
        </>
      }
    >
      <Field
        label={t('onboarding.handleLabel')}
        value={handle ? `@${handle}` : ''}
        onChangeText={(t) => setHandle(cleanHandle(t))}
        placeholder={t('onboarding.handlePlaceholder')}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={21}
        note={t(`onboarding.handle.${durum}`)}
        onSubmitEditing={durum === 'musait' ? next : undefined}
      />
    </FormScreen>
  );
}
