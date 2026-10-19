import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Intro } from '@/components/Intro';
import { loadLanguage } from '@/i18n';
import { AuthProvider, isProfileComplete, useAuth } from '@/lib/auth';
import { SettingsProvider } from '@/lib/settings';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Oturum yoksa (auth), profil eksikse (onboarding), tamamsa (tabs). */
function Routes() {
  const { session, profile, loading } = useAuth();
  const complete = isProfileComplete(profile);

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
        <Stack.Screen name="dogum-duzenle" />
      </Stack.Protected>
    </Stack>
  );
}

/** Yükleme sürerken giriş animasyonu ekranı kaplar; her şey hazır olunca ana ekran belirir. */
function Shell({ fontsReady }: { fontsReady: boolean }) {
  const { loading } = useAuth();
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    void loadLanguage().finally(() => setLangReady(true));
  }, []);

  const hideSplash = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  const ready = fontsReady && langReady && !loading;

  return (
    <>
      {fontsReady && <Routes />}
      <Intro ready={ready} onShown={hideSplash} />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  return (
    <View style={styles.page}>
      <View style={styles.frame}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <AuthProvider>
            <SettingsProvider>
              <Shell fontsReady={loaded || !!error} />
            </SettingsProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </View>
    </View>
  );
}

/** Masaüstünde ekran telefon gibi: en çok 430px, ortada; iki yanı zemin rengi. */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  frame: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', overflow: 'hidden' },
});
