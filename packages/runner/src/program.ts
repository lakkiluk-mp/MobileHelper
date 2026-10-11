import type { TapeEvent } from "./tape.ts";

/**
 * Harness lives in a closure. Learner code runs after `__report` / `__serialize`
 * are cleared, and `__test` is frozen so it cannot be swapped for a fake that
 * marks every check as passed.
 */
export function buildImplementProgram(userCode: string, tests: Array<{ code: string }>): string {
  const body = tests.map((test) => test.code).join("\n");
  return `(function (report, serialize) {
  var api = Object.freeze({
    assertEquals: function (actual, expected, name) {
      var pass = Object.is(actual, expected);
      report({
        type: "test",
        name: name || "equals",
        pass: pass,
        message: pass ? undefined : "expected " + serialize(expected) + " got " + serialize(actual),
      });
    },
    assertDeepEqual: function (actual, expected, name) {
      var pass = serialize(actual) === serialize(expected);
      report({
        type: "test",
        name: name || "deepEqual",
        pass: pass,
        message: pass ? undefined : "expected " + serialize(expected) + " got " + serialize(actual),
      });
    },
    expectThrow: function (fn, name) {
      var threw = false;
      try { fn(); } catch (error) { threw = true; }
      report({
        type: "test",
        name: name || "throws",
        pass: threw,
        message: threw ? undefined : "did not throw",
      });
    },
  });
  var fail = function (error) {
    report({
      type: "error",
      name: (error && error.name) || "Error",
      message: String((error && error.message) || error),
    });
  };
  var globalObject = (function () { return this; })();
  if (!globalObject) globalObject = (0, eval)("this");
  var lock = function (key, value) {
    try {
      Object.defineProperty(globalObject, key, { value: value, writable: false, configurable: false });
    } catch (error) {
      globalObject[key] = value;
    }
  };
  lock("__test", api);
  lock("__onTestError", fail);
  try { delete globalObject.__report; } catch (error) {}
  try { delete globalObject.__serialize; } catch (error) {}
  try { globalObject.__report = undefined; } catch (error) {}
  try { globalObject.__serialize = undefined; } catch (error) {}
})(
  typeof __report === "function" ? __report : function () {},
  typeof __serialize === "function" ? __serialize : function (value) { return String(value); }
);
${userCode}
;(async function () {
${body}
})().catch(typeof __onTestError === "function" ? __onTestError : function () {});
`;
}

export function countAssertions(tests: Array<{ code: string }>): number {
  return tests.reduce((sum, test) => sum + (test.code.match(/__test\./g) ?? []).length, 0);
}

/** Passing means every declared check ran, none failed, and nothing threw. */
export function gradeImplementTape(
  tape: TapeEvent[],
  tests: Array<{ code: string }>,
): { ok: boolean; detail: string } {
  const expected = countAssertions(tests);
  const ran = tape.filter((event) => event.type === "test");
  const error = tape.find((event) => event.type === "error");
  if (error && error.type === "error") return { ok: false, detail: `${error.name}: ${error.message}` };
  if (ran.length !== expected) return { ok: false, detail: `проверок ${ran.length} из ${expected}` };
  const failed = ran.find((event) => event.type === "test" && !event.pass);
  if (failed && failed.type === "test") {
    return { ok: false, detail: `${failed.name}${failed.message ? `: ${failed.message}` : ""}` };
  }
  return { ok: true, detail: "" };
}
