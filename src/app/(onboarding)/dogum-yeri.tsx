import { useRouter } from 'expo-router';
import { BirthPlaceStep } from '@/components/birth/BirthSteps';
import { useTranslation } from '@/i18n';

export default function DogumYeriScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <BirthPlaceStep
      eyebrow={t('onboarding.step', { n: 5, total: 6 })}
      onNext={() => router.push('/bildirim')}
      onBack={() => router.back()}
    />
  );
}
