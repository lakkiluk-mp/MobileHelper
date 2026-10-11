import { Screen, SyncNote, TopBar, useTabBarInset } from "@/components/shell";
import { T } from "@/components/text";
import { colors } from "@/theme";
import { router } from "expo-router";
import { ArrowLeftRight, ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

export default function Profile() {
  const bottom = useTabBarInset();
  return (
    <Screen header={<TopBar title="Профиль" />}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.guest}>
          <View style={styles.avatar}>
            <T size={18} weight="bold" color={colors.paper}>
              Г
            </T>
          </View>
          <View style={styles.flex}>
            <T weight="semibold">Гость</T>
            <T size={14} color={colors.muted}>
              Прогресс хранится на этом устройстве
            </T>
          </View>
        </View>
        <Pressable onPress={() => router.push("/login")} style={styles.login}>
          <ArrowLeftRight size={22} color={colors.violet} />
          <T size={14} style={styles.flex}>
            Войти, чтобы прогресс был на всех устройствах
          </T>
          <ChevronRight size={20} color={colors.violet} />
        </Pressable>
        <View style={styles.menu}>
          <Pressable onPress={() => router.push("/settings")} style={styles.menuRow}>
            <T size={15}>Автодополнение в редакторе</T>
            <ChevronRight size={20} color={colors.muted} />
          </Pressable>
        </View>
        <SyncNote />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.violet,
    alignItems: "center",
    justifyContent: "center",
  },
  login: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.faint,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  flex: { flex: 1, flexShrink: 1, minWidth: 0 },
  menu: {
    marginTop: 20,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  menuRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
});
