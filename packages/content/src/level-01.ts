/**
 * Уровень 1. Карточки в порядке тропы.
 * `expected` у predict-карточек — машинная лента, её не пишут руками:
 * она снимается раннером (см. packages/runner). Меняешь `code` — пересними ленту.
 */
export const CARDS = [
  {
    id: "1.1",
    kind: "predict",
    level: 1,
    order: 1,
    title: "var поднимается, let в TDZ",
    tags: [
      "hoisting",
      "tdz"
    ],
    strict: false,
    code: "console.log(a);\nvar a = 1;\nconsole.log(b);\nlet b = 2;\n",
    expected: [
      {
        type: "log",
        args: [
          "undefined"
        ]
      },
      {
        type: "error",
        name: "ReferenceError",
        message: "Cannot access 'b' before initialization"
      }
    ],
    answer: "undefined, затем ReferenceError",
    theory: "`var a` поднимается как объявление и до строки присваивания равно `undefined`, поэтому первый лог успевает напечататься. `let b` тоже видно в области, но до инициализации переменная в TDZ: чтение бросает `ReferenceError`, и до `let b = 2` выполнение не доходит.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.2",
    kind: "predict",
    level: 1,
    order: 2,
    title: "Два let с одним именем",
    tags: [
      "scope"
    ],
    strict: false,
    code: "let x = 1;\n{\n  let x = 2;\n  console.log(x);\n}\nconsole.log(x);\n",
    expected: [
      {
        type: "log",
        args: [
          "2"
        ]
      },
      {
        type: "log",
        args: [
          "1"
        ]
      }
    ],
    answer: "2, затем 1",
    theory: "Внутренний `let x` — другая переменная, она живёт только в блоке. Внешний `x` блок не трогает. `let` не протекает наружу, в отличие от `var`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.3",
    kind: "predict",
    level: 1,
    order: 3,
    title: "function declaration и var-функция",
    tags: [
      "hoisting"
    ],
    strict: false,
    code: "foo();\nbar();\nfunction foo() { console.log('foo'); }\nvar bar = function () { console.log('bar'); };\n",
    expected: [
      {
        type: "log",
        args: [
          "\"foo\""
        ]
      },
      {
        type: "error",
        name: "TypeError",
        message: "bar is not a function"
      }
    ],
    answer: "foo, затем TypeError: bar is not a function",
    theory: "`function foo` поднимается целиком, вызов до строки объявления законен. `var bar` поднимается как `undefined`: присваивание функции ещё не выполнено, поэтому `bar()` падает с `TypeError`. Объявление function и функция в `var` поднимаются по-разному.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.4",
    kind: "predict",
    level: 1,
    order: 4,
    title: "Локальный var затеняет внешний",
    tags: [
      "hoisting",
      "scope"
    ],
    strict: false,
    code: "var a = 1;\nfunction f() {\n  console.log(a);\n  var a = 2;\n}\nf();\n",
    expected: [
      {
        type: "log",
        args: [
          "undefined"
        ]
      }
    ],
    answer: "undefined",
    theory: "Внутри `f` свой `var a` поднимается в начало функции и затеняет внешний `a` ещё до строки `var a = 2`. Лог читает локальный `undefined`, а не `1`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.5",
    kind: "predict",
    level: 1,
    order: 5,
    title: "typeof, плюс и нестрогое равенство",
    tags: [
      "types",
      "coercion"
    ],
    strict: false,
    code: "console.log(typeof null, typeof [], typeof NaN);\nconsole.log([] + [], [] + {}, '5' - 2, '5' + 2);\nconsole.log(null == 0, null >= 0, NaN === NaN, 0.1 + 0.2 === 0.3);\n",
    expected: [
      {
        type: "log",
        args: [
          "\"object\"",
          "\"object\"",
          "\"number\""
        ]
      },
      {
        type: "log",
        args: [
          "\"\"",
          "\"[object Object]\"",
          "3",
          "\"52\""
        ]
      },
      {
        type: "log",
        args: [
          "false",
          "true",
          "false",
          "false"
        ]
      }
    ],
    answer: "object object number · пустая строка, [object Object], 3, '52' · false true false false",
    theory: "`typeof null` исторически `\"object\"`, массив тоже `\"object\"`, `NaN` — число. `[] + []` склеивает пустые строки. `[] + {}` даёт `\"[object Object]\"`. Минус приводит к числу (`3`), плюс со строкой склеивает (`\"52\"`). `null == 0` ложь, но `null >= 0` истина: операторы сравнения приводят `null` к `0`. `NaN` не равен сам себе. `0.1 + 0.2` не равно `0.3` из-за двоичной дроби.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.6",
    kind: "predict",
    level: 1,
    order: 6,
    title: "typeof необъявленного и typeof в TDZ",
    tags: [
      "tdz",
      "types"
    ],
    strict: false,
    code: "console.log(typeof x);\nconsole.log(typeof y);\nlet y = 1;\n",
    expected: [
      {
        type: "log",
        args: [
          "\"undefined\""
        ]
      },
      {
        type: "error",
        name: "ReferenceError",
        message: "Cannot access 'y' before initialization"
      }
    ],
    answer: "'undefined', затем ReferenceError",
    theory: "`typeof` необъявленного имени возвращает `\"undefined\"` и не бросает. `y` уже объявлен через `let` ниже по коду, поэтому `typeof y` попадает в TDZ и бросает `ReferenceError`. Особый случай `typeof` не спасает от TDZ.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.7",
    kind: "predict",
    level: 1,
    order: 7,
    title: "var не видит блок, let видит",
    tags: [
      "scope"
    ],
    strict: false,
    code: "var x = 1;\nif (true) { var x = 2; }\nconsole.log(x);\n\nlet y = 1;\nif (true) { let y = 2; }\nconsole.log(y);\n",
    expected: [
      {
        type: "log",
        args: [
          "2"
        ]
      },
      {
        type: "log",
        args: [
          "1"
        ]
      }
    ],
    answer: "2, затем 1",
    theory: "Оба `var x` — одна переменная функции или скрипта. Внутреннее присваивание меняет её на `2`. `let y` внутри `if` — другая переменная, снаружи остаётся `1`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.8",
    kind: "predict",
    level: 1,
    order: 8,
    title: "const и стрелка не поднимаются",
    tags: [
      "tdz",
      "hoisting"
    ],
    strict: false,
    code: "console.log(sum(2, 3));\nconst sum = (a, b) => a + b;\n",
    expected: [
      {
        type: "error",
        name: "ReferenceError",
        message: "Cannot access 'sum' before initialization"
      }
    ],
    answer: "ReferenceError",
    theory: "`const sum` в TDZ до своей строки. Стрелка не является function declaration и не поднимается целиком. Вызов выше инициализации — `ReferenceError`, не `TypeError`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.9",
    kind: "predict",
    level: 1,
    order: 9,
    title: "function и var с одним именем",
    tags: [
      "hoisting"
    ],
    strict: false,
    code: "var f = 1;\nfunction f() {}\nconsole.log(typeof f);\n",
    expected: [
      {
        type: "log",
        args: [
          "\"number\""
        ]
      }
    ],
    answer: "'number'",
    theory: "Имя одно. Function declaration поднимается и создаёт функцию, затем выполняется присваивание `f = 1`. Повторный `var` не обнуляет значение в момент объявления. К логу `f` уже число.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.10",
    kind: "predict",
    level: 1,
    order: 10,
    title: "Присваивание без объявления",
    tags: [
      "scope",
      "strict"
    ],
    strict: false,
    code: "function f() {\n  x = 10;\n}\nf();\nconsole.log(x);\n",
    expected: [
      {
        type: "log",
        args: [
          "10"
        ]
      }
    ],
    answer: "10",
    theory: "В нестрогом коде присваивание необъявленному `x` создаёт свойство глобального объекта. После `f()` внешний лог читает `10`. В strict mode эта строка — `ReferenceError`, глобальная не создаётся. У карточки `strict: false`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.11",
    kind: "predict",
    level: 1,
    order: 11,
    title: "Переменная цикла снаружи for",
    tags: [
      "scope"
    ],
    strict: false,
    code: "for (var i = 0; i < 3; i++) {}\nconsole.log(i);\nfor (let j = 0; j < 3; j++) {}\nconsole.log(j);\n",
    expected: [
      {
        type: "log",
        args: [
          "3"
        ]
      },
      {
        type: "error",
        name: "ReferenceError",
        message: "j is not defined"
      }
    ],
    answer: "3, затем ReferenceError",
    theory: "`var i` объявлен на весь скрипт, после цикла он равен `3`. `let j` существует только в `for`. Снаружи имени `j` нет — это `ReferenceError`, не `undefined`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.12",
    kind: "predict",
    level: 1,
    order: 12,
    title: "var из невыполненного if",
    tags: [
      "hoisting"
    ],
    strict: false,
    code: "var a = 1;\nfunction f() {\n  if (false) {\n    var a = 2;\n  }\n  console.log(a);\n}\nf();\n",
    expected: [
      {
        type: "log",
        args: [
          "undefined"
        ]
      }
    ],
    answer: "undefined",
    theory: "`var` поднимается из всего тела функции, даже из ветки, которая не выполняется. Локальный `a` затеняет внешний `1` и остаётся `undefined`, потому что присваивание `2` не случилось.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.13",
    kind: "predict",
    level: 1,
    order: 13,
    title: "Лексическая область, не место вызова",
    tags: [
      "scope",
      "closure"
    ],
    strict: false,
    code: "let x = 'global';\nfunction show() { console.log(x); }\nfunction run() {\n  let x = 'local';\n  show();\n}\nrun();\n",
    expected: [
      {
        type: "log",
        args: [
          "\"global\""
        ]
      }
    ],
    answer: "'global'",
    theory: "`show` замыкается на `x` там, где функция написана, — на внешний `'global'`. `let x` внутри `run` для неё невидим. Область лексическая: важно место объявления, не место вызова.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.14",
    kind: "predict",
    level: 1,
    order: 14,
    title: "const запрещает другое присваивание",
    tags: [
      "scope"
    ],
    strict: false,
    code: "const obj = { a: 1 };\nobj.a = 2;\nconsole.log(obj.a);\nconst n = 1;\nn = 2;\n",
    expected: [
      {
        type: "log",
        args: [
          "2"
        ]
      },
      {
        type: "error",
        name: "TypeError",
        message: "Assignment to constant variable."
      }
    ],
    answer: "2, затем TypeError",
    theory: "`const` фиксирует привязку имени, а не замораживает объект. `obj.a = 2` законно. `n = 2` меняет саму привязку и бросает `TypeError: Assignment to constant variable`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.15",
    kind: "predict",
    level: 1,
    order: 15,
    title: "typeof от typeof и разные типы",
    tags: [
      "types"
    ],
    strict: false,
    code: "console.log(typeof typeof 1);\nconsole.log(typeof function () {}, typeof undefined, typeof Symbol());\n",
    expected: [
      {
        type: "log",
        args: [
          "\"string\""
        ]
      },
      {
        type: "log",
        args: [
          "\"function\"",
          "\"undefined\"",
          "\"symbol\""
        ]
      }
    ],
    answer: "'string'; 'function' 'undefined' 'symbol'",
    theory: "`typeof 1` — строка `\"number\"`, а `typeof` от строки — `\"string\"`. Дальше типы как есть: функция, `undefined` и символ. `typeof` всегда возвращает строку.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.16",
    kind: "predict",
    level: 1,
    order: 16,
    title: "true, null и undefined в плюсе",
    tags: [
      "coercion"
    ],
    strict: false,
    code: "console.log(true + 1, true + '1', null + 1, undefined + 1);\n",
    expected: [
      {
        type: "log",
        args: [
          "2",
          "\"true1\"",
          "1",
          "NaN"
        ]
      }
    ],
    answer: "2 'true1' 1 NaN",
    theory: "`true + 1` приводит `true` к `1` и даёт `2`. `true + '1'` видит строку и конкатенирует: `true` становится `\"true\"`, результат `\"true1\"`, не `\"11\"`. `null + 1` приводит `null` к `0`. `undefined` к числу не приводится, получается `NaN`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.17",
    kind: "predict",
    level: 1,
    order: 17,
    title: "Строки в арифметике и унарный плюс",
    tags: [
      "coercion"
    ],
    strict: false,
    code: "console.log('3' * '4', '10' / 2, '5' - - '2', +'', +' 7 ', +'7px');\n",
    expected: [
      {
        type: "log",
        args: [
          "12",
          "5",
          "7",
          "0",
          "7",
          "NaN"
        ]
      }
    ],
    answer: "12 5 7 0 7 NaN",
    theory: "`*` и `/` всегда numeric: `'3' * '4'` это `12`, `'10' / 2` это `5`. `'5' - - '2'` читается как `5 - (-2)`. Унарный плюс приводит к числу: пустая строка → `0`, строка с пробелами → `7`, `'7px'` → `NaN`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.18",
    kind: "predict",
    level: 1,
    order: 18,
    title: "== не транзитивно",
    tags: [
      "coercion"
    ],
    strict: false,
    code: "console.log(0 == '', 0 == '0', '' == '0');\nconsole.log(null == undefined, null === undefined);\n",
    expected: [
      {
        type: "log",
        args: [
          "true",
          "true",
          "false"
        ]
      },
      {
        type: "log",
        args: [
          "true",
          "false"
        ]
      }
    ],
    answer: "true true false; true false",
    theory: "`==` приводит типы. `0 == ''` и `0 == '0'` истина, потому что строка становится числом. `'' == '0'` сравнивает две строки без числа — ложь. Поэтому `==` не транзитивно. `null == undefined` истина только друг для друга, `===` эту пару не равняет.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.19",
    kind: "predict",
    level: 1,
    order: 19,
    title: "Массив в == и в плюсе",
    tags: [
      "coercion"
    ],
    strict: false,
    code: "console.log([] == false, [] == ![], [0] == false);\nconsole.log([1, 2] + [3]);\n",
    expected: [
      {
        type: "log",
        args: [
          "true",
          "true",
          "true"
        ]
      },
      {
        type: "log",
        args: [
          "\"1,23\""
        ]
      }
    ],
    answer: "true true true; '1,23'",
    theory: "В `==` массив приводится через `toString` к строке, затем к числу. `[]` становится `0`, как и `false`. `![]` это `false`, дальше тот же путь. `[0]` становится `\"0\"` и тоже `0`. Плюс массивов — конкатенация строк: `\"1,2\" + \"3\"` даёт `\"1,23\"`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.20",
    kind: "predict",
    level: 1,
    order: 20,
    title: "Что truthy на самом деле",
    tags: [
      "types",
      "coercion"
    ],
    strict: false,
    code: "console.log(Boolean([]), Boolean({}), Boolean(''), Boolean('0'), Boolean(NaN));\n",
    expected: [
      {
        type: "log",
        args: [
          "true",
          "true",
          "false",
          "true",
          "false"
        ]
      }
    ],
    answer: "true true false true false",
    theory: "К boolean приводят по короткому списку falsy, а не по «пустоте». Любой объект и любой массив truthy, даже пустые. Пустая строка и `NaN` falsy. Строка `\"0\"` не пустая, она truthy.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.21",
    kind: "predict",
    level: 1,
    order: 21,
    title: "NaN, Number.isNaN и isNaN",
    tags: [
      "types"
    ],
    strict: false,
    code: "console.log(NaN == NaN, Number.isNaN('abc'), isNaN('abc'));\n",
    expected: [
      {
        type: "log",
        args: [
          "false",
          "false",
          "true"
        ]
      }
    ],
    answer: "false false true",
    theory: "`NaN` не равен сам себе ни через `==`, ни через `===`. `Number.isNaN` не приводит аргумент: строка — не `NaN`. Глобальный `isNaN` сначала делает `Number(\"abc\")`, получает `NaN` и возвращает `true`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "1.22",
    kind: "predict",
    level: 1,
    order: 22,
    title: "let внутри case: со скобками и без",
    tags: ["tdz", "scope"],
    strict: false,
    code: "function braced(n) {\n  switch (n) {\n    case 1: {\n      let label = 'braced';\n      return label;\n    }\n    default:\n      return typeof label;\n  }\n}\nconsole.log(braced(1));\nconsole.log(braced(2));\n\nfunction flat(n) {\n  switch (n) {\n    case 1:\n      let tag = 'flat';\n      return tag;\n    default:\n      return typeof tag;\n  }\n}\nconsole.log(flat(1));\nconsole.log(flat(2));\n",
    expected: [
      { type: "log", args: ["\"braced\""] },
      { type: "log", args: ["\"undefined\""] },
      { type: "log", args: ["\"flat\""] },
      { type: "error", name: "ReferenceError", message: "Cannot access 'tag' before initialization" },
    ],
    answer: "'braced', 'undefined', 'flat', затем ReferenceError",
    theory: "Все `case` одного `switch` делят общий блок, поэтому `let tag` из первого `case` существует и в `default` — но до выполнения своей строки он в TDZ, и `typeof tag` бросает `ReferenceError`. Фигурные скобки вокруг `case 1` создают отдельный блок: `let label` живёт только внутри них, снаружи такого имени нет вообще, и `typeof label` спокойно отдаёт `\"undefined\"`. Так что `let` в `switch` лучше всегда оборачивать в блок.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "1.23",
    kind: "predict",
    level: 1,
    order: 23,
    title: "delete: переменная против свойства",
    tags: ["scope", "types"],
    strict: false,
    code: "var x = 1;\nlet y = 2;\nconst obj = { a: 1, b: 2 };\nconsole.log(delete x, delete y, x, y);\nconsole.log(delete obj.a, obj.a, Object.keys(obj).length);\nconsole.log(delete obj.nothing, 'a' in obj, 'b' in obj);\n",
    expected: [
      { type: "log", args: ["false", "false", "1", "2"] },
      { type: "log", args: ["true", "undefined", "1"] },
      { type: "log", args: ["true", "false", "true"] },
    ],
    answer: "false false 1 2; true undefined 1; true false true",
    theory: "`delete` умеет удалять только свойства объектов: для имени переменной — неважно, `var` это или `let` — он возвращает `false` и ничего не трогает. У свойства всё иначе: `obj.a` действительно исчезает, чтение даёт `undefined`, а `in` возвращает `false`. Удаление несуществующего свойства при этом считается успешным и возвращает `true`. В strict mode `delete` по имени переменной — уже `SyntaxError`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "1.24",
    kind: "predict",
    level: 1,
    order: 24,
    title: "Присваивание параметру: число и объект",
    tags: ["scope", "types"],
    strict: false,
    code: "function bump(n) {\n  n = n + 1;\n  return n;\n}\nlet count = 1;\nconsole.log(bump(count), count);\n\nfunction rename(user) {\n  user.name = 'Bob';\n  user = { name: 'Ann' };\n  return user.name;\n}\nconst me = { name: 'Ann' };\nconsole.log(rename(me), me.name);\n",
    expected: [
      { type: "log", args: ["2", "1"] },
      { type: "log", args: ["\"Ann\"", "\"Bob\""] },
    ],
    answer: "2 1; 'Ann' 'Bob'",
    theory: "Параметр — обычная локальная переменная, которая получает значение аргумента. Для числа это копия: `n = n + 1` внутри функции ничего не меняет снаружи, `count` остаётся `1`. Для объекта копируется тоже значение, но это ссылка на тот же объект: `user.name = 'Bob'` меняет и `me`, поэтому в логе рядом с `'Ann'` стоит `'Bob'`. А переприсваивание самого параметра связь рвёт — после `user = { name: 'Ann' }` функция работает с новым объектом и возвращает `'Ann'`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "1.25",
    kind: "predict",
    level: 1,
    order: 25,
    title: "Дефолты в деструктуризации: undefined и null",
    tags: ["types", "coercion"],
    strict: false,
    code: "const { a = 1, b = 2, c = 3 } = { a: null, b: undefined, c: 0 };\nconsole.log(a, b, c);\n\nconst [x = 10, y = 20] = [undefined, null];\nconsole.log(x, y);\n\nfunction f({ n = 5 } = {}) {\n  return n;\n}\nconsole.log(f({ n: null }), f({}), f());\n",
    expected: [
      { type: "log", args: ["null", "2", "0"] },
      { type: "log", args: ["10", "null"] },
      { type: "log", args: ["null", "5", "5"] },
    ],
    answer: "null 2 0; 10 null; null 5 5",
    theory: "Значение по умолчанию срабатывает ровно на `undefined` — это тот же механизм, что у дефолтов параметров функции. Поэтому `b` из `undefined` становится `2`, а `a: null` и `c: 0` остаются как есть, хотя оба falsy. В массиве `undefined` в первой позиции даёт `10`, а `null` во второй так и остаётся `null`. Дефолт у самого параметра (`= {}`) нужен, чтобы вызов совсем без аргумента не падал.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "1.26",
    kind: "predict",
    level: 1,
    order: 26,
    title: "Object.is смотрит иначе, чем ===",
    tags: ["equality", "types"],
    strict: false,
    code: "const o = {};\nconsole.log(NaN === NaN, Object.is(NaN, NaN));\nconsole.log(0 === -0, Object.is(0, -0));\nconsole.log(Object.is('1', 1), Object.is(o, o), Object.is({}, {}));\n",
    expected: [
      { type: "log", args: ["false", "true"] },
      { type: "log", args: ["true", "false"] },
      { type: "log", args: ["false", "true", "false"] },
    ],
    answer: "false true; true false; false true false",
    theory: "`Object.is` — это почти `===`, расходится он ровно в двух случаях. `NaN` он считает равным самому себе, а `0` и `-0` различает, тогда как `===` их не различает. Всё остальное совпадает: разные типы не равны, один и тот же объект равен себе, два разных объекта — нет. Типы `Object.is`, как и `===`, не приводит.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "1.27",
    kind: "predict",
    level: 1,
    order: 27,
    title: "0 и пустая строка: ?? против ||",
    tags: ["coercion", "types"],
    strict: false,
    code: "const a = 0 || 'fallback';\nconst b = 0 ?? 'fallback';\nconst c = '' ?? 'fallback';\nconsole.log(a, b, c);\n\nlet hits = 0;\nfunction side() {\n  hits += 1;\n  return 'called';\n}\nconst r = false && side();\nconst s = true || side();\nconst t = undefined ?? side();\nconsole.log(r, s, t, hits);\n",
    expected: [
      { type: "log", args: ["\"fallback\"", "0", "\"\""] },
      { type: "log", args: ["false", "true", "\"called\"", "1"] },
    ],
    answer: "'fallback' 0 ''; false true 'called' 1",
    theory: "`||` берёт правый операнд, если левый falsy: `0` и `''` для него пусто, поэтому в `a` попадает `'fallback'`. `??` реагирует только на `null` и `undefined`, так что `0` и `''` проходят насквозь. Заодно видно короткое замыкание: у `false && ...` и `true || ...` правая часть не вычисляется вовсе, поэтому `side` вызывается один раз — только из `??`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
];
