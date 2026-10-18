import { useRouter } from 'expo-router';
import { BirthTimeStep } from '@/components/birth/BirthSteps';
import { useTranslation } from '@/i18n';

export default function BirthEditTimeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <BirthTimeStep
      eyebrow={t('birthEdit.step', { n: 2, total: 3 })}
      onNext={() => router.push('/dogum-duzenle/yer')}
      onBack={() => router.back()}
    />
  );
}
