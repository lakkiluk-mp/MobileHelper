import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LEVELS } from "@/lib/catalog";
import { pathOf } from "@/lib/path";
import { SyncNote, useStudy } from "@/lib/study";

export const Route = createFileRoute("/levels/$level")({
  beforeLoad: ({ params }) => {
    const level = Number(params.level);
    if (!LEVELS.some((item) => item.level === level)) throw notFound();
  },
  component: LevelPage,
});

function LevelPage() {
  const { level: levelParam } = Route.useParams();
  const level = Number(levelParam);
  const meta = LEVELS.find((item) => item.level === level);
  const { cards, progress, ready } = useStudy();
  const steps = pathOf(cards, progress).filter((step) => step.card.level === level);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm text-mark no-underline">
        К тропе
      </Link>
      <header className="mt-4 mb-6">
        <p className="font-serif text-2xl text-mark tabular-nums">{String(level).padStart(2, "0")}</p>
        <h1 className="mt-1 text-3xl text-ink">{meta?.title}</h1>
        <p className="mt-2 text-sm text-pretty text-muted">{meta?.blurb}</p>
      </header>
      <ol className="flex flex-col">
        {steps.map((step) => {
          const locked = ready && step.state === "locked";
          const label =
            step.state === "knew"
              ? "знал"
              : step.state === "unsure"
                ? "сомневался"
                : step.state === "missed"
                  ? "не знал"
                  : step.state === "current"
                    ? "сейчас"
                    : "закрыто";
          const body = (
            <>
              <span>
                <span className="font-mono text-sm text-mark">{step.card.id}</span>
                <span className="mt-1 block text-base font-medium">{step.card.title}</span>
              </span>
              <span className="shrink-0 text-sm text-muted">{label}</span>
            </>
          );
          return (
            <li key={step.card.id} className="border-t border-line">
              {locked ? (
                <div className="flex min-h-11 items-baseline justify-between gap-4 py-4 text-muted">{body}</div>
              ) : (
                <Link
                  to="/tasks/$taskId"
                  params={{ taskId: step.card.id }}
                  className="flex min-h-11 items-baseline justify-between gap-4 py-4 text-ink no-underline"
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
