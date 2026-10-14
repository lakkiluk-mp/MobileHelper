import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TapeEvent } from "@etalon/shared";
import {
  answerSteps,
  canonical,
  checkAnswer,
  checkLine,
  insertWord,
  orderChoices,
  splitValues,
  suggestWords,
} from "./answer.ts";

const log = (...args: string[]): TapeEvent => ({ type: "log", args });
const error = (name: string): TapeEvent => ({ type: "error", name, message: "boom" });

describe("splitValues", () => {
  it("keeps quoted strings and brackets whole", () => {
    assert.deepEqual(splitValues(`"1,23" [0, 1] {"a": 1} 'x y', 3`), [
      `"1,23"`,
      "[0, 1]",
      `{"a": 1}`,
      "'x y'",
      "3",
    ]);
  });
});

describe("canonical", () => {
  it("treats single and double quotes alike", () => {
    assert.equal(canonical(`['a', 'b']`), canonical(`["a", "b"]`));
    assert.equal(canonical(`'{"x":1}'`), canonical(`"{\\"x\\":1}"`));
  });
});

describe("checkAnswer", () => {
  it("accepts one line per output with commas or spaces", () => {
    const expected = [log('"object"', '"object"', '"number"'), error("ReferenceError")];
    assert.equal(checkAnswer(`"object", 'object' "number"\nreferenceerror`, expected, "").ok, true);
  });

  it("tells a string from a number by quotes", () => {
    const result = checkAnswer("52", [log('"52"')], "");
    assert.equal(result.ok, false);
    assert.deepEqual(result.lines, ["wrong"]);
  });

  it("ignores the error message after the name", () => {
    assert.equal(
      checkAnswer("TypeError: bar is not a function", [error("TypeError")], "").ok,
      true,
    );
  });

  it("marks missing and extra lines without revealing them", () => {
    assert.deepEqual(checkAnswer("1", [log("1"), log("2")], "").lines, ["ok", "missing"]);
    assert.deepEqual(checkAnswer("1\n2", [log("1")], "").lines, ["ok", "extra"]);
  });

  it("lets labels taken from the code be skipped", () => {
    const code = `console.log("со strict:", f());`;
    const expected = [log('"со strict:"', "undefined")];
    assert.equal(checkAnswer("undefined", expected, code).ok, true);
    assert.equal(checkAnswer(`"со strict:" undefined`, expected, code).ok, true);
  });

  it("still asks for a line made only of strings from the code", () => {
    const code = `console.log("child ctor");`;
    assert.equal(checkAnswer("", [log('"child ctor"')], code).ok, false);
    assert.equal(checkAnswer(`"child ctor"`, [log('"child ctor"')], code).ok, true);
  });
});

describe("suggestWords", () => {
  it("completes a prefix from the fixed dictionary", () => {
    assert.deepEqual(suggestWords("1\nRef", 5), [{ from: 2, to: 5, word: "ReferenceError" }]);
    assert.deepEqual(suggestWords("u", 1), []);
  });

  it("inserts a word with a separating space", () => {
    assert.deepEqual(insertWord("1", 1, "null"), { text: "1 null", caret: 6 });
    assert.deepEqual(insertWord("", 0, "NaN"), { text: "NaN", caret: 3 });
    assert.deepEqual(insertWord("1", 1, '""'), { text: '1 ""', caret: 3 });
  });
});

describe("orderChoices", () => {
  it("offers code literals in source order plus nothing", () => {
    const code =
      "console.log(1);\nsetTimeout(() => console.log(2));\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);\n";
    const expected = [log("1"), log("4"), log("3"), log("2")];
    const choices = orderChoices(code, expected);
    assert.deepEqual(
      choices?.map((choice) => choice.label),
      ["1", "2", "3", "4", "ошибка", "ничего"],
    );
    assert.equal(checkLine("1", expected[0]!, code), true);
    assert.equal(checkLine("4", expected[1]!, code), true);
  });

  it("keeps string quotes from the snippet", () => {
    const code = "console.log('start');\nconsole.log('a');\n";
    const choices = orderChoices(code, [log('"start"'), log('"a"')]);
    assert.deepEqual(
      choices?.map((choice) => choice.label),
      ["'start'", "'a'", "ошибка", "ничего"],
    );
    assert.equal(checkLine(choices![0]!.line, log('"start"'), code), true);
  });

  it("offers a missing number even when the code only has a longer one", () => {
    const choices = orderChoices("console.log(x);\nconst n = 10;\n", [log("1")]);
    assert.equal(choices?.some((choice) => choice.label === "1"), true);
    assert.equal(choices?.some((choice) => choice.label === "10"), true);
    assert.equal(checkLine("1", log("1"), ""), true);
    assert.equal(checkLine("10", log("1"), ""), false);
  });

  it("splits one log into single values and still covers a computed result", () => {
    assert.equal(answerSteps([log("1", "2"), error("TypeError")]).length, 3);
    const many = orderChoices("console.log(1, 2);\n", [log("1", "2")]);
    assert.equal(many?.some((choice) => choice.label === "1"), true);
    assert.equal(many?.some((choice) => choice.label === "2"), true);
    const computed = orderChoices("console.log(e * 10);\n", [log("20")]);
    assert.equal(computed?.some((choice) => choice.label === "20"), true);
    assert.equal(computed?.some((choice) => choice.label === "10"), true);
  });

  it("builds 1, 2 and ошибка when the log is undefined and then throws", () => {
    const choices = orderChoices("console.log(a);\nvar a = 1;\nconsole.log(b);\nlet b = 2;\n", [
      log("undefined"),
      error("ReferenceError"),
    ]);
    assert.deepEqual(
      choices?.map((choice) => choice.label),
      ["1", "2", "undefined", "ошибка", "ничего"],
    );
  });

  it("keeps a literal that is in the code but does not print", () => {
    const code = "f.bind({ n: 1 }).bind({ n: 2 })();\nf.call({ n: 3 });\nconsole.log(this.n);\n";
    const choices = orderChoices(code, [log("1"), log("3")]);
    assert.deepEqual(
      choices?.map((choice) => choice.label),
      ["1", "2", "3", "ошибка", "ничего"],
    );
  });

  it("keeps null from the snippet as its own button", () => {
    const code = "console.log('a');\nawait null;\nconsole.log('b');\n";
    const choices = orderChoices(code, [log('"a"'), log('"b"')]);
    assert.deepEqual(
      choices?.map((choice) => choice.label),
      ["'a'", "null", "'b'", "ошибка", "ничего"],
    );
  });

  it("still offers traps when the only printed literal is obvious", () => {
    assert.deepEqual(
      orderChoices("x = 10;\nconsole.log(x);\n", [log("10")])?.map((choice) => choice.label),
      ["10", "ошибка", "ничего"],
    );
  });
});

describe("checkLine", () => {
  it("checks a single output line on its own", () => {
    assert.equal(
      checkLine(`"" "[object Object]" 3 '52'`, log('""', '"[object Object]"', "3", '"52"'), ""),
      true,
    );
    assert.equal(checkLine("typeerror", error("TypeError"), ""), true);
    assert.equal(checkLine("undefined", error("TypeError"), ""), false);
  });
});
