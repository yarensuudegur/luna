import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { draftFromProfile, OnboardingProvider } from '@/lib/onboarding';

export const unstable_settings = { initialRouteName: 'tarih' };

/** Ayarlar > Doğum bilgileri: onboarding adımları, mevcut profil bilgileriyle dolu açılır. */
export default function BirthEditLayout() {
  const { profile } = useAuth();
  const initial = useMemo(() => draftFromProfile(profile), [profile]);
  return (
    <OnboardingProvider initial={initial}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </OnboardingProvider>
  );
}
