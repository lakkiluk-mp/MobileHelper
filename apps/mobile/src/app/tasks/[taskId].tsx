import { T } from "@/components/text";
import { TaskScreenBody } from "@/components/task-view";
import { useStudy } from "@/lib/study";
import { lockOf, pathOf, type PathState } from "@etalon/web-path";
import { colors } from "@/theme";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SEGMENT: Record<PathState, string> = {
  knew: colors.mark,
  unsure: colors.warn,
  missed: colors.bad,
  current: colors.ink,
  locked: colors.line,
};

function Back() {
  return (
    <Pressable accessibilityLabel="Назад к пути" onPress={() => router.back()} style={styles.back}>
      <ChevronLeft size={24} color={colors.ink} />
    </Pressable>
  );
}

export default function TaskPage() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const id = Array.isArray(taskId) ? taskId[0] : taskId;
  const { cards, ready, progress } = useStudy();
  const insets = useSafeAreaInsets();
  const card = cards.find((item) => item.id === id);
  if (!ready || !id) {
    return (
      <View style={[styles.page, { paddingTop: Math.max(insets.top, 16) }]}>
        <T size={14} color={colors.muted}>
          Открываю задачу
        </T>
      </View>
    );
  }
  if (!card) {
    return (
      <View style={[styles.page, { paddingTop: Math.max(insets.top, 16) }]}>
        <Back />
        <T size={26} weight="semibold" style={styles.lockedTitle}>
          Задачи нет
        </T>
      </View>
    );
  }
  const steps = pathOf(cards, progress);
  const step = steps.find((item) => item.card.id === card.id);
  if (step?.state === "locked") {
    const { next: current, gate } = lockOf(cards, progress, steps, card);
    return (
      <View style={[styles.page, { paddingTop: Math.max(insets.top, 16) }]}>
        <Back />
        <T size={26} weight="semibold" style={styles.lockedTitle}>
          Шаг ещё закрыт
        </T>
        <T size={14} color={colors.muted} style={styles.lockedText}>
          {gate
            ? `Тема откроется, когда в теме ${gate.level} ещё ${gate.need} задач будут на «знал».`
            : current
              ? `Сначала оцени ${current.card.id}. Потом откроется ${card.id}.`
              : "Этот шаг откроется по порядку тропы."}
        </T>
        {current ? (
          <Pressable onPress={() => router.replace(`/tasks/${current.card.id}`)} style={styles.go}>
            <T size={16} weight="bold" color={colors.paper}>
              К шагу {current.card.id}
            </T>
          </Pressable>
        ) : null}
      </View>
    );
  }
  const level = steps.filter((item) => item.card.level === card.level);
  const position = level.findIndex((item) => item.card.id === card.id) + 1;
  const next = steps[steps.findIndex((item) => item.card.id === card.id) + 1];
  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 12) }]}>
      <TaskScreenBody
        key={card.id}
        card={card}
        nextId={next?.card.id ?? null}
        nextLocked={next?.state === "locked"}
        onNext={() => {
          if (!next) {
            router.replace("/");
            return;
          }
          if (next.state === "locked") return;
          router.replace(`/tasks/${next.card.id}`);
        }}
        header={
          <>
            <View style={styles.header}>
              <Back />
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`Уровень ${card.level}`}
                accessibilityValue={{ min: 0, max: level.length, now: position }}
                style={styles.segments}
              >
                {level.map((item) => (
                  <View
                    key={item.card.id}
                    style={[
                      styles.segment,
                      { backgroundColor: item.card.id === card.id ? colors.ink : SEGMENT[item.state] },
                    ]}
                  />
                ))}
              </View>
              <T mono size={13} color={colors.muted}>
                {card.id}
              </T>
            </View>
            <T mono size={12} color={colors.muted} style={styles.kind}>
              {card.kind === "predict" ? "predict · что выведет консоль" : "implement · напиши сам"}
            </T>
            <T size={21} weight="semibold" style={styles.title}>
              {card.title}
            </T>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  back: { marginLeft: -8, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  segments: { flex: 1, flexDirection: "row", gap: 3 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  kind: { marginTop: 8 },
  title: { marginTop: 4, lineHeight: 26 },
  lockedTitle: { marginTop: 16 },
  lockedText: { marginTop: 12, lineHeight: 20 },
  go: {
    marginTop: 24,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.mark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
});
