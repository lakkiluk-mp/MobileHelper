import { createFileRoute } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/app-shell";
import { PathView } from "@/components/path-view";
import { SyncNote } from "@/lib/study";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <TopBar />
      <PathView />
      <SyncNote />
    </AppShell>
  );
}
