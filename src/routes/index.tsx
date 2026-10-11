import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountSlot } from "@/components/account-slot";
import { PathView } from "@/components/path-view";
import { SyncNote } from "@/lib/study";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted uppercase">JS к собеседованию</p>
          <h1 className="mt-2 text-4xl text-ink">Эталон</h1>
          <p className="mt-3 text-base text-pretty text-muted">
            Тропа идёт по порядку. Оцени шаг — откроется следующий. Без сети задачи остаются на устройстве.
          </p>
          <Link to="/settings" className="mt-1 inline-flex min-h-11 items-center text-sm text-mark no-underline">
            Настройки
          </Link>
        </div>
        <AccountSlot />
      </header>
      <PathView />
      <SyncNote />
    </main>
  );
}
