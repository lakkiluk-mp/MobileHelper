import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blocksSnippet, readSnippetsEnabled, snippetAfterInput, snippetCatalog } from "./snippets.ts";

function type(value: string, key: string, at = value.length) {
  const next = value.slice(0, at) + key + value.slice(at);
  return snippetAfterInput(next, at + key.length);
}

function apply(value: string, key: string, at = value.length) {
  const edit = type(value, key, at);
  assert.ok(edit);
  const next = value.slice(0, at) + key + value.slice(at);
  return {
    value: next.slice(0, edit.from) + edit.text + next.slice(edit.to),
    caret: edit.caret,
  };
}

describe("snippetAfterInput", () => {
  it("turns a finished console into console.log() with the caret inside", () => {
    const result = apply("consol", "e");
    assert.equal(result.value, "console.log()");
    assert.equal(result.value[result.caret], ")");
    assert.equal(result.value.slice(0, result.caret), "console.log(");
  });

  it("does not expand const until the word is finished, so console can still be typed", () => {
    assert.equal(type("cons", "t"), null);
    assert.equal(type("const", "o"), null);
    const named = apply("const", " ");
    assert.equal(named.value, "const  = ");
    assert.equal(named.value.slice(0, named.caret), "const ");
  });

  it("expands console on a following space too", () => {
    const result = apply("console", " ");
    assert.equal(result.value, "console.log()");
    assert.equal(result.value.slice(0, result.caret), "console.log(");
  });

  it("leaves console alone inside strings and comments", () => {
    assert.equal(type('"consol', "e"), null);
    assert.equal(type("'consol", "e"), null);
    assert.equal(type("`consol", "e"), null);
    assert.equal(type("// consol", "e"), null);
    assert.equal(type("/* consol", "e"), null);
    const after = apply("/* ok */ consol", "e");
    assert.equal(after.value, "/* ok */ console.log()");
  });

  it("does not steal the tail of a longer identifier or a mid-word edit", () => {
    assert.equal(type("myconsol", "e"), null);
    assert.equal(type("consolX", "e", 6), null);
  });

  it("waits to finish querySelector because querySelectorAll is longer", () => {
    assert.equal(type("querySelector", "A"), null);
    const all = apply("querySelectorAl", "l");
    assert.equal(all.value, 'querySelectorAll("")');
    assert.equal(all.value[all.caret - 1], '"');
    const one = apply("document.querySelector", " ");
    assert.equal(one.value, 'document.querySelector("")');
  });

  it("expands for on a boundary and forEach as soon as the name is complete", () => {
    const loop = apply("for", " ");
    assert.equal(loop.value, "for (let i = 0; i < ; i++) {\n  \n}");
    assert.equal(loop.value.slice(0, loop.caret), "for (let i = 0; i < ");
    const each = apply("arr.forEac", "h");
    assert.equal(each.value, "arr.forEach(() => {\n  \n})");
  });

  it("expands if on space, paren, or enter, and swallows that character", () => {
    assert.equal(type("i", "f"), null);
    for (const key of [" ", "(", "\n"]) {
      const result = apply("if", key);
      assert.equal(result.value, "if () {\n  \n}");
      assert.equal(result.value.slice(0, result.caret), "if (");
    }
  });

  it("keeps the indent of a snippet that starts a line", () => {
    const result = apply("  if", " ");
    assert.equal(result.value, "  if () {\n    \n  }");
    assert.equal(result.caret, "  if (".length);
  });

  it("turns promise and setTimeout into the full construct", () => {
    const timeout = apply("setTimeou", "t");
    assert.equal(timeout.value, "setTimeout(() => {\n  \n}, 0)");
    assert.equal(timeout.value.slice(0, timeout.caret), "setTimeout(() => {\n  ");
    const promise = apply("promise", "(");
    assert.equal(promise.value, "new Promise((resolve, reject) => {\n  \n})");
  });

  it("ignores an empty caret and a bare boundary", () => {
    assert.equal(snippetAfterInput("", 0), null);
    assert.equal(snippetAfterInput(" ", 1), null);
  });
});

describe("snippet catalog", () => {
  it("gives every construct one caret and a unique trigger", () => {
    const catalog = snippetCatalog();
    const triggers = catalog.map((item) => item.trigger);
    assert.equal(new Set(triggers).size, triggers.length);
    assert.equal(catalog[0]?.trigger, "console");
    assert.equal(catalog.find((item) => item.trigger === "console")?.mode, "immediate");
    assert.equal(catalog.find((item) => item.trigger === "const")?.mode, "boundary");
    assert.equal(catalog.find((item) => item.trigger === "querySelector")?.mode, "boundary");
    assert.equal(catalog.find((item) => item.trigger === "querySelectorAll")?.mode, "immediate");
    for (const item of catalog) assert.equal(item.preview.includes("|"), false);
  });
});

describe("blocksSnippet", () => {
  it("stops at the end of a line comment and an escaped quote", () => {
    assert.equal(blocksSnippet("// no\nconsole", "// no\n".length), false);
    assert.equal(blocksSnippet('"say \\"hi\\" " console', '"say \\"hi\\" "'.length), false);
    assert.equal(blocksSnippet('"still', 6), true);
  });
});

describe("readSnippetsEnabled", () => {
  it("stays on unless the setting is explicitly off", () => {
    assert.equal(readSnippetsEnabled(null), true);
    assert.equal(readSnippetsEnabled(undefined), true);
    assert.equal(readSnippetsEnabled("on"), true);
    assert.equal(readSnippetsEnabled("off"), false);
  });
});
