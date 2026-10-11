import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Card } from "@etalon/shared";
import { ladderOf, lockOf, pathOf, type PathStep } from "./path.ts";

function card(id: string, level: number, order: number): Card {
  return {
    id,
    level,
    order,
    title: id,
    tags: [],
    kind: "predict",
    code: "1",
    expected: [{ type: "log", args: ["1"] }],
    answer: "1",
    theory: "почему",
    strict: false,
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  };
}

function steps(ids: string[], currentAt = 0): PathStep[] {
  return ids.map((id, index) => ({
    card: card(id, 1, index + 1),
    state: index < currentAt ? "knew" : index === currentAt ? "current" : "locked",
    index,
  }));
}

describe("ladderOf", () => {
  it("shows only the next five unsolved steps and folds the rest into a sixth pile", () => {
    const ids = Array.from({ length: 10 }, (_, index) => `1.${index + 1}`);
    const ladder = ladderOf(steps(ids, 2));
    assert.deepEqual(
      ladder.shown.map((step) => step.card.id),
      ["1.3", "1.4", "1.5", "1.6", "1.7"],
    );
    assert.equal(ladder.rest.length, 3);
    assert.equal(ladder.rest[0]?.card.id, "1.8");
  });

  it("does not invent a pile when five or fewer tasks remain", () => {
    const ladder = ladderOf(steps(["1.1", "1.2", "1.3", "1.4", "1.5"]));
    assert.equal(ladder.shown.length, 5);
    assert.equal(ladder.rest.length, 0);
  });

  it("is empty once every step is rated", () => {
    const rated = steps(["1.1"]).map((step) => ({ ...step, state: "knew" as const }));
    const ladder = ladderOf(rated);
    assert.equal(ladder.shown.length, 0);
    assert.equal(ladder.rest.length, 0);
  });
});

describe("pathOf", () => {
  it("keeps a later rated card open even before the frontier", () => {
    const cards = [card("1.1", 1, 1), card("1.2", 1, 2), card("1.3", 1, 3)];
    const path = pathOf(cards, { "1.3": { status: "knew" } });
    assert.deepEqual(
      path.map((step) => step.state),
      ["current", "locked", "knew"],
    );
  });
});

describe("level unlock", () => {
  const level = (n: number, size: number) =>
    Array.from({ length: size }, (_, index) => card(`${n}.${index + 1}`, n, index + 1));
  const knew = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { status: "knew" as const }]));
  const stateOf = (path: PathStep[], id: string) => path.find((step) => step.card.id === id)?.state;

  it("keeps the next level locked until ten tasks are known", () => {
    const cards = [...level(1, 14), ...level(2, 3)];
    const nine = knew(cards.slice(0, 9).map((item) => item.id));
    assert.equal(stateOf(pathOf(cards, nine), "2.1"), "locked");
    const ten = knew(cards.slice(0, 10).map((item) => item.id));
    assert.equal(stateOf(pathOf(cards, ten), "2.1"), "current");
    assert.equal(stateOf(pathOf(cards, ten), "1.11"), "current");
  });

  it("does not count unsure or missed toward the unlock", () => {
    const cards = [...level(1, 12), ...level(2, 2)];
    const progress = {
      ...knew(cards.slice(0, 9).map((item) => item.id)),
      "1.10": { status: "unsure" as const },
      "1.11": { status: "missed" as const },
    };
    assert.equal(stateOf(pathOf(cards, progress), "2.1"), "locked");
  });

  it("asks a short level to be known in full", () => {
    const cards = [...level(1, 4), ...level(2, 2)];
    assert.equal(stateOf(pathOf(cards, knew(["1.1", "1.2", "1.3"])), "2.1"), "locked");
    assert.equal(stateOf(pathOf(cards, knew(["1.1", "1.2", "1.3", "1.4"])), "2.1"), "current");
  });

  it("opens levels one after another, not past a locked one", () => {
    const cards = [...level(1, 10), ...level(2, 10), ...level(3, 2)];
    const progress = knew(cards.slice(0, 10).map((item) => item.id));
    const path = pathOf(cards, progress);
    assert.equal(stateOf(path, "2.1"), "current");
    assert.equal(stateOf(path, "3.1"), "locked");
  });
});

describe("lockOf", () => {
  it("points a locked level to the open level that gates it", () => {
    const cards = [
      ...Array.from({ length: 12 }, (_, index) => card(`1.${index + 1}`, 1, index + 1)),
      card("2.1", 2, 1),
    ];
    const progress = Object.fromEntries(cards.slice(0, 7).map((item) => [item.id, { status: "knew" as const }]));
    const steps = pathOf(cards, progress);
    const lock = lockOf(cards, progress, steps, cards[12]!);
    assert.deepEqual(lock.gate, { level: 1, need: 3 });
    assert.equal(lock.next?.card.id, "1.8");
  });
});
