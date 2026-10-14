import { bundledCatalog } from "@etalon/web-catalog";
import type { Card, ProgressStatus } from "@etalon/shared";
import { useNetworkState } from "expo-network";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readCards, readDrafts, readMeta, readProgress, writeCards, writeDraft, writeMeta, writeProgress, type ProgressRow } from "./db";
import { currentAccount, signIn as startSignIn, signOut as endSession, syncProgress, type Account } from "./sync";

const CODE_SIZES = [11, 12, 13, 14, 15] as const;

type CodePrefs = { wrap: boolean; size: number };

type StudyValue = {
  cards: Card[];
  progress: Record<string, ProgressRow>;
  ready: boolean;
  note: string;
  offline: boolean;
  rate: (taskId: string, status: ProgressStatus) => void;
  draft: (taskId: string) => string;
  saveDraft: (taskId: string, value: string) => void;
  snippetsOn: boolean;
  setSnippetsOn: (on: boolean) => void;
  openAll: boolean;
  setOpenAll: (on: boolean) => void;
  codePrefs: CodePrefs;
  setCodePrefs: (next: CodePrefs) => void;
  account: Account | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const StudyContext = createContext<StudyValue | null>(null);

function asMap(rows: ProgressRow[]): Record<string, ProgressRow> {
  return Object.fromEntries(rows.map((row) => [row.taskId, row]));
}

function parsePrefs(raw: string | null): CodePrefs {
  if (!raw) return { wrap: true, size: 12 };
  try {
    const value = JSON.parse(raw) as Partial<CodePrefs>;
    const size = CODE_SIZES.find((item) => item === value.size) ?? 12;
    return { wrap: typeof value.wrap === "boolean" ? value.wrap : true, size };
  } catch {
    return { wrap: true, size: 12 };
  }
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const bundled = useMemo(() => bundledCatalog(), []);
  const network = useNetworkState();
  const offline = network.isConnected === false;
  const [cards, setCards] = useState<Card[]>(bundled.cards);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("Задачи из сборки");
  const [snippetsOn, setSnippetsOnState] = useState(true);
  const [openAll, setOpenAllState] = useState(true);
  const [codePrefs, setCodePrefsState] = useState<CodePrefs>({ wrap: true, size: 12 });
  const [account, setAccount] = useState<Account | null>(null);

  const sync = useCallback(async () => {
    try {
      await syncProgress();
      setProgress(asMap(await readProgress()));
    } catch {
      setNote("Синхронизация не удалась — повторим позже");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await readCards();
        const localProgress = await readProgress();
        const storedDrafts = await readDrafts();
        const snippets = await readMeta("etalon-snippets");
        const themes = await readMeta("etalon-open-themes");
        const prefs = parsePrefs(await readMeta("etalon-code-view"));
        if (cancelled) return;
        const nextCards = stored.length > 0 ? stored : bundled.cards;
        if (stored.length === 0) await writeCards(bundled.cards);
        if (cancelled) return;
        setCards(nextCards);
        setProgress(asMap(localProgress));
        setDrafts(storedDrafts);
        setSnippetsOnState(snippets !== "off");
        setOpenAllState(themes !== "off");
        setCodePrefsState(prefs);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bundled.cards]);

  useEffect(() => {
    if (!ready) return;
    setNote(
      offline
        ? "Сети нет — задачи и оценки остаются на устройстве"
        : "Задачи из сборки. Оценки на этом телефоне",
    );
  }, [offline, ready]);

  useEffect(() => {
    if (!ready || offline) return;
    let cancelled = false;
    void (async () => {
      const next = await currentAccount().catch(() => null);
      if (cancelled) return;
      setAccount(next);
      await sync();
      if (!cancelled && next) setNote("Прогресс сохранён в аккаунте");
    })();
    return () => {
      cancelled = true;
    };
  }, [offline, ready, sync]);

  const rate = useCallback(
    (taskId: string, status: ProgressStatus) => {
      const saved = drafts[taskId];
      const row: ProgressRow = {
        taskId,
        status,
        updatedAt: new Date().toISOString(),
        draft: saved || undefined,
      };
      setProgress((prev) => ({ ...prev, [taskId]: row }));
      void writeProgress(row).then(
        () => {
          setNote(
            offline
              ? "Сети нет — оценка сохранится на устройстве и уйдёт позже"
              : account
                ? "Оценка сохранена в аккаунте"
                : "Оценка на этом телефоне",
          );
          if (!offline) void sync();
        },
        () => {
          setNote("Оценку не удалось записать");
        },
      );
    },
    [account, drafts, offline, sync],
  );

  const signIn = useCallback(async () => {
    try {
      const next = await startSignIn();
      if (!next) return;
      setAccount(next);
      setProgress(asMap(await readProgress()));
      setNote("Прогресс сохранён в аккаунте");
    } catch {
      setNote("Войти не удалось — проверьте сеть");
    }
  }, []);

  const signOut = useCallback(async () => {
    await endSession();
    setAccount(null);
    setNote("Вы вышли. Оценки остаются на этом телефоне");
  }, []);

  const setSnippetsOn = useCallback((on: boolean) => {
    setSnippetsOnState(on);
    void writeMeta("etalon-snippets", on ? "on" : "off");
  }, []);

  const setOpenAll = useCallback((on: boolean) => {
    setOpenAllState(on);
    void writeMeta("etalon-open-themes", on ? "on" : "off");
  }, []);

  const setCodePrefs = useCallback((next: CodePrefs) => {
    setCodePrefsState(next);
    void writeMeta("etalon-code-view", JSON.stringify(next));
  }, []);

  const value = useMemo<StudyValue>(
    () => ({
      cards,
      progress,
      ready,
      note,
      offline,
      rate,
      draft: (taskId) => drafts[taskId] ?? progress[taskId]?.draft ?? "",
      saveDraft: (taskId, draft) => {
        setDrafts((prev) => ({ ...prev, [taskId]: draft }));
        void writeDraft(taskId, draft);
      },
      snippetsOn,
      setSnippetsOn,
      openAll,
      setOpenAll,
      codePrefs,
      setCodePrefs,
      account,
      signIn,
      signOut,
    }),
    [account, cards, codePrefs, drafts, note, offline, openAll, progress, rate, ready, setCodePrefs, setOpenAll, setSnippetsOn, signIn, signOut, snippetsOn],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyValue {
  const value = useContext(StudyContext);
  if (!value) throw new Error("useStudy outside provider");
  return value;
}

export const CODE_SIZE_STEPS = CODE_SIZES;
