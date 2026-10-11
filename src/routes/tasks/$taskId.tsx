import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TaskView } from "@/components/task-view";
import { pathOf, type PathState } from "@/lib/path";
import { SyncNote, useStudy } from "@/lib/study";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskPage,
});

const SEGMENT: Record<PathState, string> = {
  knew: "bg-mark",
  unsure: "bg-warn",
  missed: "bg-bad",
  current: "bg-ink",
  locked: "bg-line",
};

function BackLink() {
  return (
    <Link
      to="/"
      aria-label="Назад к пути"
      className="-ml-2 flex size-11 shrink-0 items-center justify-center text-ink"
    >
      <ChevronLeft className="size-6" aria-hidden="true" />
    </Link>
  );
}

function TaskPage() {
  const { taskId } = Route.useParams();
  const { cards, ready, progress } = useStudy();
  const card = cards.find((item) => item.id === taskId);
  if (!ready) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
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
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
        <BackLink />
        <h1 className="mt-4 text-[26px] font-semibold text-ink">Шаг ещё закрыт</h1>
        <p className="mt-3 text-sm text-pretty text-muted">
          {current
            ? `Сначала оцени ${current.card.id}. Потом откроется ${card.id}.`
            : "Этот шаг откроется по порядку тропы."}
        </p>
        {current ? (
          <Link
            to="/tasks/$taskId"
            params={{ taskId: current.card.id }}
            className="mt-6 flex min-h-12 items-center justify-center rounded-[14px] bg-mark px-5 text-base font-bold text-paper no-underline"
          >
            К шагу {current.card.id}
          </Link>
        ) : null}
      </main>
    );
  }

  const level = steps.filter((item) => item.card.level === card.level);
  const position = level.findIndex((item) => item.card.id === card.id) + 1;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <header className="flex items-center gap-2.5">
        <BackLink />
        <div
          role="progressbar"
          aria-label={`Уровень ${card.level}`}
          aria-valuemin={0}
          aria-valuemax={level.length}
          aria-valuenow={position}
          className="grid flex-1 gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${level.length}, minmax(0, 1fr))` }}
        >
          {level.map((item) => (
            <span
              key={item.card.id}
              className={`h-1.5 rounded-[3px] ${item.card.id === card.id ? "bg-ink" : SEGMENT[item.state]}`}
            />
          ))}
        </div>
        <span className="pr-1 font-mono text-[13px] text-muted">{card.id}</span>
      </header>
      <div className="mt-2">
        <p className="m-0 font-mono text-xs text-muted">
          {card.kind === "predict" ? "predict · что выведет консоль" : "implement · напиши сам"}
        </p>
        <h1 className="mt-1 mb-0 text-[21px] leading-tight font-semibold">{card.title}</h1>
      </div>
      <TaskView key={card.id} card={card} />
      <div className="pb-4">
        <SyncNote />
      </div>
    </main>
  );
}
