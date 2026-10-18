import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useTranslation } from '@/i18n';
import { useOnboarding } from '@/lib/onboarding';

export default function AdScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { draft, update } = useOnboarding();
  const [name, setName] = useState(draft.name);
  const clean = name.trim();

  function next() {
    update({ name: clean });
    router.push('/kullanici-adi');
  }

  return (
    <FormScreen
      eyebrow={t('onboarding.step', { n: 1, total: 6 })}
      title={t('onboarding.nameTitle')}
      subtitle={t('onboarding.nameSubtitle')}
      footer={
        <Button onPress={next} disabled={clean.length < 2}>
          {t('common.continue')}
        </Button>
      }
    >
      <Field
        label={t('onboarding.nameLabel')}
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
        autoComplete="given-name"
        maxLength={40}
        onSubmitEditing={clean.length >= 2 ? next : undefined}
      />
    </FormScreen>
  );
}
