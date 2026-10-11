import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TaskView } from "@/components/task-view";
import { pathOf } from "@/lib/path";
import { SyncNote, useStudy } from "@/lib/study";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskPage,
});

function TaskPage() {
  const { taskId } = Route.useParams();
  const { cards, ready, progress } = useStudy();
  const card = cards.find((item) => item.id === taskId);
  if (!ready) {
    return (
      <main className="mx-auto max-w-xl px-5 py-8">
        <p className="text-sm text-muted">Открываю задачу</p>
      </main>
    );
  }
  if (!card) throw notFound();

  const steps = pathOf(cards, progress);
  const step = steps.find((item) => item.card.id === card.id);
  if (step?.state === "locked") {
    const current = steps.find((item) => item.state === "current");
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
        <Link to="/" className="inline-flex min-h-11 items-center text-sm text-mark no-underline">
          К тропе
        </Link>
        <h1 className="mt-4 text-3xl text-ink">Шаг ещё закрыт</h1>
        <p className="mt-3 text-sm text-pretty text-muted">
          {current
            ? `Сначала оцени ${current.card.id}. Потом откроется ${card.id}.`
            : "Этот шаг откроется по порядку тропы."}
        </p>
        {current ? (
          <Link
            to="/tasks/$taskId"
            params={{ taskId: current.card.id }}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-mark px-5 text-sm text-paper no-underline"
          >
            К шагу {current.card.id}
          </Link>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm text-mark no-underline">
        К тропе
      </Link>
      <header className="mt-4">
        <p className="font-mono text-sm text-mark">{card.id}</p>
        <h1 className="mt-1 text-3xl text-ink">{card.title}</h1>
        <p className="mt-3 text-sm text-muted">{card.tags.join(" · ")}</p>
      </header>
      <TaskView card={card} />
      <SyncNote />
    </main>
  );
}
