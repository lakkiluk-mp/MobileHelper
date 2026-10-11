import type { Card, ProgressStatus } from "@etalon/shared";

export type PathState = ProgressStatus | "current" | "locked";

export type PathStep = {
  card: Card;
  state: PathState;
  index: number;
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
