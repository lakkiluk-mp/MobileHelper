/**
 * Тестовый харнесс для implement-карточек.
 *
 * Отдаётся как фабрика, а не готовой переменной: так `__serialize` и функция
 * отправки события остаются в замыкании, а наружу торчит только объект `__test`.
 * Вместе с `const __test` внутри IIFE (см. `buildImplementProgram`) это не даёт
 * коду ученика переприсвоить харнесс и отчитаться о «зелёных» проверках.
 */
export const TEST_HARNESS = `var __makeTest = function (serialize, report) {
  return Object.freeze({
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
};`;

/**
 * Собирает программу прогона implement-карточки: харнесс, код ученика, тесты.
 *
 * Почему так, а не «просто склеить строки»:
 *  - харнесс и `__test` лежат внутри IIFE, `__test` объявлен через `const`,
 *    поэтому `__test = {...}` из кода ученика падает с `TypeError`, а
 *    `Object.freeze` не даёт подменить отдельные методы;
 *  - тело ученика обёрнуто в `try`, а тесты — в `async` с `try/catch`: иначе
 *    синхронный `throw` превращается в необработанный reject промиса и роняет
 *    Node вместо того, чтобы стать событием `error` в ленте.
 *
 * Граница честности: это защита от наивной подмены, а не от подделки вывода
 * целиком. Код ученика всё ещё видит глобальный `__report` и может слать свои
 * события; ловится это на стороне проверки — `golden.test.ts` требует, чтобы
 * число и имена выполненных проверок совпали с объявленными в карточке, а
 * браузерный вердикт отвергает ленту с событиями `error`. Инструмент
 * самопроверки, а не экзамен под наблюдением.
 */
export function buildImplementProgram(userCode: string, tests: Array<{ code: string }>): string {
  const body = tests.map((test) => test.code).join("\n");
  return `${TEST_HARNESS}
;(function () {
  const __test = __makeTest(__serialize, function (event) {
    __report(event);
  });
  var __safeReport = function (error) {
    __report({
      type: "error",
      name: (error && error.name) || "Error",
      message: String((error && error.message) || error),
    });
  };
  try {
${userCode}
  } catch (error) {
    __safeReport(error);
  }
  (async function () {
    try {
${body}
    } catch (error) {
      __safeReport(error);
    }
  })().catch(function (error) {
    __safeReport(error);
  });
})();
`;
}
