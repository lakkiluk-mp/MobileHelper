import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TapeEvent } from "@etalon/shared";
import {
  canonical,
  checkAnswer,
  checkLine,
  insertWord,
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
