import { useRouter } from 'expo-router';
import { BirthDateStep } from '@/components/birth/BirthSteps';
import { useTranslation } from '@/i18n';

export default function BirthEditDateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <BirthDateStep
      eyebrow={t('birthEdit.step', { n: 1, total: 3 })}
      onNext={() => router.push('/dogum-duzenle/saat')}
      onBack={() => router.back()}
      backLabel={t('common.cancel')}
    />
  );
}
