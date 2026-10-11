import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LEVELS } from "@/lib/catalog";
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
  const { cards, progress } = useStudy();
  const tasks = cards.filter((card) => card.level === level).sort((a, b) => a.order - b.order);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm text-mark no-underline">
        Все уровни
      </Link>
      <header className="mt-4 mb-6">
        <p className="font-serif text-2xl text-mark tabular-nums">{String(level).padStart(2, "0")}</p>
        <h1 className="mt-1 text-3xl text-ink">{meta?.title}</h1>
        <p className="mt-2 text-sm text-pretty text-muted">{meta?.blurb}</p>
      </header>
      <ol className="flex flex-col">
        {tasks.map((card) => {
          const status = progress[card.id]?.status;
          const label = status === "knew" ? "знал" : status === "unsure" ? "сомневался" : status === "missed" ? "не знал" : card.kind === "implement" ? "код" : "вопрос";
          return (
            <li key={card.id} className="border-t border-line">
              <Link
                to="/tasks/$taskId"
                params={{ taskId: card.id }}
                className="flex min-h-11 items-baseline justify-between gap-4 py-4 text-ink no-underline"
              >
                <span>
                  <span className="font-mono text-sm text-mark">{card.id}</span>
                  <span className="mt-1 block text-base font-medium">{card.title}</span>
                </span>
                <span className="shrink-0 text-sm text-muted">{label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <SyncNote />
    </main>
  );
}
