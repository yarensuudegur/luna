import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, isProfileComplete, useAuth } from '@/lib/auth';
import { fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Oturum yoksa (auth), profil eksikse (onboarding), tamamsa (tabs). */
function Routes() {
  const { session, profile, loading } = useAuth();
  const complete = isProfileComplete(profile);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !complete}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && complete}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
