import assert from "node:assert/strict";
import test from "node:test";
import { loadCardsFromDisk } from "../content/src/node-load.ts";
import { LEVELS } from "../content/src/levels.ts";
import { buildImplementProgram, gradeImplementTape } from "./src/program.ts";
import { compareTapes, formatTape } from "./src/tape.ts";
import { runInNode } from "./src/node-host.ts";

const LEVEL_COUNTS: Record<number, number> = { 1: 21, 2: 6, 3: 4, 4: 3, 5: 5, 6: 24 };

test("committed tapes match a fresh Node run", async () => {
  const cards = await loadCardsFromDisk();
  const ids = cards.map((card) => card.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate card id");
  for (const level of LEVELS) {
    const count = cards.filter((card) => card.level === level.level).length;
    assert.equal(count, LEVEL_COUNTS[level.level], `level ${level.level} has ${count} cards`);
    const orders = cards.filter((card) => card.level === level.level).map((card) => card.order).sort((a, b) => a - b);
    assert.deepEqual(orders, orders.map((_, index) => index + 1), `level ${level.level} order gap`);
  }
  for (const card of cards) {
    if (card.kind === "implement") {
      const checks = card.tests.reduce((sum, item) => sum + (item.code.match(/__test\./g) ?? []).length, 0);
      assert.ok(checks > 0, `${card.id} has no __test`);
    }
  }

  for (const card of cards) {
    if (card.kind === "predict") {
      const actual = await runInNode(card.code, { strict: card.strict, waitMs: 50 });
      const result = compareTapes(actual, card.expected);
      assert.equal(
        result.ok,
        true,
        result.ok ? card.id : `${card.id}\nactual:\n${formatTape(actual)}\n${result.diffs.map((diff) => diff.reason).join("\n")}`,
      );
      for (const variant of card.variants ?? []) {
        const variantActual = await runInNode(variant.code, { strict: card.strict, waitMs: 50 });
        const variantResult = compareTapes(variantActual, variant.expected);
        assert.equal(
          variantResult.ok,
          true,
          variantResult.ok
            ? variant.id
            : `${variant.id}\nactual:\n${formatTape(variantActual)}\n${variantResult.diffs.map((diff) => diff.reason).join("\n")}`,
        );
      }
      continue;
    }

    const program = buildImplementProgram(card.solution, card.tests);
    const tape = await runInNode(program, { strict: false, waitMs: card.waitMs ?? 40 });
    const verdict = gradeImplementTape(tape, card.tests);
    assert.equal(verdict.ok, true, `${card.id} ${verdict.detail}\n${formatTape(tape)}`);
  }
});

test("a fake harness cannot mark a wrong solution as passed", async () => {
  const tests = [
    {
      name: "поле",
      code: '__test.assertEquals(groupBy([]), 1, "по полю");\n__test.assertDeepEqual(groupBy([]), { a: 1 }, "функция");',
    },
  ];
  const cheat = `function groupBy() { return {}; }
__test = {
  assertEquals: function (a, b, name) { __report({ type: "test", name: name || "equals", pass: true }); },
  assertDeepEqual: function (a, b, name) { __report({ type: "test", name: name || "deepEqual", pass: true }); },
  expectThrow: function (fn, name) { __report({ type: "test", name: name || "throws", pass: true }); },
};
__report({ type: "test", name: "по полю", pass: true });
__report({ type: "test", name: "функция", pass: true });`;
  const tape = await runInNode(buildImplementProgram(cheat, tests), { strict: false, waitMs: 40 });
  const verdict = gradeImplementTape(tape, tests);
  assert.equal(verdict.ok, false, formatTape(tape));
});

test("an error after the first check is not a pass", async () => {
  const tests = [{ name: "два", code: '__test.assertEquals(1, 1, "первый");\nthrow new Error("вторая ветка");' }];
  const tape = await runInNode(buildImplementProgram("function ready() { return 1; }", tests), { strict: false, waitMs: 40 });
  assert.equal(gradeImplementTape(tape, tests).ok, false, formatTape(tape));
});
