import { tabBarStyle, useTabBarBottom } from "@/components/shell";
import { colors } from "@/theme";
import { Tabs } from "expo-router";
import {
  ChartNoAxesColumn,
  RotateCcw,
  Route,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { T } from "@/components/text";

const ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: "Путь", icon: Route },
  review: { label: "Повтор", icon: RotateCcw },
  progress: { label: "Прогресс", icon: ChartNoAxesColumn },
  profile: { label: "Профиль", icon: UserRound },
};

function PillBar({
  state,
  navigation,
}: {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: { navigate: (name: string) => void };
}) {
  const bottom = useTabBarBottom();
  return (
    <View pointerEvents="box-none" style={[styles.slot, { paddingBottom: bottom }]}>
      <View style={styles.barInset}>
        <View accessibilityLabel="Разделы" style={[tabBarStyle.bar, styles.barFlow]}>
          {state.routes.map((route, index) => {
            const item = ICONS[route.name];
            if (!item) return null;
            const active = state.index === index;
            const Icon = item.icon;
            return (
              <Pressable
                key={route.key}
                accessibilityLabel={item.label}
                onPress={() => navigation.navigate(route.name)}
                style={active ? tabBarStyle.active : tabBarStyle.idle}
              >
                <Icon size={22} color={active ? colors.paper : colors.muted} />
                {active ? (
                  <T
                    size={14}
                    weight="bold"
                    color={colors.paper}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.2}
                    style={styles.label}
                  >
                    {item.label}
                  </T>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillBar state={props.state} navigation={props.navigation} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: colors.paper },
        // Бар идёт в потоке поверх сцены: safe-area добирается padding-ом, а не магическим bottom —
        // иначе на телефоне с кнопочной навигацией или другим вырезом он уезжает.
        tabBarStyle: { backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Путь" }} />
      <Tabs.Screen name="review" options={{ title: "Повтор" }} />
      <Tabs.Screen name="progress" options={{ title: "Прогресс" }} />
      <Tabs.Screen name="profile" options={{ title: "Профиль" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  /** Те же поля, что у контента (`shell.tsx` → screen.paddingHorizontal) и у веба (`inset-x-4`). */
  barInset: { paddingHorizontal: 16 },
  barFlow: { position: "relative", left: 0, right: 0, bottom: 0 },
  label: { flexShrink: 1 },
});
