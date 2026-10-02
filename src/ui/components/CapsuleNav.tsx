import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { T } from './Text';

export interface CapsuleRoute {
  key: string;
  name: string;
  title: string;
}

/**
 * The three-item bottom capsule: Discover · Library · Review. Ink capsule,
 * 28pt radius; the current tab is a lime pill with ink text. Review carries the
 * pending count. Purely presentational — the (tabs) layout does the navigating.
 */
export function CapsuleNav({
  routes,
  activeIndex,
  onPress,
  pendingCount,
}: {
  routes: CapsuleRoute[];
  activeIndex: number;
  onPress: (route: CapsuleRoute, focused: boolean) => void;
  pendingCount: number;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: t.spacing.page, right: t.spacing.page, bottom: Math.max(insets.bottom, 12) + 10 }}>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          backgroundColor: t.colors.ink,
          borderRadius: t.radius.nav,
          padding: 6,
          shadowColor: '#243225',
          shadowOpacity: 0.14,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        {routes.map((route, index) => {
          const focused = activeIndex === index;
          const badge = route.name === 'review' && pendingCount > 0 ? pendingCount : null;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${route.title}, ${badge}` : route.title}
              onPress={() => onPress(route, focused)}
              style={{
                flex: 1,
                minHeight: t.targets.min,
                paddingVertical: 12,
                paddingHorizontal: 4,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                backgroundColor: focused ? t.colors.accent : 'transparent',
              }}
            >
              <T variant="meta" style={{ fontSize: 12, fontWeight: '600', color: focused ? t.colors.ink : t.colors.navInactive }}>
                {route.title}
              </T>
              {badge ? (
                <View
                  style={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    paddingHorizontal: 5,
                    backgroundColor: focused ? t.colors.ink : t.colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T variant="meta" style={{ fontSize: 10, fontWeight: '700', color: focused ? t.colors.accent : t.colors.ink }}>
                    {badge > 99 ? '99+' : badge}
                  </T>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
