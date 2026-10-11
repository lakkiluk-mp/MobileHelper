export const TEST_HARNESS = `var __test = {
  assertEquals: function (actual, expected, name) {
    var pass = Object.is(actual, expected);
    __report({
      type: "test",
      name: name || "equals",
      pass: pass,
      message: pass ? undefined : "expected " + __serialize(expected) + " got " + __serialize(actual),
    });
  },
  assertDeepEqual: function (actual, expected, name) {
    var pass = __serialize(actual) === __serialize(expected);
    __report({
      type: "test",
      name: name || "deepEqual",
      pass: pass,
      message: pass ? undefined : "expected " + __serialize(expected) + " got " + __serialize(actual),
    });
  },
  expectThrow: function (fn, name) {
    var threw = false;
    try { fn(); } catch (error) { threw = true; }
    __report({
      type: "test",
      name: name || "throws",
      pass: threw,
      message: threw ? undefined : "did not throw",
    });
  },
};`;

export function buildImplementProgram(userCode: string, tests: Array<{ code: string }>): string {
  const body = tests.map((test) => test.code).join("\n");
  return `${TEST_HARNESS}
${userCode}
;(async function () {
${body}
})().catch(function (error) {
  __report({
    type: "error",
    name: (error && error.name) || "Error",
    message: String((error && error.message) || error),
  });
});
`;
}
