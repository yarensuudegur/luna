import { useRouter } from 'expo-router';
import { BirthDateStep } from '@/components/birth/BirthSteps';
import { useTranslation } from '@/i18n';

export default function DogumTarihiScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <BirthDateStep
      eyebrow={t('onboarding.step', { n: 3, total: 6 })}
      onNext={() => router.push('/dogum-saati')}
      onBack={() => router.back()}
    />
  );
}
