/**
 * Уровень 3. Карточки в порядке тропы.
 * `expected` у predict-карточек — машинная лента, её не пишут руками:
 * она снимается раннером (см. packages/runner). Меняешь `code` — пересними ленту.
 */
export const CARDS = [
  {
    id: "3.1",
    kind: "predict",
    level: 3,
    order: 1,
    title: "Метод, оторванный от объекта",
    tags: [
      "this"
    ],
    strict: false,
    code: "const user = { login: 'max', hi() { console.log(this.login); } };\nconst hi = user.hi;\nuser.hi();\nhi();\nsetTimeout(user.hi);\n",
    expected: [
      {
        type: "log",
        args: [
          "\"max\""
        ]
      },
      {
        type: "log",
        args: [
          "undefined"
        ]
      },
      {
        type: "log",
        args: [
          "undefined"
        ]
      }
    ],
    answer: "max, undefined, undefined",
    theory: "`user.hi()` зовёт функцию как метод, `this` — это `user`. `const hi = user.hi` отрывает функцию от объекта. Голый вызов в нестрогом коде ставит `this` на глобальный объект, у него нет `login`. `setTimeout` тоже вызывает функцию не как метод: в браузере `this` обычно `window`, в Node — объект таймера, но `login` нет в обоих случаях, в логе `undefined`. В strict mode голый `hi()` получил бы `this === undefined` и упал бы на чтении `this.login`. Карточка нестрогая.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "3.2",
    kind: "predict",
    level: 3,
    order: 2,
    title: "Стрелка не имеет своего this",
    tags: [
      "this"
    ],
    strict: false,
    code: "function outer() {\n  const obj = {\n    name: 'obj',\n    arrow: () => console.log(this.name),\n    regular() { console.log(this.name); },\n  };\n  obj.arrow();\n  obj.regular();\n}\nouter.call({ name: 'outer' });\n",
    expected: [
      {
        type: "log",
        args: [
          "\"outer\""
        ]
      },
      {
        type: "log",
        args: [
          "\"obj\""
        ]
      }
    ],
    answer: "outer, затем obj",
    theory: "Стрелка берёт `this` из `outer`, а `outer` вызвана через `call` с `{ name: 'outer' }`. Обычный метод вызван как `obj.regular()`, его `this` — сам `obj`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "3.3",
    kind: "predict",
    level: 3,
    order: 3,
    title: "Повторный bind и отдельный call",
    tags: [
      "this"
    ],
    strict: false,
    code: "function f() { console.log(this.n); }\nf.bind({ n: 1 }).bind({ n: 2 })();\nf.call({ n: 3 });\n",
    expected: [
      {
        type: "log",
        args: [
          "1"
        ]
      },
      {
        type: "log",
        args: [
          "3"
        ]
      }
    ],
    answer: "1, затем 3",
    theory: "Первый `bind` фиксирует `this` в новой функции. Повторный `bind` у bound-функции этот `this` не перебивает, вызывается привязка к `{ n: 1 }`. `f.call({ n: 3 })` — это исходная `f`, не результат `bind`. `call` подставляет `this` только на этот вызов. Две разные механики.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "3.4",
    kind: "predict",
    level: 3,
    order: 4,
    title: "new связывает this и прототип",
    tags: [
      "this",
      "prototype"
    ],
    strict: false,
    code: "function P(n) { this.n = n; }\nconst p = new P(5);\nconsole.log(p.n, Object.getPrototypeOf(p) === P.prototype);\n",
    expected: [
      {
        type: "log",
        args: [
          "5",
          "true"
        ]
      }
    ],
    answer: "5 true",
    theory: "`new` создаёт объект, передаёт его как `this` и возвращает его, потому что конструктор не вернул другой объект. `[[Prototype]]` экземпляра — `P.prototype` на момент `new`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "3.5",
    kind: "predict",
    level: 3,
    order: 5,
    title: "Колбэк setTimeout: функция против стрелки",
    tags: ["this", "arrow"],
    strict: false,
    code: "const user = {\n  login: 'max',\n  show() {\n    setTimeout(function () { console.log('regular:', this === globalThis); }, 0);\n    setTimeout(() => console.log('arrow:', this.login), 0);\n  },\n};\nuser.show();\n",
    expected: [
      { type: "log", args: ["\"regular:\"", "true"] },
      { type: "log", args: ["\"arrow:\"", "\"max\""] },
    ],
    answer: "regular: true, затем arrow: max",
    theory: "`show()` вызван как метод, внутри него `this` — это `user`. Обычная функция в `setTimeout` вызывается таймером как голая функция: своего `this` у неё нет, в нестрогом коде его подставляет глобальный объект. Стрелка не создаёт `this` вообще, поэтому видит `this` из `show`, то есть `user`, и достаёт `login`. В strict mode у обычной функции было бы `this === undefined`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.6",
    kind: "predict",
    level: 3,
    order: 6,
    title: "forEach внутри метода",
    tags: ["this", "arrow"],
    strict: false,
    code: "const calc = {\n  total: 0,\n  sum(list) {\n    list.forEach(function (n) { console.log('regular:', this.total + n); });\n    list.forEach((n) => console.log('arrow:', this.total + n));\n  },\n};\ncalc.sum([1, 2]);\n",
    expected: [
      { type: "log", args: ["\"regular:\"", "NaN"] },
      { type: "log", args: ["\"regular:\"", "NaN"] },
      { type: "log", args: ["\"arrow:\"", "1"] },
      { type: "log", args: ["\"arrow:\"", "2"] },
    ],
    answer: "regular: NaN дважды, затем arrow: 1 и arrow: 2",
    theory: "`forEach` зовёт колбэк как обычную функцию и свой `this` не передаёт. У обычного колбэка он берётся из правила вызова: голая функция в нестрогом коде получает глобальный объект, где `total` нет, поэтому `undefined + 1` даёт `NaN`. Стрелка замыкает `this` из `sum`, а там `calc` с `total: 0`. Если нужен обычный колбэк, контекст передают вторым аргументом: `list.forEach(fn, calc)`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.7",
    kind: "predict",
    level: 3,
    order: 7,
    title: "Метод уехал в map без хозяина",
    tags: ["this", "class"],
    strict: false,
    code: "class Scale {\n  constructor(factor) { this.factor = factor; }\n  apply(n) { return n * this.factor; }\n}\nconst ten = new Scale(10);\nconsole.log([1, 2, 3].map(ten.apply));\n",
    expected: [
      { type: "error", name: "TypeError", message: "Cannot read properties of undefined (reading 'factor')" },
    ],
    answer: "TypeError: Cannot read properties of undefined (reading 'factor')",
    theory: "`ten.apply` — это просто ссылка на функцию, объект-хозяин при передаче теряется. `map` вызывает колбэк как обычную функцию, а тело метода класса всегда строгое, поэтому `this` внутри равен `undefined` и чтение `this.factor` бросает `TypeError`. Рабочие варианты: `map((n) => ten.apply(n))` или `map(ten.apply.bind(ten))`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.8",
    kind: "predict",
    level: 3,
    order: 8,
    title: "bind каррирует аргументы",
    tags: ["this", "bind"],
    strict: false,
    code: "function tag(label, n) { console.log(this.prefix + label + n); }\nconst makeId = tag.bind({ prefix: '#' }, 'id-');\nmakeId(7);\nmakeId(8);\nconsole.log(tag.length, makeId.length);\n",
    expected: [
      { type: "log", args: ["\"#id-7\""] },
      { type: "log", args: ["\"#id-8\""] },
      { type: "log", args: ["2", "1"] },
    ],
    answer: "#id-7, #id-8, затем 2 1",
    theory: "`bind` делает две вещи сразу: навсегда фиксирует `this` и подставляет первые аргументы слева. `makeId(7)` — это `tag.call({ prefix: '#' }, 'id-', 7)`. Исходная `tag` по-прежнему ждёт два аргумента, а у `makeId` один уже приклеен, поэтому `length` падает с 2 до 1.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.9",
    kind: "predict",
    level: 3,
    order: 9,
    title: "apply, call со spread и обычный вызов",
    tags: ["this", "call"],
    strict: false,
    code: "function join(a, b, c) { console.log(typeof this, a + b + c); }\nconst args = [1, 2, 3];\njoin.apply(null, args);\njoin.call(null, ...args);\njoin(...args);\n",
    expected: [
      { type: "log", args: ["\"object\"", "6"] },
      { type: "log", args: ["\"object\"", "6"] },
      { type: "log", args: ["\"object\"", "6"] },
    ],
    answer: "object 6 три раза",
    theory: "`apply` принимает аргументы одним массивом, `call` — обычным списком, поэтому туда передают spread. Дальше разницы нет: оба вызывают ту же функцию с явно заданным `this`. Здесь `this` равен `null`, но код нестрогий, и вместо `null` подставляется глобальный объект — поэтому `typeof` показывает `object`. Обычный `join(...args)` не задаёт `this` вообще, и получает то же самое.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.10",
    kind: "predict",
    level: 3,
    order: 10,
    title: "Геттер и потерянный this",
    tags: ["this"],
    strict: false,
    code: "const user = {\n  name: 'max',\n  get tag() { return this.name + '!'; },\n};\nconsole.log(user.tag);\nconst getTag = Object.getOwnPropertyDescriptor(user, 'tag').get;\nconsole.log(getTag());\nconsole.log(getTag.call({ name: 'ann' }));\n",
    expected: [
      { type: "log", args: ["\"max!\""] },
      { type: "log", args: ["\"undefined!\""] },
      { type: "log", args: ["\"ann!\""] },
    ],
    answer: "max!, undefined!, ann!",
    theory: "Чтение `user.tag` вызывает геттер как метод, поэтому `this` — это `user`. Если достать функцию геттера и позвать её отдельно, контекст потеряется ровно как у обычного метода: нестрогий вызов подставит глобальный объект, у него нет `name`, и получится `undefined!`. `call` возвращает контекст руками — отсюда `ann!`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.11",
    kind: "predict",
    level: 3,
    order: 11,
    title: "Метод класса через обёртку",
    tags: ["this", "class"],
    strict: false,
    code: "class Counter {\n  constructor(step) { this.step = step; }\n  add(n) { return n + this.step; }\n}\nconst c = new Counter(10);\nconst wrap = (fn) => fn(1);\nconsole.log('прямой вызов:', c.add(1));\ntry {\n  console.log('через обёртку:', wrap(c.add));\n} catch (e) {\n  console.log(e.name);\n}\n",
    expected: [
      { type: "log", args: ["\"прямой вызов:\"", "11"] },
      { type: "log", args: ["\"TypeError\""] },
    ],
    answer: "прямой вызов: 11, затем TypeError",
    theory: "`c.add(1)` — вызов метода, `this` это `c`, получается 11. В `wrap(c.add)` уезжает только функция, связь с `c` не сохраняется: `wrap` зовёт её как `fn(1)`, а тело метода класса строгое, поэтому `this` равен `undefined` и `this.step` бросает `TypeError`. Лечится стрелкой в классе или `c.add.bind(c)`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.12",
    kind: "predict",
    level: 3,
    order: 12,
    title: "Стрелка и обычная функция рядом в методе",
    tags: ["this", "arrow"],
    strict: false,
    code: "const timer = {\n  label: 'tick',\n  start() {\n    const arrow = () => this.label;\n    const regular = function () { return this && this.label; };\n    console.log(arrow());\n    console.log(regular());\n  },\n};\ntimer.start();\n",
    expected: [
      { type: "log", args: ["\"tick\""] },
      { type: "log", args: ["undefined"] },
    ],
    answer: "tick, затем undefined",
    theory: "Обе функции объявлены внутри `start`, но `this` берут по-разному. Стрелка своего `this` не имеет вовсе и читает его из `start`, где это `timer`. У обычной функции `this` определяется в момент вызова: она вызвана как `regular()`, значит в нестрогом коде получит глобальный объект, у которого нет `label`. Проверка `this &&` нужна, чтобы не упасть в strict mode.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.13",
    kind: "predict",
    level: 3,
    order: 13,
    title: "Конструктор вернул объект",
    tags: ["this", "prototype"],
    strict: false,
    code: "function A() { this.kind = 'instance'; return { kind: 'returned' }; }\nfunction B() { this.kind = 'instance'; return 42; }\nconsole.log(new A().kind, new B().kind);\nconsole.log(new A() instanceof A, new B() instanceof B);\n",
    expected: [
      { type: "log", args: ["\"returned\"", "\"instance\""] },
      { type: "log", args: ["false", "true"] },
    ],
    answer: "returned instance, затем false true",
    theory: "С `new` объект, созданный под `this`, возвращается автоматически, но только если конструктор не вернул объект сам. `A` вернул литерал — именно он и станет результатом, поэтому `new A() instanceof A` ложно. Число `42` объектом не является, его игнорируют, и `new B()` отдаёт `this` с прототипом `B.prototype`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.14",
    kind: "predict",
    level: 3,
    order: 14,
    title: "IIFE: свой strict внутри нестрогого файла",
    tags: ["this"],
    strict: false,
    code: "(function () {\n  console.log('без strict:', this === globalThis);\n})();\n(function () {\n  'use strict';\n  console.log('со strict:', this === undefined);\n})();\n(function () {\n  console.log('с call:', this.tag);\n}).call({ tag: 'ctx' });\n",
    expected: [
      { type: "log", args: ["\"без strict:\"", "true"] },
      { type: "log", args: ["\"со strict:\"", "true"] },
      { type: "log", args: ["\"с call:\"", "\"ctx\""] },
    ],
    answer: "без strict: true, со strict: true, затем с call: ctx",
    theory: "IIFE — та же голая функция, просто вызванная сразу. Строгость задаёт директива внутри самой функции, а не файл: первая получает подставленный глобальный объект, вторая — `undefined`. Своего `this` у IIFE нет, но его можно задать снаружи: `.call({ tag: 'ctx' })` подставит объект, и он же попадёт в `this` внутри.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.15",
    kind: "predict",
    level: 3,
    order: 15,
    title: "Reflect.apply и строгая функция",
    tags: ["this", "call"],
    strict: false,
    code: "function sloppy() { console.log('sloppy:', this === globalThis, this === null); }\nfunction strict() { 'use strict'; console.log('strict:', this === null, this === globalThis); }\nReflect.apply(sloppy, null, []);\nReflect.apply(strict, null, []);\nsloppy.call(null);\n",
    expected: [
      { type: "log", args: ["\"sloppy:\"", "true", "false"] },
      { type: "log", args: ["\"strict:\"", "true", "false"] },
      { type: "log", args: ["\"sloppy:\"", "true", "false"] },
    ],
    answer: "sloppy: true false, strict: true false, затем снова sloppy: true false",
    theory: "`Reflect.apply(fn, thisArg, args)` делает ровно то же, что `fn.apply(thisArg, args)`, только без промежуточного свойства у функции. `null` как `thisArg` — это запрос \"без объекта\": нестрогая функция вместо `null` получает глобальный объект, поэтому первое сравнение истинно, а второе нет. Строгая функция ничего не подменяет и видит настоящий `null`. Третья строка показывает, что `Function.prototype.call` с тем же `thisArg` даёт ровно тот же результат, что и `Reflect.apply`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.16",
    kind: "predict",
    level: 3,
    order: 16,
    title: "bind не спасает от new",
    tags: ["this", "bind"],
    strict: false,
    code: "function Point(x, y) { this.x = x; this.y = y; }\nconst atZero = Point.bind({ x: 0, y: 0 });\natZero(5, 6);\nconst p = new atZero(1, 2);\nconsole.log(p.x, p.y, p instanceof Point);\n",
    expected: [
      { type: "log", args: ["1", "2", "true"] },
    ],
    answer: "1 2 true",
    theory: "`bind` игнорируется, если функцию вызвали через `new`: конструктор получает свежий объект, а не привязанный `{ x: 0, y: 0 }`. Привязанные аргументы при этом работают, а `prototype` для экземпляра берётся у исходной `Point`, поэтому `instanceof` истинно. Первый вызов `atZero(5, 6)` пишет в привязанный объект, но его никто не читает.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
  {
    id: "3.17",
    kind: "predict",
    level: 3,
    order: 17,
    title: "Примитив в call упаковывается в объект",
    tags: ["this", "call"],
    strict: false,
    code: "function box(extra) { console.log(typeof this, String(this) + extra); }\nbox.call(7, '!');\nbox.call('str', '!');\n",
    expected: [
      { type: "log", args: ["\"object\"", "\"7!\""] },
      { type: "log", args: ["\"object\"", "\"str!\""] },
    ],
    answer: "object 7!, затем object str!",
    theory: "В нестрогом режиме `this` обязан быть объектом, поэтому примитив из `call` движок оборачивает в объект-обёртку: число в `Number`, строку в `String`. `typeof` всегда `object`, а `String(this)` возвращает исходный примитив. В strict mode упаковки нет: `this` остался бы числом `7`, и `typeof` дал бы `number`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1,
  },
];
