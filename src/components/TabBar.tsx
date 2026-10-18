import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotifications } from '@/lib/notifications';
import { colors, fonts, layout } from '@/theme';

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { badge } = useNotifications();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={styles.item}
          >
            <View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
              {route.name === 'arkadaslar' && badge && <View style={styles.badge} accessibilityLabel="Yeni bildirim" />}
            </View>
            {focused && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: layout.hairline,
    borderTopColor: colors.line,
  },
  item: { flex: 1, height: layout.navHeight, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: 0.6, color: colors.faint },
  labelActive: { color: colors.fg },
  badge: { position: 'absolute', top: -2, right: -7, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.fg },
  dot: {
    position: 'absolute',
    bottom: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.fg,
  },
});
