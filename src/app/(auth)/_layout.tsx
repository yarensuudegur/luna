import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'giris' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
