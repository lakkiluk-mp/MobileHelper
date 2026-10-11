import { T } from "@/components/text";
import { colors } from "@/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 16) }]}>
      <Pressable accessibilityLabel="Назад" onPress={() => router.back()} style={styles.back}>
        <T size={14} color={colors.mark}>
          ‹ Профиль
        </T>
      </Pressable>
      <T size={28} weight="semibold" style={styles.title}>
        Вход позже
      </T>
      <T size={15} color={colors.muted} style={styles.copy}>
        Эта сборка работает без входа. Оценки лежат на телефоне. Вход понадобится только чтобы
        прогресс переехал на второй телефон.
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 16 },
  back: { minHeight: 44, justifyContent: "center" },
  title: { marginTop: 16 },
  copy: { marginTop: 12, lineHeight: 22 },
});
