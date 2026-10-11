import assert from "node:assert/strict";
import test from "node:test";
import { loadCardsFromDisk } from "../content/src/node-load.ts";
import { buildImplementProgram } from "./src/program.ts";
import { compareTapes, formatTape } from "./src/tape.ts";
import { runInNode } from "./src/node-host.ts";

const required = [
  ...Array.from({ length: 21 }, (_, index) => `1.${index + 1}`),
  ...Array.from({ length: 5 }, (_, index) => `5.${index + 1}`),
];

test("committed tapes match a fresh Node run", async () => {
  const cards = await loadCardsFromDisk();
  const ids = new Set(cards.map((card) => card.id));
  for (const id of required) assert.ok(ids.has(id), `missing ${id}`);
  assert.ok(cards.length >= 26);
  assert.ok(ids.has("2.5") && ids.has("6.1"));

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
    const tests = tape.filter((event) => event.type === "test");
    assert.ok(tests.length >= card.tests.length, `${card.id} ran ${tests.length} tests\n${formatTape(tape)}`);
    for (const event of tests) {
      if (event.type !== "test") continue;
      assert.equal(event.pass, true, `${card.id} ${event.name}: ${event.message ?? ""}`);
    }
  }
});
