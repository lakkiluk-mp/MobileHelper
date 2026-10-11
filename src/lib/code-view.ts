import { useSyncExternalStore } from "react";

export type CodePrefs = { wrap: boolean; size: number };

export const CODE_SIZES = [11, 12, 13, 14, 15] as const;

const KEY = "etalon-code-view";
const DEFAULT_PREFS: CodePrefs = { wrap: true, size: 12 };
const listeners = new Set<() => void>();

let current: CodePrefs | null = null;

function load(): CodePrefs {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const value = JSON.parse(raw) as Partial<CodePrefs>;
    const size = CODE_SIZES.find((item) => item === value.size) ?? DEFAULT_PREFS.size;
    return { wrap: typeof value.wrap === "boolean" ? value.wrap : DEFAULT_PREFS.wrap, size };
  } catch {
    return DEFAULT_PREFS;
  }
}

function snapshot(): CodePrefs {
  if (!current) current = load();
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: CodePrefs): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function setCodePrefs(next: CodePrefs): void {
  current = next;
  persist(next);
  listeners.forEach((listener) => listener());
}

export function useCodePrefs(): CodePrefs {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_PREFS);
}
