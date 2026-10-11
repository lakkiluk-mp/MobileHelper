import { ProgressRing } from "@/components/progress-ring";
import { LEVELS } from "@/lib/catalog";
import { pathOf, type PathState, type PathStep } from "@/lib/path";
import { useStudy } from "@/lib/study";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

const BEFORE_CURRENT = 2;
const AFTER_CURRENT = 1;

function passed(state: PathState): boolean {
  return state === "knew" || state === "unsure" || state === "missed";
}

function previewOf(step: PathStep): string {
  const { card } = step;
  if (card.kind === "implement") return card.statement;
  const lines = card.code.trim().split("\n");
  return lines
    .reduce((longest, line) => (line.length > longest.length ? line : longest), "")
    .trim();
}

function ContinueCard({ step }: { step: PathStep | undefined }) {
  if (!step) {
    return (
      <div className="rounded-[20px] border border-line bg-card p-4">
        <p className="m-0 font-mono text-xs text-muted">все уровни</p>
        <p className="mt-2 mb-0 text-[22px] leading-tight font-semibold">Тропа пройдена</p>
        <p className="mt-2 mb-0 text-sm text-muted">
          Загляни в «Повтор» — там задачи, где ты сомневался.
        </p>
      </div>
    );
  }
  const { card } = step;
  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: card.id }}
      className="block rounded-[20px] border border-line bg-card p-4 text-ink no-underline active:scale-[0.99]"
    >
      <span className="flex justify-between font-mono text-xs text-muted">
        <span>следующая · {card.id}</span>
        <span>{card.kind}</span>
      </span>
      <span className="mt-2 block text-[22px] leading-tight font-semibold text-balance">
        {card.title}
      </span>
      <span className="mt-3 line-clamp-2 block rounded-xl bg-paper px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted">
        {previewOf(step)}
      </span>
      <span className="mt-3.5 flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-mark text-base font-bold text-paper">
        Продолжить
        <ArrowRight className="size-[18px]" aria-hidden="true" />
      </span>
    </Link>
  );
}

function StepMark({ state }: { state: PathState }) {
  if (state === "knew") return <Check className="size-[18px] text-mark" aria-label="знал" />;
  if (state === "unsure") return <span className="font-mono text-xs text-warn">сомневался</span>;
  if (state === "missed") return <span className="font-mono text-xs text-bad">не знал</span>;
  if (state === "current") return <span className="font-mono text-[11px] text-mark">сейчас</span>;
  return null;
}

function TimelineRow({ step }: { step: PathStep }) {
  const { state, card } = step;
  const current = state === "current";
  const done = passed(state);
  const rail = done ? "border-mark border-solid" : "border-line border-dashed";
  const body = (
    <>
      {current ? (
        <span
          aria-hidden="true"
          className="-ml-[25px] size-[18px] shrink-0 rounded-full bg-mark shadow-[0_0_0_5px_rgb(198_242_78/0.18)]"
        />
      ) : null}
      <span
        className={`w-8 shrink-0 font-mono text-xs ${current ? "text-mark" : done ? "text-muted" : "text-faint"}`}
      >
        {card.id}
      </span>
      <span
        className={`flex-1 text-[15px] ${current ? "font-semibold text-ink" : done ? "text-muted" : "text-faint"}`}
      >
        {card.title}
      </span>
      <StepMark state={state} />
    </>
  );
  const className = `flex items-center gap-3.5 border-l-2 ${rail} ${current ? "min-h-14 pl-3.5" : "min-h-12 pl-4"}`;
  if (state === "locked") return <li className={className}>{body}</li>;
  return (
    <li>
      <Link
        to="/tasks/$taskId"
        params={{ taskId: card.id }}
        className={`${className} text-ink no-underline`}
      >
        {body}
      </Link>
    </li>
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
    <section className="mt-5">
      <Link
        to="/levels/$level"
        params={{ level: String(level) }}
        className="flex items-center gap-3 text-ink no-underline"
      >
        <ProgressRing
          parts={[{ value: done, color: "var(--color-mark)" }]}
          total={steps.length}
          label={`Уровень ${level}: ${done} из ${steps.length}`}
        >
          <span className="font-mono text-[13px] font-bold">{String(level).padStart(2, "0")}</span>
        </ProgressRing>
        <span className="flex-1">
          <span className="block text-lg font-semibold">{meta?.title}</span>
          <span className="mt-0.5 block font-mono text-xs text-muted">
            {done} / {steps.length} · теория ›
          </span>
        </span>
      </Link>
      <ol className="mt-3.5 ml-[21px] flex list-none flex-col p-0">
        {shown.map((step) => (
          <TimelineRow key={step.card.id} step={step} />
        ))}
        {rest > 0 ? (
          <li>
            <Link
              to="/levels/$level"
              params={{ level: String(level) }}
              className="flex min-h-12 items-center gap-3.5 border-l-2 border-dashed border-line pl-4 text-faint no-underline"
            >
              <span className="w-8 font-mono text-xs">+{rest}</span>
              <span className="text-[15px]">ещё в уровне</span>
            </Link>
          </li>
        ) : null}
      </ol>
    </section>
  );
}

function LevelRow({ level, steps }: { level: number; steps: PathStep[] }) {
  const meta = LEVELS.find((item) => item.level === level);
  const done = steps.filter((step) => passed(step.state)).length;
  const complete = done === steps.length;
  return (
    <li>
      <Link
        to="/levels/$level"
        params={{ level: String(level) }}
        className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-3 no-underline"
      >
        <ProgressRing
          parts={[{ value: done, color: "var(--color-mark)" }]}
          total={steps.length}
          thickness={2}
          label={`Уровень ${level}: ${done} из ${steps.length}`}
        >
          <span className={`font-mono text-[13px] ${complete ? "text-mark" : "text-muted"}`}>
            {String(level).padStart(2, "0")}
          </span>
        </ProgressRing>
        <span className="flex-1">
          <span className={`block text-base font-semibold ${complete ? "text-ink" : "text-muted"}`}>
            {meta?.title}
          </span>
          <span className="mt-0.5 block font-mono text-xs text-faint">
            {done} / {steps.length}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function PathView() {
  const { cards, progress } = useStudy();
  const steps = pathOf(cards, progress);
  const current = steps.find((step) => step.state === "current");
  const focusLevel = current?.card.level ?? steps.at(-1)?.card.level;
  const others = LEVELS.filter((level) => level.level !== focusLevel);

  return (
    <div>
      <ContinueCard step={current} />
      {focusLevel !== undefined ? (
        <CurrentLevel
          level={focusLevel}
          steps={steps.filter((step) => step.card.level === focusLevel)}
        />
      ) : null}
      {others.length > 0 ? (
        <ul className="mt-6 flex list-none flex-col gap-2.5 p-0">
          {others.map((level) => {
            const section = steps.filter((step) => step.card.level === level.level);
            if (section.length === 0) return null;
            return <LevelRow key={level.level} level={level.level} steps={section} />;
          })}
        </ul>
      ) : null}
    </div>
  );
}
