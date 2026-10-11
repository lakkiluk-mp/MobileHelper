import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activity, statusCounts, streak } from "./stats.ts";

const NOW = new Date(2026, 9, 11, 15, 0);

function at(daysAgo: number): string {
  return new Date(2026, 9, 11 - daysAgo, 12, 0).toISOString();
}

describe("statusCounts", () => {
  it("считает только оценённые задачи", () => {
    const counts = statusCounts({
      a: { status: "knew" },
      b: { status: "knew" },
      c: { status: "missed" },
      d: undefined,
    });
    assert.deepEqual(counts, { knew: 2, unsure: 0, missed: 1 });
  });
});

describe("streak", () => {
  it("идёт назад от сегодняшнего дня", () => {
    const progress = {
      a: { status: "knew" as const, updatedAt: at(0) },
      b: { status: "knew" as const, updatedAt: at(1) },
    };
    assert.equal(streak(progress, NOW), 2);
  });

  it("не обрывается, если сегодня ещё не занимались", () => {
    const progress = {
      a: { status: "knew" as const, updatedAt: at(1) },
      b: { status: "unsure" as const, updatedAt: at(2) },
    };
    assert.equal(streak(progress, NOW), 2);
  });

  it("обрывается на пропущенном дне", () => {
    const progress = {
      a: { status: "knew" as const, updatedAt: at(0) },
      b: { status: "knew" as const, updatedAt: at(2) },
    };
    assert.equal(streak(progress, NOW), 1);
  });

  it("ноль без оценок", () => {
    assert.equal(streak({}, NOW), 0);
  });
});

describe("activity", () => {
  it("раскладывает оценки по дням, последний элемент — сегодня", () => {
    const progress = {
      a: { status: "knew" as const, updatedAt: at(0) },
      b: { status: "missed" as const, updatedAt: at(0) },
      c: { status: "knew" as const, updatedAt: at(3) },
    };
    const days = activity(progress, NOW, 5);
    assert.deepEqual(
      days.map((day) => day.count),
      [0, 1, 0, 0, 2],
    );
  });
});
