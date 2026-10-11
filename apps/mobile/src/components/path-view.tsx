import { useStudy } from "@/lib/study";
import { ProgressRing } from "@/components/progress-ring";
import { T } from "@/components/text";
import { LEVELS } from "@etalon/web-catalog";
import { pathOf, type PathState, type PathStep } from "@etalon/web-path";
import { colors } from "@/theme";
import { router } from "expo-router";
import { ArrowRight, Check } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

const BEFORE_CURRENT = 2;
const AFTER_CURRENT = 1;

function passed(state: PathState): boolean {
  return state === "knew" || state === "unsure" || state === "missed";
}

function previewOf(step: PathStep): string {
  const { card } = step;
  if (card.kind === "implement") return card.statement;
  const lines = card.code.trim().split("\n");
  return lines.reduce((longest, line) => (line.length > longest.length ? line : longest), "").trim();
}

function ContinueCard({ step }: { step: PathStep | undefined }) {
  if (!step) {
    return (
      <View style={styles.card}>
        <T mono size={12} color={colors.muted}>
          все уровни
        </T>
        <T size={22} weight="semibold" style={styles.cardTitle}>
          Тропа пройдена
        </T>
        <T size={14} color={colors.muted}>
          Загляни в «Повтор» — там задачи, где ты сомневался.
        </T>
      </View>
    );
  }
  const { card } = step;
  return (
    <Pressable
      onPress={() => router.push(`/tasks/${card.id}`)}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.rowBetween}>
        <T mono size={12} color={colors.muted}>
          следующая · {card.id}
        </T>
        <T mono size={12} color={colors.muted}>
          {card.kind}
        </T>
      </View>
      <T size={22} weight="semibold" style={styles.cardTitle}>
        {card.title}
      </T>
      <T mono size={12} color={colors.muted} numberOfLines={2} style={styles.preview}>
        {previewOf(step)}
      </T>
      <View style={styles.continue}>
        <T size={16} weight="bold" color={colors.paper}>
          Продолжить
        </T>
        <ArrowRight size={18} color={colors.paper} />
      </View>
    </Pressable>
  );
}

function StepMark({ state }: { state: PathState }) {
  if (state === "knew") return <Check size={18} color={colors.mark} />;
  if (state === "unsure") return <T mono size={12} color={colors.warn}>сомневался</T>;
  if (state === "missed") return <T mono size={12} color={colors.bad}>не знал</T>;
  if (state === "current") return <T mono size={11} color={colors.mark}>сейчас</T>;
  return null;
}

function TimelineRow({ step }: { step: PathStep }) {
  const { state, card } = step;
  const current = state === "current";
  const done = passed(state);
  const body = (
    <>
      {current ? <View style={styles.now} /> : null}
      <T mono size={12} color={current ? colors.mark : done ? colors.muted : colors.faint} style={styles.id}>
        {card.id}
      </T>
      <T
        size={15}
        weight={current ? "semibold" : "regular"}
        color={current ? colors.ink : done ? colors.muted : colors.faint}
        style={styles.flex}
      >
        {card.title}
      </T>
      <StepMark state={state} />
    </>
  );
  const rail = {
    borderLeftWidth: 2,
    borderLeftColor: done ? colors.mark : colors.line,
    borderStyle: done ? ("solid" as const) : ("dashed" as const),
    minHeight: current ? 56 : 48,
    paddingLeft: current ? 14 : 16,
  };
  if (state === "locked") {
    return <View style={[styles.step, rail]}>{body}</View>;
  }
  return (
    <Pressable onPress={() => router.push(`/tasks/${card.id}`)} style={[styles.step, rail]}>
      {body}
    </Pressable>
  );
}

function CurrentLevel({ level, steps }: { level: number; steps: PathStep[] }) {
  const meta = LEVELS.find((item) => item.level === level);
  const done = steps.filter((step) => passed(step.state)).length;
  const at = steps.findIndex((step) => step.state === "current");
  const anchor = at === -1 ? steps.length - 1 : at;
  const from = Math.max(0, anchor - BEFORE_CURRENT);
  const to = Math.min(steps.length, anchor + AFTER_CURRENT + 1);
  const shown = steps.slice(from, to);
  const rest = steps.length - to;
  return (
    <View style={styles.section}>
      <Pressable onPress={() => router.push(`/levels/${level}`)} style={styles.levelHead}>
        <ProgressRing
          parts={[{ value: done, color: colors.mark }]}
          total={steps.length}
          label={`Уровень ${level}: ${done} из ${steps.length}`}
        >
          <T mono size={13} weight="bold">
            {String(level).padStart(2, "0")}
          </T>
        </ProgressRing>
        <View style={styles.flex}>
          <T size={18} weight="semibold">
            {meta?.title}
          </T>
          <T mono size={12} color={colors.muted} style={styles.sub}>
            {done} / {steps.length} · теория ›
          </T>
        </View>
      </Pressable>
      <View style={styles.timeline}>
        {shown.map((step) => (
          <TimelineRow key={step.card.id} step={step} />
        ))}
        {rest > 0 ? (
          <Pressable onPress={() => router.push(`/levels/${level}`)} style={styles.more}>
            <T mono size={12} color={colors.faint} style={styles.id}>
              +{rest}
            </T>
            <T size={15} color={colors.faint}>
              ещё в уровне
            </T>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function LevelRow({ level, steps }: { level: number; steps: PathStep[] }) {
  const meta = LEVELS.find((item) => item.level === level);
  const done = steps.filter((step) => passed(step.state)).length;
  const complete = done === steps.length;
  return (
    <Pressable onPress={() => router.push(`/levels/${level}`)} style={styles.levelRow}>
      <ProgressRing
        parts={[{ value: done, color: colors.mark }]}
        total={steps.length}
        thickness={2}
        label={`Уровень ${level}: ${done} из ${steps.length}`}
      >
        <T mono size={13} color={complete ? colors.mark : colors.muted}>
          {String(level).padStart(2, "0")}
        </T>
      </ProgressRing>
      <View style={styles.flex}>
        <T size={16} weight="semibold" color={complete ? colors.ink : colors.muted}>
          {meta?.title}
        </T>
        <T mono size={12} color={colors.faint} style={styles.sub}>
          {done} / {steps.length}
        </T>
      </View>
    </Pressable>
  );
}

export function PathView() {
  const { cards, progress } = useStudy();
  const steps = pathOf(cards, progress);
  const current = steps.find((step) => step.state === "current");
  const focusLevel = current?.card.level ?? steps.at(-1)?.card.level;
  const others = LEVELS.filter((level) => level.level !== focusLevel);
  return (
    <View>
      <ContinueCard step={current} />
      {focusLevel !== undefined ? (
        <CurrentLevel level={focusLevel} steps={steps.filter((step) => step.card.level === focusLevel)} />
      ) : null}
      {others.length > 0 ? (
        <View style={styles.others}>
          {others.map((level) => {
            const section = steps.filter((step) => step.card.level === level.level);
            if (section.length === 0) return null;
            return <LevelRow key={level.level} level={level.level} steps={section} />;
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
  },
  pressed: { transform: [{ scale: 0.99 }] },
  cardTitle: { marginTop: 8, lineHeight: 26 },
  preview: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
    lineHeight: 18,
  },
  continue: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.mark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  section: { marginTop: 20 },
  levelHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
  sub: { marginTop: 2 },
  timeline: { marginTop: 14, marginLeft: 21 },
  step: { flexDirection: "row", alignItems: "center", gap: 14 },
  now: {
    width: 18,
    height: 18,
    marginLeft: -25,
    borderRadius: 9,
    backgroundColor: colors.mark,
    shadowColor: colors.mark,
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  id: { width: 32 },
  more: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderLeftWidth: 2,
    borderLeftColor: colors.line,
    borderStyle: "dashed",
    paddingLeft: 16,
  },
  others: { marginTop: 24, gap: 10 },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
