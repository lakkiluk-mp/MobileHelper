import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Card } from "@etalon/shared";
import { ladderOf, pathOf, type PathStep } from "./path.ts";

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
