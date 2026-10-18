import { useRouter } from 'expo-router';
import { BirthTimeStep } from '@/components/birth/BirthSteps';
import { useTranslation } from '@/i18n';

export default function DogumSaatiScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <BirthTimeStep
      eyebrow={t('onboarding.step', { n: 4, total: 6 })}
      onNext={() => router.push('/dogum-yeri')}
      onBack={() => router.back()}
    />
  );
}
