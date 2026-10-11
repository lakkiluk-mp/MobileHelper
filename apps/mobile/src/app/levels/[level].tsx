import { ProgressRing } from "@/components/progress-ring";
import { SyncNote } from "@/components/shell";
import { T } from "@/components/text";
import { TheoryText } from "@/components/theory-text";
import { useStudy } from "@/lib/study";
import { LEVELS } from "@etalon/web-catalog";
import { pathOf, type PathState } from "@etalon/web-path";
import { colors } from "@/theme";
import { router, useLocalSearchParams } from "expo-router";
import { Check, ChevronDown, ChevronLeft, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Mark({ state }: { state: PathState }) {
  if (state === "knew") return <Check size={18} color={colors.mark} />;
  if (state === "unsure")
    return (
      <T mono size={12} color={colors.warn}>
        сомневался
      </T>
    );
  if (state === "missed")
    return (
      <T mono size={12} color={colors.bad}>
        не знал
      </T>
    );
  if (state === "current")
    return (
      <T mono size={11} color={colors.mark}>
        сейчас
      </T>
    );
  return <Lock size={16} color={colors.faint} />;
}

export default function LevelPage() {
  const params = useLocalSearchParams<{ level: string }>();
  const raw = Array.isArray(params.level) ? params.level[0] : params.level;
  const level = Number(raw);
  const meta = LEVELS.find((item) => item.level === level);
  const { cards, progress, ready } = useStudy();
  const steps = pathOf(cards, progress).filter((step) => step.card.level === level);
  const done = steps.filter((step) => step.state !== "current" && step.state !== "locked").length;
  const [theoryOpen, setTheoryOpen] = useState(true);
  const insets = useSafeAreaInsets();
  // Прогресс приезжает из базы после первого кадра, поэтому «открывать теорию только
  // на пустом уровне» решается здесь, а не в useState: иначе готовый уровень открывался бы с теорией.
  useEffect(() => {
    if (ready) setTheoryOpen(done === 0);
  }, [ready, done]);
  if (!meta) {
    return (
      <View style={[styles.page, { paddingTop: Math.max(insets.top, 12) }]}>
        <T size={16}>Уровня нет</T>
      </View>
    );
  }
  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 12) }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel="Назад к пути"
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View style={styles.head}>
          <ProgressRing
            parts={[{ value: done, color: colors.mark }]}
            total={steps.length}
            size={64}
            thickness={6}
            label={`${done} из ${steps.length}`}
          >
            <T mono size={16} weight="bold">
              {String(level).padStart(2, "0")}
            </T>
          </ProgressRing>
          <View style={styles.flex}>
            <T size={24} weight="semibold">
              {meta.title}
            </T>
            <T size={14} color={colors.muted} style={styles.blurb}>
              {meta.blurb}
            </T>
          </View>
        </View>
        <View style={styles.theory}>
          <Pressable
            accessibilityState={{ expanded: theoryOpen }}
            onPress={() => setTheoryOpen((value) => !value)}
            style={styles.theoryBtn}
          >
            <T size={15} weight="semibold">
              Теория темы
            </T>
            <ChevronDown
              size={20}
              color={colors.muted}
              style={{ transform: [{ rotate: theoryOpen ? "180deg" : "0deg" }] }}
            />
          </Pressable>
          {theoryOpen ? (
            <View style={styles.theoryBody}>
              <TheoryText text={meta.intro} />
            </View>
          ) : null}
        </View>
        <View style={styles.list}>
          {steps.map((step) => {
            const locked = ready && step.state === "locked";
            const current = step.state === "current";
            const passed = !current && step.state !== "locked";
            const body = (
              <>
                <T
                  mono
                  size={12}
                  color={current ? colors.mark : passed ? colors.muted : colors.faint}
                  style={styles.id}
                >
                  {step.card.id}
                </T>
                <T
                  size={15}
                  weight={current ? "semibold" : "regular"}
                  color={current || passed ? colors.ink : colors.faint}
                  style={styles.flex}
                >
                  {step.card.title}
                </T>
                <Mark state={step.state} />
              </>
            );
            const rail = [
              styles.step,
              {
                borderLeftColor: passed ? colors.mark : colors.line,
                borderStyle: passed ? ("solid" as const) : ("dashed" as const),
              },
            ];
            return locked ? (
              <View key={step.card.id} style={rail}>
                {body}
              </View>
            ) : (
              <Pressable
                key={step.card.id}
                onPress={() => router.push(`/tasks/${step.card.id}`)}
                style={rail}
              >
                {body}
              </Pressable>
            );
          })}
        </View>
        <SyncNote />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 16 },
  back: { marginLeft: -8, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  head: { marginTop: 8, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  flex: { flex: 1 },
  blurb: { marginTop: 4, lineHeight: 20 },
  theory: {
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  theoryBtn: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  theoryBody: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  list: { marginLeft: 9 },
  step: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderLeftWidth: 2,
    paddingVertical: 8,
    paddingLeft: 16,
  },
  id: { width: 32 },
});
