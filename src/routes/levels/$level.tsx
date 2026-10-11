import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProgressRing } from "@/components/progress-ring";
import { LEVELS } from "@/lib/catalog";
import { pathOf, type PathState } from "@/lib/path";
import { SyncNote, useStudy } from "@/lib/study";
import { TheoryText } from "@/components/theory-text";
import { Check, ChevronDown, ChevronLeft, Lock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/levels/$level")({
  beforeLoad: ({ params }) => {
    const level = Number(params.level);
    if (!LEVELS.some((item) => item.level === level)) throw notFound();
  },
  component: LevelPage,
});

function Mark({ state }: { state: PathState }) {
  if (state === "knew") return <Check className="size-[18px] text-mark" aria-label="знал" />;
  if (state === "unsure") return <span className="font-mono text-xs text-warn">сомневался</span>;
  if (state === "missed") return <span className="font-mono text-xs text-bad">не знал</span>;
  if (state === "current") return <span className="font-mono text-[11px] text-mark">сейчас</span>;
  return <Lock className="size-4 text-faint" aria-label="закрыто" />;
}

function LevelPage() {
  const { level: levelParam } = Route.useParams();
  const level = Number(levelParam);
  const meta = LEVELS.find((item) => item.level === level);
  const { cards, progress, ready } = useStudy();
  const steps = pathOf(cards, progress).filter((step) => step.card.level === level);
  const done = steps.filter((step) => step.state !== "current" && step.state !== "locked").length;
  const [theoryOpen, setTheoryOpen] = useState(done === 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-8">
      <Link
        to="/"
        aria-label="Назад к пути"
        className="-ml-2 flex size-11 items-center justify-center text-ink"
      >
        <ChevronLeft className="size-6" aria-hidden="true" />
      </Link>
      <header className="mt-2 mb-5 flex items-center gap-4">
        <ProgressRing
          parts={[{ value: done, color: "var(--color-mark)" }]}
          total={steps.length}
          size={64}
          thickness={6}
          label={`${done} из ${steps.length}`}
        >
          <span className="font-mono text-base font-bold">{String(level).padStart(2, "0")}</span>
        </ProgressRing>
        <div>
          <h1 className="m-0 text-2xl leading-tight font-semibold">{meta?.title}</h1>
          <p className="mt-1 mb-0 text-sm text-pretty text-muted">{meta?.blurb}</p>
        </div>
      </header>
      {meta ? (
        <section className="mb-5 rounded-2xl border border-line bg-card">
          <button
            type="button"
            aria-expanded={theoryOpen}
            onClick={() => setTheoryOpen((value) => !value)}
            className="flex min-h-12 w-full items-center justify-between px-4 text-left text-[15px] font-semibold text-ink"
          >
            Теория темы
            <ChevronDown
              className={`size-5 text-muted transition-transform ${theoryOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {theoryOpen ? (
            <div className="border-t border-line px-4 pt-3 pb-4">
              <TheoryText text={meta.intro} />
            </div>
          ) : null}
        </section>
      ) : null}
      <ol className="ml-[9px] flex list-none flex-col p-0">
        {steps.map((step) => {
          const locked = ready && step.state === "locked";
          const current = step.state === "current";
          const passed = !current && step.state !== "locked";
          const rail = passed ? "border-solid border-mark" : "border-dashed border-line";
          const body = (
            <>
              <span
                className={`w-8 shrink-0 font-mono text-xs ${current ? "text-mark" : passed ? "text-muted" : "text-faint"}`}
              >
                {step.card.id}
              </span>
              <span
                className={`flex-1 text-[15px] ${current ? "font-semibold text-ink" : passed ? "text-ink" : "text-faint"}`}
              >
                {step.card.title}
              </span>
              <Mark state={step.state} />
            </>
          );
          const className = `flex min-h-13 items-center gap-3.5 border-l-2 py-2 pl-4 ${rail}`;
          return (
            <li key={step.card.id}>
              {locked ? (
                <div className={className}>{body}</div>
              ) : (
                <Link
                  to="/tasks/$taskId"
                  params={{ taskId: step.card.id }}
                  className={`${className} no-underline`}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <SyncNote />
    </main>
  );
}
