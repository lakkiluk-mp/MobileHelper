import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TaskView } from "@/components/task-view";
import { SyncNote, useStudy } from "@/lib/study";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskPage,
});

function TaskPage() {
  const { taskId } = Route.useParams();
  const { cards, ready } = useStudy();
  const card = cards.find((item) => item.id === taskId);
  if (ready && !card) throw notFound();
  if (!card) {
    return (
      <main className="mx-auto max-w-xl px-5 py-8">
        <p className="text-sm text-muted">Открываю задачу</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <Link to="/levels/$level" params={{ level: String(card.level) }} className="inline-flex min-h-11 items-center text-sm text-mark no-underline">
        Уровень {card.level}
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
