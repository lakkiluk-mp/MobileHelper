/**
 * Уровень 5. Карточки в порядке тропы.
 * `expected` у predict-карточек — машинная лента, её не пишут руками:
 * она снимается раннером (см. packages/runner). Меняешь `code` — пересними ленту.
 */
export const CARDS = [
  {
    id: "5.1",
    kind: "predict",
    level: 5,
    order: 1,
    title: "Синхронный код, микротаск, таймер",
    tags: [
      "event-loop",
      "promises"
    ],
    strict: false,
    code: "console.log(1);\nsetTimeout(() => console.log(2));\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);\n",
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
          "4"
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
          "2"
        ]
      }
    ],
    answer: "1 4 3 2",
    theory: "Сначала весь синхронный код: `1` и `4`. Потом очередь микротасков: колбэк `then` печатает `3`. Таймер — макротаск и идёт после микротасков, это `2`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "5.2",
    kind: "predict",
    level: 5,
    order: 2,
    title: "Тело промиса синхронно",
    tags: [
      "promises",
      "event-loop"
    ],
    strict: false,
    code: "new Promise(res => { console.log(1); res(2); console.log(3); }).then(console.log);\nconsole.log(4);\n",
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
      },
      {
        type: "log",
        args: [
          "4"
        ]
      },
      {
        type: "log",
        args: [
          "2"
        ]
      }
    ],
    answer: "1 3 4 2",
    theory: "Исполнитель `new Promise` вызывается сразу, на том же стеке: `1`, резолв, `3`. Затем синхронный `4`. Колбэк `then` поставлен в микротаски и печатает уже переданное `2`. `res` не останавливает исполнитель.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "5.3",
    kind: "predict",
    level: 5,
    order: 3,
    title: "await отдаёт управление",
    tags: [
      "promises",
      "event-loop"
    ],
    strict: false,
    code: "async function f() {\n  console.log('a');\n  await null;\n  console.log('b');\n}\nconsole.log('start');\nf();\nconsole.log('end');\n",
    expected: [
      {
        type: "log",
        args: [
          "\"start\""
        ]
      },
      {
        type: "log",
        args: [
          "\"a\""
        ]
      },
      {
        type: "log",
        args: [
          "\"end\""
        ]
      },
      {
        type: "log",
        args: [
          "\"b\""
        ]
      }
    ],
    answer: "start a end b",
    theory: "`async`-функция идёт синхронно до первого `await`. Сначала `start`, потом `a`, затем `await` возвращает управление вызывающему, печатается `end`. Продолжение после `await` — микротаск, это `b`. `await null` оборачивается в выполненный промис.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "5.4",
    kind: "predict",
    level: 5,
    order: 4,
    title: "Две очереди: микротаски и таймеры",
    tags: [
      "event-loop",
      "promises"
    ],
    strict: false,
    code: "setTimeout(() => console.log('t1'));\nPromise.resolve()\n  .then(() => { console.log('p1'); setTimeout(() => console.log('t2')); })\n  .then(() => console.log('p2'));\nqueueMicrotask(() => console.log('m'));\n",
    expected: [
      {
        type: "log",
        args: [
          "\"p1\""
        ]
      },
      {
        type: "log",
        args: [
          "\"m\""
        ]
      },
      {
        type: "log",
        args: [
          "\"p2\""
        ]
      },
      {
        type: "log",
        args: [
          "\"t1\""
        ]
      },
      {
        type: "log",
        args: [
          "\"t2\""
        ]
      }
    ],
    answer: "p1 m p2 t1 t2",
    theory: "После синхронного кода в микротасках уже стоят реакция промиса и `queueMicrotask`. Сначала `p1`: внутри него планируется `t2`, но таймер не вклинивается в микротаски. Затем `m`, затем вторая реакция `p2`. Макротаски в порядке постановки: раньше запланирован `t1`, потом `t2`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "5.5",
    kind: "predict",
    level: 5,
    order: 5,
    title: "throw, catch, finally, затем then",
    tags: [
      "promises"
    ],
    strict: false,
    code: "Promise.resolve(1)\n  .then(x => { throw x + 1; })\n  .then(x => console.log(x))\n  .catch(e => { console.log(e); return e * 10; })\n  .finally(() => console.log('finally'))\n  .then(x => console.log(x));\n",
    expected: [
      { type: "log", args: ["2"] },
      { type: "log", args: ["\"finally\""] },
      { type: "log", args: ["20"] },
    ],
    answer: "2, finally, 20",
    theory: "`throw` внутри `then` отклоняет цепочку, следующий `then` пропускается. `catch` печатает `2` и возвращает `20`, дальше цепочка снова успешна. `finally` выполняется перед следующим `then` и не подменяет значение. Последний `then` получает `20`.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  },
  {
    id: "5.6",
    kind: "predict",
    level: 5,
    order: 6,
    title: "Три then на одном промисе против цепочки",
    tags: [
      "promises",
      "microtasks"
    ],
    strict: false,
    code: "const p = Promise.resolve('v');\np.then(() => console.log('A'));\np.then(() => console.log('B'));\np.then(x => { console.log('C'); return x; }).then(() => console.log('D'));\nconsole.log('sync');\n",
    expected: [
      { type: "log", args: ["\"sync\""] },
      { type: "log", args: ["\"A\""] },
      { type: "log", args: ["\"B\""] },
      { type: "log", args: ["\"C\""] },
      { type: "log", args: ["\"D\""] },
    ],
    answer: "sync, A, B, C, D",
    theory: "`then` не заменяет обработчик, а добавляет ещё одну реакцию на тот же промис. Три реакции на `p` встают в очередь микротасков в порядке подписки, поэтому `A`, `B`, `C` идут подряд, а синхронный `sync` успевает напечататься раньше всех. `D` подписан не на `p`, а на промис, который вернул третий `then`: он попадает в очередь только после того, как отработает `C`.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  },
  {
    id: "5.7",
    kind: "predict",
    level: 5,
    order: 7,
    title: "queueMicrotask и then — одна и та же очередь",
    tags: [
      "microtasks",
      "promises"
    ],
    strict: false,
    code: "setTimeout(() => console.log('t'));\nqueueMicrotask(() => console.log('m1'));\nPromise.resolve().then(() => console.log('p1'));\nqueueMicrotask(() => console.log('m2'));\nPromise.resolve().then(() => console.log('p2'));\n",
    expected: [
      {
        type: "log",
        args: [
          "\"m1\""
        ]
      },
      {
        type: "log",
        args: [
          "\"p1\""
        ]
      },
      {
        type: "log",
        args: [
          "\"m2\""
        ]
      },
      {
        type: "log",
        args: [
          "\"p2\""
        ]
      },
      {
        type: "log",
        args: [
          "\"t\""
        ]
      }
    ],
    answer: "m1, p1, m2, p2, t",
    theory: "`queueMicrotask` и реакция `then` кладут работу в одну и ту же очередь микротасков — отдельного приоритета ни у кого нет. Порядок задаёт момент постановки, поэтому задачи идут вперемешку: `m1`, `p1`, `m2`, `p2`. Таймер ждёт, пока очередь микротасков не опустеет полностью.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "5.8",
    kind: "predict",
    level: 5,
    order: 8,
    title: "for с await против forEach",
    tags: [
      "async",
      "microtasks"
    ],
    strict: false,
    code: "const items = [1];\nasync function withFor() {\n  for (const x of items) {\n    await null;\n    console.log('for');\n  }\n  console.log('for end');\n}\nasync function withForEach() {\n  items.forEach(async (x) => {\n    await null;\n    console.log('each');\n  });\n  console.log('each end');\n}\nwithFor();\nwithForEach();\nconsole.log('sync');\n",
    expected: [
      { type: "log", args: ["\"each end\""] },
      { type: "log", args: ["\"sync\""] },
      { type: "log", args: ["\"for\""] },
      { type: "log", args: ["\"for end\""] },
      { type: "log", args: ["\"each\""] },
    ],
    answer: "each end, sync, for, each, for end",
    theory: "`for` с `await` ждёт каждую итерацию внутри одной функции, поэтому `for end` идёт только после `for`. `forEach` только вызывает колбэк и не смотрит, что тот вернул промис, — он не умеет ждать, поэтому `each end` печатается сразу, синхронно, ещё до первой итерации. Колбэк `forEach` при этом честно доигрывает в микротаске и вклинивается между `for` и `for end`.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  },
  {
    id: "5.9",
    kind: "predict",
    level: 5,
    order: 9,
    title: "async без return: что приходит в await",
    tags: [
      "async",
      "promises"
    ],
    strict: false,
    code: "async function noValue() {\n  console.log('body');\n}\nasync function main() {\n  const result = await noValue();\n  console.log(result);\n}\nmain();\nconsole.log('sync');\n",
    expected: [
      { type: "log", args: ["\"body\""] },
      { type: "log", args: ["\"sync\""] },
      { type: "log", args: ["undefined"] },
    ],
    answer: "body, sync, undefined",
    theory: "`async`-функция всегда возвращает промис, даже если в теле нет `return`. Без `return` он выполняется со значением `undefined`, и `await` распаковывает именно его — это обычное значение, а не «ничего». Тело до первого `await` идёт синхронно (`body`), а продолжение после `await` — микротаск, поэтому `sync` печатается раньше `undefined`.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  },
  {
    id: "5.10",
    kind: "predict",
    level: 5,
    order: 10,
    title: "throw в async до первого await",
    tags: [
      "async",
      "promises"
    ],
    strict: false,
    code: "async function boom() {\n  console.log('start');\n  throw new Error('bad');\n}\nconsole.log('before');\nconst p = boom();\nconsole.log('after');\np.catch(e => console.log(e.message));\n",
    expected: [
      { type: "log", args: ["\"before\""] },
      { type: "log", args: ["\"start\""] },
      { type: "log", args: ["\"after\""] },
      { type: "log", args: ["\"bad\""] },
    ],
    answer: "before, start, after, bad",
    theory: "`throw` внутри `async`-функции не вылетает в вызывающий код: движок ловит его и превращает в отклонение возвращённого промиса. Поэтому строка `const p = boom()` спокойно завершается, а ошибка становится видна только подписчику. `catch` — это реакция, значит `bad` придёт микротаском уже после синхронного `after`. Без `catch` тот же промис дал бы `unhandledrejection`.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  },
  {
    id: "5.11",
    kind: "predict",
    level: 5,
    order: 11,
    title: "Promise.all с таймерами",
    tags: [
      "promises",
      "timers"
    ],
    strict: false,
    code: "const wait = (ms, v) =>\n  new Promise(res => setTimeout(() => { console.log(v); res(v); }, ms));\nPromise.all([wait(0, 'a'), wait(10, 'b')]).then(values => console.log(values));\nsetTimeout(() => console.log('t0'), 0);\nconsole.log('sync');\n",
    expected: [
      { type: "log", args: ["\"sync\""] },
      { type: "log", args: ["\"a\""] },
      { type: "log", args: ["\"t0\""] },
      { type: "log", args: ["\"b\""] },
      { type: "log", args: ["[\"a\", \"b\"]"] },
    ],
    answer: "sync, a, t0, b, [\"a\", \"b\"]",
    theory: "`Promise.all` не ускоряет работу: он ждёт последний промис, а не первый. Два таймера с нулевой задержкой срабатывают в порядке постановки — сначала `a` (он поставлен первым), потом `t0`. Второй промис резолвится только через 10 мс, и лишь тогда `then` получает массив значений.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  },
  {
    id: "5.12",
    kind: "predict",
    level: 5,
    order: 12,
    title: "Микротаск внутри микротаска против таймера",
    tags: [
      "microtasks",
      "timers"
    ],
    strict: false,
    code: "setTimeout(() => console.log('timeout'));\nPromise.resolve().then(() => {\n  console.log('m1');\n  Promise.resolve().then(() => {\n    console.log('m2');\n    queueMicrotask(() => console.log('m3'));\n  });\n});\nconsole.log('sync');\n",
    expected: [
      {
        type: "log",
        args: [
          "\"sync\""
        ]
      },
      {
        type: "log",
        args: [
          "\"m1\""
        ]
      },
      {
        type: "log",
        args: [
          "\"m2\""
        ]
      },
      {
        type: "log",
        args: [
          "\"m3\""
        ]
      },
      {
        type: "log",
        args: [
          "\"timeout\""
        ]
      }
    ],
    answer: "sync, m1, m2, m3, timeout",
    theory: "Очередь микротасков вычерпывается до конца, а новые микротаски встают в тот же хвост. Поэтому `m1` успевает поставить `m2`, `m2` — `m3`, и все три отрабатывают до таймера. Таймер не «вклинивается» между микротасками, даже если поставлен раньше всех в коде.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "5.13",
    kind: "predict",
    level: 5,
    order: 13,
    title: "Отказ течёт вниз до ближайшего catch",
    tags: [
      "promises"
    ],
    strict: false,
    code: "Promise.resolve('a')\n  .then(v => { console.log(v); throw new Error('x'); })\n  .then(v => console.log(v))\n  .catch(e => { console.log(e.message); return 'b'; })\n  .then(v => { console.log(v); throw new Error('y'); })\n  .catch(e => console.log(e.message));\n",
    expected: [
      { type: "log", args: ["\"a\""] },
      { type: "log", args: ["\"x\""] },
      { type: "log", args: ["\"b\""] },
      { type: "log", args: ["\"y\""] },
    ],
    answer: "a, x, b, y",
    theory: "Отклонённый промис ищет вниз по цепочке первый `catch` и молча проскакивает все `then` на пути — поэтому второй `then` не вызывается вообще. `catch` возвращает `b` и тем самым снова делает цепочку выполненной, так что следующий `then` получает нормальное значение. Новый `throw` внутри него снова отклоняет цепочку, и его ловит уже второй `catch`.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  },
  {
    id: "5.14",
    kind: "predict",
    level: 5,
    order: 14,
    title: "Таймер внутри then и then внутри таймера",
    tags: [
      "event-loop",
      "timers",
      "microtasks"
    ],
    strict: false,
    code: "setTimeout(() => {\n  console.log('t1');\n  Promise.resolve().then(() => console.log('p-in-t'));\n});\nPromise.resolve().then(() => {\n  console.log('p1');\n  setTimeout(() => console.log('t-in-p'));\n});\n",
    expected: [
      {
        type: "log",
        args: [
          "\"p1\""
        ]
      },
      {
        type: "log",
        args: [
          "\"t1\""
        ]
      },
      {
        type: "log",
        args: [
          "\"p-in-t\""
        ]
      },
      {
        type: "log",
        args: [
          "\"t-in-p\""
        ]
      }
    ],
    answer: "p1, t1, p-in-t, t-in-p",
    theory: "Синхронного кода нет, поэтому первым в очереди стоит микротаск `then`: печатается `p1`, и из микротаска ставится таймер `t-in-p`. Дальше цикл событий берёт таймеры: `t1` был поставлен ещё синхронно, значит идёт раньше `t-in-p`. После колбэка `t1` снова вычерпываются микротаски — там уже ждёт `p-in-t`.",
    updatedAt: "2026-10-11T09:00:00.000Z",
    rev: 1
  },
  {
    id: "5.15",
    kind: "predict",
    level: 5,
    order: 15,
    title: "then возвращает промис — цепочка ждёт",
    tags: [
      "promises",
      "timers"
    ],
    strict: false,
    code: "Promise.resolve('a')\n  .then(v => new Promise(res => setTimeout(() => { console.log('inner'); res('b'); }, 10)))\n  .then(v => console.log(v));\nqueueMicrotask(() => console.log('m'));\nconsole.log('sync');\n",
    expected: [
      { type: "log", args: ["\"sync\""] },
      { type: "log", args: ["\"m\""] },
      { type: "log", args: ["\"inner\""] },
      { type: "log", args: ["\"b\""] },
    ],
    answer: "sync, m, inner, b",
    theory: "Если колбэк `then` вернул промис, следующий `then` ждёт не значения, а его выполнения: движок подписывает цепочку на возвращённый промис. Здесь это заметно по паузе — за время ожидания таймера успевает отработать микротаск `m`. В последний `then` приходит уже `b`, то есть значение, которым резолвнулся внутренний промис.",
    updatedAt: "2026-10-15T09:00:00.000Z",
    rev: 2,
  }
];
