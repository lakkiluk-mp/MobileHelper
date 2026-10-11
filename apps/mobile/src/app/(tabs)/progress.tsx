import { ProgressRing } from "@/components/progress-ring";
import { Screen, TopBar, useTabBarInset } from "@/components/shell";
import { T } from "@/components/text";
import { useStudy } from "@/lib/study";
import { LEVELS } from "@etalon/web-catalog";
import { activity, statusCounts, streak } from "@etalon/web-stats";
import { colors } from "@/theme";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const WEEKS = 15;
const SHADES = [colors.raised, "#3b4a1f", "#6e8f2a", "#9dc63a", colors.mark];

function shade(count: number): string {
  if (count === 0) return SHADES[0] ?? colors.raised;
  return SHADES[Math.min(4, Math.ceil(count / 2))] ?? colors.mark;
}

function Activity() {
  const { progress } = useStudy();
  const [days, setDays] = useState<Array<{ key: string; count: number }> | null>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const now = new Date();
    setDays(activity(progress, now, WEEKS * 7));
    setRun(streak(progress, now));
  }, [progress]);
  const cells =
    days ?? Array.from({ length: WEEKS * 7 }, (_, index) => ({ key: String(index), count: 0 }));
  const weeks = Array.from({ length: WEEKS }, (_, week) => cells.slice(week * 7, week * 7 + 7));
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <T size={16} weight="semibold">
          Активность
        </T>
        <T mono size={12} color={colors.warn}>
          {run > 0 ? `${run} дн. подряд` : "серии нет"}
        </T>
      </View>
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.col}>
            {week.map((day) => (
              <View key={day.key} style={[styles.cell, { backgroundColor: shade(day.count) }]} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProgressPage() {
  const { cards, progress } = useStudy();
  const bottom = useTabBarInset();
  const counts = statusCounts(progress);
  const done = counts.knew + counts.unsure + counts.missed;
  const legend = [
    { label: "Знал", value: counts.knew, color: colors.mark },
    { label: "Сомневался", value: counts.unsure, color: colors.warn },
    { label: "Не знал", value: counts.missed, color: colors.bad },
  ];
  return (
    <Screen header={<TopBar title="Прогресс" />}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summary}>
          <ProgressRing
            parts={legend}
            total={cards.length}
            size={112}
            thickness={10}
            label={`Пройдено ${done} из ${cards.length}`}
          >
            <T size={30} weight="bold">
              {done}
            </T>
            <T mono size={11} color={colors.muted}>
              из {cards.length}
            </T>
          </ProgressRing>
          <View style={styles.legend}>
            {legend.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.swatch, { backgroundColor: item.color }]} />
                <T size={14}>{item.label}</T>
                <T mono size={14} weight="bold" style={styles.legendValue}>
                  {item.value}
                </T>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.block}>
          <Activity />
        </View>
        <T size={16} weight="semibold" style={styles.levelsTitle}>
          По уровням
        </T>
        {LEVELS.map((level) => {
          const section = cards.filter((card) => card.level === level.level);
          if (section.length === 0) return null;
          const passed = section.filter((card) => progress[card.id]?.status).length;
          return (
            <Pressable
              key={level.level}
              onPress={() => router.push(`/levels/${level.level}`)}
              style={styles.level}
            >
              <T mono size={12} color={colors.muted} style={styles.levelId}>
                {String(level.level).padStart(2, "0")}
              </T>
              <View style={styles.flex}>
                <T size={14}>{level.title}</T>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.round((passed / section.length) * 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <T mono size={12} color={colors.muted}>
                {passed}/{section.length}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: "row", alignItems: "center", gap: 20 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendValue: { marginLeft: "auto" },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  block: { marginTop: 20 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 14,
  },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  grid: { marginTop: 12, flexDirection: "row", gap: 4 },
  col: { flex: 1, gap: 4 },
  cell: { height: 14, borderRadius: 3 },
  levelsTitle: { marginTop: 20, marginBottom: 10 },
  level: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  levelId: { width: 26 },
  flex: { flex: 1 },
  track: {
    marginTop: 6,
    height: 6,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  fill: { height: "100%", backgroundColor: colors.mark },
});
