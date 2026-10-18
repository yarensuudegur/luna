import { useRouter } from 'expo-router';
import { useState } from 'react';
import { BirthPlaceStep } from '@/components/birth/BirthSteps';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { cityLabel } from '@/lib/cities';
import type { City } from '@/lib/cities';
import { useOnboarding } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';

export default function BirthEditPlaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, refreshProfile } = useAuth();
  const { draft } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(place: City) {
    if (!session) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        birth_date: draft.birthDate,
        birth_time: draft.birthTime,
        birth_time_known: draft.birthTime !== null,
        birth_place: cityLabel(place),
        lat: place.lat,
        lon: place.lon,
        timezone: place.tz,
      })
      .eq('id', session.user.id);
    if (err) {
      setError(t('birthEdit.saveError'));
      setBusy(false);
      return;
    }
    // Harita ve günlük içerik profilden hesaplanır; profil yenilenince kendiliğinden yeniden hesaplanır.
    await refreshProfile();
    setBusy(false);
    router.navigate('/sen');
  }

  return (
    <BirthPlaceStep
      eyebrow={t('birthEdit.step', { n: 3, total: 3 })}
      onNext={save}
      onBack={() => router.back()}
      nextLabel={t('birthEdit.saveBtn')}
      loading={busy}
      error={error}
    />
  );
}
