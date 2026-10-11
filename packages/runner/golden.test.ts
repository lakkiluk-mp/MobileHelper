import assert from "node:assert/strict";
import test from "node:test";
import { loadCardsFromDisk } from "../content/src/node-load.ts";
import { buildImplementProgram } from "./src/program.ts";
import { compareTapes, formatTape } from "./src/tape.ts";
import { runInNode } from "./src/node-host.ts";

/**
 * Сколько карточек должно быть на каждом уровне. Именно равенство, а не «не
 * меньше»: иначе удаление целого уровня проходит незамеченным. Обновляй числа
 * вместе с контентом — тест специально падает, когда состав изменился.
 */
const LEVEL_SIZES: Record<number, number> = {
  1: 27,
  2: 14,
  3: 17,
  4: 14,
  5: 15,
  6: 50,
};

/** Сколько вызовов `__test.` объявлено в тестах карточки. */
function declaredAssertions(card: { tests: Array<{ code: string }> }): number {
  return (card.tests.map((entry) => entry.code).join("\n").match(/__test\./g) ?? []).length;
}

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
    // собираем аргументы верхнего уровня этого вызова
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
  for (const [level, expected] of Object.entries(LEVEL_SIZES)) {
    assert.equal(
      byLevel.get(Number(level)) ?? 0,
      expected,
      `level ${level}: ожидалось ${expected} карточек, а не ${byLevel.get(Number(level)) ?? 0}`,
    );
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

    // Implement-карточка. Проверяем три вещи, каждая из которых раньше
    // пропускала сломанное решение:
    //  1) объявлено хоть одно __test. (иначе «тесты» ничего не проверяют);
    //  2) выполнено ровно столько проверок, сколько объявлено — упавший на
    //     середине кандидат раньше проходил, потому что считались блоки tests[];
    //  3) в ленте нет событий error — раньше они вообще не смотрелись.
    const declared = declaredAssertions(card);
    assert.ok(declared > 0, `${card.id}: в tests нет ни одного вызова __test.`);

    const program = buildImplementProgram(card.solution, card.tests);
    const tape = await runInNode(program, { strict: false, waitMs: card.waitMs ?? 40 });
    const ran = tape.filter((event) => event.type === "test").length;
    const threw = tape.filter((event) => event.type === "error");

    assert.equal(
      threw.length,
      0,
      `${card.id}: эталон бросил — ${threw.map((event) => (event.type === "error" ? `${event.name}: ${event.message}` : "")).join("; ")}\n${formatTape(tape)}`,
    );
    assert.equal(
      ran,
      declared,
      `${card.id}: выполнено ${ran} проверок из ${declared} объявленных\n${formatTape(tape)}`,
    );

    // Имена ловят подменённый __test: проверок столько же и все «зелёные»,
    // но названы они не так, как объявлено в карточке.
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

    for (const event of tape) {
      if (event.type !== "test") continue;
      assert.equal(event.pass, true, `${card.id} ${event.name}: ${event.message ?? ""}`);
    }
  }
});
