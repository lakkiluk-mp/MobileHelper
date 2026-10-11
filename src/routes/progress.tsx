import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/app-shell";
import { ProgressRing } from "@/components/progress-ring";
import { LEVELS } from "@/lib/catalog";
import { activity, statusCounts, streak } from "@/lib/stats";
import { useStudy } from "@/lib/study";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

const WEEKS = 15;
const SHADES = ["var(--color-raised)", "#3b4a1f", "#6e8f2a", "#9dc63a", "var(--color-mark)"];

function shade(count: number): string {
  if (count === 0) return SHADES[0] ?? "";
  return SHADES[Math.min(4, Math.ceil(count / 2))] ?? "";
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

  return (
    <section className="rounded-[18px] border border-line bg-card p-3.5">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-base font-semibold">Активность</h2>
        <p className="m-0 font-mono text-xs text-warn">
          {run > 0 ? `${run} дн. подряд` : "серии нет"}
        </p>
      </div>
      <div
        aria-hidden="true"
        className="mt-3 grid grid-flow-col gap-1"
        style={{
          gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
          gridTemplateRows: "repeat(7, 14px)",
        }}
      >
        {(
          days ??
          Array.from({ length: WEEKS * 7 }, (_, index) => ({ key: String(index), count: 0 }))
        ).map((day) => (
          <span
            key={day.key}
            className="rounded-[3px]"
            style={{ background: shade(day.count) }}
            title={`${day.key}: ${day.count}`}
          />
        ))}
      </div>
    </section>
  );
}

function ProgressPage() {
  const { cards, progress } = useStudy();
  const counts = statusCounts(progress);
  const done = counts.knew + counts.unsure + counts.missed;
  const legend = [
    { label: "Знал", value: counts.knew, color: "var(--color-mark)" },
    { label: "Сомневался", value: counts.unsure, color: "var(--color-warn)" },
    { label: "Не знал", value: counts.missed, color: "var(--color-bad)" },
  ];

  return (
    <AppShell>
      <TopBar title="Прогресс" />
      <section className="flex items-center gap-5">
        <ProgressRing
          parts={legend}
          total={cards.length}
          size={112}
          thickness={10}
          label={`Пройдено ${done} из ${cards.length}`}
        >
          <span className="text-3xl leading-none font-bold">{done}</span>
          <span className="font-mono text-[11px] text-muted">из {cards.length}</span>
        </ProgressRing>
        <ul className="m-0 flex flex-1 list-none flex-col gap-2 p-0 text-sm">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
              {item.label}
              <b className="ml-auto font-mono">{item.value}</b>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5">
        <Activity />
      </div>

      <section className="mt-5">
        <h2 className="mt-0 mb-2.5 text-base font-semibold">По уровням</h2>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {LEVELS.map((level) => {
            const section = cards.filter((card) => card.level === level.level);
            if (section.length === 0) return null;
            const passed = section.filter((card) => progress[card.id]?.status).length;
            return (
              <li key={level.level}>
                <Link
                  to="/levels/$level"
                  params={{ level: String(level.level) }}
                  className="grid min-h-11 grid-cols-[26px_minmax(0,1fr)_48px] items-center gap-2.5 py-1 text-ink no-underline"
                >
                  <span className="font-mono text-xs text-muted">
                    {String(level.level).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm">{level.title}</span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-[3px] bg-line">
                      <span
                        className="block h-full bg-mark"
                        style={{ width: `${Math.round((passed / section.length) * 100)}%` }}
                      />
                    </span>
                  </span>
                  <span className="text-right font-mono text-xs text-muted">
                    {passed}/{section.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
