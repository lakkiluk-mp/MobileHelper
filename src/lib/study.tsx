import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bundledCatalog } from "@/lib/catalog";
import { getManifest, getTasks } from "@/lib/content-api";
import {
  clearOutbox,
  deviceId,
  readCards,
  readOutbox,
  readProgress,
  replaceProgress,
  writeCards,
  writeProgress,
  type ProgressRow,
} from "@/lib/local-db";
import { claimDevice, pullUserProgress, pushDeviceProgress, pushUserProgress } from "@/lib/progress-api";
import { planSync, withoutTombstones, type Card, type ProgressStatus } from "@etalon/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type StudyValue = {
  cards: Card[];
  progress: Record<string, ProgressRow>;
  ready: boolean;
  note: string;
  offline: boolean;
  rate: (taskId: string, status: ProgressStatus) => void;
  draft: (taskId: string) => string;
  saveDraft: (taskId: string, value: string) => void;
};

const StudyContext = createContext<StudyValue | null>(null);

let syncChain: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = syncChain.then(task, task);
  syncChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function asMap(rows: ProgressRow[]): Record<string, ProgressRow> {
  return Object.fromEntries(rows.map((row) => [row.taskId, row]));
}

function mergeRows(local: ProgressRow[], remote: ProgressRow[]): ProgressRow[] {
  const map = new Map(local.map((row) => [row.taskId, row]));
  for (const row of remote) {
    const current = map.get(row.taskId);
    if (!current || row.updatedAt >= current.updatedAt) map.set(row.taskId, row);
  }
  return [...map.values()];
}

function draftKey(taskId: string): string {
  return `etalon-draft:${taskId}`;
}

function readLocalDraft(taskId: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(draftKey(taskId));
  } catch {
    return null;
  }
}

function rememberRemoteDrafts(rows: ProgressRow[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    for (const row of rows) {
      if (row.draft && localStorage.getItem(draftKey(row.taskId)) == null) {
        localStorage.setItem(draftKey(row.taskId), row.draft);
      }
    }
  } catch {
    // Private mode and a full quota must not abort a sync.
  }
}

async function syncCatalog(current: Card[]): Promise<{ cards: Card[]; offline: boolean; changed: boolean }> {
  try {
    const remote = await getManifest();
    const plan = planSync({
      local: current.map((card) => ({ id: card.id, updatedAt: card.updatedAt, rev: card.rev })),
      remote: remote.tasks.map((task) => ({ id: task.id, updatedAt: task.updatedAt, rev: task.rev })),
      tombstones: remote.tombstones,
    });
    let next = withoutTombstones(current, plan.dropIds);
    let changed = plan.dropIds.length > 0;
    if (plan.fetchIds.length > 0) {
      const fetched: Card[] = [];
      for (let index = 0; index < plan.fetchIds.length; index += 60) {
        const slice = plan.fetchIds.slice(index, index + 60);
        fetched.push(...(await getTasks({ data: { ids: slice } })));
      }
      const byId = new Map(next.map((card) => [card.id, card]));
      for (const card of fetched) byId.set(card.id, card);
      next = [...byId.values()];
      changed = true;
    }
    next.sort((a, b) => a.level - b.level || a.order - b.order);
    if (changed) await writeCards(next);
    return { cards: next, offline: false, changed };
  } catch {
    return { cards: current, offline: true, changed: false };
  }
}

async function pushPending(userId: string | undefined): Promise<ProgressRow[]> {
  const pending = await readOutbox();
  const id = deviceId();
  if (pending.length > 0) {
    for (let index = 0; index < pending.length; index += 100) {
      const chunk = pending.slice(index, index + 100);
      await pushDeviceProgress({ data: { deviceId: id, items: chunk } });
      if (userId) await pushUserProgress({ data: { items: chunk } });
      const latest = await readOutbox();
      const sent = chunk.filter((row) => {
        const now = latest.find((item) => item.taskId === row.taskId);
        return now?.updatedAt === row.updatedAt;
      });
      await clearOutbox(sent.map((row) => row.taskId));
    }
  }
  if (!userId) return readProgress();
  await claimDevice({ data: { deviceId: id } });
  const remote = await pullUserProgress();
  const merged = mergeRows(await readProgress(), remote);
  rememberRemoteDrafts(merged);
  await replaceProgress(merged);
  return merged;
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const bundled = useMemo(() => bundledCatalog(), []);
  const { user, isPending } = useCurrentUserState();
  const [cards, setCards] = useState<Card[]>(bundled.cards);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("Задачи из сборки");
  const [offline, setOffline] = useState(false);

  const applyRows = useCallback((rows: ProgressRow[]) => {
    setProgress((prev) => {
      const next = { ...asMap(rows) };
      for (const [id, row] of Object.entries(prev)) {
        const synced = next[id];
        if (!synced || row.updatedAt > synced.updatedAt) next[id] = row;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;
    void enqueue(async () => {
      let current = bundled.cards;
      try {
        const stored = await readCards();
        if (cancelled) return;
        if (stored.length > 0) current = stored;
        else await writeCards(bundled.cards);
        const localProgress = await readProgress();
        if (cancelled) return;
        setCards(current);
        applyRows(localProgress);
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
      const catalog = await syncCatalog(current);
      if (cancelled) return;
      setCards(catalog.cards);
      if (catalog.offline) {
        setOffline(true);
        setNote("Сети нет — задачи и оценки остаются на устройстве");
        return;
      }
      try {
        const rows = await pushPending(user?.id);
        if (cancelled) return;
        applyRows(rows);
        setOffline(false);
        setNote(catalog.changed ? "Каталог обновлён, оценки на сервере" : "Каталог совпадает, оценки на сервере");
      } catch {
        if (cancelled) return;
        setOffline(true);
        setNote("Сети нет — оценка сохранится на устройстве и уйдёт позже");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [applyRows, bundled.cards, isPending, user?.id]);

  const rate = useCallback(
    (taskId: string, status: ProgressStatus) => {
      const saved = readLocalDraft(taskId);
      const row: ProgressRow = {
        taskId,
        status,
        updatedAt: new Date().toISOString(),
        draft: saved || undefined,
      };
      setProgress((prev) => ({ ...prev, [taskId]: row }));
      void enqueue(async () => {
        await writeProgress(row);
        try {
          const rows = await pushPending(user?.id);
          applyRows(rows);
          setOffline(false);
          setNote("Оценка на сервере");
        } catch {
          setOffline(true);
          setNote("Сети нет — оценка сохранится на устройстве и уйдёт позже");
        }
      });
    },
    [applyRows, user?.id],
  );

  const value = useMemo<StudyValue>(
    () => ({
      cards,
      progress,
      ready,
      note,
      offline,
      rate,
      draft: (taskId) => readLocalDraft(taskId) ?? progress[taskId]?.draft ?? "",
      saveDraft: (taskId, draft) => {
        try {
          if (typeof localStorage === "undefined") return;
          localStorage.setItem(draftKey(taskId), draft);
        } catch {
          // The editor keeps the text in memory if the quota is full.
        }
      },
    }),
    [cards, note, offline, progress, rate, ready],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyValue {
  const value = useContext(StudyContext);
  if (!value) throw new Error("useStudy outside provider");
  return value;
}

export function SyncNote() {
  const { note, offline } = useStudy();
  return (
    <p
      className={
        offline
          ? "mt-6 rounded-lg bg-mark-soft px-3 py-3 text-sm text-ink"
          : "mt-6 text-sm text-muted"
      }
    >
      {note}
    </p>
  );
}
