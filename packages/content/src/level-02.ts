/**
 * Уровень 2. Карточки в порядке тропы.
 * `expected` у predict-карточек — машинная лента, её не пишут руками:
 * она снимается раннером (см. packages/runner). Меняешь `code` — пересними ленту.
 */
export const CARDS = [
  {
    id: "2.1",
    kind: "predict",
    level: 2,
    order: 1,
    title: "var в цикле и setTimeout",
    tags: [
      "closure",
      "event-loop"
    ],
    strict: false,
    code: "for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i));\n}\n",
    expected: [
      {
        type: "log",
        args: [
          "3"
        ]
      },
      {
        type: "log",
        args: [
          "3"
        ]
      },
      {
        type: "log",
        args: [
          "3"
        ]
      }
    ],
    answer: "3 3 3",
    theory: "У `var` одна переменная `i` на весь цикл. Колбэки таймера бегут после цикла, когда `i` уже `3`, и читают её. Они не запомнили `0`, `1` и `2`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
    variants: [
      {
        id: "2.1-let",
        code: "for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i));\n}\n",
        answer: "0 1 2",
        theory: "`let` в заголовке `for` создаёт новую привязку на каждую итерацию. Стрелка замыкается на свою, поэтому таймеры печатают `0`, `1`, `2`.",
        expected: [
          {
            type: "log",
            args: [
              "0"
            ]
          },
          {
            type: "log",
            args: [
              "1"
            ]
          },
          {
            type: "log",
            args: [
              "2"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "2.2",
    kind: "predict",
    level: 2,
    order: 2,
    title: "Три функции и одна переменная",
    tags: [
      "closure"
    ],
    strict: false,
    code: "const fns = [];\nfor (var i = 0; i < 3; i++) fns.push(() => i);\nconsole.log(fns.map(f => f()));\n",
    expected: [
      {
        type: "log",
        args: [
          "[3, 3, 3]"
        ]
      }
    ],
    answer: "[3, 3, 3]",
    theory: "Стрелки не копируют число в момент `push`. Они читают `i`, когда их вызывают. К `map` цикл уже закончился, `var i` равен `3`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.3",
    kind: "predict",
    level: 2,
    order: 3,
    title: "Своё окружение на каждый вызов",
    tags: [
      "closure"
    ],
    strict: false,
    code: "function make() {\n  let x = 0;\n  return { inc: () => ++x, get: () => x };\n}\nconst a = make(), b = make();\na.inc(); a.inc(); b.inc();\nconsole.log(a.get(), b.get());\n",
    expected: [
      {
        type: "log",
        args: [
          "2",
          "1"
        ]
      }
    ],
    answer: "2 1",
    theory: "Каждый вызов `make` создаёт свой `x`. Методы `a` замкнуты на первом окружении, методы `b` — на втором. Два `inc` у `a` и один у `b` не делят счётчик.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.4",
    kind: "implement",
    level: 2,
    order: 4,
    title: "makeCounter",
    tags: [
      "closure"
    ],
    statement: "Сделай makeCounter(). Каждый вызов возвращает новый объект с increment, decrement и reset. Счётчики не делят состояние.",
    starter: "function makeCounter() {\n  \n}\n",
    tests: [
      {
        name: "свой счётчик",
        code: "var a = makeCounter();\nvar b = makeCounter();\n__test.assertEquals(a.increment(), 1, \"a +1\");\n__test.assertEquals(a.increment(), 2, \"a +2\");\n__test.assertEquals(b.increment(), 1, \"b отдельно\");\na.decrement();\n__test.assertEquals(a.reset(), 0, \"reset\");\n__test.assertEquals(b.increment(), 2, \"b не сброшен\");"
      }
    ],
    solution: "function makeCounter() {\n  var n = 0;\n  return {\n    increment: function () { return ++n; },\n    decrement: function () { return --n; },\n    reset: function () { n = 0; return n; },\n  };\n}\n",
    theory: "Каждый вызов makeCounter создаёт своё лексическое окружение и свой n. Методы возвращаемого объекта замыкаются на это окружение, поэтому a и b не видят счётчик друг друга. reset меняет ту же переменную, а не создаёт новую.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.5",
    kind: "implement",
    level: 2,
    order: 5,
    title: "once",
    tags: [
      "closure"
    ],
    statement: "once(fn) возвращает функцию, которая вызывает fn только в первый раз и дальше отдаёт тот же результат.",
    starter: "function once(fn) {\n  \n}\n",
    tests: [
      {
        name: "один вызов",
        code: "var n = 0;\nvar f = once(function (x) { n += 1; return x + n; });\n__test.assertEquals(f(1), 2, \"первый\");\n__test.assertEquals(f(9), 2, \"второй отдал память\");\n__test.assertEquals(n, 1, \"тело один раз\");"
      }
    ],
    solution: "function once(fn) {\n  var called = false;\n  var value;\n  return function () {\n    if (called) return value;\n    called = true;\n    value = fn.apply(this, arguments);\n    return value;\n  };\n}\n",
    theory: "Флаг called и value живут в окружении once, не в самой обёртке как глобальные. Первый вызов записывает результат, следующие даже не входят в fn. apply сохраняет this и аргументы первого вызова.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.6",
    kind: "implement",
    level: 2,
    order: 6,
    title: "sum(1)(2)(3)()",
    tags: [
      "closure"
    ],
    statement: "sum(1)(2)(3)() возвращает 6. Чисел может быть сколько угодно, пустой вызов заканчивает цепочку. sum() без аргумента — 0.",
    starter: "function sum(n) {\n  \n}\n",
    tests: [
      {
        name: "цепочка",
        code: "__test.assertEquals(sum(), 0, \"пусто\");\n__test.assertEquals(sum(1)(), 1, \"одно\");\n__test.assertEquals(sum(1)(2)(3)(), 6, \"три\");"
      }
    ],
    solution: "function sum(n) {\n  if (n === undefined) return 0;\n  var total = n;\n  function next(m) {\n    if (m === undefined) return total;\n    total += m;\n    return next;\n  }\n  return next;\n}\n",
    theory: "Каждое число возвращает ту же функцию next, замкнутую на total. Пустой вызов — сигнал остановиться и вернуть число, а не ещё одну функцию. Отдельный вызов sum начинает новую сумму: состояние не глобальное.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.7",
    kind: "predict",
    level: 2,
    order: 7,
    title: "IIFE внутри цикла с var",
    tags: [
      "closure",
      "iife"
    ],
    strict: false,
    code: "const fns = [];\nfor (var i = 0; i < 3; i++) {\n  (function (n) { fns.push(() => n); })(i);\n}\nconsole.log(fns.map(f => f()));\n",
    expected: [
      {
        type: "log",
        args: [
          "[0, 1, 2]"
        ]
      }
    ],
    answer: "[0, 1, 2]",
    theory: "IIFE вызывается прямо на итерации и получает текущее `i` как параметр `n`. Параметр — обычная переменная функции, у каждого вызова она своя, и стрелка замыкается на неё, а не на общий `var i`. Это старый способ починить сцену 2.1 без `let`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.8",
    kind: "predict",
    level: 2,
    order: 8,
    title: "Два цикла: let и var рядом",
    tags: [
      "closure",
      "scope"
    ],
    strict: false,
    code: "const fromLet = [], fromVar = [];\nfor (let i = 0; i < 2; i++) fromLet.push(() => i);\nfor (var j = 0; j < 2; j++) fromVar.push(() => j);\nconsole.log(fromLet.map(f => f()));\nconsole.log(fromVar.map(f => f()));\n",
    expected: [
      {
        type: "log",
        args: [
          "[0, 1]"
        ]
      },
      {
        type: "log",
        args: [
          "[2, 2]"
        ]
      }
    ],
    answer: "[0, 1] и [2, 2]",
    theory: "`let` в заголовке `for` заводит новую привязку на каждую итерацию, и каждая стрелка держит свою. У `var` привязка одна на цикл, поэтому обе стрелки смотрят в одну переменную, дожившую до значения `2`. Разница только в том, сколько привязок создаёт заголовок цикла.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.9",
    kind: "predict",
    level: 2,
    order: 9,
    title: "Функция и снимок значения",
    tags: [
      "closure"
    ],
    strict: false,
    code: "let x = 1;\nconst getX = () => x;\nx = 99;\nconst copy = x;\nx = 100;\nconsole.log(getX(), copy);\n",
    expected: [
      {
        type: "log",
        args: [
          "100",
          "99"
        ]
      }
    ],
    answer: "100 99",
    theory: "Замыкание держит не значение, а саму переменную `x`. Пока `getX` не вызвали, `x` успели переписать дважды, и функция увидит последнее значение. А `copy` — это обычный снимок, сделанный в момент присваивания.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.10",
    kind: "predict",
    level: 2,
    order: 10,
    title: "Две функции из одного вызова",
    tags: [
      "closure",
      "counter"
    ],
    strict: false,
    code: "function counter() {\n  var n = 0;\n  const bump = () => ++n;\n  const show = () => n;\n  return [bump, show];\n}\nconst [bump1, show1] = counter();\nconst [bump2, show2] = counter();\nbump1(); bump1();\nconsole.log(show1(), show2());\nbump2();\nconsole.log(show1(), show2());\n",
    expected: [
      {
        type: "log",
        args: [
          "2",
          "0"
        ]
      },
      {
        type: "log",
        args: [
          "2",
          "1"
        ]
      }
    ],
    answer: "2 0, затем 2 1",
    theory: "`bump` и `show` созданы в одном вызове `counter`, поэтому смотрят в одну и ту же переменную `n`: запись через `bump` видна чтению через `show`. Второй вызов `counter` создаёт своё окружение и свою `n`, поэтому `show2` про первый счётчик ничего не знает.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.11",
    kind: "predict",
    level: 2,
    order: 11,
    title: "Модуль со спрятанным состоянием",
    tags: [
      "closure",
      "iife",
      "scope"
    ],
    strict: false,
    code: "const counter = (() => {\n  let n = 0;\n  return {\n    inc: () => ++n,\n    get value() { return n; },\n  };\n})();\ncounter.inc();\nconsole.log(counter.value, counter.n, typeof n);\n",
    expected: [
      {
        type: "log",
        args: [
          "1",
          "undefined",
          "\"undefined\""
        ]
      }
    ],
    answer: "1 undefined \"undefined\"",
    theory: "IIFE отработал один раз и оставил наружу только объект с методами; сама `n` живёт в его окружении. `inc` меняет эту `n`, поэтому геттер отдаёт `1`. А `counter.n` — просто отсутствующее свойство объекта, и снаружи имени `n` тоже нет: в глобальной области его не видно.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.12",
    kind: "predict",
    level: 2,
    order: 12,
    title: "Функция, возвращающая счётчик",
    tags: [
      "closure",
      "counter"
    ],
    strict: false,
    code: "function makeCounter() {\n  let n = 0;\n  return () => ++n;\n}\nconst next = makeCounter();\nnext();\nconsole.log(next(), next(), makeCounter()());\n",
    expected: [
      {
        type: "log",
        args: [
          "2",
          "3",
          "1"
        ]
      }
    ],
    answer: "2 3 1",
    theory: "`makeCounter` возвращает новую стрелку, и каждая такая стрелка держит свою `n` из своего вызова. Поэтому `next` продолжает считать, а третий вызов `makeCounter()` в том же `console.log` получает свежую `n` и отдаёт `1`. Три аргумента вычисляются слева направо, и это не мешает каждому своему счётчику.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.13",
    kind: "predict",
    level: 2,
    order: 13,
    title: "Стрелка и обычная функция внутри",
    tags: [
      "closure",
      "scope"
    ],
    strict: false,
    code: "function outer(a) {\n  const arrow = () => arguments[0];\n  function inner() { return arguments[0]; }\n  return [arrow(), inner(7)];\n}\nconsole.log(outer(5));\n",
    expected: [
      {
        type: "log",
        args: [
          "[5, 7]"
        ]
      }
    ],
    answer: "[5, 7]",
    theory: "У стрелки нет своего `arguments`, поэтому она берёт объект аргументов из `outer` — там лежит `5`. Обычная `inner` заводит собственный `arguments` на каждый вызов, и в него попадает `7`. Параметр `a` при этом равен `5` в обоих случаях, различает их именно `arguments`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "2.14",
    kind: "predict",
    level: 2,
    order: 14,
    title: "Замыкание на метку, а не на индекс",
    tags: [
      "closure",
      "scope"
    ],
    strict: false,
    code: "const handlers = [];\nfor (let i = 0; i < 3; i++) {\n  const label = 'btn-' + i;\n  handlers.push(() => label);\n}\nconsole.log(handlers.map(h => h()), handlers.length);\n",
    expected: [
      {
        type: "log",
        args: [
          "[\"btn-0\", \"btn-1\", \"btn-2\"]",
          "3"
        ]
      }
    ],
    answer: "[\"btn-0\", \"btn-1\", \"btn-2\"] 3",
    theory: "`label` объявлена через `const` внутри тела цикла, значит у каждой итерации своя привязка, и стрелка хранит именно её. Строку собрали в момент итерации, а не при вызове. `let` в заголовке даёт то же самое для `i`, а `var` сломал бы сцену: одна привязка на весь цикл.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  }
];
