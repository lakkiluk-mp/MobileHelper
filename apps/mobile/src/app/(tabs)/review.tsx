import { Screen, TopBar, useTabBarInset } from "@/components/shell";
import { T } from "@/components/text";
import { useStudy } from "@/lib/study";
import { colors } from "@/theme";
import type { ProgressStatus } from "@etalon/shared";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const STATUS_LABEL: Partial<Record<ProgressStatus, { text: string; color: string; bg: string }>> = {
  missed: { text: "не знал", color: colors.bad, bg: "rgba(255, 138, 138, 0.15)" },
  unsure: { text: "сомневался", color: colors.warn, bg: "rgba(255, 184, 77, 0.15)" },
};

const WEIGHT: Record<ProgressStatus, number> = { missed: 0, unsure: 1, knew: 2 };

export default function Review() {
  const { cards, progress, ready } = useStudy();
  const bottom = useTabBarInset();
  const queue = cards
    .filter((card) => {
      const status = progress[card.id]?.status;
      return status === "missed" || status === "unsure";
    })
    .sort((a, b) => {
      const sa = progress[a.id]?.status ?? "knew";
      const sb = progress[b.id]?.status ?? "knew";
      return (
        WEIGHT[sa] - WEIGHT[sb] ||
        (progress[a.id]?.updatedAt ?? "").localeCompare(progress[b.id]?.updatedAt ?? "")
      );
    });
  const first = queue[0];
  return (
    <Screen header={<TopBar title="Повтор" />}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        <T size={14} color={colors.muted} style={styles.lead}>
          Задачи, где ты не знал или сомневался. Сначала самые старые «не знал».
        </T>
        {!ready ? <View style={styles.pulse} /> : null}
        {ready && !first ? (
          <View style={styles.empty}>
            <T size={18} weight="semibold">
              Повторять нечего
            </T>
            <T size={14} color={colors.muted} style={styles.sub}>
              Всё, что ты оценил, ты знал.
            </T>
          </View>
        ) : null}
        {first ? (
          <>
            <Pressable onPress={() => router.push(`/tasks/${first.id}`)} style={styles.start}>
              <T size={16} weight="bold" color={colors.paper}>
                Начать · {queue.length}
              </T>
            </Pressable>
            <View style={styles.list}>
              {queue.map((card, index) => {
                const status = progress[card.id]?.status;
                const badge = status ? STATUS_LABEL[status] : undefined;
                return (
                  <Pressable
                    key={card.id}
                    onPress={() => router.push(`/tasks/${card.id}`)}
                    style={[styles.row, index < queue.length - 1 ? styles.border : null]}
                  >
                    <T mono size={12} color={colors.muted} style={styles.id}>
                      {card.id}
                    </T>
                    <T size={14} style={styles.flex}>
                      {card.title}
                    </T>
                    {badge ? (
                      <T
                        size={12}
                        color={badge.color}
                        style={[styles.badge, { backgroundColor: badge.bg }]}
                      >
                        {badge.text}
                      </T>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginBottom: 16, lineHeight: 20 },
  pulse: { height: 48, borderRadius: 16, backgroundColor: colors.card },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    padding: 20,
    alignItems: "center",
  },
  sub: { marginTop: 4 },
  start: {
    marginBottom: 16,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.mark,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  border: { borderBottomWidth: 1, borderBottomColor: colors.line },
  id: { width: 32 },
  flex: { flex: 1 },
  badge: { borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 2 },
});
