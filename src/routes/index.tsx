import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountSlot } from "@/components/account-slot";
import { LEVELS } from "@/lib/catalog";
import { SyncNote, useStudy } from "@/lib/study";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { cards, progress } = useStudy();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted uppercase">JS к собеседованию</p>
          <h1 className="mt-2 text-4xl text-ink">Эталон</h1>
          <p className="mt-3 text-base text-pretty text-muted">
            Запусти код, сверь ленту с эталоном и оставь оценку. Без сети задачи остаются на устройстве.
          </p>
        </div>
        <AccountSlot />
      </header>
      <ol className="flex flex-col">
        {LEVELS.map((level) => {
          const levelCards = cards.filter((card) => card.level === level.level);
          const known = levelCards.filter((card) => progress[card.id]?.status === "knew").length;
          return (
            <li key={level.level} className="border-t border-line">
              <Link
                to="/levels/$level"
                params={{ level: String(level.level) }}
                className="flex min-h-11 items-start justify-between gap-4 py-4 text-ink no-underline"
              >
                <span>
                  <span className="font-serif text-2xl text-mark tabular-nums">
                    {String(level.level).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block text-lg font-medium">{level.title}</span>
                  <span className="mt-1 block text-sm text-pretty text-muted">{level.blurb}</span>
                </span>
                <span className="shrink-0 pt-1 text-sm text-muted tabular-nums">
                  {known > 0 ? `${known}/${levelCards.length}` : levelCards.length}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <SyncNote />
    </main>
  );
}
