import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { highlightLine, indentOf } from "./highlight.ts";

describe("highlightLine", () => {
  it("склеивается обратно в исходную строку", () => {
    const line = "    setTimeout(() => console.log('arrow:', this.login), 0); // хвост";
    assert.equal(
      highlightLine(line)
        .map((token) => token.text)
        .join(""),
      line,
    );
  });

  it("размечает ключевые слова, строки, числа, вызовы и комментарии", () => {
    const kinds = highlightLine("const a = f('x', 10); // c")
      .filter((token) => token.kind)
      .map((token) => `${token.kind}:${token.text}`);
    assert.deepEqual(kinds, ["keyword:const", "call:f", "string:'x'", "number:10", "comment:// c"]);
  });

  it("не считает слово внутри строки ключевым", () => {
    const kinds = highlightLine("log('return this')").map((token) => token.kind);
    assert.deepEqual(kinds, ["call", undefined, "string", undefined]);
  });
});

describe("indentOf", () => {
  it("считает ведущие пробелы", () => {
    assert.equal(indentOf("    x"), 4);
    assert.equal(indentOf(""), 0);
  });
});
