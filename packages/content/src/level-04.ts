/**
 * Уровень 4. Карточки в порядке тропы.
 * `expected` у predict-карточек — машинная лента, её не пишут руками:
 * она снимается раннером (см. packages/runner). Меняешь `code` — пересними ленту.
 */
export const CARDS = [
  {
    id: "4.1",
    kind: "predict",
    level: 4,
    order: 1,
    title: "Мутация прототипа и замена ссылки",
    tags: [
      "prototype"
    ],
    strict: false,
    code: "function A() {}\nA.prototype.x = 1;\nconst a = new A();\nA.prototype.x = 2;\nconsole.log(a.x);\nA.prototype = { x: 3 };\nconsole.log(a.x, new A().x);\n",
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
          "2",
          "3"
        ]
      }
    ],
    answer: "2; затем 2 и 3",
    theory: "`a.x` читается с объекта прототипа. Пока это тот же объект, `A.prototype.x = 2` видно и старому экземпляру. Присваивание `A.prototype = { x: 3 }` меняет ссылку у конструктора, но не `[[Prototype]]` уже созданного `a`: у него по-прежнему `2`. Новый `new A()` смотрит уже на новый объект и видит `3`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.2",
    kind: "predict",
    level: 4,
    order: 2,
    title: "super ищет метод, this остаётся экземпляром",
    tags: [
      "classes",
      "prototype"
    ],
    strict: false,
    code: "class A {\n  constructor() { this.name = 'A'; }\n  say() { return 'A:' + this.name; }\n}\nclass B extends A {\n  constructor() { super(); this.name = 'B'; }\n  say() { return 'B>' + super.say(); }\n}\nconsole.log(new B().say());\n",
    expected: [
      {
        type: "log",
        args: [
          "\"B>A:B\""
        ]
      }
    ],
    answer: "B>A:B",
    theory: "`super()` обязателен до `this`. Затем `B` перезаписывает `name`. `super.say()` берёт метод с прототипа `A`, но `this` остаётся экземпляром `B`, поэтому внутри `A.say` имя уже `\"B\"`. Снаружи строка собирается как `\"B>\" + \"A:B\"`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.3",
    kind: "predict",
    level: 4,
    order: 3,
    title: "in, hasOwn и keys",
    tags: [
      "prototype"
    ],
    strict: false,
    code: "const o = Object.create({ a: 1 });\no.b = 2;\nconsole.log('a' in o, Object.hasOwn(o, 'a'), Object.keys(o));\n",
    expected: [
      {
        type: "log",
        args: [
          "true",
          "false",
          "[\"b\"]"
        ]
      }
    ],
    answer: "true false ['b']",
    theory: "`in` идёт по цепочке прототипов, `a` находится. `Object.hasOwn` и `Object.keys` смотрят только собственные ключи: `a` чужой, собственный перечислимый ключ один — `b`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.4",
    kind: "predict",
    level: 4,
    order: 4,
    title: "Два похожих имени у одной функции",
    tags: [
      "prototype",
      "object"
    ],
    strict: false,
    code: "function F() {}\nconst f = new F();\nconsole.log(f.__proto__ === F.prototype, typeof F.__proto__, F.__proto__ === Function.prototype);\nconst Child = F.bind(null);\nconsole.log(Child.prototype === F.prototype, typeof Child.prototype === 'undefined');\nconsole.log(F.__proto__ === Function.prototype);\n",
    expected: [
      {
        type: "log",
        args: [
          "true",
          "\"function\"",
          "true"
        ]
      },
      {
        type: "log",
        args: [
          "false",
          "true"
        ]
      },
      {
        type: "log",
        args: [
          "true"
        ]
      }
    ],
    answer: "true, function, true; false, true; true",
    theory: "`prototype` — обычное свойство функции-конструктора: объект, который получат будущие экземпляры. `__proto__` — геттер/сеттер из `Object.prototype`: он читает и пишет `[[Prototype]]` самого объекта. Для экземпляра это `F.prototype`, для самой функции — `Function.prototype`, потому что функция тоже объект и её цепочка ведёт к функциям. У стрелочных функций и у `bind`-обёрток собственного `prototype` нет вовсе.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.5",
    kind: "predict",
    level: 4,
    order: 5,
    title: "Объект, у которого нет прототипа",
    tags: [
      "prototype",
      "object"
    ],
    strict: false,
    code: "const o = Object.create(null);\no.x = 1;\nconsole.log(Object.getPrototypeOf(o), JSON.stringify(o));\nconsole.log(String(o.toString), String(o.hasOwnProperty));\nconsole.log('toString' in o, 'x' in o, Object.keys(o));\n",
    expected: [
      {
        type: "log",
        args: [
          "null",
          "\"{\\\"x\\\":1}\""
        ]
      },
      {
        type: "log",
        args: [
          "\"undefined\"",
          "\"undefined\""
        ]
      },
      {
        type: "log",
        args: [
          "false",
          "true",
          "[\"x\"]"
        ]
      }
    ],
    answer: "null, {x:1}; undefined undefined; false true ['x']",
    theory: "`Object.create(null)` создаёт объект с `[[Prototype]] = null`: цепочка обрывается сразу, и весь `Object.prototype` с его `toString`, `hasOwnProperty`, `valueOf` недоступен. Поэтому `o.toString` — `undefined`, а не функция, хотя `JSON.stringify` работает: он не зовёт методы объекта. Оператор `in` тоже перестаёт находить что-либо унаследованное, а `Object.keys` видит только собственный `x`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.6",
    kind: "predict",
    level: 4,
    order: 6,
    title: "Присваивание экземпляру мимо прототипа",
    tags: [
      "prototype",
      "object"
    ],
    strict: false,
    code: "function User() {}\nUser.prototype.role = 'guest';\nconst u = new User();\nconsole.log(u.role, u.hasOwnProperty('role'));\nu.role = 'admin';\nconsole.log(u.role, u.hasOwnProperty('role'), User.prototype.role);\ndelete u.role;\nconsole.log(u.role, u.hasOwnProperty('role'));\n",
    expected: [
      {
        type: "log",
        args: [
          "\"guest\"",
          "false"
        ]
      },
      {
        type: "log",
        args: [
          "\"admin\"",
          "true",
          "\"guest\""
        ]
      },
      {
        type: "log",
        args: [
          "\"guest\"",
          "false"
        ]
      }
    ],
    answer: "guest false; admin true guest; guest",
    theory: "Чтение `u.role` поднимается по цепочке и находит `role` в `User.prototype`, а `hasOwnProperty` показывает, что собственного свойства у `u` нет. Присваивание `u.role = 'admin'` не трогает прототип: движок создаёт новое собственное свойство на самом `u`, которое затеняет унаследованное. Прототип по-прежнему хранит `'guest'`, поэтому `delete u.role` возвращает прежнюю картину.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.7",
    kind: "predict",
    level: 4,
    order: 7,
    title: "Старый экземпляр после подмены прототипа",
    tags: [
      "prototype",
      "inheritance"
    ],
    strict: false,
    code: "function F() {}\nconst oldIns = new F();\nF.prototype = {};\nconst newIns = new F();\nconsole.log(oldIns instanceof F, newIns instanceof F);\nconsole.log(Object.getPrototypeOf(oldIns) === F.prototype, Object.getPrototypeOf(newIns) === F.prototype);\n",
    expected: [
      {
        type: "log",
        args: [
          "false",
          "true"
        ]
      },
      {
        type: "log",
        args: [
          "false",
          "true"
        ]
      }
    ],
    answer: "false true; false true",
    theory: "`instanceof` не хранит ничего у себя: он берёт `[[Prototype]]` левого операнда и идёт по цепочке, сравнивая звенья с текущим `F.prototype`. Подмена `F.prototype = {}` меняет только свойство конструктора, поэтому свежесозданный `newIns` получает новую цепочку, а `oldIns` продолжает ссылаться на старый объект и перестаёт быть «экземпляром» `F`. Это ломает и `instanceof`, и наследование у уже созданных объектов.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.8",
    kind: "predict",
    level: 4,
    order: 8,
    title: "Кто печатает первым в цепочке классов",
    tags: [
      "classes",
      "inheritance"
    ],
    strict: false,
    code: "class Parent {\n  constructor() { console.log('parent ctor'); }\n}\nclass Child extends Parent {\n  constructor() { console.log('child ctor'); super(); }\n}\nnew Child();\n",
    expected: [
      {
        type: "log",
        args: [
          "\"child ctor\""
        ]
      },
      {
        type: "log",
        args: [
          "\"parent ctor\""
        ]
      }
    ],
    answer: "child ctor, затем parent ctor",
    theory: "`extends` связывает два прототипа, но не меняет порядок выполнения: тело конструктора `Child` начинает работать сразу, и `console.log` до `super()` успевает выполниться. Вызов `super()` уже внутри себя запускает конструктор `Parent`, который и печатает вторую строку. Отсюда правило: до `super()` в теле нет `this`, потому что объект создаёт именно родительский конструктор.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.9",
    kind: "predict",
    level: 4,
    order: 9,
    title: "Где живут статические методы и поля",
    tags: [
      "classes",
      "object"
    ],
    strict: false,
    code: "class Counter {\n  static count = 0;\n  constructor() { Counter.count += 1; }\n  static describe() { return 'count=' + this.count; }\n}\nnew Counter();\nnew Counter();\nconsole.log(Counter.describe());\nconsole.log(Object.hasOwn(Counter, 'describe'), 'describe' in Counter, Object.hasOwn(Counter.prototype, 'describe'));\nconsole.log('count' in new Counter());\n",
    expected: [
      {
        type: "log",
        args: [
          "\"count=2\""
        ]
      },
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
          "false"
        ]
      }
    ],
    answer: "count=2; true true false; false",
    theory: "`static` кладёт свойство на саму функцию-конструктор, а не на её `prototype`: поэтому `describe` есть у `Counter` и нет у экземпляра. Внутри статического метода `this` — это класс, так что `this.count` читает статическое же поле `count`. Экземпляр о статике не знает вовсе: `'count' in new Counter()` — `false`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.10",
    kind: "predict",
    level: 4,
    order: 10,
    title: "Геттер в классе против геттера в литерале",
    tags: [
      "classes",
      "object",
      "prototype"
    ],
    strict: false,
    code: "class Circle {\n  constructor(r) { this.r = r; }\n  get area() { return this.r * this.r; }\n}\nconst c = new Circle(3);\nconsole.log(c.area, Object.keys(c), Object.hasOwn(c, 'area'));\nconst lit = { r: 3, get area() { return this.r * this.r; } };\nconsole.log(lit.area, Object.keys(lit), Object.hasOwn(lit, 'area'));\n",
    expected: [
      {
        type: "log",
        args: [
          "9",
          "[\"r\"]",
          "false"
        ]
      },
      {
        type: "log",
        args: [
          "9",
          "[\"r\", \"area\"]",
          "true"
        ]
      }
    ],
    answer: "9 ['r'] false; 9 ['r', 'area'] true",
    theory: "В классе `get area` попадает в `Circle.prototype` как неперечислимое свойство-аксессор, поэтому у экземпляра собственных ключей только `r`, а `Object.hasOwn` для `area` — `false`. В литерале объекта геттер задаётся прямо на этом объекте, попадает в его собственные свойства и, что важнее, оказывается перечислимым: `Object.keys` его показывает.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.11",
    kind: "predict",
    level: 4,
    order: 11,
    title: "Собственные ключи и вся цепочка",
    tags: [
      "inheritance",
      "prototype",
      "object"
    ],
    strict: false,
    code: "function Base() { this.own = 1; }\nBase.prototype.base = 'base';\nfunction Mid() { Base.call(this); }\nMid.prototype = Object.create(Base.prototype);\nMid.prototype.mid = 'mid';\nconst m = new Mid();\nconsole.log(m.base, m.mid, m.own);\nconsole.log(Object.keys(m));\nconst collected = [];\nfor (const k in m) collected.push(k);\nconsole.log(collected);\n",
    expected: [
      {
        type: "log",
        args: [
          "\"base\"",
          "\"mid\"",
          "1"
        ]
      },
      {
        type: "log",
        args: [
          "[\"own\"]"
        ]
      },
      {
        type: "log",
        args: [
          "[\"own\", \"mid\", \"base\"]"
        ]
      }
    ],
    answer: "base mid 1; ['own']; ['own', 'mid', 'base']",
    theory: "`Object.keys` возвращает только собственные перечислимые ключи, поэтому видит лишь `own`, созданный в конструкторе. `for...in` идёт по всей цепочке прототипов и добавляет перечислимые чужие ключи: `mid` из `Mid.prototype` и `base` из `Base.prototype`. Порядок обхода — сначала собственные, потом по цепочке вверх.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.12",
    kind: "predict",
    level: 4,
    order: 12,
    title: "Свой метод, дописанный массивам",
    tags: [
      "prototype",
      "object"
    ],
    strict: false,
    code: "const arr = [1, 2, 3];\nArray.prototype.last = function () { return this[this.length - 1]; };\nconsole.log(arr.last(), [9, 8].last(), [].last());\nconst seen = [];\nfor (const k in arr) seen.push(k);\nconsole.log(seen);\nconsole.log(Object.keys(arr));\ndelete Array.prototype.last;\nconsole.log(String(arr.last));\n",
    expected: [
      {
        type: "log",
        args: [
          "3",
          "8",
          "undefined"
        ]
      },
      {
        type: "log",
        args: [
          "[\"0\", \"1\", \"2\", \"last\"]"
        ]
      },
      {
        type: "log",
        args: [
          "[\"0\", \"1\", \"2\"]"
        ]
      },
      {
        type: "log",
        args: [
          "\"undefined\""
        ]
      }
    ],
    answer: "3 8 undefined; ['0','1','2','last']; ['0','1','2']; undefined",
    theory: "Присваивание в `Array.prototype` попадает в общий объект-прототип массивов, поэтому метод тут же видят все массивы, а не только `arr`. Обычное присваивание делает свойство перечислимым, в отличие от встроенных методов, и оно всплывает в `for...in`, хотя `Object.keys` его не покажет — это собственный ключ прототипа, а не массива. Удаление из прототипа убирает метод сразу у всех массивов.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.13",
    kind: "predict",
    level: 4,
    order: 13,
    title: "instanceof для числа и строки",
    tags: [
      "classes",
      "object"
    ],
    strict: false,
    code: "class Temperature {\n  constructor() { this.celsius = 20; }\n  static [Symbol.hasInstance](v) { return typeof v === 'number'; }\n}\nconsole.log(42 instanceof Temperature, 'text' instanceof Temperature);\nconsole.log(42 instanceof Number, 'text' instanceof String, new Number(42) instanceof Number);\nconsole.log(42 instanceof Object, 'text' instanceof Object, null instanceof Object);\n",
    expected: [
      {
        type: "log",
        args: [
          "true",
          "false"
        ]
      },
      {
        type: "log",
        args: [
          "false",
          "false",
          "true"
        ]
      },
      {
        type: "log",
        args: [
          "false",
          "false",
          "false"
        ]
      }
    ],
    answer: "true false; false false false; false false false",
    theory: "По умолчанию `instanceof` идёт по цепочке прототипов, а примитив объектом не является, поэтому `42 instanceof Number` — `false` (обёрнутое `new Number(42)` дало бы `true`). Свой `Symbol.hasInstance` переопределяет проверку целиком: метод получает левый операнд как есть, и класс сам решает, что считать своим экземпляром — здесь любое число. Для строки и `null` такого метода никто не объявлял, и они снова упираются в обычное правило.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "4.14",
    kind: "predict",
    level: 4,
    order: 14,
    title: "Где остановится поиск в цепочке из трёх звеньев",
    tags: [
      "inheritance",
      "prototype"
    ],
    strict: false,
    code: "function Top() {}\nTop.prototype.kind = 'top';\nfunction Mid() {}\nMid.prototype = Object.create(Top.prototype);\nMid.prototype.kind = 'mid';\nfunction Leaf() {}\nLeaf.prototype = Object.create(Mid.prototype);\nconst l = new Leaf();\nconsole.log(l.kind, 'kind' in l, Object.hasOwn(l, 'kind'));\ndelete Mid.prototype.kind;\nconsole.log(l.kind, 'kind' in l, Object.hasOwn(l, 'kind'));\ndelete Top.prototype.kind;\nconsole.log(l.kind, 'kind' in l, Object.hasOwn(l, 'kind'));\n",
    expected: [
      {
        type: "log",
        args: [
          "\"mid\"",
          "true",
          "false"
        ]
      },
      {
        type: "log",
        args: [
          "\"top\"",
          "true",
          "false"
        ]
      },
      {
        type: "log",
        args: [
          "undefined",
          "false",
          "false"
        ]
      }
    ],
    answer: "mid true false; top true false; undefined false false",
    theory: "`[[Prototype]]` экземпляра — `Leaf.prototype`, выше `Mid.prototype`, ещё выше `Top.prototype`: поиск идёт снизу вверх и останавливается на первом совпадении, поэтому `kind` находится на среднем звене и до `Top` не доходит. После `delete` среднее звено теряет ключ, и поиск продолжается выше — теперь виден `top`. Когда свойство удалено отовсюду, `in` тоже даёт `false`, хотя `Object.hasOwn` и раньше был `false`: у экземпляра ключа нет ни в один момент.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  }
];
