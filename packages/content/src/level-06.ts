/**
 * Уровень 6. Карточки в порядке тропы.
 * `expected` у predict-карточек — машинная лента, её не пишут руками:
 * она снимается раннером (см. packages/runner). Меняешь `code` — пересними ленту.
 */
export const CARDS = [
  {
    id: "6.1",
    kind: "implement",
    level: 6,
    order: 1,
    title: "debounce",
    tags: [
      "event-loop"
    ],
    statement: "debounce(fn, wait) откладывает вызов, пока пауза между вызовами не станет длиннее wait. Срабатывает один раз, с аргументами последнего вызова.",
    starter: "function debounce(fn, wait) {\n  \n}\n",
    tests: [
      {
        name: "схлопывает серию",
        code: "var calls = [];\nvar d = debounce(function (x) { calls.push(x); }, 20);\nd(1); d(2); d(3);\n__test.assertEquals(calls.length, 0, \"сразу тихо\");\nsetTimeout(function () {\n  __test.assertDeepEqual(calls, [3], \"один последний\");\n}, 40);"
      }
    ],
    solution: "function debounce(fn, wait) {\n  var timer;\n  return function () {\n    var args = arguments;\n    var ctx = this;\n    clearTimeout(timer);\n    timer = setTimeout(function () { fn.apply(ctx, args); }, wait);\n  };\n}\n",
    theory: "Таймер лежит в замыкании. Каждый новый вызов сбрасывает предыдущий clearTimeout, поэтому из серии остаётся только последний. fn.apply нужен, чтобы не потерять this и аргументы: колбэк таймера вызывается уже не как метод.",
    waitMs: 80,
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.2",
    kind: "implement",
    level: 6,
    order: 2,
    title: "throttle",
    tags: [
      "event-loop"
    ],
    statement: "throttle(fn, wait) вызывает fn сразу, а следующий вызов — не раньше чем через wait. Если вызовы пришли в окне ожидания, последний из них выполняется по окончании окна.",
    starter: "function throttle(fn, wait) {\n  \n}\n",
    tests: [
      {
        name: "сразу и хвост",
        code: "var n = 0;\nvar t = throttle(function () { n += 1; }, 30);\nt();\n__test.assertEquals(n, 1, \"первый сразу\");\nt();\n__test.assertEquals(n, 1, \"в окне тихо\");\nsetTimeout(function () {\n  __test.assertEquals(n, 2, \"хвост\");\n}, 50);"
      }
    ],
    solution: "function throttle(fn, wait) {\n  var last = 0;\n  var timer;\n  var savedArgs;\n  var savedThis;\n  return function () {\n    var now = Date.now();\n    savedArgs = arguments;\n    savedThis = this;\n    var remain = wait - (now - last);\n    if (remain <= 0) {\n      clearTimeout(timer);\n      timer = null;\n      last = now;\n      fn.apply(savedThis, savedArgs);\n    } else if (!timer) {\n      timer = setTimeout(function () {\n        last = Date.now();\n        timer = null;\n        fn.apply(savedThis, savedArgs);\n      }, remain);\n    }\n  };\n}\n",
    theory: "В отличие от debounce, первый вызов не ждёт. last запоминает время, а timer хранит отложенный хвост. Пока окно не кончилось, новые вызовы только обновляют аргументы, не ставя второй таймер. Поэтому из пачки получается два вызова: ведущий и один замыкающий.",
    waitMs: 90,
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.3",
    kind: "implement",
    level: 6,
    order: 3,
    title: "memoize",
    tags: [
      "closure"
    ],
    statement: "memoize(fn) кэширует результат по JSON аргументов. Повторный вызов с теми же аргументами не входит в fn.",
    starter: "function memoize(fn) {\n  \n}\n",
    tests: [
      {
        name: "кэш",
        code: "var n = 0;\nvar f = memoize(function (x) { n += 1; return x * 2; });\n__test.assertEquals(f(2), 4, \"первый\");\n__test.assertEquals(f(2), 4, \"из кэша\");\n__test.assertEquals(f(3), 6, \"другой ключ\");\n__test.assertEquals(n, 2, \"два захода в тело\");\nvar calls = 0;\nvar g = memoize(function (x) { calls += 1; return String(x); });\n__test.assertEquals(g(2), \"2\", \"число\");\n__test.assertEquals(g(\"2\"), \"2\", \"строка\");\n__test.assertEquals(calls, 2, \"2 и строка 2 — разный кэш\");"
      }
    ],
    solution: "function memoize(fn) {\n  var cache = new Map();\n  return function () {\n    var key = JSON.stringify([].slice.call(arguments));\n    if (cache.has(key)) return cache.get(key);\n    var value = fn.apply(this, arguments);\n    cache.set(key, value);\n    return value;\n  };\n}\n",
    theory: "Map живёт в замыкании обёртки, не в fn. Ключ — строка аргументов, поэтому 2 и \"2\" это разный кэш. Повтор не вызывает fn вообще: возвращается сохранённое значение, даже если оно undefined.",
    updatedAt: "2026-10-11T14:10:00.000Z",
    rev: 2
  },
  {
    id: "6.4",
    kind: "implement",
    level: 6,
    order: 4,
    title: "sleep",
    tags: [
      "promises"
    ],
    statement: "sleep(ms) возвращает промис, который выполняется не раньше чем через ms.",
    starter: "function sleep(ms) {\n  \n}\n",
    tests: [
      {
        name: "ждёт",
        code: "var start = Date.now();\nawait sleep(25);\n__test.assertEquals(Date.now() - start >= 20, true, \"пауза\");"
      }
    ],
    solution: "function sleep(ms) {\n  return new Promise(function (resolve) {\n    setTimeout(resolve, ms);\n  });\n}\n",
    theory: "Промис переносит продолжение в микрозадачу после таймера. await в тесте как раз ждёт этот промис. Резолв без значения — обычный приём, когда важна пауза, а не данные.",
    waitMs: 80,
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.5",
    kind: "implement",
    level: 6,
    order: 5,
    title: "promiseAll",
    tags: [
      "promises"
    ],
    statement: "promiseAll(list) ждёт все элементы, сохраняет порядок и падает на первой ошибке. Пустой список выполняется сразу пустым массивом.",
    starter: "function promiseAll(list) {\n  \n}\n",
    tests: [
      {
        name: "порядок и пустой",
        code: "var empty = await promiseAll([]);\n__test.assertDeepEqual(empty, [], \"пусто\");\nvar values = await promiseAll([\n  Promise.resolve(1),\n  2,\n  Promise.resolve(3),\n]);\n__test.assertDeepEqual(values, [1, 2, 3], \"порядок\");\nvar rejected = false;\nvar reason = \"\";\ntry {\n  await promiseAll([Promise.resolve(1), Promise.reject(new Error(\"boom\"))]);\n} catch (error) {\n  rejected = true;\n  reason = error.message;\n}\n__test.assertEquals(rejected, true, \"reject\");\n__test.assertEquals(reason, \"boom\", \"текст ошибки\");\nvar first = \"\";\ntry {\n  await promiseAll([Promise.reject(new Error(\"a\")), Promise.reject(new Error(\"b\"))]);\n} catch (error) {\n  first = error.message;\n}\n__test.assertEquals(first, \"a\", \"первая ошибка\");"
      }
    ],
    solution: "function promiseAll(list) {\n  var items = [].slice.call(list);\n  return new Promise(function (resolve, reject) {\n    var out = new Array(items.length);\n    var left = items.length;\n    if (left === 0) { resolve(out); return; }\n    items.forEach(function (item, index) {\n      Promise.resolve(item).then(function (value) {\n        out[index] = value;\n        left -= 1;\n        if (left === 0) resolve(out);\n      }, reject);\n    });\n  });\n}\n",
    theory: "Индекс пишется в заранее созданный массив, поэтому более поздний промис не обгоняет более ранний в результате. Promise.resolve оборачивает обычное значение. reject на первой ошибке отклоняет внешний промис; остальные потом ещё выполнятся, но их результат уже никому не нужен.",
    updatedAt: "2026-10-11T14:10:00.000Z",
    rev: 2
  },
  {
    id: "6.6",
    kind: "implement",
    level: 6,
    order: 6,
    title: "curry",
    tags: [
      "closure"
    ],
    statement: "curry(fn) копит аргументы, пока их не станет столько, сколько у fn.length. Звать можно по одному или пачкой. Когда аргументов хватает, вызывается исходная fn.",
    starter: "function curry(fn) {\n  \n}\n",
    tests: [
      {
        name: "добор аргументов",
        code: "function add(a, b, c) { return a + b + c; }\nvar c = curry(add);\n__test.assertEquals(c(1)(2)(3), 6, \"по одному\");\n__test.assertEquals(c(1, 2)(3), 6, \"пачкой\");\n__test.assertEquals(c(1)(2, 3), 6, \"хвост пачкой\");"
      }
    ],
    solution: "function curry(fn) {\n  return function curried() {\n    var args = [].slice.call(arguments);\n    if (args.length >= fn.length) return fn.apply(this, args);\n    return function () {\n      return curried.apply(this, args.concat([].slice.call(arguments)));\n    };\n  };\n}\n",
    theory: "Длина функции — это fn.length, число объявленных параметров. Пока собранных аргументов меньше, curry возвращает новую функцию, замкнутую на уже накопленный список. Когда аргументов хватает, apply зовёт исходную fn и цепочка заканчивается числом, а не ещё одной функцией.",
    updatedAt: "2026-10-11T14:10:00.000Z",
    rev: 2
  },
  {
    id: "6.7",
    kind: "implement",
    level: 6,
    order: 7,
    title: "compose",
    tags: [
      "closure"
    ],
    statement: "compose(f, g, h)(x) считает h(x), потом g, потом f. Справа налево. Вызов без функций возвращает аргумент как есть.",
    starter: "function compose() {\n  \n}\n",
    tests: [
      {
        name: "справа налево",
        code: "function inc(n) { return n + 1; }\nfunction dbl(n) { return n * 2; }\n__test.assertEquals(compose(inc, dbl)(3), 7, \"сначала умножение\");\n__test.assertEquals(compose()(5), 5, \"пусто\");"
      }
    ],
    solution: "function compose() {\n  var fns = [].slice.call(arguments);\n  return function (value) {\n    for (var i = fns.length - 1; i >= 0; i--) value = fns[i](value);\n    return value;\n  };\n}\n",
    theory: "Порядок важен: compose читает список с конца, поэтому ближайшая к аргументу функция — последняя в списке. Пустой список нечего применять, значение проходит насквозь. Каждая функция получает уже результат предыдущей, а не исходный x.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.8",
    kind: "implement",
    level: 6,
    order: 8,
    title: "pipe",
    tags: [
      "closure"
    ],
    statement: "pipe(f, g, h)(x) считает слева направо: сначала f, потом g, потом h. Это тот же конвейер, что compose, только в порядке чтения.",
    starter: "function pipe() {\n  \n}\n",
    tests: [
      {
        name: "слева направо",
        code: "function inc(n) { return n + 1; }\nfunction dbl(n) { return n * 2; }\n__test.assertEquals(pipe(inc, dbl)(3), 8, \"сначала плюс\");\n__test.assertEquals(pipe()(5), 5, \"пусто\");"
      }
    ],
    solution: "function pipe() {\n  var fns = [].slice.call(arguments);\n  return function (value) {\n    for (var i = 0; i < fns.length; i++) value = fns[i](value);\n    return value;\n  };\n}\n",
    theory: "pipe идёт по массиву функций с начала. Отличие от compose только в направлении: здесь первая написанная функция видит исходное значение. Промежуточный результат не сохраняется снаружи, он живёт в переменной value одного вызова.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.9",
    kind: "implement",
    level: 6,
    order: 9,
    title: "map",
    tags: [
      "array"
    ],
    statement: "map(list, fn) возвращает новый массив той же длины. fn получает элемент и индекс. Исходный массив не меняется.",
    starter: "function map(list, fn) {\n  \n}\n",
    tests: [
      {
        name: "новый массив",
        code: "var src = [1, 2, 3];\nvar out = map(src, function (n, i) { return n + i; });\n__test.assertDeepEqual(out, [1, 3, 5], \"значение и индекс\");\n__test.assertDeepEqual(src, [1, 2, 3], \"исходный цел\");"
      }
    ],
    solution: "function map(list, fn) {\n  var out = [];\n  for (var i = 0; i < list.length; i++) out.push(fn(list[i], i));\n  return out;\n}\n",
    theory: "Новый массив нужен, чтобы преобразование не портило вход. Индекс передаётся вторым аргументом: без него нельзя отличить значение от позиции. Длина результата равна длине входа, даже если fn вернула undefined.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.10",
    kind: "implement",
    level: 6,
    order: 10,
    title: "filter",
    tags: [
      "array"
    ],
    statement: "filter(list, fn) оставляет элементы, для которых fn вернула истинное значение. Индекс тоже передаётся. Исходный массив не меняется.",
    starter: "function filter(list, fn) {\n  \n}\n",
    tests: [
      {
        name: "отбор",
        code: "var src = [1, 2, 3, 4];\nvar out = filter(src, function (n) { return n % 2 === 0; });\n__test.assertDeepEqual(out, [2, 4], \"чётные\");\n__test.assertDeepEqual(src, [1, 2, 3, 4], \"исходный цел\");\n__test.assertDeepEqual(filter([10, 20, 30], function (n, i) { return i > 0; }), [20, 30], \"индекс\");"
      }
    ],
    solution: "function filter(list, fn) {\n  var out = [];\n  for (var i = 0; i < list.length; i++) {\n    if (fn(list[i], i)) out.push(list[i]);\n  }\n  return out;\n}\n",
    theory: "В результат кладётся сам элемент, а не то, что вернула fn. fn только решает, прошёл ли элемент. 0 и пустая строка в предикате — ложь, поэтому такие элементы выпадут, если предикат возвращает сам элемент вместо true.",
    updatedAt: "2026-10-11T14:10:00.000Z",
    rev: 2
  },
  {
    id: "6.11",
    kind: "implement",
    level: 6,
    order: 11,
    title: "reduce",
    tags: [
      "array"
    ],
    statement: "reduce(list, fn, initial) сворачивает список в одно значение. Если initial нет, старт — первый элемент, а пустой список без initial бросает TypeError. Пустой список с initial возвращает initial.",
    starter: "function reduce(list, fn, initial) {\n  \n}\n",
    tests: [
      {
        name: "свёртка",
        code: "function sum(a, b) { return a + b; }\n__test.assertEquals(reduce([1, 2, 3], sum, 0), 6, \"с нуля\");\n__test.assertEquals(reduce([1, 2, 3], sum), 6, \"без начального\");\n__test.assertEquals(reduce([], sum, 5), 5, \"пустое с начальным\");\n__test.expectThrow(function () { reduce([], sum); }, \"пустой без начального\");"
      }
    ],
    solution: "function reduce(list, fn, initial) {\n  var i = 0;\n  var acc;\n  if (arguments.length < 3) {\n    if (list.length === 0) throw new TypeError(\"Reduce of empty array with no initial value\");\n    acc = list[0];\n    i = 1;\n  } else {\n    acc = initial;\n  }\n  for (; i < list.length; i++) acc = fn(acc, list[i], i);\n  return acc;\n}\n",
    theory: "arguments.length отличает «начального значения нет» от «начальное значение undefined». Без этой проверки undefined нельзя передать как честный старт. Пустой список без старта не из чего начать, поэтому TypeError, а не молчаливый undefined.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.12",
    kind: "implement",
    level: 6,
    order: 12,
    title: "myCall",
    tags: [
      "this"
    ],
    statement: "myCall(fn, ctx, ...args) вызывает fn с this, равным ctx, и остальными аргументами по отдельности.",
    starter: "function myCall(fn, ctx) {\n  \n}\n",
    tests: [
      {
        name: "this и аргументы",
        code: "function f(a, b) { return this.n + a + b; }\n__test.assertEquals(myCall(f, { n: 1 }, 2, 3), 6, \"подставленный this\");"
      }
    ],
    solution: "function myCall(fn, ctx) {\n  var args = [].slice.call(arguments, 2);\n  return fn.apply(ctx, args);\n}\n",
    theory: "call отличается от обычного вызова только тем, что this задан явно. Аргументы после ctx идут по одному, поэтому их отрезают slice с индекса 2 и отдают в apply уже массивом. Сама fn не знает, что её позвали через обёртку.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.13",
    kind: "implement",
    level: 6,
    order: 13,
    title: "myApply",
    tags: [
      "this"
    ],
    statement: "myApply(fn, ctx, args) вызывает fn с this, равным ctx. args — массив аргументов, а не список по одному.",
    starter: "function myApply(fn, ctx, args) {\n  \n}\n",
    tests: [
      {
        name: "массив аргументов",
        code: "function f(a, b) { return this.n + a + b; }\n__test.assertEquals(myApply(f, { n: 1 }, [2, 3]), 6, \"из массива\");\n__test.assertEquals(myApply(function () { return this.n; }, { n: 4 }), 4, \"без массива\");"
      }
    ],
    solution: "function myApply(fn, ctx, args) {\n  return fn.apply(ctx, args || []);\n}\n",
    theory: "apply принимает аргументы одним массивом. Если массив не передали, подставляется пустой, иначе fn.apply получит undefined и упадёт. this при этом всё равно ctx: отсутствие аргументов не возвращает вызов к глобальному объекту.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.14",
    kind: "implement",
    level: 6,
    order: 14,
    title: "myBind",
    tags: [
      "this"
    ],
    statement: "myBind(fn, ctx, ...preset) возвращает новую функцию. У неё this всегда ctx, а preset стоит перед аргументами вызова. Повторный myBind снаружи не перебивает уже зафиксированный this.",
    starter: "function myBind(fn, ctx) {\n  \n}\n",
    tests: [
      {
        name: "фиксация this",
        code: "function f(a, b) { return this.n + a + b; }\nvar bound = myBind(f, { n: 10 }, 1);\n__test.assertEquals(bound(2), 13, \"частичные аргументы\");\nvar once = myBind(function () { return this.n; }, { n: 1 });\nvar twice = myBind(once, { n: 2 });\n__test.assertEquals(twice(), 1, \"повторный bind не перебивает\");"
      }
    ],
    solution: "function myBind(fn, ctx) {\n  var preset = [].slice.call(arguments, 2);\n  return function () {\n    return fn.apply(ctx, preset.concat([].slice.call(arguments)));\n  };\n}\n",
    theory: "bind не вызывает fn сразу. Он возвращает функцию, замкнутую на ctx и на уже переданные аргументы. Второй myBind оборачивает эту функцию, а не исходную: внутри первой обёртки this всё равно старый ctx, apply второй обёртки его не достаёт.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.15",
    kind: "implement",
    level: 6,
    order: 15,
    title: "promiseAllSettled",
    tags: [
      "promises"
    ],
    statement: "promiseAllSettled(list) ждёт все элементы и не падает из-за отказа. На каждое место возвращает { status: 'fulfilled', value } или { status: 'rejected', reason }. Порядок как во входе. Пустой список — пустой массив.",
    starter: "function promiseAllSettled(list) {\n  \n}\n",
    tests: [
      {
        name: "и успех, и отказ",
        code: "var empty = await promiseAllSettled([]);\n__test.assertDeepEqual(empty, [], \"пусто\");\nvar rows = await promiseAllSettled([Promise.resolve(1), Promise.reject(\"нет\")]);\n__test.assertDeepEqual(rows, [{ status: \"fulfilled\", value: 1 }, { status: \"rejected\", reason: \"нет\" }], \"оба статуса\");"
      }
    ],
    solution: "function promiseAllSettled(list) {\n  var items = [].slice.call(list);\n  return new Promise(function (resolve) {\n    var out = new Array(items.length);\n    var left = items.length;\n    if (left === 0) { resolve(out); return; }\n    items.forEach(function (item, index) {\n      Promise.resolve(item).then(function (value) {\n        out[index] = { status: \"fulfilled\", value: value };\n        left -= 1;\n        if (left === 0) resolve(out);\n      }, function (reason) {\n        out[index] = { status: \"rejected\", reason: reason };\n        left -= 1;\n        if (left === 0) resolve(out);\n      });\n    });\n  });\n}\n",
    theory: "В отличие от promiseAll, отказ здесь не reject внешнего промиса, а обычное значение со статусом. Индекс пишется в готовый массив, поэтому более быстрый элемент не сдвигает более медленный. Promise.resolve нужен, чтобы обычное число тоже стало промисом и попало в ту же ветку.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.16",
    kind: "implement",
    level: 6,
    order: 16,
    title: "promiseRace",
    tags: [
      "promises"
    ],
    statement: "promiseRace(list) возвращает результат первого завершившегося элемента, успех или отказ. Остальные игнорируются.",
    starter: "function promiseRace(list) {\n  \n}\n",
    tests: [
      {
        name: "первый финиш",
        code: "var value = await promiseRace([Promise.resolve(1), Promise.resolve(2)]);\n__test.assertEquals(value, 1, \"первый успех\");\nvar reason = null;\ntry { await promiseRace([Promise.reject(\"bad\"), Promise.resolve(2)]); }\ncatch (error) { reason = error; }\n__test.assertEquals(reason, \"bad\", \"первый отказ\");"
      }
    ],
    solution: "function promiseRace(list) {\n  return new Promise(function (resolve, reject) {\n    [].slice.call(list).forEach(function (item) {\n      Promise.resolve(item).then(resolve, reject);\n    });\n  });\n}\n",
    theory: "Гонка не отменяет остальные промисы, она просто перестаёт на них смотреть: повторный resolve у уже выполненного промиса ничего не меняет. Первый в списке, который уже завершён, ставит свою реакцию в микрозадачи раньше следующего, поэтому он и выигрывает среди уже готовых.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.17",
    kind: "implement",
    level: 6,
    order: 17,
    title: "flat",
    tags: [
      "array"
    ],
    statement: "flat(list, depth) разворачивает вложенные массивы на depth уровней. По умолчанию depth равен 1. Ноль оставляет список как есть. Не-массивы не разворачиваются.",
    starter: "function flat(list, depth) {\n  \n}\n",
    tests: [
      {
        name: "глубина",
        code: "__test.assertDeepEqual(flat([1, [2, [3]]]), [1, 2, [3]], \"один уровень\");\n__test.assertDeepEqual(flat([1, [2, [3]]], 2), [1, 2, 3], \"два уровня\");\n__test.assertDeepEqual(flat([1, [2]], 0), [1, [2]], \"ноль\");"
      }
    ],
    solution: "function flat(list, depth) {\n  if (depth === undefined) depth = 1;\n  var out = [];\n  function walk(items, left) {\n    for (var i = 0; i < items.length; i++) {\n      if (Array.isArray(items[i]) && left > 0) walk(items[i], left - 1);\n      else out.push(items[i]);\n    }\n  }\n  walk(list, depth);\n  return out;\n}\n",
    theory: "Глубина уменьшается только когда элемент сам массив и лимит ещё не кончился. Иначе элемент кладётся как есть, даже если это массив: так depth 0 и «дно» вложенности не проваливаются дальше. Новый массив собирается снаружи, вход не режется.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.18",
    kind: "implement",
    level: 6,
    order: 18,
    title: "get",
    tags: [
      "object"
    ],
    statement: "get(obj, path, fallback) читает путь вида 'a.b.c'. Если по дороге встретился null или undefined, либо конечного значения нет, верни fallback, когда он передан. 0 и пустая строка — настоящие значения, не запасной вариант.",
    starter: "function get(obj, path, fallback) {\n  \n}\n",
    tests: [
      {
        name: "путь и обрыв",
        code: "__test.assertEquals(get({ a: { b: 1 } }, \"a.b\"), 1, \"нашёлся\");\n__test.assertEquals(get({ a: null }, \"a.b\", \"нет\"), \"нет\", \"обрыв\");\n__test.assertEquals(get({ a: 0 }, \"a\", \"нет\"), 0, \"ноль живой\");\n__test.assertEquals(get({ a: undefined }, \"a\", \"нет\"), \"нет\", \"undefined\");"
      }
    ],
    solution: "function get(obj, path, fallback) {\n  var parts = String(path).split(\".\");\n  var cur = obj;\n  for (var i = 0; i < parts.length; i++) {\n    if (cur == null) return arguments.length > 2 ? fallback : undefined;\n    cur = cur[parts[i]];\n  }\n  if (cur === undefined && arguments.length > 2) return fallback;\n  return cur;\n}\n",
    theory: "Проверять надо == null, чтобы поймать и null, и undefined до чтения следующего ключа. Иначе null.b бросит TypeError. Запасной вариант отдаётся только если аргумент действительно передали: иначе честный undefined на конце пути нельзя отличить от «ключа нет».",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.19",
    kind: "implement",
    level: 6,
    order: 19,
    title: "groupBy",
    tags: [
      "object"
    ],
    statement: "groupBy(list, key) собирает объект групп. key — имя поля или функция. Ключ группы приводится к строке. Порядок элементов внутри группы как во входе.",
    starter: "function groupBy(list, key) {\n  \n}\n",
    tests: [
      {
        name: "поле и функция",
        code: "var rows = [{ t: \"a\", n: 1 }, { t: \"b\", n: 2 }, { t: \"a\", n: 3 }];\n__test.assertDeepEqual(groupBy(rows, \"t\"), { a: [{ t: \"a\", n: 1 }, { t: \"a\", n: 3 }], b: [{ t: \"b\", n: 2 }] }, \"по полю\");\nvar byParity = groupBy([1, 2, 3, 4], function (n) { return n % 2 ? \"odd\" : \"even\"; });\n__test.assertDeepEqual(byParity.even, [2, 4], \"функция\");"
      }
    ],
    solution: "function groupBy(list, key) {\n  var out = {};\n  for (var i = 0; i < list.length; i++) {\n    var item = list[i];\n    var raw = typeof key === \"function\" ? key(item) : item[key];\n    var name = String(raw);\n    if (!out[name]) out[name] = [];\n    out[name].push(item);\n  }\n  return out;\n}\n",
    theory: "Ключ объекта всегда строка, поэтому 1 и '1' попадут в одну группу. Функция нужна, когда группа считается, а не лежит готовым полем. Массив группы создаётся при первом элементе и дальше только push, поэтому порядок внутри группы совпадает с порядком входа.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.20",
    kind: "implement",
    level: 6,
    order: 20,
    title: "deepClone",
    tags: [
      "object"
    ],
    statement: "deepClone(value) копирует простые объекты, массивы и Date. Вложенные структуры не делят ссылки с оригиналом. Цикл в объекте не зацикливает копирование: копия ссылается на свою копию.",
    starter: "function deepClone(value) {\n  \n}\n",
    tests: [
      {
        name: "копия без общих ссылок",
        code: "var src = { n: 1, list: [2], when: new Date(\"2020-01-01T00:00:00.000Z\") };\nvar copy = deepClone(src);\ncopy.n = 9;\ncopy.list.push(3);\n__test.assertEquals(src.n, 1, \"число\");\n__test.assertDeepEqual(src.list, [2], \"массив\");\n__test.assertEquals(copy.when !== src.when && copy.when.getTime() === src.when.getTime(), true, \"дата\");\nvar loop = { name: \"a\" };\nloop.self = loop;\nvar cloned = deepClone(loop);\n__test.assertEquals(cloned !== loop && cloned.self === cloned, true, \"цикл\");"
      }
    ],
    solution: "function deepClone(value, seen) {\n  if (value === null || typeof value !== \"object\") return value;\n  if (!seen) seen = new WeakMap();\n  if (seen.has(value)) return seen.get(value);\n  if (Object.prototype.toString.call(value) === \"[object Date]\") return new Date(value.getTime());\n  var out = Array.isArray(value) ? [] : {};\n  seen.set(value, out);\n  if (Array.isArray(value)) {\n    for (var i = 0; i < value.length; i++) out.push(deepClone(value[i], seen));\n    return out;\n  }\n  var keys = Object.keys(value);\n  for (var k = 0; k < keys.length; k++) out[keys[k]] = deepClone(value[keys[k]], seen);\n  return out;\n}\n",
    theory: "Поверхностного копирования мало: вложенный массив остался бы общим, и push в копии испортил бы оригинал. Date — объект, но его нельзя копировать как набор ключей, у него забирают время. WeakMap запоминает уже созданную копию, поэтому цикл self возвращает её, а не уходит в бесконечный обход.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.21",
    kind: "implement",
    level: 6,
    order: 21,
    title: "deepEqual",
    tags: [
      "object"
    ],
    statement: "deepEqual(a, b) сравнивает значения по содержимому. NaN равен NaN. 0 и -0 не равны. Лишний ключ делает объекты разными. Date сравниваются по времени. Цикл не приводит к бесконечному обходу.",
    starter: "function deepEqual(a, b) {\n  \n}\n",
    tests: [
      {
        name: "структура",
        code: "__test.assertEquals(deepEqual({ a: 1, b: [NaN] }, { a: 1, b: [NaN] }), true, \"NaN\");\n__test.assertEquals(deepEqual(0, -0), false, \"знак нуля\");\n__test.assertEquals(deepEqual({ a: 1 }, { a: 1, c: 2 }), false, \"лишний ключ\");\n__test.assertEquals(deepEqual(new Date(\"2020-01-01T00:00:00.000Z\"), new Date(\"2020-01-01T00:00:00.000Z\")), true, \"даты\");\nvar left = { n: 1 };\nleft.self = left;\nvar right = { n: 1 };\nright.self = right;\n__test.assertEquals(deepEqual(left, right), true, \"цикл\");"
      }
    ],
    solution: "function deepEqual(a, b, seen) {\n  if (Object.is(a, b)) return true;\n  if (typeof a !== \"object\" || typeof b !== \"object\" || a === null || b === null) return false;\n  if (!seen) seen = new WeakMap();\n  if (seen.get(a) === b) return true;\n  seen.set(a, b);\n  var tagA = Object.prototype.toString.call(a);\n  var tagB = Object.prototype.toString.call(b);\n  if (tagA !== tagB) return false;\n  if (tagA === \"[object Date]\") return a.getTime() === b.getTime();\n  if (Array.isArray(a)) {\n    if (a.length !== b.length) return false;\n    for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i], seen)) return false;\n    return true;\n  }\n  var keys = Object.keys(a);\n  if (keys.length !== Object.keys(b).length) return false;\n  for (var k = 0; k < keys.length; k++) {\n    if (!Object.prototype.hasOwnProperty.call(b, keys[k])) return false;\n    if (!deepEqual(a[keys[k]], b[keys[k]], seen)) return false;\n  }\n  return true;\n}\n",
    theory: "Object.is отличает NaN от себя обычным === и не считает 0 равным -0. Дальше сравниваются только объекты одного вида: дата по getTime, массив по длине и элементам, обычный объект по собственным ключам. WeakMap помнит пару уже виденных ссылок, иначе цикл self никогда не закончится.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.22",
    kind: "implement",
    level: 6,
    order: 22,
    title: "EventEmitter",
    tags: [
      "events"
    ],
    statement: "Сделай EventEmitter с on, off, once и emit. on подписывает, off снимает именно эту функцию, once срабатывает один раз, emit вызывает подписчиков с аргументами. Снятие подписки во время emit не ломает уже начатый проход.",
    starter: "function EventEmitter() {\n  \n}\n",
    tests: [
      {
        name: "подписка",
        code: "var e = new EventEmitter();\nvar n = 0;\nfunction add(x) { n += x; }\ne.on(\"a\", add);\ne.once(\"a\", function () { n += 10; });\ne.emit(\"a\", 1);\ne.emit(\"a\", 1);\n__test.assertEquals(n, 12, \"on и once\");\ne.off(\"a\", add);\ne.emit(\"a\", 5);\n__test.assertEquals(n, 12, \"off\");"
      }
    ],
    solution: "function EventEmitter() {\n  this.events = {};\n}\nEventEmitter.prototype.on = function (name, fn) {\n  if (!this.events[name]) this.events[name] = [];\n  this.events[name].push(fn);\n  return this;\n};\nEventEmitter.prototype.off = function (name, fn) {\n  var list = this.events[name] || [];\n  this.events[name] = list.filter(function (item) { return item !== fn; });\n  return this;\n};\nEventEmitter.prototype.once = function (name, fn) {\n  var self = this;\n  function wrap() {\n    self.off(name, wrap);\n    return fn.apply(this, arguments);\n  }\n  return this.on(name, wrap);\n};\nEventEmitter.prototype.emit = function (name) {\n  var args = [].slice.call(arguments, 1);\n  var list = (this.events[name] || []).slice();\n  for (var i = 0; i < list.length; i++) list[i].apply(this, args);\n  return this;\n};\n",
    theory: "Список подписчиков лежит на экземпляре, не в глобальной переменной. once — это on с обёрткой, которая снимает саму себя перед пользовательским вызовом. emit копирует массив через slice: если обработчик позовёт off, проход идёт по копии и не пропускает соседа.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.23",
    kind: "implement",
    level: 6,
    order: 23,
    title: "retry",
    tags: [
      "promises"
    ],
    statement: "retry(fn, times) вызывает fn до times раз. Первая удача возвращает её значение. Если все попытки бросили ошибку, наружу уходит последняя. times — это число попыток, не число повторов после первой.",
    starter: "function retry(fn, times) {\n  \n}\n",
    tests: [
      {
        name: "попытки",
        code: "var n = 0;\nvar value = await retry(function () {\n  n += 1;\n  if (n < 3) throw new Error(\"нет\");\n  return \"ok\";\n}, 3);\n__test.assertEquals(value, \"ok\", \"третья удалась\");\n__test.assertEquals(n, 3, \"ровно три\");\nvar failed = false;\ntry { await retry(function () { throw new Error(\"x\"); }, 2); }\ncatch (error) { failed = error instanceof Error; }\n__test.assertEquals(failed, true, \"лимит\");"
      }
    ],
    solution: "function retry(fn, times) {\n  function attempt(left) {\n    return Promise.resolve().then(fn).catch(function (error) {\n      if (left <= 1) throw error;\n      return attempt(left - 1);\n    });\n  }\n  return attempt(times);\n}\n",
    theory: "Promise.resolve().then(fn) превращает и синхронный throw, и возвращённый промис в одну цепочку. catch либо пробрасывает последнюю ошибку, либо зовёт следующую попытку. Счётчик уменьшается после неудачи, поэтому times: 3 — это три входа в fn, а не три дополнительных.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.24",
    kind: "implement",
    level: 6,
    order: 24,
    title: "pool",
    tags: [
      "promises"
    ],
    statement: "pool(limit, tasks) запускает задачи-функции, которые возвращают промис. Одновременно выполняется не больше limit штук. Результат — массив в порядке tasks, не в порядке завершения. Пустой список — пустой массив.",
    starter: "function pool(limit, tasks) {\n  \n}\n",
    tests: [
      {
        name: "лимит и порядок",
        code: "var running = 0;\nvar max = 0;\nfunction make(v) {\n  return function () {\n    running += 1;\n    if (running > max) max = running;\n    return Promise.resolve(v).then(function (value) {\n      running -= 1;\n      return value;\n    });\n  };\n}\nvar values = await pool(2, [make(1), make(2), make(3), make(4)]);\n__test.assertDeepEqual(values, [1, 2, 3, 4], \"порядок\");\n__test.assertEquals(max, 2, \"не больше двух\");\nvar empty = await pool(2, []);\n__test.assertDeepEqual(empty, [], \"пусто\");"
      }
    ],
    solution: "function pool(limit, tasks) {\n  var results = new Array(tasks.length);\n  var next = 0;\n  var running = 0;\n  return new Promise(function (resolve, reject) {\n    if (tasks.length === 0) { resolve(results); return; }\n    var failed = false;\n    function launch() {\n      if (failed) return;\n      if (next >= tasks.length && running === 0) { resolve(results); return; }\n      while (running < limit && next < tasks.length) {\n        (function (index) {\n          running += 1;\n          Promise.resolve().then(tasks[index]).then(function (value) {\n            results[index] = value;\n            running -= 1;\n            launch();\n          }, function (error) {\n            failed = true;\n            reject(error);\n          });\n        })(next);\n        next += 1;\n      }\n    }\n    launch();\n  });\n}\n",
    theory: "Индекс задачи закрывается в своей функции: var внутри цикла был бы один на всех, и все результаты записались бы в последнюю ячейку. running не даёт запустить больше limit, а когда слот освобождается, launch берёт следующую. Массив results заполняется по индексу, поэтому быстрая четвёртая задача не обгоняет медленную первую.",
    updatedAt: "2026-10-11T10:50:00.000Z",
    rev: 1
  },
  {
    id: "6.25",
    kind: "implement",
    level: 6,
    order: 25,
    title: "uniq",
    tags: [
      "array"
    ],
    statement: "uniq(list) возвращает новый массив без повторов, сохраняя порядок первого появления. Сравнение как у includes: 1 и '1' — разные значения, а NaN считается повтором самого себя. Исходный массив не меняется.",
    starter: "function uniq(list) {\n  \n}\n",
    tests: [
      {
        name: "повторы",
        code: "var src = [1, 2, 1, 3, 2, 1];\n__test.assertDeepEqual(uniq(src), [1, 2, 3], \"порядок первого появления\");\n__test.assertEquals(uniq([1, \"1\", 1]).length, 2, \"число и строка разные\");\n__test.assertDeepEqual(uniq([NaN, NaN, 1]), [NaN, 1], \"NaN схлопывается\");\n__test.assertDeepEqual(src, [1, 2, 1, 3, 2, 1], \"исходный цел\");"
      }
    ],
    solution: "function uniq(list) {\n  var out = [];\n  for (var i = 0; i < list.length; i++) {\n    var value = list[i];\n    var seen = false;\n    for (var j = 0; j < out.length; j++) {\n      if (out[j] === value || (out[j] !== out[j] && value !== value)) { seen = true; break; }\n    }\n    if (!seen) out.push(value);\n  }\n  return out;\n}\n",
    theory: "Проверять повтор через indexOf мало: indexOf(NaN) всегда -1, и NaN попадал бы в результат сколько угодно раз. Поэтому сравнение идёт вручную — строгое === плюс отдельное правило x !== x для NaN. Собираем в новый массив, так что вход не портится, а порядок задаёт именно первое появление элемента.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.26",
    kind: "implement",
    level: 6,
    order: 26,
    title: "chunk",
    tags: [
      "array"
    ],
    statement: "chunk(list, size) режет список на группы по size элементов. Последняя группа может быть короче. Пустой список даёт пустой массив, а size меньше единицы — RangeError.",
    starter: "function chunk(list, size) {\n  \n}\n",
    tests: [
      {
        name: "нарезка",
        code: "__test.assertDeepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]], \"хвост короче\");\n__test.assertDeepEqual(chunk([1, 2], 5), [[1, 2]], \"size больше длины\");\n__test.assertDeepEqual(chunk([], 3), [], \"пусто\");\n__test.expectThrow(function () { chunk([1, 2], 0); }, \"size меньше единицы\");"
      }
    ],
    solution: "function chunk(list, size) {\n  if (size < 1) throw new RangeError(\"size must be at least 1\");\n  var out = [];\n  for (var i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));\n  return out;\n}\n",
    theory: "Шаг цикла равен size, а slice сам аккуратно обрежет последний кусок: если элементов осталось меньше, он вернёт что есть. Отдельная ветка «добить хвост» не нужна. RangeError на size < 1 выбран специально: цикл с нулевым шагом никогда не закончится, лучше упасть сразу.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.27",
    kind: "implement",
    level: 6,
    order: 27,
    title: "flattenDeep",
    tags: [
      "array"
    ],
    statement: "flattenDeep(list) разворачивает вложенные массивы на всех уровнях и возвращает плоский массив. Всё, что не массив, попадает в результат как есть — включая null и строки. Пустой список даёт пустой массив.",
    starter: "function flattenDeep(list) {\n  \n}\n",
    tests: [
      {
        name: "до дна",
        code: "__test.assertDeepEqual(flattenDeep([1, [2, [3, [4]]]]), [1, 2, 3, 4], \"все уровни\");\n__test.assertDeepEqual(flattenDeep([[1], [2, [3]]]), [1, 2, 3], \"ветки разной глубины\");\n__test.assertDeepEqual(flattenDeep([1, \"a\", null]), [1, \"a\", null], \"не массивы как есть\");\n__test.assertDeepEqual(flattenDeep([]), [], \"пусто\");"
      }
    ],
    solution: "function flattenDeep(list) {\n  var out = [];\n  for (var i = 0; i < list.length; i++) {\n    if (Array.isArray(list[i])) {\n      var inner = flattenDeep(list[i]);\n      for (var j = 0; j < inner.length; j++) out.push(inner[j]);\n    } else {\n      out.push(list[i]);\n    }\n  }\n  return out;\n}\n",
    theory: "Рекурсия идёт только по массивам, всё остальное кладётся в результат как есть — поэтому null и строка не превращаются в пустоту. В отличие от flat(list, depth), здесь нет лимита: каждый вложенный массив разворачивается до конца, а глубина задаётся самими данными, а не аргументом.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.28",
    kind: "implement",
    level: 6,
    order: 28,
    title: "zip",
    tags: [
      "array"
    ],
    statement: "zip(left, right) склеивает два массива в массив пар: [[left[0], right[0]], [left[1], right[1]] и так далее]. Длина результата — по короткому массиву, лишние элементы отбрасываются. Пустой вход даёт пустой массив.",
    starter: "function zip(left, right) {\n  \n}\n",
    tests: [
      {
        name: "пары",
        code: "__test.assertDeepEqual(zip([1, 2, 3], [\"a\", \"b\"]), [[1, \"a\"], [2, \"b\"]], \"по короткому\");\n__test.assertDeepEqual(zip([1], [2, 3]), [[1, 2]], \"лишнее справа отброшено\");\n__test.assertDeepEqual(zip([], [1]), [], \"пусто\");"
      }
    ],
    solution: "function zip(left, right) {\n  var out = [];\n  var size = Math.min(left.length, right.length);\n  for (var i = 0; i < size; i++) out.push([left[i], right[i]]);\n  return out;\n}\n",
    theory: "Длину задаёт меньший массив: Math.min защищает от undefined в парах и от лишнего прохода. Пара создаётся новым литералом на каждой итерации, поэтому пары независимы: правка одной не заденет соседнюю.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.29",
    kind: "implement",
    level: 6,
    order: 29,
    title: "partition",
    tags: [
      "array"
    ],
    statement: "partition(list, fn) делит список на две группы и возвращает пару [прошли, не прошли]. fn получает элемент и индекс, её результат приводится к булеву. Порядок внутри групп как во входе, исходный массив не меняется.",
    starter: "function partition(list, fn) {\n  \n}\n",
    tests: [
      {
        name: "две группы",
        code: "var src = [1, 2, 3, 4];\nvar parts = partition(src, function (n) { return n % 2 === 0; });\n__test.assertDeepEqual(parts[0], [2, 4], \"прошли\");\n__test.assertDeepEqual(parts[1], [1, 3], \"не прошли\");\n__test.assertDeepEqual(src, [1, 2, 3, 4], \"исходный цел\");\n__test.assertDeepEqual(partition([\"a\", \"b\", \"c\"], function (s, i) { return i !== 1; }), [[\"a\", \"c\"], [\"b\"]], \"индекс в предикате\");"
      }
    ],
    solution: "function partition(list, fn) {\n  var yes = [];\n  var no = [];\n  for (var i = 0; i < list.length; i++) {\n    if (fn(list[i], i)) yes.push(list[i]);\n    else no.push(list[i]);\n  }\n  return [yes, no];\n}\n",
    theory: "Один проход раскладывает элементы по двум массивам-накопителям, поэтому порядок внутри каждой группы совпадает с порядком входа. Индекс передаётся вторым аргументом — без него предикат не сможет опереться на позицию. Элемент кладётся в группу как есть, предикат только решает, в какую.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.30",
    kind: "implement",
    level: 6,
    order: 30,
    title: "compact",
    tags: [
      "array"
    ],
    statement: "compact(list) выбрасывает ложные значения: false, null, undefined, 0, пустую строку и NaN. Возвращает новый массив, порядок остальных элементов сохраняется, исходный массив не меняется.",
    starter: "function compact(list) {\n  \n}\n",
    tests: [
      {
        name: "ложь долой",
        code: "__test.assertDeepEqual(compact([0, 1, false, 2, \"\", 3, null, undefined, NaN]), [1, 2, 3], \"осталось живое\");\n__test.assertDeepEqual(compact([\"a\", \"b\"]), [\"a\", \"b\"], \"всё живое\");\nvar src = [0, 1];\ncompact(src);\n__test.assertDeepEqual(src, [0, 1], \"исходный цел\");"
      }
    ],
    solution: "function compact(list) {\n  var out = [];\n  for (var i = 0; i < list.length; i++) {\n    if (list[i]) out.push(list[i]);\n  }\n  return out;\n}\n",
    theory: "Проверка if (list[i]) отсеивает всё ложное разом: 0, пустую строку, null, undefined, false и NaN. Отдельный список исключений не нужен и легко забывается. При этом объекты, непустые строки и отрицательные числа истинны, поэтому они остаются в результате.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.31",
    kind: "implement",
    level: 6,
    order: 31,
    title: "pick",
    tags: [
      "object"
    ],
    statement: "pick(obj, keys) возвращает новый объект только с перечисленными ключами. Ключи, которых в объекте нет, молча пропускаются. Унаследованное из прототипа не переезжает — берутся только собственные свойства.",
    starter: "function pick(obj, keys) {\n  \n}\n",
    tests: [
      {
        name: "выборка полей",
        code: "var src = { a: 1, b: 2, c: 3 };\nvar out = pick(src, [\"a\", \"c\"]);\n__test.assertDeepEqual(out, { a: 1, c: 3 }, \"только выбранное\");\nout.a = 99;\n__test.assertEquals(src.a, 1, \"оригинал не тронут\");\n__test.assertDeepEqual(pick(src, [\"a\", \"нет\"]), { a: 1 }, \"лишний ключ пропущен\");\nvar child = Object.create({ inherited: 1 });\nchild.own = 2;\n__test.assertDeepEqual(pick(child, [\"inherited\", \"own\"]), { own: 2 }, \"только собственные\");"
      }
    ],
    solution: "function pick(obj, keys) {\n  var out = {};\n  for (var i = 0; i < keys.length; i++) {\n    var key = keys[i];\n    if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];\n  }\n  return out;\n}\n",
    theory: "hasOwnProperty отделяет собственные поля от унаследованных: без него в результат просочилось бы свойство из прототипа. Идём по списку keys, поэтому порядок ключей в результате задаёт вызывающий, а не исходный объект. Сам объект новый, но значения копируются по ссылке — глубокая копия здесь не обещана.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.32",
    kind: "implement",
    level: 6,
    order: 32,
    title: "omit",
    tags: [
      "object"
    ],
    statement: "omit(obj, keys) возвращает копию объекта без перечисленных ключей. Ключи, которых в объекте нет, игнорируются. Остальные собственные свойства переезжают в том же порядке.",
    starter: "function omit(obj, keys) {\n  \n}\n",
    tests: [
      {
        name: "минус ключи",
        code: "var src = { a: 1, b: 2, c: 3 };\n__test.assertDeepEqual(omit(src, [\"b\"]), { a: 1, c: 3 }, \"минус один\");\n__test.assertDeepEqual(omit(src, [\"нет\"]), { a: 1, b: 2, c: 3 }, \"нечего убирать\");\n__test.assertDeepEqual(omit(src, [\"a\", \"b\", \"c\"]), {}, \"убрали всё\");\n__test.assertDeepEqual(src, { a: 1, b: 2, c: 3 }, \"исходный цел\");"
      }
    ],
    solution: "function omit(obj, keys) {\n  var out = {};\n  var all = Object.keys(obj);\n  for (var i = 0; i < all.length; i++) {\n    var key = all[i];\n    if (keys.indexOf(key) === -1) out[key] = obj[key];\n  }\n  return out;\n}\n",
    theory: "Здесь удобнее идти по ключам объекта, а не по списку исключений: так сохраняется исходный порядок полей, а Object.keys сразу отдаёт только собственные ключи — hasOwnProperty не нужен. Для проверки исключения хватает indexOf по короткому списку. Отсутствующий в объекте ключ просто ни на что не влияет.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.33",
    kind: "implement",
    level: 6,
    order: 33,
    title: "isEmpty",
    tags: [
      "object"
    ],
    statement: "isEmpty(value) отвечает, пусто ли значение. Пусто — это null, undefined, пустая строка, пустой массив и объект без собственных ключей. Числа и булевы пустыми не считаются: isEmpty(0) и isEmpty(false) дают false.",
    starter: "function isEmpty(value) {\n  \n}\n",
    tests: [
      {
        name: "что считать пустым",
        code: "__test.assertEquals(isEmpty({}), true, \"пустой объект\");\n__test.assertEquals(isEmpty({ a: 1 }), false, \"объект с полем\");\n__test.assertEquals(isEmpty([]), true, \"пустой массив\");\n__test.assertEquals(isEmpty([0]), false, \"массив с нулём\");\n__test.assertEquals(isEmpty(null), true, \"null\");\n__test.assertEquals(isEmpty(undefined), true, \"undefined\");\n__test.assertEquals(isEmpty(\"\"), true, \"пустая строка\");\n__test.assertEquals(isEmpty(\" \"), false, \"пробел не пусто\");\n__test.assertEquals(isEmpty(0) || isEmpty(false), false, \"числа и булевы не пусты\");"
      }
    ],
    solution: "function isEmpty(value) {\n  if (value == null) return true;\n  if (typeof value === \"string\" || Array.isArray(value)) return value.length === 0;\n  if (typeof value === \"object\") return Object.keys(value).length === 0;\n  return false;\n}\n",
    theory: "Проверка == null одним махом ловит и null, и undefined. Дальше важно не спутать «нет ключей» с «нет значения»: длина нужна строкам и массивам, Object.keys — обычным объектам, а числа и булевы под последнее правило не подпадают и остаются непустыми. Порядок ветвей важен: массив — тоже object, поэтому Array.isArray проверяется раньше.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.34",
    kind: "implement",
    level: 6,
    order: 34,
    title: "mergeDeep",
    tags: [
      "object"
    ],
    statement: "mergeDeep(target, source) глубоко сливает два объекта и возвращает новый. Если по одному ключу в обоих лежат обычные объекты — они сливаются рекурсивно. Всё остальное, включая массивы, source перекрывает целиком. target и source не меняются, общих ссылок с результатом нет.",
    starter: "function mergeDeep(target, source) {\n  \n}\n",
    tests: [
      {
        name: "глубокий merge",
        code: "var target = { a: { b: 1, c: 2 }, list: [1, 2] };\nvar source = { a: { c: 3, d: 4 }, list: [3] };\nvar out = mergeDeep(target, source);\n__test.assertEquals(out.a.b, 1, \"старое поле на месте\");\n__test.assertEquals(out.a.c, 3, \"перекрыто\");\n__test.assertEquals(out.a.d, 4, \"добавлено\");\n__test.assertDeepEqual(out.list, [3], \"массив заменён целиком\");\nout.a.b = 99;\nout.list.push(4);\n__test.assertEquals(target.a.b, 1, \"вложенный объект не общий\");\n__test.assertDeepEqual(target.list, [1, 2], \"массив не общий\");"
      }
    ],
    solution: "function mergeDeep(target, source) {\n  function isPlain(value) {\n    return value !== null && typeof value === \"object\" && !Array.isArray(value);\n  }\n  var out = {};\n  var i;\n  var key;\n  var keys = Object.keys(target);\n  for (i = 0; i < keys.length; i++) {\n    key = keys[i];\n    out[key] = isPlain(target[key]) ? mergeDeep(target[key], {}) : target[key];\n  }\n  keys = Object.keys(source);\n  for (i = 0; i < keys.length; i++) {\n    key = keys[i];\n    if (isPlain(source[key]) && isPlain(out[key])) out[key] = mergeDeep(out[key], source[key]);\n    else if (isPlain(source[key])) out[key] = mergeDeep({}, source[key]);\n    else out[key] = source[key];\n  }\n  return out;\n}\n",
    theory: "Ключи собираются в два прохода: сначала копия target, потом накатка source. Вложенные объекты не переезжают по ссылке, а пересобираются рекурсивно — иначе правка результата испортила бы оригинал. Массив формально тоже объект, но сливать его поэлементно не принято: он перекрывается целиком, поэтому Array.isArray вынесен в отдельную проверку.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.35",
    kind: "implement",
    level: 6,
    order: 35,
    title: "promiseAny",
    tags: [
      "promises"
    ],
    statement: "promiseAny(list) ждёт первый успех и игнорирует отказы. Обычные значения считаются готовыми. Если упали все, промис отклоняется с Error, у которого в поле errors лежит массив причин в порядке входа. Пустой список сразу отклоняется с пустым errors.",
    starter: "function promiseAny(list) {\n  \n}\n",
    tests: [
      {
        name: "первый успех и общий провал",
        code: "var bad1 = Promise.reject(\"a\");\nbad1.catch(function () {});\nvar bad2 = Promise.reject(\"b\");\nbad2.catch(function () {});\n__test.assertEquals(await promiseAny([bad1, Promise.resolve(2), bad2]), 2, \"первый успех\");\nvar failed = null;\ntry { await promiseAny([bad1, bad2]); } catch (error) { failed = error; }\n__test.assertEquals(failed instanceof Error, true, \"это ошибка\");\n__test.assertDeepEqual(failed.errors, [\"a\", \"b\"], \"причины в порядке входа\");\nvar empty = null;\ntry { await promiseAny([]); } catch (error) { empty = error; }\n__test.assertDeepEqual(empty.errors, [], \"пустой вход тоже отказ\");"
      }
    ],
    solution: "function promiseAny(list) {\n  var items = [].slice.call(list);\n  return new Promise(function (resolve, reject) {\n    var reasons = new Array(items.length);\n    if (items.length === 0) {\n      var empty = new Error(\"All promises were rejected\");\n      empty.errors = [];\n      reject(empty);\n      return;\n    }\n    var left = items.length;\n    items.forEach(function (item, index) {\n      Promise.resolve(item).then(resolve, function (reason) {\n        reasons[index] = reason;\n        left -= 1;\n        if (left === 0) {\n          var error = new Error(\"All promises were rejected\");\n          error.errors = reasons;\n          reject(error);\n        }\n      });\n    });\n  });\n}\n",
    theory: "Успех разрешает внешний промис, а отказы копятся по индексам: только когда счётчик дошёл до нуля, становится ясно, что удачи не будет. Порядок причин задаёт индекс, а не момент отказа, поэтому медленный первый элемент не уедет в конец. Пустой список — вырожденный случай: успеха не будет никогда, значит отказ наступает сразу.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.36",
    kind: "implement",
    level: 6,
    order: 36,
    title: "withTimeout",
    tags: [
      "promises"
    ],
    statement: "withTimeout(promise, ms) даёт исходному промису ms миллисекунд. Успел — наружу уходит его значение, не успел — отказ с Error и message 'timeout'. Отказ самого промиса проходит наружу как есть.",
    starter: "function withTimeout(promise, ms) {\n  \n}\n",
    tests: [
      {
        name: "успел и не успел",
        code: "var value = await withTimeout(new Promise(function (resolve) {\n  setTimeout(function () { resolve(\"ok\"); }, 10);\n}), 50);\n__test.assertEquals(value, \"ok\", \"успел\");\nvar message = \"\";\ntry { await withTimeout(new Promise(function () {}), 10); } catch (error) { message = error.message; }\n__test.assertEquals(message, \"timeout\", \"не успел\");\nvar bad = Promise.reject(\"плохо\");\nbad.catch(function () {});\nvar reason = \"\";\ntry { await withTimeout(bad, 50); } catch (error) { reason = error; }\n__test.assertEquals(reason, \"плохо\", \"отказ проходит как есть\");"
      }
    ],
    solution: "function withTimeout(promise, ms) {\n  return new Promise(function (resolve, reject) {\n    var timer = setTimeout(function () {\n      reject(new Error(\"timeout\"));\n    }, ms);\n    Promise.resolve(promise).then(function (value) {\n      clearTimeout(timer);\n      resolve(value);\n    }, function (error) {\n      clearTimeout(timer);\n      reject(error);\n    });\n  });\n}\n",
    theory: "Это гонка двух источников: таймера и исходного промиса. Кто первый — тот и решает, второй вызов resolve или reject уже ничего не меняет. clearTimeout в обеих ветках обязателен: без него таймер висел бы до конца и держал лишнюю работу, а в Node — ещё и процесс.",
    waitMs: 80,
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.37",
    kind: "implement",
    level: 6,
    order: 37,
    title: "promiseAllLimit",
    tags: [
      "promises"
    ],
    statement: "promiseAllLimit(list, limit) запускает задачи из list — это функции без аргументов, каждая возвращает промис — так, чтобы одновременно работало не больше limit штук. Результат — массив значений в порядке list. Пустой список даёт пустой массив, limit меньше единицы — RangeError.",
    starter: "function promiseAllLimit(list, limit) {\n  \n}\n",
    tests: [
      {
        name: "ограничение и порядок",
        code: "var started = [];\nvar running = 0;\nvar max = 0;\nfunction task(value, delay) {\n  return function () {\n    running += 1;\n    if (running > max) max = running;\n    started.push(value);\n    return new Promise(function (resolve) {\n      setTimeout(function () { running -= 1; resolve(value * 10); }, delay);\n    });\n  };\n}\nvar values = await promiseAllLimit([task(1, 10), task(2, 1), task(3, 1)], 1);\n__test.assertDeepEqual(values, [10, 20, 30], \"порядок входа\");\n__test.assertEquals(max, 1, \"одновременно только одна задача\");\n__test.assertDeepEqual(started, [1, 2, 3], \"по порядку и без пропусков\");\nvar fast = await promiseAllLimit([task(4, 10), task(5, 1)], 2);\n__test.assertDeepEqual(fast, [40, 50], \"быстрый не обгоняет в результате\");\n__test.assertDeepEqual(await promiseAllLimit([], 2), [], \"пусто\");\n__test.expectThrow(function () { promiseAllLimit([], 0); }, \"limit меньше единицы\");"
      }
    ],
    solution: "function promiseAllLimit(list, limit) {\n  var tasks = [].slice.call(list);\n  if (limit < 1) throw new RangeError(\"limit must be at least 1\");\n  var results = new Array(tasks.length);\n  var next = 0;\n  var running = 0;\n  return new Promise(function (resolve, reject) {\n    if (tasks.length === 0) { resolve(results); return; }\n    var stopped = false;\n    function launch() {\n      if (stopped) return;\n      if (next >= tasks.length && running === 0) { resolve(results); return; }\n      while (running < limit && next < tasks.length) {\n        (function (index) {\n          running += 1;\n          Promise.resolve().then(tasks[index]).then(function (value) {\n            results[index] = value;\n            running -= 1;\n            launch();\n          }, function (error) {\n            stopped = true;\n            reject(error);\n          });\n        })(next);\n        next += 1;\n      }\n    }\n    launch();\n  });\n}\n",
    theory: "Задачи — это функции, а не готовые промисы: готовый промис уже стартовал, и ограничивать было бы нечего. Счётчик running держит не больше limit одновременных запусков, а освободившийся слот тут же занимает следующая задача. Результат пишется по индексу, поэтому порядок значений не зависит от того, кто финишировал первым.",
    waitMs: 80,
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.38",
    kind: "implement",
    level: 6,
    order: 38,
    title: "mapLimit",
    tags: [
      "promises"
    ],
    statement: "mapLimit(list, limit, fn) применяет fn к элементам списка, держа не больше limit одновременных вызовов. fn получает элемент и индекс и возвращает промис. Результат — массив в порядке list, первая ошибка отклоняет весь промис. limit меньше единицы — RangeError.",
    starter: "function mapLimit(list, limit, fn) {\n  \n}\n",
    tests: [
      {
        name: "лимит, индекс, ошибка",
        code: "var running = 0;\nvar max = 0;\nfunction slow(n) {\n  running += 1;\n  if (running > max) max = running;\n  return new Promise(function (resolve) {\n    setTimeout(function () { running -= 1; resolve(n * 2); }, 5);\n  });\n}\n__test.assertDeepEqual(await mapLimit([1, 2, 3, 4, 5], 2, slow), [2, 4, 6, 8, 10], \"порядок как во входе\");\n__test.assertEquals(max, 2, \"не больше двух сразу\");\n__test.assertDeepEqual(await mapLimit([10, 20], 1, function (n, i) { return Promise.resolve(n + i); }), [10, 21], \"индекс передан\");\n__test.assertDeepEqual(await mapLimit([], 3, slow), [], \"пусто\");\nvar message = \"\";\ntry {\n  await mapLimit([1, 2, 3], 1, function (n) {\n    if (n === 2) throw new Error(\"двойка\");\n    return Promise.resolve(n);\n  });\n} catch (error) { message = error.message; }\n__test.assertEquals(message, \"двойка\", \"первая ошибка наружу\");"
      }
    ],
    solution: "function mapLimit(list, limit, fn) {\n  var items = [].slice.call(list);\n  if (limit < 1) throw new RangeError(\"limit must be at least 1\");\n  var results = new Array(items.length);\n  var next = 0;\n  var running = 0;\n  return new Promise(function (resolve, reject) {\n    if (items.length === 0) { resolve(results); return; }\n    var stopped = false;\n    function launch() {\n      if (stopped) return;\n      if (next >= items.length && running === 0) { resolve(results); return; }\n      while (running < limit && next < items.length) {\n        (function (index) {\n          running += 1;\n          Promise.resolve().then(function () { return fn(items[index], index); }).then(function (value) {\n            results[index] = value;\n            running -= 1;\n            launch();\n          }, function (error) {\n            stopped = true;\n            reject(error);\n          });\n        })(next);\n        next += 1;\n      }\n    }\n    launch();\n  });\n}\n",
    theory: "Машина та же, что у pool: счётчик running и очередь next. Отличие в том, что наружу торчит не список задач, а данные и функция — вызывающему не нужно самому заворачивать каждый элемент в функцию. Результат кладётся по индексу, иначе быстрый последний элемент обогнал бы медленный первый. Ошибка не ждёт остальных: reject сразу, а флаг stopped не даёт запускать новые задачи.",
    waitMs: 80,
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.39",
    kind: "implement",
    level: 6,
    order: 39,
    title: "sequence",
    tags: [
      "promises"
    ],
    statement: "sequence(tasks, start) вызывает задачи по очереди: результат каждой уходит в следующую, первая получает start. Возвращает промис с итогом цепочки. Пустой список — промис со start. Ошибка останавливает цепочку, следующие задачи не запускаются.",
    starter: "function sequence(tasks, start) {\n  \n}\n",
    tests: [
      {
        name: "цепочка",
        code: "var order = [];\nvar result = await sequence([\n  function (n) { order.push(\"a\"); return n + 1; },\n  function (n) { order.push(\"b\"); return Promise.resolve(n * 2); },\n  function (n) { order.push(\"c\"); return n - 3; }\n], 1);\n__test.assertEquals(result, 1, \"1 → 2 → 4 → 1\");\n__test.assertDeepEqual(order, [\"a\", \"b\", \"c\"], \"строго по очереди\");\n__test.assertEquals(await sequence([], 5), 5, \"пусто\");\nvar ran = 0;\nvar caught = false;\ntry {\n  await sequence([\n    function () { ran += 1; throw new Error(\"стоп\"); },\n    function () { ran += 1; }\n  ]);\n} catch (error) { caught = true; }\n__test.assertEquals(caught, true, \"ошибка наружу\");\n__test.assertEquals(ran, 1, \"после ошибки не идём\");"
      }
    ],
    solution: "function sequence(tasks, start) {\n  var list = [].slice.call(tasks);\n  var chain = Promise.resolve(start);\n  for (var i = 0; i < list.length; i++) {\n    (function (task) {\n      chain = chain.then(function (value) { return task(value); });\n    })(list[i]);\n  }\n  return chain;\n}\n",
    theory: "Цепочка собирается заранее из then: каждая следующая задача подписана на предыдущую, но вызывается только после её результата. Поэтому синхронный throw внутри задачи превращается в отказ промиса, а не в обрыв программы, и цепочка просто останавливается. Без start первая задача получит undefined — явный аргумент и его отсутствие тут не различаются, потому что начальное значение всё равно одно.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.40",
    kind: "implement",
    level: 6,
    order: 40,
    title: "delayChain",
    tags: [
      "promises"
    ],
    statement: "delayChain(tasks, wait) выполняет задачи по очереди, как sequence, но между шагами держит паузу wait миллисекунд. Первая задача стартует сразу, паузы только между задачами. Возвращает промис с массивом результатов в порядке задач.",
    starter: "function delayChain(tasks, wait) {\n  \n}\n",
    tests: [
      {
        name: "паузы между шагами",
        code: "var start = Date.now();\nvar values = await delayChain([\n  function () { return 1; },\n  function () { return Promise.resolve(2); },\n  function () { return 3; }\n], 10);\n__test.assertDeepEqual(values, [1, 2, 3], \"результаты по порядку\");\n__test.assertEquals(Date.now() - start >= 15, true, \"две паузы по 10 мс\");\n__test.assertDeepEqual(await delayChain([], 10), [], \"пусто\");"
      }
    ],
    solution: "function delayChain(tasks, wait) {\n  var list = [].slice.call(tasks);\n  var out = [];\n  var chain = Promise.resolve();\n  function pause() {\n    return new Promise(function (resolve) { setTimeout(resolve, wait); });\n  }\n  list.forEach(function (task, index) {\n    chain = chain.then(function () {\n      return (index === 0 ? Promise.resolve() : pause()).then(function () { return task(); });\n    }).then(function (value) { out.push(value); });\n  });\n  return chain.then(function () { return out; });\n}\n",
    theory: "Пауза вставляется перед вызовом задачи, а не после: иначе последняя задача тянула бы за собой лишний таймер, и промис резолвился бы позже, чем нужно. Так как каждый then ждёт предыдущий, результаты складываются в исходном порядке, даже если внутри задачи асинхронные. Нулевая задача — исключение: перед ней паузы нет.",
    waitMs: 80,
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.41",
    kind: "implement",
    level: 6,
    order: 41,
    title: "retryWithDelay",
    tags: [
      "promises"
    ],
    statement: "retryWithDelay(fn, times, delay) зовёт fn до times раз, делая паузу delay миллисекунд между неудачными попытками. Первый успех отдаёт своё значение, а если провалились все попытки — наружу уходит последняя ошибка. Перед первой попыткой паузы нет.",
    starter: "function retryWithDelay(fn, times, delay) {\n  \n}\n",
    tests: [
      {
        name: "попытки с паузами",
        code: "var start = Date.now();\nvar n = 0;\nvar value = await retryWithDelay(function () {\n  n += 1;\n  if (n < 3) throw new Error(\"нет\");\n  return Promise.resolve(\"ok\");\n}, 3, 10);\n__test.assertEquals(value, \"ok\", \"третья удалась\");\n__test.assertEquals(n, 3, \"ровно три входа\");\n__test.assertEquals(Date.now() - start >= 15, true, \"две паузы\");\nvar message = \"\";\ntry {\n  await retryWithDelay(function () { throw new Error(\"всё\"); }, 2, 5);\n} catch (error) { message = error.message; }\n__test.assertEquals(message, \"всё\", \"последняя ошибка наружу\");"
      }
    ],
    solution: "function retryWithDelay(fn, times, delay) {\n  function attempt(left) {\n    return Promise.resolve().then(fn).catch(function (error) {\n      if (left <= 1) throw error;\n      return new Promise(function (resolve) { setTimeout(resolve, delay); }).then(function () {\n        return attempt(left - 1);\n      });\n    });\n  }\n  return attempt(times);\n}\n",
    theory: "Схема та же, что у retry без задержки, но между попытками вклинивается промис-пауза. Важно, что ошибка не теряется: catch перебрасывает её наружу только когда счётчик дошёл до единицы, поэтому последняя причина уходит вызывающему. Синхронный throw из fn и отклонённый промис обрабатываются одинаково, потому что вызов завёрнут в then.",
    waitMs: 80,
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.42",
    kind: "implement",
    level: 6,
    order: 42,
    title: "myFinally",
    tags: [
      "promises"
    ],
    statement: "myFinally(promise, onFinally) зовёт onFinally без аргументов в любом случае — и при успехе, и при отказе. Значение или причина исходного промиса проходят наружу без изменений. Если onFinally сам бросил, наружу уходит именно его ошибка.",
    starter: "function myFinally(promise, onFinally) {\n  \n}\n",
    tests: [
      {
        name: "колбэк в обе стороны",
        code: "var runs = 0;\n__test.assertEquals(await myFinally(Promise.resolve(7), function () { runs += 1; }), 7, \"значение насквозь\");\n__test.assertEquals(runs, 1, \"колбэк вызван на успехе\");\nvar bad = Promise.reject(\"плохо\");\nbad.catch(function () {});\nvar reason = null;\ntry { await myFinally(bad, function () { runs += 1; }); } catch (error) { reason = error; }\n__test.assertEquals(reason, \"плохо\", \"причина насквозь\");\n__test.assertEquals(runs, 2, \"колбэк вызван и на отказе\");\nvar message = \"\";\ntry {\n  await myFinally(Promise.resolve(1), function () { throw new Error(\"из finally\"); });\n} catch (error) { message = error.message; }\n__test.assertEquals(message, \"из finally\", \"ошибка колбэка важнее\");"
      }
    ],
    solution: "function myFinally(promise, onFinally) {\n  return Promise.resolve(promise).then(function (value) {\n    return Promise.resolve(onFinally()).then(function () { return value; });\n  }, function (reason) {\n    return Promise.resolve(onFinally()).then(function () { throw reason; });\n  });\n}\n",
    theory: "finally не подменяет результат: значение запоминается до вызова колбэка и возвращается после него. Поэтому в успешной ветке нужно дождаться onFinally и только потом отдать value, а в ветке отказа — снова бросить reason. Если колбэк упал сам, его ошибка перебивает исходный результат — ровно как у штатного Promise.prototype.finally.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.43",
    kind: "implement",
    level: 6,
    order: 43,
    title: "camelCase",
    tags: [
      "string"
    ],
    statement: "camelCase(str) превращает строку в camelCase: разделителем считается любой символ, кроме буквы или цифры. Слова приводятся к нижнему регистру, у всех слов кроме первого первая буква становится заглавной. Пустая строка остаётся пустой.",
    starter: "function camelCase(str) {\n  \n}\n",
    tests: [
      {
        name: "склейка слов",
        code: "__test.assertEquals(camelCase(\"hello-world\"), \"helloWorld\", \"дефис\");\n__test.assertEquals(camelCase(\"Hello_world test\"), \"helloWorldTest\", \"регистр и пробел\");\n__test.assertEquals(camelCase(\"--foo-bar--\"), \"fooBar\", \"разделители по краям\");\n__test.assertEquals(camelCase(\"user-id-2\"), \"userId2\", \"цифры остаются в слове\");\n__test.assertEquals(camelCase(\"\"), \"\", \"пусто\");"
      }
    ],
    solution: "function camelCase(str) {\n  var words = String(str).toLowerCase().split(/[^a-z0-9]+/);\n  var out = \"\";\n  for (var i = 0; i < words.length; i++) {\n    var word = words[i];\n    if (!word) continue;\n    out += out === \"\" ? word : word.charAt(0).toUpperCase() + word.slice(1);\n  }\n  return out;\n}\n",
    theory: "Сначала вся строка в нижний регистр, потом split по разделителям — так Hello и hello дают одно и то же слово. Пустые куски от двойных дефисов отбрасываются проверкой if (!word), иначе на стыке появился бы лишний заглавный символ. Первое слово остаётся строчным: именно по пустому out видно, что оно первое.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.44",
    kind: "implement",
    level: 6,
    order: 44,
    title: "truncate",
    tags: [
      "string"
    ],
    statement: "truncate(str, max, suffix) обрезает строку до max символов. Если строка длиннее, добавляется suffix (по умолчанию '...'), причём итог вместе с suffix не длиннее max. Строка не длиннее max возвращается как есть. Если max не больше нуля — пустая строка, а если suffix длиннее max, он сам обрезается до max.",
    starter: "function truncate(str, max, suffix) {\n  \n}\n",
    tests: [
      {
        name: "обрезка",
        code: "__test.assertEquals(truncate(\"hello world\", 8), \"hello...\", \"с многоточием\");\n__test.assertEquals(truncate(\"hello\", 5), \"hello\", \"ровно в длину\");\n__test.assertEquals(truncate(\"hello world\", 7, \"~\"), \"hello ~\", \"свой суффикс\");\n__test.assertEquals(truncate(\"hello\", 2, \"...\"), \"..\", \"суффикс не влез\");\n__test.assertEquals(truncate(\"hello\", 0), \"\", \"ноль\");"
      }
    ],
    solution: "function truncate(str, max, suffix) {\n  var text = String(str);\n  if (suffix === undefined) suffix = \"...\";\n  if (max <= 0) return \"\";\n  if (text.length <= max) return text;\n  if (suffix.length >= max) return suffix.slice(0, max);\n  return text.slice(0, max - suffix.length) + suffix;\n}\n",
    theory: "Главное — считать длину вместе с суффиксом: обрезаем не до max, а до max минус длина суффикса, иначе итог вылезет за лимит. Строка ровно в max символов не трогается, иначе многоточие появилось бы на полной строке. Отдельная ветка нужна, когда суффикс сам длиннее лимита: тогда режется уже он.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.45",
    kind: "implement",
    level: 6,
    order: 45,
    title: "template",
    tags: [
      "string"
    ],
    statement: "template(str, data) подставляет значения из data вместо дырок вида {{ключ}}. Пробелы внутри скобок допустимы: {{ name }}. Если ключа нет или значение null/undefined, на месте дырки пустая строка. Остальные значения приводятся к строке, 0 остаётся '0'. Строка без дырок возвращается как есть.",
    starter: "function template(str, data) {\n  \n}\n",
    tests: [
      {
        name: "подстановка",
        code: "__test.assertEquals(template(\"Привет, {{name}}!\", { name: \"Мир\" }), \"Привет, Мир!\", \"подстановка\");\n__test.assertEquals(template(\"{{a}}+{{b}}\", { a: 1, b: 2 }), \"1+2\", \"числа приводятся\");\n__test.assertEquals(template(\"{{ z }}\", { z: 0 }), \"0\", \"ноль и пробелы в скобках\");\n__test.assertEquals(template(\"[{{nope}}]\", {}), \"[]\", \"нет ключа\");\n__test.assertEquals(template(\"без дырок\", { a: 1 }), \"без дырок\", \"нечего менять\");"
      }
    ],
    solution: "function template(str, data) {\n  return String(str).replace(/\\{\\{([^}]+)\\}\\}/g, function (match, key) {\n    var name = String(key).trim();\n    var value = data == null ? undefined : data[name];\n    return value === undefined || value === null ? \"\" : String(value);\n  });\n}\n",
    theory: "replace с функцией-заменой даёт доступ к имени ключа из каждой дырки: не нужно резать строку на куски и склеивать обратно. trim внутри скобок разрешает запись {{ name }}. Отсутствие ключа отличается от нуля: undefined и null дают пустую строку, а 0 честно превращается в \"0\" — сравнение идёт именно с undefined, а не на ложность.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.46",
    kind: "implement",
    level: 6,
    order: 46,
    title: "partial",
    tags: [
      "closure"
    ],
    statement: "partial(fn, ...preset) возвращает функцию с уже подставленными первыми аргументами: preset идёт перед аргументами вызова. В отличие от bind, this не фиксируется — обёртка передаёт fn тот this, с которым позвали её саму.",
    starter: "function partial(fn) {\n  \n}\n",
    tests: [
      {
        name: "preset без фиксации this",
        code: "function f(a, b) { return this.n + a + b; }\nvar p = partial(f, 1);\n__test.assertEquals(p.call({ n: 10 }, 2), 13, \"preset и this вызова\");\n__test.assertEquals(p.call({ n: 100 }, 2), 103, \"this можно менять\");\nfunction join(a, b, c) { return a + \"-\" + b + \"-\" + c; }\n__test.assertEquals(partial(join, \"x\")(\"y\", \"z\"), \"x-y-z\", \"хвост аргументов\");\n__test.assertEquals(partial(join)(\"x\", \"y\", \"z\"), \"x-y-z\", \"без preset\");"
      }
    ],
    solution: "function partial(fn) {\n  var preset = [].slice.call(arguments, 1);\n  return function () {\n    return fn.apply(this, preset.concat([].slice.call(arguments)));\n  };\n}\n",
    theory: "Зафиксированы только аргументы: fn.apply(this, ...) внутри обёртки получает ровно тот контекст, с которым позвали саму обёртку. Именно этим partial отличается от myBind, где ctx зашит в замыкание и перебить его снаружи нельзя. preset собирается один раз при создании обёртки, поэтому уже подставленные аргументы вызывающий не перепишет.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.47",
    kind: "implement",
    level: 6,
    order: 47,
    title: "negate",
    tags: [
      "closure"
    ],
    statement: "negate(fn) возвращает функцию, которая зовёт fn с теми же аргументами и this и возвращает логическое отрицание результата. Наружу всегда уходит true или false, а не исходное значение.",
    starter: "function negate(fn) {\n  \n}\n",
    tests: [
      {
        name: "отрицание",
        code: "function isEven(n) { return n % 2 === 0; }\nvar isOdd = negate(isEven);\n__test.assertEquals(isOdd(3), true, \"нечётное\");\n__test.assertEquals(isOdd(4), false, \"чётное\");\nfunction has(list, item) { return list.indexOf(item) !== -1; }\n__test.assertEquals(negate(has)([1, 2], 3), true, \"несколько аргументов\");\nfunction flag() { return this.flag; }\n__test.assertEquals(negate(flag).call({ flag: 0 }), true, \"this прокинут\");\n__test.assertEquals(negate(function () { return \"текст\"; })(), false, \"результат приводится к булеву\");"
      }
    ],
    solution: "function negate(fn) {\n  return function () {\n    return !fn.apply(this, arguments);\n  };\n}\n",
    theory: "Обёртка не должна терять ни аргументы, ни this, поэтому fn.apply(this, arguments) — ровно то, что нужно: arguments уже похож на массив и подходит вторым аргументом apply без пересборки. Отрицание приводит любой результат к честному булеву, поэтому наружу уходит true или false, а не 0 и не пустая строка.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.48",
    kind: "implement",
    level: 6,
    order: 48,
    title: "composeAsync",
    tags: [
      "closure"
    ],
    statement: "composeAsync(f, g, h) собирает асинхронный конвейер справа налево, как compose, но каждая функция может вернуть промис, и результат тоже промис. Следующая функция ждёт предыдущую. Без функций промис выполняется исходным значением.",
    starter: "function composeAsync() {\n  \n}\n",
    tests: [
      {
        name: "промисы справа налево",
        code: "function inc(n) { return n + 1; }\nfunction dbl(n) { return Promise.resolve(n * 2); }\n__test.assertEquals(await composeAsync(inc, dbl)(3), 7, \"промис в середине\");\n__test.assertEquals(await composeAsync()(5), 5, \"пусто\");\nvar seen = [];\nvar pipeline = composeAsync(\n  function (v) { seen.push(\"f\"); return Promise.resolve(v * 10); },\n  function (v) { seen.push(\"g\"); return v + 1; }\n);\n__test.assertEquals(await pipeline(2), 30, \"сначала g, потом f\");\n__test.assertDeepEqual(seen, [\"g\", \"f\"], \"строго по очереди\");"
      }
    ],
    solution: "function composeAsync() {\n  var fns = [].slice.call(arguments);\n  return function (value) {\n    var chain = Promise.resolve(value);\n    for (var i = fns.length - 1; i >= 0; i--) {\n      (function (fn) {\n        chain = chain.then(function (current) { return fn(current); });\n      })(fns[i]);\n    }\n    return chain;\n  };\n}\n",
    theory: "Цепочка then выравнивает шаги: следующая функция получает уже готовое значение, потому что промис сам разворачивает возвращённый thenable. Порядок обратный, как у compose: последняя функция в списке видит исходный аргумент. Пустой список — не особый случай: Promise.resolve(value) уже даёт нужный результат.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.49",
    kind: "implement",
    level: 6,
    order: 49,
    title: "once",
    tags: [
      "events"
    ],
    statement: "once(emitter, event) возвращает промис, который выполняется при первом срабатывании события. Значение — аргументы события: один аргумент отдаётся как есть, несколько — массивом. Подписка снимается через emitter.off, поэтому второй emit уже ни на что не влияет.",
    starter: "function once(emitter, event) {\n  \n}\n",
    tests: [
      {
        name: "первое событие",
        code: "function makeEmitter() {\n  var map = {};\n  return {\n    on: function (name, fn) { (map[name] = map[name] || []).push(fn); },\n    off: function (name, fn) {\n      map[name] = (map[name] || []).filter(function (item) { return item !== fn; });\n    },\n    emit: function (name) {\n      var args = [].slice.call(arguments, 1);\n      (map[name] || []).slice().forEach(function (fn) { fn.apply(null, args); });\n    },\n    listeners: function (name) { return (map[name] || []).length; }\n  };\n}\nvar bus = makeEmitter();\nvar pending = once(bus, \"ready\");\n__test.assertEquals(bus.listeners(\"ready\"), 1, \"подписались сразу\");\nbus.emit(\"ready\", 1, 2);\n__test.assertDeepEqual(await pending, [1, 2], \"аргументы массивом\");\n__test.assertEquals(bus.listeners(\"ready\"), 0, \"подписка снята\");\nvar bus2 = makeEmitter();\nvar single = once(bus2, \"ping\");\nbus2.emit(\"ping\", \"pong\");\n__test.assertEquals(await single, \"pong\", \"один аргумент как есть\");\n__test.assertEquals(bus2.listeners(\"ping\"), 0, \"и здесь подписка снята\");"
      }
    ],
    solution: "function once(emitter, event) {\n  return new Promise(function (resolve) {\n    function handler() {\n      emitter.off(event, handler);\n      var args = [].slice.call(arguments);\n      resolve(args.length > 1 ? args : args[0]);\n    }\n    emitter.on(event, handler);\n  });\n}\n",
    theory: "Промис здесь — мост между событийной моделью и async/await: resolve вызывается из обработчика события. Снимать подписку нужно до resolve, иначе следующий emit дёрнет уже ненужный обработчик и в эмиттере будут копиться мёртвые подписки. Разбор arguments нужен, чтобы не терять второй и третий аргументы: промис умеет отдать только одно значение.",
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  },
  {
    id: "6.50",
    kind: "implement",
    level: 6,
    order: 50,
    title: "waitFor",
    tags: [
      "events"
    ],
    statement: "waitFor(emitter, event, ms) ждёт первое событие не дольше ms миллисекунд. Событие пришло — промис выполняется с его аргументами (один как есть, несколько — массивом). Время вышло — отказ с Error и message 'timeout'. Подписка снимается в обоих случаях.",
    starter: "function waitFor(emitter, event, ms) {\n  \n}\n",
    tests: [
      {
        name: "событие или таймаут",
        code: "function makeEmitter() {\n  var map = {};\n  return {\n    on: function (name, fn) { (map[name] = map[name] || []).push(fn); },\n    off: function (name, fn) {\n      map[name] = (map[name] || []).filter(function (item) { return item !== fn; });\n    },\n    emit: function (name) {\n      var args = [].slice.call(arguments, 1);\n      (map[name] || []).slice().forEach(function (fn) { fn.apply(null, args); });\n    },\n    listeners: function (name) { return (map[name] || []).length; }\n  };\n}\nvar bus = makeEmitter();\nvar pending = waitFor(bus, \"done\", 25);\nbus.emit(\"done\", \"ok\");\n__test.assertEquals(await pending, \"ok\", \"событие успело\");\n__test.assertEquals(bus.listeners(\"done\"), 0, \"подписка снята после события\");\nvar bus2 = makeEmitter();\nvar message = \"\";\ntry { await waitFor(bus2, \"never\", 10); } catch (error) { message = error.message; }\n__test.assertEquals(message, \"timeout\", \"не дождались\");\n__test.assertEquals(bus2.listeners(\"never\"), 0, \"подписка снята и по таймауту\");"
      }
    ],
    solution: "function waitFor(emitter, event, ms) {\n  return new Promise(function (resolve, reject) {\n    var done = false;\n    function handler() {\n      if (done) return;\n      done = true;\n      clearTimeout(timer);\n      emitter.off(event, handler);\n      var args = [].slice.call(arguments);\n      resolve(args.length > 1 ? args : args[0]);\n    }\n    var timer = setTimeout(function () {\n      if (done) return;\n      done = true;\n      emitter.off(event, handler);\n      reject(new Error(\"timeout\"));\n    }, ms);\n    emitter.on(event, handler);\n  });\n}\n",
    theory: "Источников завершения два — событие и таймер, и оба обязаны снять подписку. Флаг done делает исход однократным: без него позднее событие пыталось бы разрешить уже решённый промис, а таймер — отклонить успешный. Снимать обработчик нужно в обеих ветках, иначе на долгоживущем эмиттере подписки копятся после каждого таймаута.",
    waitMs: 80,
    updatedAt: "2026-10-12T09:00:00.000Z",
    rev: 1
  }
];
