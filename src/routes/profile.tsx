import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/app-shell";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SyncNote } from "@/lib/study";
import { ArrowLeftRight, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/profile")({ component: Profile });

function Account() {
  const { user, isPending } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || isPending) return <div className="h-16 animate-pulse rounded-2xl bg-card" />;
  if (user) {
    return (
      <div className="rounded-2xl border border-line bg-card p-4">
        <UserButton />
        <p className="mt-3 mb-0 text-sm text-muted">
          Прогресс синхронизируется между устройствами.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-violet text-lg font-bold text-paper">
          Г
        </span>
        <span>
          <span className="block font-semibold">Гость</span>
          <span className="block text-sm text-muted">Прогресс хранится на этом устройстве</span>
        </span>
      </div>
      <Link
        to="/login"
        className="flex items-center gap-3 rounded-2xl border border-dashed border-faint px-3.5 py-3 text-ink no-underline"
      >
        <ArrowLeftRight className="size-[22px] text-violet" aria-hidden="true" />
        <span className="flex-1 text-sm">Войти, чтобы прогресс был на всех устройствах</span>
        <ChevronRight className="size-5 text-violet" aria-hidden="true" />
      </Link>
    </div>
  );
}

function Profile() {
  return (
    <AppShell>
      <TopBar title="Профиль" />
      <Account />
      <ul className="mt-5 list-none overflow-hidden rounded-2xl border border-line bg-card p-0">
        <li>
          <Link
            to="/settings"
            className="flex min-h-13 items-center justify-between px-4 text-[15px] text-ink no-underline"
          >
            Автодополнение в редакторе
            <ChevronRight className="size-5 text-muted" aria-hidden="true" />
          </Link>
        </li>
      </ul>
      <SyncNote />
    </AppShell>
  );
}
