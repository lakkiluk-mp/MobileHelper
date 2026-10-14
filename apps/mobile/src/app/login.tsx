import { T } from "@/components/text";
import { useStudy } from "@/lib/study";
import { colors } from "@/theme";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
  const insets = useSafeAreaInsets();
  const { account, offline, signIn, signOut } = useStudy();
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 16) }]}>
      <Pressable accessibilityLabel="Назад" onPress={() => router.back()} style={styles.back}>
        <T size={14} color={colors.mark}>
          ‹ Профиль
        </T>
      </Pressable>
      <T size={28} weight="semibold" style={styles.title}>
        {account ? "Аккаунт" : "Вход"}
      </T>
      <T size={15} color={colors.muted} style={styles.copy}>
        {account
          ? `Вы вошли как ${account.email}. Оценки с этого телефона уходят в аккаунт и видны на других устройствах.`
          : "Без входа всё работает, оценки лежат на телефоне. Войдите, чтобы прогресс был на всех устройствах. Оценки этого телефона перенесутся в аккаунт."}
      </T>
      <Pressable
        disabled={busy || (offline && !account)}
        onPress={() =>
          void run(async () => {
            if (account) {
              await signOut();
              return;
            }
            await signIn();
          })
        }
        style={[
          styles.button,
          account ? styles.secondary : null,
          busy || (offline && !account) ? styles.disabled : null,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.paper} />
        ) : (
          <T size={15} weight="semibold" color={account ? colors.ink : colors.paper}>
            {account ? "Выйти" : "Войти через Google"}
          </T>
        )}
      </Pressable>
      {offline && !account ? (
        <T size={14} color={colors.muted} style={styles.copy}>
          Нет сети — вход станет доступен, когда она появится
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 16 },
  back: { minHeight: 44, justifyContent: "center" },
  title: { marginTop: 16 },
  copy: { marginTop: 12, lineHeight: 22 },
  button: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.violet,
  },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  disabled: { opacity: 0.5 },
});
