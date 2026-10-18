import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';
import { TopBar } from '@/components/TopBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ header: () => <TopBar /> }}>
      <Tabs.Screen name="index" options={{ title: 'BUGÜN' }} />
      <Tabs.Screen name="arkadaslar" options={{ title: 'ARKADAŞLAR' }} />
      <Tabs.Screen name="void" options={{ title: 'VOID' }} />
      <Tabs.Screen name="gunluk" options={{ title: 'GÜNLÜK' }} />
      <Tabs.Screen name="sen" options={{ title: 'SEN' }} />
    </Tabs>
  );
}
