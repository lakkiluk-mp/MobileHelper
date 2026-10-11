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

export function pathOf(cards: Card[], progress: Record<string, { status?: ProgressStatus } | undefined>): PathStep[] {
  const ordered = [...cards].sort((a, b) => a.level - b.level || a.order - b.order);
  const frontier = ordered.findIndex((card) => !progress[card.id]?.status);
  return ordered.map((card, index) => {
    const status = progress[card.id]?.status;
    const state: PathState = status ? status : index === frontier ? "current" : "locked";
    return { card, state, index };
  });
}

const LADDER_LIMIT = 6;

export function ladderOf(steps: PathStep[]): Ladder {
  const unsolved = steps.filter((step) => step.state === "current" || step.state === "locked");
  if (unsolved.length <= LADDER_LIMIT - 1) return { shown: unsolved, rest: [] };
  return { shown: unsolved.slice(0, LADDER_LIMIT - 1), rest: unsolved.slice(LADDER_LIMIT - 1) };
}
