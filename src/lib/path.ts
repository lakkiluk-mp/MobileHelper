import type { Card, ProgressStatus } from "@etalon/shared";

export type PathState = ProgressStatus | "current" | "locked";

export type PathStep = {
  card: Card;
  state: PathState;
  index: number;
};

export type Ladder = {
  shown: PathStep[];
  rest: PathStep[];
};

export const LEVEL_UNLOCK = 10;

export function levelUnlocked(
  cards: Card[],
  progress: Record<string, { status?: ProgressStatus } | undefined>,
  level: number,
): boolean {
  const levels = [...new Set(cards.map((card) => card.level))].sort((a, b) => a - b);
  const previous = levels[levels.indexOf(level) - 1];
  if (previous === undefined) return true;
  const section = cards.filter((card) => card.level === previous);
  const knew = section.filter((card) => progress[card.id]?.status === "knew").length;
  return knew >= Math.min(LEVEL_UNLOCK, section.length);
}

export function pathOf(cards: Card[], progress: Record<string, { status?: ProgressStatus } | undefined>): PathStep[] {
  const ordered = [...cards].sort((a, b) => a.level - b.level || a.order - b.order);
  const open = new Map<number, boolean>();
  const frontiers = new Set<string>();
  for (const card of ordered) {
    if (!open.has(card.level)) open.set(card.level, levelUnlocked(cards, progress, card.level));
  }
  for (const [level, unlocked] of open) {
    if (!unlocked) continue;
    const first = ordered.find((card) => card.level === level && !progress[card.id]?.status);
    if (first) frontiers.add(first.id);
  }
  return ordered.map((card, index) => {
    const status = progress[card.id]?.status;
    const state: PathState = status ? status : frontiers.has(card.id) ? "current" : "locked";
    return { card, state, index };
  });
}

export type Lock = {
  next?: PathStep;
  gate?: { level: number; need: number };
};

export function lockOf(
  cards: Card[],
  progress: Record<string, { status?: ProgressStatus } | undefined>,
  steps: PathStep[],
  card: Card,
): Lock {
  if (levelUnlocked(cards, progress, card.level)) {
    return { next: steps.find((step) => step.state === "current" && step.card.level === card.level) };
  }
  const open = steps.filter((step) => step.card.level < card.level && levelUnlocked(cards, progress, step.card.level));
  const level = open.at(-1)?.card.level;
  if (level === undefined) return {};
  const section = open.filter((step) => step.card.level === level);
  const knew = section.filter((step) => step.state === "knew").length;
  return {
    next:
      section.find((step) => step.state === "current") ??
      section.find((step) => step.state === "missed" || step.state === "unsure"),
    gate: { level, need: Math.max(Math.min(LEVEL_UNLOCK, section.length) - knew, 0) },
  };
}

const LADDER_LIMIT = 6;

export function ladderOf(steps: PathStep[]): Ladder {
  const unsolved = steps.filter((step) => step.state === "current" || step.state === "locked");
  if (unsolved.length <= LADDER_LIMIT - 1) return { shown: unsolved, rest: [] };
  return { shown: unsolved.slice(0, LADDER_LIMIT - 1), rest: unsolved.slice(LADDER_LIMIT - 1) };
}
