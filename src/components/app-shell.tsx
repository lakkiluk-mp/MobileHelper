import { useStudy } from "@/lib/study";
import { streak } from "@/lib/stats";
import { Link } from "@tanstack/react-router";
import {
  ChartNoAxesColumn,
  Flame,
  RotateCcw,
  Route,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type Tab = { to: "/" | "/review" | "/progress" | "/profile"; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { to: "/", label: "Путь", icon: Route },
  { to: "/review", label: "Повтор", icon: RotateCcw },
  { to: "/progress", label: "Прогресс", icon: ChartNoAxesColumn },
  { to: "/profile", label: "Профиль", icon: UserRound },
];

function TabBar() {
  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-4 bottom-[max(env(safe-area-inset-bottom),1.25rem)] z-40 mx-auto flex max-w-[34rem] items-center justify-between rounded-[28px] border border-line bg-raised/95 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] backdrop-blur"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          activeOptions={{ exact: true }}
          aria-label={tab.label}
          className="no-underline"
        >
          {({ isActive }) => (
            <span
              className={
                isActive
                  ? "flex h-12 items-center gap-2 rounded-[22px] bg-mark px-4 text-sm font-bold text-paper"
                  : "flex h-12 w-13 items-center justify-center text-muted"
              }
            >
              <tab.icon className="size-[22px]" aria-hidden="true" />
              {isActive ? tab.label : null}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function StreakChip() {
  const { progress } = useStudy();
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(streak(progress, new Date()));
  }, [progress]);

  return (
    <span
      aria-label={days === null ? "Серия" : `Серия: ${days} дн.`}
      className="flex h-8 items-center gap-1.5 rounded-2xl bg-raised px-2.5 font-mono text-[13px] font-bold text-warn"
    >
      <Flame className="size-4" aria-hidden="true" />
      {days ?? "–"}
    </span>
  );
}

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="mb-4 flex items-center justify-between">
      {title ? (
        <h1 className="m-0 text-[28px] font-semibold">{title}</h1>
      ) : (
        <p className="m-0 font-mono text-[17px] font-bold tracking-tight">
          эталон<span className="text-mark">_</span>
        </p>
      )}
      <StreakChip />
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-32">
        {children}
      </main>
      <TabBar />
    </>
  );
}
