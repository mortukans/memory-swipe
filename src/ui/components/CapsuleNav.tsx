import { PixelRatio, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { T } from './Text';

export interface CapsuleRoute {
  key: string;
  name: string;
  title: string;
}

/**
 * The three-item bottom capsule: Discover · Library · Review. Ink capsule in
 * light, paper-white in dark (the prototype's `.dark nav`), 28pt radius; the
 * current tab is a lime pill with ink text. Review carries the pending count.
 * Tab labels are the one place text scaling is capped (HIG tab-bar behaviour).
 */
export function CapsuleNav({
  routes,
  activeIndex,
  onPress,
  pendingCount,
  pendingHint,
}: {
  routes: CapsuleRoute[];
  activeIndex: number;
  onPress: (route: CapsuleRoute, focused: boolean) => void;
  pendingCount: number;
  /** e.g. "5 items waiting for review" — used as the Review tab's hint. */
  pendingHint?: string;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bigText = PixelRatio.getFontScale() >= 1.6;
  const labelColor = (focused: boolean) => (focused ? t.colors.ink : t.colors.navInactive);
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: t.spacing.page, right: t.spacing.page, bottom: Math.max(insets.bottom, 12) + 10 }}>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          backgroundColor: t.colors.capsule,
          borderRadius: t.radius.nav,
          padding: 6,
          shadowColor: '#243225',
          shadowOpacity: t.dark ? 0.35 : 0.125,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
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
              accessibilityLabel={route.title}
              accessibilityHint={badge && pendingHint ? pendingHint : undefined}
              onPress={() => onPress(route, focused)}
              style={{
                flex: 1,
                minHeight: t.targets.min,
                paddingVertical: 12,
                paddingHorizontal: 4,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: bigText ? 'column' : 'row',
                gap: 6,
                backgroundColor: focused ? t.colors.accent : 'transparent',
              }}
            >
              <T variant="meta" numberOfLines={1} maxFontSizeMultiplier={1.6} style={{ fontSize: 12, fontWeight: '600', color: labelColor(focused) }}>
                {route.title}
              </T>
              {badge ? (
                <View
                  style={{
                    minWidth: 18,
                    minHeight: 18,
                    borderRadius: 9,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    backgroundColor: focused ? t.colors.ink : t.colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T variant="meta" maxFontSizeMultiplier={1.6} style={{ fontSize: 10, lineHeight: 12, fontWeight: '700', color: focused ? t.colors.accent : t.colors.ink }}>
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
