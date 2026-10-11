import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/app-shell";
import { useStudy } from "@/lib/study";
import type { ProgressStatus } from "@etalon/shared";

export const Route = createFileRoute("/review")({ component: Review });

const STATUS_LABEL: Partial<Record<ProgressStatus, { text: string; className: string }>> = {
  missed: { text: "не знал", className: "bg-bad/15 text-bad" },
  unsure: { text: "сомневался", className: "bg-warn/15 text-warn" },
};

const WEIGHT: Record<ProgressStatus, number> = { missed: 0, unsure: 1, knew: 2 };

function Review() {
  const { cards, progress, ready } = useStudy();
  const queue = cards
    .filter((card) => {
      const status = progress[card.id]?.status;
      return status === "missed" || status === "unsure";
    })
    .sort((a, b) => {
      const sa = progress[a.id]?.status ?? "knew";
      const sb = progress[b.id]?.status ?? "knew";
      return (
        WEIGHT[sa] - WEIGHT[sb] ||
        (progress[a.id]?.updatedAt ?? "").localeCompare(progress[b.id]?.updatedAt ?? "")
      );
    });
  const first = queue[0];

  return (
    <AppShell>
      <TopBar title="Повтор" />
      <p className="mt-0 mb-4 text-sm text-pretty text-muted">
        Задачи, где ты не знал или сомневался. Сначала самые старые «не знал».
      </p>
      {!ready ? <div className="h-12 animate-pulse rounded-2xl bg-card" /> : null}
      {ready && !first ? (
        <div className="rounded-[20px] border border-dashed border-line p-5 text-center">
          <p className="m-0 text-lg font-semibold">Повторять нечего</p>
          <p className="mt-1 mb-0 text-sm text-muted">Всё, что ты оценил, ты знал.</p>
        </div>
      ) : null}
      {first ? (
        <>
          <Link
            to="/tasks/$taskId"
            params={{ taskId: first.id }}
            className="mb-4 flex min-h-12 items-center justify-center rounded-[14px] bg-mark text-base font-bold text-paper no-underline"
          >
            Начать · {queue.length}
          </Link>
          <ul className="m-0 list-none overflow-hidden rounded-[20px] border border-line bg-card p-0">
            {queue.map((card) => {
              const status = progress[card.id]?.status;
              const badge = status ? STATUS_LABEL[status] : undefined;
              return (
                <li key={card.id} className="border-b border-line last:border-b-0">
                  <Link
                    to="/tasks/$taskId"
                    params={{ taskId: card.id }}
                    className="flex min-h-13 items-center gap-3 px-3.5 py-2 text-ink no-underline"
                  >
                    <span className="w-8 shrink-0 font-mono text-xs text-muted">{card.id}</span>
                    <span className="flex-1 text-sm">{card.title}</span>
                    {badge ? (
                      <span
                        className={`shrink-0 rounded-lg px-2 py-0.5 text-xs ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </AppShell>
  );
}
