import { LEVELS } from "@/lib/catalog";
import { pathOf, type PathState, type PathStep } from "@/lib/path";
import { useStudy } from "@/lib/study";
import { TheoryText } from "@/components/theory-text";
import { Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";

const X_PERCENT = [50, 76, 50, 24] as const;

function xOf(index: number): number {
  return X_PERCENT[index % X_PERCENT.length] ?? 50;
}

function rowSpan(state: PathState): number {
  return state === "current" ? 168 : 104;
}

function passed(state: PathState): boolean {
  return state === "knew" || state === "unsure" || state === "missed";
}

function nodeClass(state: PathState): string {
  const size = state === "current" ? "size-16 text-sm" : "size-14 text-xs";
  const base = `${size} relative z-10 flex items-center justify-center rounded-full font-mono transition-transform duration-150 ease-out`;
  if (state === "knew") return `${base} bg-mark text-paper`;
  if (state === "unsure") return `${base} border border-mark bg-mark-soft text-ink`;
  if (state === "missed") return `${base} border border-ink bg-card text-ink`;
  if (state === "current") {
    return `${base} border-2 border-mark bg-card text-mark shadow-[0_0_0_8px_var(--color-mark-soft)]`;
  }
  return `${base} border border-[#d9d0c2] bg-[#e7e1d6] text-muted`;
}

type Placed = { step: PathStep; x: number; y: number };

function place(section: PathStep[]): { items: Placed[]; height: number } {
  let cursor = 0;
  const items = section.map((step) => {
    const span = rowSpan(step.state);
    const y = cursor + span / 2;
    cursor += span;
    return { step, x: xOf(step.index), y };
  });
  return { items, height: cursor };
}

function bend(a: Placed, b: Placed): string {
  const mid = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`;
}

function StepNode({ item, currentRef }: { item: Placed; currentRef: RefObject<HTMLLIElement | null> }) {
  const { step, x, y } = item;
  const current = step.state === "current";
  const locked = step.state === "locked";
  return (
    <li
      ref={current ? currentRef : undefined}
      className="absolute"
      style={{ left: `${x}%`, top: y, transform: "translate(-50%, -50%)" }}
    >
      {current ? (
        <p className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 text-xs font-medium tracking-widest text-mark uppercase">
          Сейчас
        </p>
      ) : null}
      {locked ? (
        <div className={nodeClass("locked")} aria-label={`${step.card.id} ${step.card.title}, закрыто`}>
          <Lock className="size-4" aria-hidden="true" />
        </div>
      ) : (
        <Link
          to="/tasks/$taskId"
          params={{ taskId: step.card.id }}
          aria-current={current ? "step" : undefined}
          aria-label={`${step.card.id} ${step.card.title}`}
          className={`${nodeClass(step.state)} no-underline active:scale-[0.96]`}
        >
          {step.state === "knew" ? <Check className="size-5" aria-hidden="true" /> : step.card.id}
        </Link>
      )}
      {current ? (
        <p className="absolute top-full left-1/2 mt-3 w-40 -translate-x-1/2 text-center text-sm text-pretty text-ink">
          {step.card.title}
        </p>
      ) : null}
    </li>
  );
}

function Trail({ section, currentRef }: { section: PathStep[]; currentRef: RefObject<HTMLLIElement | null> }) {
  const { items, height } = place(section);
  return (
    <ol className="relative mx-auto w-full max-w-sm list-none p-0" style={{ height }}>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {items.slice(0, -1).map((item, index) => {
          const next = items[index + 1];
          if (!next) return null;
          const done = passed(item.step.state);
          return (
            <path
              key={`${item.step.card.id}-${next.step.card.id}`}
              d={bend(item, next)}
              fill="none"
              stroke={done ? "var(--color-mark)" : "#d9d0c2"}
              strokeWidth={done ? 3 : 2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {items.map((item) => (
        <StepNode key={item.step.card.id} item={item} currentRef={currentRef} />
      ))}
    </ol>
  );
}

export function PathView() {
  const { cards, progress } = useStudy();
  const steps = pathOf(cards, progress);
  const current = steps.find((step) => step.state === "current");
  const currentRef = useRef<HTMLLIElement>(null);
  const [theoryLevel, setTheoryLevel] = useState<number | null>(null);

  useEffect(() => {
    const node = currentRef.current;
    if (!node) return;
    if (node.getBoundingClientRect().top > window.innerHeight * 0.85) {
      node.scrollIntoView({ block: "center" });
    }
  }, [current?.card.id]);

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-5 mb-6 bg-paper px-5 pt-1 pb-4">
        {current ? (
          <Link
            to="/tasks/$taskId"
            params={{ taskId: current.card.id }}
            className="flex min-h-11 items-center justify-center rounded-full bg-mark px-5 text-sm text-paper no-underline active:scale-[0.96]"
          >
            Продолжить · {current.card.id}
          </Link>
        ) : (
          <p className="rounded-full border border-line bg-card px-5 py-3 text-center text-sm text-ink">Тропа пройдена</p>
        )}
      </div>
      {LEVELS.map((level) => {
        const section = steps.filter((step) => step.card.level === level.level);
        if (section.length === 0) return null;
        const done = section.filter((step) => passed(step.state)).length;
        const width = section.length === 0 ? 0 : Math.round((done / section.length) * 100);
        const theoryOpen = theoryLevel === level.level;
        return (
          <section key={level.level} className="mb-12">
            <div className="mb-2 rounded-2xl border border-line bg-card">
              <Link to="/levels/$level" params={{ level: String(level.level) }} className="block px-4 py-3 text-ink no-underline">
                <p className="font-serif text-2xl text-mark tabular-nums">{String(level.level).padStart(2, "0")}</p>
                <p className="mt-1 font-medium">{level.title}</p>
                <p className="mt-1 text-sm text-muted tabular-nums">
                  {done}/{section.length}
                </p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full bg-mark" style={{ width: `${width}%` }} />
                </div>
              </Link>
              <div className="border-t border-line px-4">
                <button
                  type="button"
                  aria-expanded={theoryOpen}
                  onClick={() => setTheoryLevel(theoryOpen ? null : level.level)}
                  className="min-h-11 text-sm text-mark"
                >
                  {theoryOpen ? "Скрыть теорию" : "Теория темы"}
                </button>
                {theoryOpen ? (
                  <div className="pb-4">
                    <TheoryText text={level.intro} />
                  </div>
                ) : null}
              </div>
            </div>
            <Trail section={section} currentRef={currentRef} />
          </section>
        );
      })}
    </div>
  );
}
