import { fnv1a } from "./hash.ts";

/** Fields that decide whether a card changed. `updatedAt` / `rev` stay outside the hash. */
export type AddressableCard = {
  id: string;
  kind: string;
  level: number;
  order: number;
  title: string;
  tags: string[];
  strict: boolean;
  code: string;
  expected: unknown;
  answer: string;
  theory: string;
  variants?: Array<{
    id: string;
    code: string;
    expected: unknown;
    answer: string;
    theory: string;
  }>;
};

export type ImplementAddressable = {
  kind: "implement";
  id: string;
  level: number;
  order: number;
  title: string;
  tags: string[];
  statement: string;
  starter: string;
  tests: unknown;
  solution: string;
  theory: string;
  waitMs?: number;
};

export function cardContentHash(card: AddressableCard): string {
  const body = {
    id: card.id,
    kind: card.kind,
    level: card.level,
    order: card.order,
    title: card.title,
    tags: card.tags,
    strict: card.strict,
    code: card.code,
    expected: card.expected,
    answer: card.answer,
    theory: card.theory,
    variants: (card.variants ?? []).map((variant) => ({
      id: variant.id,
      code: variant.code,
      expected: variant.expected,
      answer: variant.answer,
      theory: variant.theory,
    })),
  };
  return fnv1a(JSON.stringify(body));
}

export function hashAnyCard(card: AddressableCard | ImplementAddressable): string {
  if (card.kind === "implement" && "statement" in card) {
    return fnv1a(
      JSON.stringify({
        id: card.id,
        kind: card.kind,
        level: card.level,
        order: card.order,
        title: card.title,
        tags: card.tags,
        statement: card.statement,
        starter: card.starter,
        tests: card.tests,
        solution: card.solution,
        theory: card.theory,
        waitMs: card.waitMs ?? null,
      }),
    );
  }
  return cardContentHash(card as AddressableCard);
}

export function seedVersion(
  stamps: Array<{ id: string; updatedAt: string; rev: number; hash: string }>,
  tombstones: Array<{ id: string; deletedAt: string }>,
): string {
  const tasks = [...stamps]
    .map((stamp) => `${stamp.id}|${stamp.updatedAt}|${stamp.rev}|${stamp.hash}`)
    .sort();
  const tombs = [...tombstones].map((tomb) => `${tomb.id}|${tomb.deletedAt}`).sort();
  return fnv1a(JSON.stringify({ tasks, tombs }));
}
