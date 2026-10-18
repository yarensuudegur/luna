import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/lib/onboarding';

export const unstable_settings = { initialRouteName: 'ad' };

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </OnboardingProvider>
  );
}
