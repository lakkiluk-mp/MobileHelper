import assert from "node:assert/strict";
import test from "node:test";
import { loadCardsFromDisk } from "../content/src/node-load.ts";
import { LEVELS } from "../content/src/levels.ts";
import { buildImplementProgram, gradeImplementTape } from "./src/program.ts";
import { compareTapes, formatTape } from "./src/tape.ts";
import { runInNode } from "./src/node-host.ts";

/**
 * Сколько карточек должно быть на каждом уровне. Именно равенство, а не «не
 * меньше»: иначе удаление целого уровня проходит незамеченным. Обновляй числа
 * вместе с контентом — тест специально падает, когда состав изменился.
 */
const LEVEL_SIZES: Record<number, number> = {
  1: 32,
  2: 14,
  3: 17,
  4: 14,
  5: 15,
  6: 50,
};

/**
 * Имена проверок, объявленные в тестах, в порядке выполнения.
 *
 * Нужны, чтобы поймать подмену харнесса: код ученика может переписать `__test`
 * (или слать поддельные события прямо в `__report`) и отчитаться о «зелёных»
 * проверках, не выполнив ни одной. Совпадение имён с объявленными это ловит.
 *
 * Разбор намеренно осторожный: если третий аргумент не строковый литерал или в
 * вызове есть вложенный вызов, имя не угадывается и проверка имён пропускается
 * для этой карточки — лучше не проверить, чем забраковать верную карточку.
 */
function declaredNames(card: { tests: Array<{ code: string }> }): string[] | null {
  const source = card.tests.map((entry) => entry.code).join("\n");
  const names: string[] = [];
  const call = /__test\.\w+\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = call.exec(source)) !== null) {
    let depth = 1;
    let index = match.index + match[0].length;
    const args: string[] = [];
    let current = "";
    while (index < source.length && depth > 0) {
      const char = source[index] as string;
      if (char === "(" || char === "[" || char === "{") depth += 1;
      else if (char === ")" || char === "]" || char === "}") {
        depth -= 1;
        if (depth === 0) break;
      } else if (char === "," && depth === 1) {
        args.push(current.trim());
        current = "";
        index += 1;
        continue;
      }
      current += char;
      index += 1;
    }
    args.push(current.trim());
    const third = args[2];
    const literal = third?.match(/^"([^"\\]*)"$|^'([^'\\]*)'$/);
    if (!literal) return null;
    names.push((literal[1] ?? literal[2]) as string);
  }
  return names.length > 0 ? names : null;
}

test("content has the expected shape per level", async () => {
  const cards = await loadCardsFromDisk();
  const byLevel = new Map<number, number>();
  const ids = new Set<string>();
  for (const card of cards) {
    assert.ok(!ids.has(card.id), `duplicate card id ${card.id}`);
    ids.add(card.id);
    byLevel.set(card.level, (byLevel.get(card.level) ?? 0) + 1);
  }
  for (const level of LEVELS) {
    const expected = LEVEL_SIZES[level.level];
    assert.equal(
      byLevel.get(level.level) ?? 0,
      expected,
      `level ${level.level}: ожидалось ${expected} карточек, а не ${byLevel.get(level.level) ?? 0}`,
    );
    const orders = cards
      .filter((card) => card.level === level.level)
      .map((card) => card.order)
      .sort((a, b) => a - b);
    assert.deepEqual(orders, orders.map((_, index) => index + 1), `level ${level.level} order gap`);
  }
});

test("committed tapes match a fresh Node run", async () => {
  const cards = await loadCardsFromDisk();

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

    const expectedNames = declaredNames(card);
    if (expectedNames) {
      const actualNames = tape
        .filter((event) => event.type === "test")
        .map((event) => (event.type === "test" ? event.name : ""));
      assert.deepEqual(
        actualNames,
        expectedNames,
        `${card.id}: имена выполненных проверок не совпали с объявленными — похоже на подмену __test\n${formatTape(tape)}`,
      );
    }
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
