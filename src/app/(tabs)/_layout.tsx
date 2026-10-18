import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';
import { TopBar } from '@/components/TopBar';
import { NotificationsProvider } from '@/lib/notifications';
import { TodayProvider } from '@/lib/today';

export default function TabsLayout() {
  return (
    <NotificationsProvider>
    <TodayProvider>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ header: ({ route }) => <TopBar routeName={route.name} /> }}
      >
        <Tabs.Screen name="index" options={{ title: 'BUGÜN' }} />
        <Tabs.Screen name="arkadaslar" options={{ title: 'ARKADAŞLAR' }} />
        <Tabs.Screen name="void" options={{ title: 'VOID' }} />
        <Tabs.Screen name="gunluk" options={{ title: 'GÜNLÜK' }} />
        <Tabs.Screen name="sen" options={{ title: 'SEN' }} />
      </Tabs>
    </TodayProvider>
    </NotificationsProvider>
  );
}
