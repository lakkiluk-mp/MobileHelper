import { T } from "@/components/text";
import { useUpdate } from "@/lib/use-update";
import { colors } from "@/theme";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function UpdateBanner() {
  const { available, progress, error, install, dismiss, hidden } = useUpdate(true);
  const insets = useSafeAreaInsets();
  if (!available || hidden) return null;
  const busy = progress !== null;
  return (
    <View style={[styles.banner, { bottom: insets.bottom + 72 }]}>
      <T size={14} weight="medium">
        Доступна версия {available}
      </T>
      {error ? (
        <T size={12} color={colors.bad} style={styles.note}>
          {error}
        </T>
      ) : null}
      <View style={styles.row}>
        <Pressable disabled={busy} onPress={install} style={styles.primary}>
          <T size={14} color={colors.paper}>
            {progress !== null ? `Загрузка ${Math.round(progress * 100)}%` : "Обновить"}
          </T>
        </Pressable>
        {busy ? null : (
          <Pressable onPress={dismiss} style={styles.secondary}>
            <T size={14} color={colors.muted}>
              Позже
            </T>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.raised,
    padding: 16,
  },
  note: { marginTop: 6 },
  row: { flexDirection: "row", marginTop: 12, gap: 8 },
  primary: {
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: colors.mark,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  secondary: { minHeight: 40, paddingHorizontal: 12, justifyContent: "center" },
});
