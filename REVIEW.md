# Эталон — полное ревью объектов на баги и улучшения

Дата: ревизия `82c5329` (main, рабочее дерево чистое).
Объём: 63 карточки контента (36 predict + 27 implement, 1 вариант), ~6 400 строк продового
TS/TSX, ~5 000 строк скриптов, 4 SQL-миграции.

## Как проверялось

> **Расположение отчёта и стендов.** Этот отчёт лежит в репозитории как [`REVIEW.md`](REVIEW.md).
> Вспомогательные стенды, которыми проверялись находки (реплей golden-лент, эксплойты к
> CRITICAL-1/2, проверки целостности контента, замеры `strict`/таймаута), остались **вне
> проекта** — в `/private/tmp/etalon-audit/` (`verify.mjs`, `run-golden.mjs`,
> `verify-a1b.mjs`, `verify-a2-fix.mjs`, `verify-a6-a7.mjs`, `cheat.mjs`, `integrity.mjs`
> и другие). Для работы приложения они не нужны; держите их, если захотите перепроверить
> фиксы — например, `verify-a1b.mjs` и `cheat.mjs` должны **перестать** давать зелёный
> вердикт после исправления CRITICAL-1 и CRITICAL-2.

* Прочитаны все файлы `src/`, `packages/`, `scripts/`, `server/`, `migrations/`, `vite.config.ts`.
* Все скриптовые тесты запущены: `node --test scripts/*.test.mjs`.
* **Все 63 карточки + вариант независимо перепроверены** собственным раннером, повторяющим
  `node-host.ts` и `serialize-source.ts` (`/tmp/etalon-audit/verify.mjs`,
  `run-golden.mjs`): **64/64 совпадений с эталонными лентами, 0 расхождений**.
  Это подтверждает, что контент и `expected` внутренне согласованы.
* Дефекты скриптов воспроизведены (симлинк-обход, красный тест-сьют, отсутствующие ассеты).
* `node_modules/` не установлен, поэтому `tsc --noEmit` и `vite build` не запускались —
  всё, что зависит от компиляции/сборки, помечено как непроверенное.

### Снятое подозрение (важно)

В ходе аудита была гипотеза о краше сериализатора в `node-host.ts`. **Она опровергнута:**
`packages/runner/src/node-host.ts:32-35` уже использует обёртку
`args.map((arg) => serializeArg(arg))`. Баг был в моём воспроизводящем стенде, не в репозитории.
Репозиторий содержит ровно одну реальную, достижимую версию этой проблемы — см. HIGH-3.

---

## Сводка

| Severity | Кол-во | Что это |
| --- | --- | --- |
| CRITICAL | 2 | Проверка implement-карточек пропускает краши и считает файлы вместо проверок; тест-харнесс перезаписывается кодом кандидата |
| HIGH | 14 | Красный тест-сьют, ложные «зелёные» гейты, тихая деградация синхронизации, 404-ассеты, доверие произвольному родителю, дыры в схеме контента |
| MEDIUM | 19 | Гонки в синке, доверие клиентскому времени, отсутствие таймаутов, недотестированные ветки раннера, контент без покрытия |
| LOW | 15 | Мёртвый код, 38 неиспользуемых зависимостей, мёртвые поля, опечатки |

**Главное:** приложение работает, контент согласован (64/64 лент), **но проверка implement-карточек
не проверяет то, что должна** — падающий кандидат получает «Все тесты прошли» и в CI, и в UI
(CRITICAL-1), а сам харнесс тестов можно переписать из кода ученика (CRITICAL-2). То есть
у зелёного CI сегодня нет доказательной силы.

---

## Top-10: что чинить первым

1. **CRITICAL-1 · `packages/runner/golden.test.ts:45-50`** — падающий implement-кандидат проходит
   проверку: ошибки не проверяются, а `tests.length >= card.tests.length` сравнивает события
   с числом **блоков**, не проверок. Воспроизведено: 1 из 2 проверок выполнена → PASSED.
2. **CRITICAL-2 · `packages/runner/src/program.ts:32-45`** — `var __test` в одной области
   видимости с кодом кандидата: `__test = {…pass:true…}` даёт «все зелёные» без единой
   настоящей проверки, в CI **и** в iframe ученика. Воспроизведено.
3. **`public/__grok/**` не существует** — 404 на каждой странице + падающие тесты.
4. **`scripts/migration-plan.test.mjs:61`** — красный тест, из-за которого `npm test` целиком
   не выполняется.
5. **`scripts/brand-check.mjs:196`, `preview.mjs:332`, `write-atomic.mjs:71`** — гейты молча
   выходят с кодом 0 через симлинк (воспроизведено).
6. **`src/lib/study.tsx:105-115`** — `pushPending` шлёт весь outbox одним батчем; сервер режет
   на 100 → синк встаёт навсегда.
7. **`src/lib/study.tsx:51` vs `packages/shared/src/sync.ts:11`** — расхождение порядка слияния
   → откат оценки на другом устройстве.
8. **`src/lib/progress.server.ts:35,45`** — доверие клиентскому `updatedAt` → отравление
   прогресса часами устройства.
9. **`packages/runner/src/serialize-source.ts:21`** — `__serialize` достижим из кода ученика
   и крашится при передаче в `.map` (воспроизведено).
10. **`src/lib/preview-embedder-origin.ts:45-50`** — на `*.grok-sandbox.com` доверяется
    **любой** родительский origin.

---

## CRITICAL

### CRITICAL-1. Проверка implement-карточек пропускает краши и считает блоки, а не проверки

`packages/runner/golden.test.ts:45-50`:

```ts
const tests = tape.filter((event) => event.type === "test");
assert.ok(tests.length >= card.tests.length, ...);   // 46
for (const event of tests) { ... assert.equal(event.pass, true, ...); }  // 47-50
```

Две независимые дыры:

1. **События `error` не проверяются вообще.** Кандидат, который прошёл первую проверку и упал,
   оставляет ленту `test pass … | error …` — цикл на строках 47-50 видит только успешный `test`.
2. **Строка 46 сравнивает число событий с числом `tests[]`-блоков, а не проверок.** У каждой
   implement-карточки ровно **один** блок `tests[]`, внутри которого 1-5 вызовов `__test.`
   (у 2.4 — 5, у 6.21 — 5). То есть условие фактически `events >= 1`.

Воспроизведено (`/tmp/etalon-audit/verify-a1b.mjs`, карточка 6.19 — в ней 2 проверки):

```
tape: [ {type:"test", name:"по полю", pass:true},
        {type:"error", name:"Error", message:"вторая ветка не реализована"} ]
executed assertions: 1 of 2
golden.test.ts verdict: PASSED — golden.test.ts would NOT throw
Learner UI verdict (task-view.tsx:328): «Все тесты прошли.»
```

Кандидат выполнил половину проверок, упал — и **и CI, и ученик видят успех**.

**Фикс:** считать `__test.` статически в `card.tests[].code` и требовать равенства, сверять имена
по порядку и явно запрещать события `error`:

```ts
const declared = (card.tests.map((t) => t.code).join("\n").match(/__test\./g) ?? []).length;
const tests = tape.filter((e) => e.type === "test");
assert.equal(tests.length, declared, `${card.id}: ran ${tests.length} of ${declared} assertions\n${formatTape(tape)}`);
assert.equal(tape.some((e) => e.type === "error"), false, `${card.id} threw\n${formatTape(tape)}`);
for (const e of tests) assert.equal(e.pass, true, `${card.id} ${e.name}: ${e.message ?? ""}`);
```

Ту же логику нужно повторить в вердикте для ученика — `src/components/task-view.tsx:324-331`
(см. MEDIUM-15).

### CRITICAL-2. Тест-харнесс перезаписывается кодом кандидата → «все тесты прошли» без проверок

`packages/runner/src/program.ts:32-45` склеивает `TEST_HARNESS` + `userCode` + тесты в один
classic-скрипт, где `var __test = {…}` — обычная глобальная переменная, которую код кандидата
может переприсвоить. Воспроизведено (`/tmp/etalon-audit/verify-claims.mjs`, карточка 6.19):

```js
function groupBy() { return { even: [] }; }
__test = {
  assertEquals:   function (a, b, n) { __report({ type: "test", name: n || "equals",     pass: true }); },
  assertDeepEqual:function (a, b, n) { __report({ type: "test", name: n || "deepEqual",  pass: true }); },
  expectThrow:    function (f, n)    { __report({ type: "test", name: n || "throws",     pass: true }); },
};
```

```
cheat tape: [{"type":"test","name":"по полю","pass":true},{"type":"test","name":"функция","pass":true}]
golden.test.ts verdict: PASSED
=> learner UI would show 'Все тесты прошли.': true
```

Функция возвращает неверный результат, настоящих проверок — ноль, вердикт зелёный.
Та же строка программы уходит в iframe ученика (`src/lib/browser-runner.ts:30`), поэтому это
воспроизводимо и в браузере.

**Фикс** (проверен на прочность — `/tmp/etalon-audit/verify-a2-fix.mjs`): убрать `__test` из
общей области видимости и сделать его неизменяемым:

```js
var __makeTest = function (report, serialize) {
  return Object.freeze({ /* assertEquals, assertDeepEqual, expectThrow */ });
};
;(function () {
  const __test = __makeTest(__report, __serialize);   // const + freeze: переприсвоить нельзя
  /* … userCode … */
  (async function () { /* … tests … */ })();
})();
```

Проверка показала: `__test = {…}` теперь даёт `TypeError: Assignment to constant variable`
и харнесс прерывает прогон. **Но остаётся второй канал:** `__report` — тоже глобальная функция,
и кандидат может слать поддельные события напрямую:

```
forged __report directly  [test "по полю" pass, test "функция" pass, test "a" pass, test "b" pass]
```

Поэтому одной изоляции мало — обязательна вторая половина фикса: **хост должен принимать только
события, чьи имена и количество совпадают с объявленными в карточке** (это же правило закрывает
и CRITICAL-1). Полностью закрыть канал можно, только вынеся харнесс в отдельный `<script>`
или передавая `__report` в замыкание, недоступное коду ученика; для тренажёра достаточно
сверки имён и количества.

---

## HIGH

### HIGH-1. Тест-сьют красный → `npm test` не проверяет ничего (`scripts/migration-plan.test.mjs:61`)

Замер (запускал каждый файл):

```
brand-check.test.mjs               # pass 26 | # fail 3
check-auth-invariant.test.mjs      # pass 10 | # fail 1
grok-pwa-plugin.test.mjs           # pass 48 | # fail 1
migration-plan.test.mjs            # pass  6 | # fail 1
with-app-env.test.mjs              # pass  9 | # fail 3
write-atomic.test.mjs              # pass 10 | # fail 1
browser-smoke-verdict.test.mjs     # pass 40 | # fail 0
preview.test.mjs                   # pass 20 | # fail 0
sign-out-plan.test.mjs             # pass 18 | # fail 0
```

**11 падений в 6 файлах.** `migration-plan.test.mjs:61` утверждает, что в `migrations/` нет
top-level `.sql`, тогда как там лежат три. Поскольку `package.json:19` склеивает проверки через
`&&`, первое падение обрывает цепочку — типы, контент и синк в том же прогоне уже не проверяются.

**Фикс:** тест должен проверять то, что имел в виду (что `migrations/auth/` не подхватывается):

```js
assert.deepEqual(pendingMigrations(["auth"], []), []);
assert.ok(!pendingMigrations(readdirSync(migrationsDir), []).some((m) => m.path.includes("/")));
```

### HIGH-2. Ассеты `public/__grok/**` отсутствуют — 404 на каждой странице

`public/` содержит только `favicon.svg`. При этом:

* `src/routes/__root.tsx:27` — `apple-touch-icon` → `/__grok/icon-180.png` в `<head>` каждой страницы;
* `scripts/grok-pwa-shared.mjs:174,190` — тот же путь в манифесте и в инжектируемых PWA-тегах;
* `scripts/install-page.html:15-16,67-124` — `/__grok/install/styles.css` и 5 картинок
  `/__grok/install/assets/homescreen/*`.

Ни dev-плагин (`scripts/grok-pwa-plugin.mjs:55-63` отдаёт только `manifest.*`), ни Nitro-middleware
(`server/middleware/grok-pwa.ts:73-80`) их не отдают. Собственный tripwire-тест это ловит:
`grok-pwa-plugin.test.mjs:532` → `ENOENT: .../public/__grok/icon-180.png`.

**Фикс:** вернуть файлы в `public/__grok/` — либо, если их должен отдавать edge, убрать ссылки
в `__root.tsx:26-27` и tripwire вместе, чтобы обе половины договорились.

### HIGH-3. `__serialize` достижим из кода ученика и крашится (воспроизведено)

`node-host.ts:84` (`__serialize: serializeArg`) и `browser-runner.ts:38`
(`window.__serialize = __serialize`) отдают сериализатор в песочницу. `__serialize` имеет
сигнатуру `(value, depth, seen)`, поэтому при передаче в `.map` третий аргумент (сам массив)
попадает в `seen`, `!seen` ложно, `new WeakSet()` пропускается и `seen.has` — не функция:

```
A  repo serializer, correct single-arg use : "[[1], [2]]"
C  via .map directly                       : THREW TypeError: seen.has is not a function
```

Воспроизведение: `/tmp/etalon-audit/repro-reachable.mjs` (использует только код репозитория).

**Фикс** — `packages/runner/src/serialize-source.ts:21`, защита без изменения поведения
(проверено: 140/140 значений на вложенных/циклических структурах байт-в-байт совпадают):

```js
if (!seen || typeof seen.has !== "function" || typeof seen.add !== "function") seen = new WeakSet();
```

Дополнительно стоит не выставлять `__serialize` в глобальную область песочницы, а передавать
его только в `__report`.

### HIGH-4. `pushPending` шлёт весь outbox одним батчем → синк встаёт навсегда

`src/lib/study.tsx:105-115` отправляет `readOutbox()` целиком, а сервер
(`src/lib/progress-api.ts:14`) принимает максимум 100 элементов, а `draft` — максимум 20 000
символов. Квоты складываются: 34 карточки в очереди × 922 символа (самый длинный `solution`,
`6.21`) и лимит по телу запроса уже рядом. При превышении сервер отвергает **весь** батч,
`clearOutbox` не вызывается, `pending` остаётся навсегда — прогресс никогда не уедет, при этом
UI покажет «Сети нет».

**Фикс:** резать на чанки по 100 и обрабатывать частичный успех так же, как сейчас
обрабатывается `sent`:

```ts
for (let i = 0; i < pending.length; i += 100) {
  const chunk = pending.slice(i, i + 100);
  await pushDeviceProgress({ data: { deviceId: id, items: chunk } });
  if (userId) await pushUserProgress({ data: { items: chunk } });
}
```

Плюс `maxLength={20000}` на textarea (`task-view.tsx:263-298`), чтобы черновик не перерос лимит.

### HIGH-5. Разный порядок слияния прогресса → откат оценки на другом устройстве

`src/lib/study.tsx:47-54` (`mergeRows`) сравнивает **только** `updatedAt`:

```ts
if (!current || row.updatedAt > current.updatedAt) map.set(row.taskId, row);
```

а общий контракт `packages/shared/src/sync.ts:11` (`isRemoteNewer`) при равных `updatedAt`
разрешает спор по `rev`. На быстром двойном клике (или при синхронных часах двух устройств)
`updatedAt` совпадает, `>` ложно — удалённая запись отбрасывается, хотя общий контракт
предписал бы взять её. Оценка «откатывается» к старой.

**Фикс:** использовать `isRemoteNewer` из `@etalon/shared` в `mergeRows`, а не свою копию логики.

### HIGH-6. Доверие клиентскому `updatedAt` (`src/lib/progress.server.ts:25-47`)

`updated_at` пишется из тела запроса без валидации формата (`progress-api.ts:9` — просто
`z.string().min(1).max(40)`), а условие конфликта — `where updated_at <= excluded.updated_at`.
Устройство с часами в 2030 году записывает строку, которую больше ничем не перезаписать:
последующие оценки (`2026-…` ≤ `2030-…`) молча отбрасываются на **всех** устройствах
пользователя. Поле не приводится к `timestamptz`, поэтому даже корректная запись не защищена.

**Фикс:** валидировать ISO-8601 с ограничением окна (`z.string().datetime()` + проверка
`|now - t| < 5 min`), и/или хранить `updated_at timestamptz` с `least(excluded.updated_at, now())`.

### HIGH-7. Гейты молча выходят с кодом 0 через симлинк (воспроизведено)

`scripts/brand-check.mjs:196`, `scripts/preview.mjs:332`, `scripts/write-atomic.mjs:71`
сравнивают `import.meta.url === pathToFileURL(process.argv[1]).href`. Node резолвит
`import.meta.url` через realpath, а `argv[1]` оставляет как набрано — через симлинк `main()`
не выполняется вовсе:

```
brand-check.mjs  via SYMLINK : exit 0  output=0 bytes      <-- ложный «успех»
brand-check.mjs  via REALPATH: exit 1  output=962 bytes     (2 brand warnings)
write-atomic.mjs via SYMLINK : exit 0  output=0 bytes
check-auth-invariant.mjs via SYMLINK: exit 2 (76 bytes)     <-- правильно: использует isMainModule()
```

Это не теория: `/tmp` на macOS — симлинк на `/private/tmp`, то есть запуск из `/tmp` уже
воспроизводит баг. Готовый helper уже есть и покрыт тестами —
`isMainModule()` в `scripts/with-app-env.mjs:97-105`, проверен
`with-app-env.test.mjs:116` и `check-auth-invariant.test.mjs:98`.

**Фикс:** импортировать `isMainModule` в три файла вместо самодельных проверок.

### HIGH-8. На `*.grok-sandbox.com` доверяется любой родительский origin

`src/lib/preview-embedder-origin.ts:45-50`: если guest-хост проходит
`isSandboxPreviewGuestHost`, возвращается `url.origin` из referrer **без проверки по списку**
Grok. Тогда `https://evil.example`, зафреймивший превью, получает все отчёты `location`
(включая `search`/`hash`) и список маршрутов, и может управлять `navigate`/`history`
(`preview-host-bridge.ts:130-149,190-205`). Это прямо противоречит контракту модуля,
заявленному в `preview-host-bridge.ts:4` и `:66-67`. Токен сессии в URL не едет, поэтому это
утечка URL и управляемая навигация, а не кража учётных данных.

Смежно: `isGrokEmbedderOrigin` (`preview-embedder-origin.ts:4`) принимает `http:`, то есть
`http://grok.com` — «доверенный» embedder для приложения, отдаваемого по https.

**Фикс:** требовать `isGrokEmbedderOrigin(url.origin)` во всех ветках; для reminted-chrome
завести явный allowlist из env. Отдельно: разрешать `http:` только для loopback.

### HIGH-9. `localStorage.setItem` без try/catch рвёт ввод (`src/components/task-view.tsx:233,225`)

`saveDraft` → `localStorage.setItem` без обработки исключения. Safari Private / переполнение
квоты бросает `QuotaExceededError` синхронно **внутри** `onChange`, то есть исключение летит
в рендер React и ломает страницу задачи. Остальной код относится к `localStorage`
осторожнее (`study.tsx:61,224`, `snippets.ts:174`, `auth/client.ts:52-67`), а
`local-db.ts:106,109` (`deviceId()`) — единственное место вообще без проверки
`typeof localStorage === "undefined"` и без try/catch.

**Фикс:** обернуть запись черновика в try/catch (и деградировать до памяти), добавить те же
защиты в `deviceId()`.

### HIGH-10. Схема допускает пустые `expected` и `tests` → проверка проходит вхолостую

`packages/shared/src/schema.ts:44` разрешает `expected: []`, `:55` — `tests: []`. Пустая лента
сравнивается сама с собой успешно, а пустой `tests` проходит условие строки 46:

```
compareTapes([], []) => {"ok":true}
empty tests array, golden predicate => PASSED
```

Живых таких карточек нет (проверено: 0 совпадений), это дыра, а не текущий баг. **Фикс:**
`.min(1)` на оба поля плюс явные `assert`-ы в тесте.

### HIGH-11. Guard покрытия требует 26 карточек из 63 — контент может тихо исчезнуть

`packages/runner/golden.test.ts:8-18`: `required` = 1.1-1.21 + 5.1-5.5 = 26 id, а
`assert.ok(cards.length >= 26)` при 63 карточках в сиде. Удаление целых уровней (3-4 или
6.2-6.24) оставляет CI зелёным, пер-уровневых счётчиков нет нигде. **Фикс:** фиксировать
точный список id (или счётчики по уровням) в одном месте.

### HIGH-12. Флаг `strict` мёртв: все 36 predict-карточек `strict: false`, тестов на `true` нет

`strict: true` не передаётся ни в одном тесте (`runInNode` вызывается только из
`golden.test.ts:22,30,44`), поэтому `node-host.ts:92` (`"use strict";`) и контракт
`host.ts:4-5` не покрыты. При этом UI отдаёт переключатель (`task-view.tsx:85,104`).
Я прогнал все 36 карточек с `strict: true`: **34 из 36 дают ленту, идентичную записанной**
(отличаются только 1.10 и 3.1), но `task-view.tsx:133` при несовпадении флага всегда печатает
«Другой режим. Эталон этой карточки записан для другого strict.» — то есть переключатель
не может показать совпадение, а сообщение неверно для 34 карточек из 36.

**Фикс:** добавить хотя бы одну `strict: true` карточку (иначе поле оправдано только прозой)
и в UI сравнивать ленту всё равно, помечая результат как «не тот режим, в котором записан
эталон», вместо подавления сравнения.

### HIGH-13. Кросс-файловой валидации контента нет вообще

`packages/content/src/node-load.ts:12` парсит `[...cards, ...extra]` через `cardSchema.array()`
— zod проверяет только наличие/тип/положительность. Ничто не проверяет: уникальность `id`
внутри и между файлами; `id === level.order`; `level ∈ LEVELS`; непрерывность `order`;
непустые `answer`/`theory`/`code`/`expected`/`starter`/`solution`; наличие хотя бы одного
`__test.` в каждом implement-тесте; ISO-даты; пересечение tombstone и карточек.
`tombstones.json` — это буквально `[]`, поэтому правило «tombstone побеждает seed» не имеет
ни данных, ни теста.

Сегодня всё чисто (проверено), но **именно тест — то, что удержит это чистым**. Готовый набор
проверок: `/tmp/etalon-audit/` (integrity-скрипты). Заодно стоит зафиксировать, что
`cards.json` содержит только predict, а `extra-cards.json` — только implement (сейчас так).

### HIGH-14. Карточка 6.5 `promiseAll`: statement обещает reject, тест его не проверяет

`packages/content/extra-cards.json:168`. Текст: «…падает на первой ошибке». Единственный блок
`tests[]` проверяет только пустой массив и порядок (`__test.` вызовов — 2, упоминаний `reject`
в тестах — **ноль**). Кандидат, который глотает reject, получает «Все тесты прошли».
**Фикс:** добавить проверку reject и «побеждает первая ошибка» (два reject-а подряд).

---

## MEDIUM

### M-1. `enqueue` не защищает от повторного входа по одной и той же строке
`study.tsx:188-212`: `rate()` пишет `row` в outbox и сразу зовёт `pushPending`, который читает
**весь** outbox. Два быстрых клика подряд порождают две последовательные отправки с одинаковым
набором taskId — дублирующий трафик и лишние раунд-трипы. `pushPending` не защищён и от
параллельного вызова из двух `enqueue`-цепочек.

### M-2. `deviceId()` без проверки окружения
`local-db.ts:104-111`: обращается к `localStorage` напрямую. В окружении без `localStorage`
(SSR-прогон, отключённое хранилище) — `ReferenceError` / `SecurityError` в середине синка.
Фикс: `typeof localStorage === "undefined"` → генерировать id на сессию.

### M-3. Протухшая запись залипает в outbox навсегда
`study.tsx:110-114`: очищаются только строки, у которых `updatedAt` не изменился. Если запись
была отвергнута сервером (пункт HIGH-4) или изменена параллельно, она остаётся в очереди
бессрочно и блокирует более новые. Нужен счётчик попыток и/или явный «мёртвый» статус.

### M-4. Игнорирование `rev` при сборке каталога
`study.tsx:90-92`: `byId.set(card.id, card)` перезаписывает локальную карточку пришедшей
безусловно, без сверки `rev`/`updatedAt` (в отличие от прогресса). Для текущего контента
безвредно, но инвариант «у карточки есть rev» здесь не соблюдается.

### M-5. Прогресс, недостижимый после tombstone
`rate()` (`study.tsx:188`) пишет оценку по `taskId` без проверки, что карточка ещё существует.
После удаления карточки из каталога строки прогресса остаются мёртвым грузом в
`device_progress`/`user_progress`.

### M-6. `check-auth-invariant.mjs:71` — fetch без таймаута
`await fetchImpl(...)` без `AbortSignal`. `browser-smoke.mjs:148` и `npm run check:auth` ждут
его до записи вердикта и до установки кода выхода: зависший dev-сервер (или посторонний
слушатель на loopback-порту, который `checkedUrl` пропускает) подвешивает прогон навсегда.
Фикс: `{ signal: AbortSignal.timeout(5000) }`, как уже сделано в `preview.mjs:286`.

### M-7. `browser-guard.mjs:34-41` — `..` резолвится, симлинки нет
`checkedOutputPath` проверяет префикс после `resolve()`, но не после `realpathSync`. Симлинк
**внутри** разрешённого каталога уводит запись наружу (воспроизведено: `out/escape -> /etc`,
путь вернулся без изменений). `browser-smoke.mjs:41` для чтения realpath делает — асимметрия
случайна. Фикс: realpath самого глубокого существующего предка и проверка префикса по нему.

### M-8. `browser-smoke.mjs:39-45` — защита baseline неполная
Сравнивается только `baselinePath === outJson`, хотя текст ошибки говорит про PNG. Если
передать `--baseline` = выходной PNG этого же прогона, `page.screenshot` (строка 124) затрёт
baseline, и только потом строка 154 сообщит вводящее в заблуждение
`"baseline unreadable: invalid JSON"`. Фикс: требовать `.json` и сравнивать со всеми тремя
выходами. Учесть, что `browser-smoke-verdict.test.mjs:384` фиксирует текущую строку регуляркой.

### M-9. `browser-smoke.mjs:165` — расхождение с baseline не влияет на код выхода
`process.exitCode = exitCodeFor(viewports)`; `verdict.divergesFromBaseline` попадает только в
JSON и в stdout. Регрессия относительно baseline не валит прогон.

### M-10. `migrate.mjs:57` — имя файла берётся из `readdir`, а не из `pendingMigrations`
`join(migrationsDir, name)` использует `name` из цикла по `entries`, тогда как
`pendingMigrations` уже вернул нормализованный `path`. Для текущего дерева эквивалентно, но
это скрытая связка: любой вход, где эти два расходятся, читает не тот файл.

### M-11. `migrate.mjs:45-76` — нет advisory-локи и `lock_timeout`
Параллельные сборки (редеплой, пока предыдущая жива) видят файл как неприменённый, выполняют
DDL и падают на `INSERT INTO _migrations`. Транзакция откатывается чисто, но деплой падает на
валидной миграции. Плюс `ALTER TABLE` в очереди за долгой продакшн-транзакцией висит без
`lock_timeout`. Фикс: `pg_advisory_lock(hashtext('_migrations'))` + `SET lock_timeout='5s'`.

### M-12. `migrate.mjs:59-63` — файлы оборачиваются в `BEGIN`/`COMMIT` без проверки
Если файл содержит собственное управление транзакцией, внутренний `COMMIT` завершает внешнюю:
изменения коммитятся **вне** транзакции раннера, и падение до `INSERT` оставляет файл
применённым, но неотмеченным → повторное применение на следующем деплое. `CREATE INDEX
CONCURRENTLY` в транзакции просто не работает.

### M-13. `migrate.mjs:49-62` — нет checksum: правка применённой миграции игнорируется
Изменить `0002_content.sql` после применения — и продакшн этого не увидит, тогда как свежий
PGLite-превью увидит: расхождение схем dev/prod без единой ошибки. Фикс: хранить sha256 и
падать, если хеш записанного файла изменился.

### M-14. Смешанные тайминги прогона ломают заявленный контракт
`docs/plan.md`: «Браузерный прогон использует тот же сериализатор и тот же контракт ленты».
Фактически окно ожидания разное: golden-тест — `waitMs: 50` (`golden.test.ts:22,30`) и
`card.waitMs ?? 40` (строка 44), браузер — `waitMs: 60` (`task-view.tsx:104,177`) и
`card.waitMs ?? 80` (строка 310), а Node по умолчанию `DEFAULT_WAIT_MS = 40`.
Для нынешних 7 асинхронных карточек (2.1, 3.1, 5.1-5.5) безопасно, потому что микротаски
дренируются до срабатывания таймера, — но это случайность, а не гарантия. Таймер, попавший
в зазор (например 55 мс), заставит нетронутую карточку показать «Лента не совпала с эталоном».
**Фикс:** один экспортируемый константный `waitMs` на режим + assert, что golden и браузер
используют одно значение.

### M-15. Вердикт для ученика повторяет дыру CRITICAL-1
`src/components/task-view.tsx:324-331`:
`tests.length > 0 && tests.every(e => e.type === "test" && e.pass)` → «Все тесты прошли.»
при наличии `error` в ленте и при выполненной только части проверок. Ровно тот же случай,
что в CRITICAL-1, виден ученику как успех. **Фикс:** то же правило (нет `error`, число
событий равно числу объявленных `__test.`, имена совпадают) и отдельный рендер ошибок
в вердикте.

### M-16. Путь таймаута не покрыт тестами
`tape.ts:22-33` (`serializeThrown`, включая маппинг `ERR_SCRIPT_EXECUTION_TIMEOUT →
TimeoutError`), `host.ts:16` (`DEFAULT_TIMEOUT_MS`), `node-host.ts:95-97` и решение №1 плана
(`while (true)` вешает страницу) не покрыты: карточки с бесконечным циклом нет. Механика
при этом исправна — проверено: `while (true) {}` даёт ровно
`[{"type":"error","name":"TimeoutError","message":"execution timed out"}]` за ~1044 мс,
а `throw "x"` и `throw {a:1}` корректно превращаются в `{name:"Error"}`. **Фикс:** добавить
юнит-тест на таймаут и на не-`Error` throw (второй попутно улучшит сообщение: сейчас
`throw {a:1}` даёт бесполезное `"[object Object]"`).

### M-17. `tape.test.ts` — 2 теста / 8 ассертов, большая часть `compareTapes` не проверена
Покрыт один случай несовпадения логов. Не покрыты: переполнение/недостача длины
(`tape.ts:46-52`), несовпадение типа (`:53`), успешный путь, сравнение `error` (`:66-74`),
сравнение `test` (`:75-79`), весь `formatTape` (`:84-91`) и `serializeArg` для объектов,
`Date`, циклических ссылок, функций и обрезки на глубине 3. Это чистые функции — табличный
тест стоит дёшево.

### M-18. `readiness-schedule.test.ts` не может упасть на том, что защищает
`src/lib/app-data/readiness-schedule.test.ts:11-17,26-35` строит ожидания из тех же констант,
что и реализация. Проверено на копии в `/tmp`: при мутации таблицы на `[17,18,19,20]` и
бюджета на 7 минут — `# pass 3 # fail 0`. **Фикс:** ассертить литералы
(`[1000,2000,3000,5000]`, `180000`) и граничное значение индекса.

### M-19. Шесть predict-карточек кодируют текст ошибки V8 → в Safari/Firefox не совпадёт
`packages/content/cards.json`, карточки `1.1, 1.3, 1.6, 1.8, 1.11, 1.14` — в `expected` лежат
строки вида `Cannot access 'b' before initialization`, `j is not defined`,
`Assignment to constant variable.`. ECMAScript нормирует только **тип** ошибки, формулировки
в Gecko/JSC другие (например, Safari для 1.14 даёт `Attempted to assign to readonly property.`),
а `task-view.tsx:91` сравнивает ленту побайтово. Ученик в Safari/Firefox увидит «Лента не
совпала с эталоном» на нетронутой карточке. Проверить в Gecko/JSC здесь не удалось (нет
браузеров), но расхождение следует из спецификации. **Фикс:** сравнивать только `error.name`
либо нормализовать ошибку в engine-независимый `code` при сериализации в обоих хостах.

### M-20. Контент декларирует требования, которые тесты не проверяют
* `6.3` (`extra-cards.json:132`): «2 и "2" это разный кэш» — кэш с одним ключом `join("|")`
  проходит все 4 ассерта, то есть утверждение не проверено.
* `6.10` (`extra-cards.json:278`): «Индекс тоже передаётся» — кандидат, игнорирующий индекс,
  проходит обе проверки (`__test.` вызовов 2, упоминаний индекса в тестах — ноль).
  **Фикс:** `__test.assertDeepEqual(filter([10,20,30], (n,i) => i > 0), [20,30], "индекс")`.
* `6.22` (`extra-cards.json:542`): «Снятие подписки во время emit не ломает уже начатый
  проход» — решение этому удовлетворяет, но тесты проверяют только само-снятие `once`
  и не отличают итерацию по живому массиву от копии.

---

## LOW

| # | Файл:строка | Проблема |
| --- | --- | --- |
| L-1 | `src/lib/progress.server.ts:49` | Мёртвый параметр `ownerColumn` глушится `void ownerColumn`; две почти одинаковые SQL-ветки (28-47) стоит свести в одну с параметризованным именем таблицы. |
| L-2 | `src/lib/multiplayer/` (579 строк) | Мёртвый код: нет ни одного импортёра, нет `/api/rtc`, упоминается несуществующий `signaling.server.ts`. Стоит `tsc --noEmit`. Удалить. |
| L-3 | `package.json` | **38 из 56 зависимостей объявлены и нигде не импортируются** (измерено скриптом по всем `src`/`server`/`packages`/`scripts`): все **21** пакет `@radix-ui/*`, плюс `@tanstack/react-query`, `@tanstack/react-table`, `zustand`, `recharts`, `date-fns`, `sonner`, `react-hook-form`, `@hookform/resolvers`, `cmdk`, `vaul`, `react-day-picker`, `react-resizable-panels`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lightningcss`, `tw-animate-css`. Удаление сократит установку и поверхность аудита. |
| L-4 | `src/lib/app-data/` (1302 строки) | Шаблонный код бэкенд-коннекторов (Gmail/Drive/Calendar/gate). Достижимо только через `preview-host-bridge.ts`, который сам активен лишь внутри разрешённого embedder. Для тренажёра это чистый балласт. |
| L-5 | `src/lib/preview-host-bridge.ts` | Неиспользуемая публичная поверхность: `PREVIEW_BRIDGE_CHANNEL`, `PREVIEW_BRIDGE_VERSION`, `isSafeBridgePath`, `resolveCurrentEmbedderOrigin`, ре-экспорты 12-16. Сузить до одной точки аудита доверенных origin. |
| L-6 | `scripts/preview.mjs:161-168` | `process.kill(pid, 0)` успешен для зомби → `stop`/`restart` могут вечно сообщать «порт занят» и не удалять pidfile. Считать состояние `Z`/`X` мёртвым. |
| L-7 | `scripts/preview.mjs:32`, `preview-thumbnail.mjs:16`, `browser-smoke.mjs:62` | `Number(env \|\| default)` даёт `NaN` при опечатке: `deadline = Date.now() + NaN` → ни одного опроса; Playwright с `timeout: NaN` падает мгновенно. Нужен `Number.isFinite(n) && n > 0`. |
| L-8 | `scripts/migration-plan.mjs:44` | `localeCompare` зависит от ICU/локали (`0002_B.sql` vs `0002_a.sql`). Для мигратора нужен побайтовый порядок: `a.name < b.name ? -1 : a.name > b.name ? 1 : 0`. |
| L-9 | `scripts/copy-pglite-assets.mjs:6-12` | Захардкожен внутренний путь Nitro `.vercel/output/functions/__server.func/_libs`. При смене раскладки чанков копирование либо падает с голым `ENOENT`, либо кладёт wasm туда, откуда рантайм его не читает. Выводить каталог из `.vercel/output/functions/*.func` и проверять наличие чанка. |
| L-10 | `scripts/write-atomic.mjs:30-33` | `isInside()` возвращает `false` при `rel === ""`, поэтому `staged === publicDir` не отвергается. |
| L-11 | `scripts/with-app-env.mjs:114-118` | `spawn` без `shell: true` ломает запуск на Windows (`vite.cmd`); обработчики сигналов снимают дефолтный выход, но не эскалируют — зависший ребёнок вешает CI. |
| L-12 | `src/lib/auth/client.ts:187-192` | `waitForPopupToken` проверяет `event.origin` и `data.source`, но не `event.source === popup`. Сейчас эксплуатировать нечем (раннер — opaque origin), но проверка стоит одной строки. |
| L-13 | `packages/content/cards.json:755` (3.1) | Теория неверна для этого проекта: «в Node — объект таймера» описывает голый `node`, а `node-host.ts:21-28` вызывает колбэк без `this`. Измерено: в хосте Эталона `this === globalThis` → `true`, `isTimeout: false`; в голом Node — наоборот. Лента совпадает, врёт только объяснение. |
| L-14 | `packages/content/extra-cards.json:190` (6.6) | Опечатка: «curry(fn) **копирует** аргументы» → «**копит** аргументы». |
| L-15 | `packages/runner/src/address.ts`, `src/lib/catalog.ts`, `catalog.server.ts`, `content/src/browser.ts`, `src/lib/browser-runner.ts` | **Ноль тестов** на 95 строк хеширования и `seedVersion` — забытое поле в `hashAnyCard` означает, что клиент никогда не перезапросит изменённую карточку, и CI этого не заметит. Заявление плана про фазу 2 («браузерный прогон совпадает с golden») держится только на общих строковых константах: нет ни одного теста, сравнивающего браузерную ленту с Node-лентой, а `browser-smoke.mjs` вообще не касается ленты и iframe. |

---

## Улучшения (не баги)

1. **Читающий путь не должен писать.** `catalog.server.ts:16-49`: `readManifest()` выполняет по
   одному `INSERT … ON CONFLICT` **на каждую карточку**, а `readTasks` (строка 79) вызывает
   `readManifest()` заново. `study.tsx:86-89` батчит по 60, то есть полная синхронизация
   каталога — это **189 upsert-запросов** (63 из `getManifest` + 2 × 63 из `readTasks`),
   и всё это внутри обработчика `GET`. Сид стоит выполнять один раз при старте
   (`ensureDbReady`) либо под условием «`seedVersion` изменился».
2. **`readTasks` читает всю таблицу.** `catalog.server.ts:82` — `select body from content_task`
   без `where`, фильтрация в JS по `Set` (строки 83-88). Параметр `ids` при этом не используется
   в SQL: `where id = any($1)`.
3. **Дублирование логики порядка.** `pathOf` сортирует карточки (`path.ts:12`), `syncCatalog`
   сортирует ещё раз (`study.tsx:95`), каталог приходит уже отсортированным — три места, которые
   могут разойтись. Оставить один инвариант.
4. **`steps.filter` внутри цикла по уровням** (`path-view.tsx:155`) — O(уровни × карточки) на
   каждый рендер. Один `groupBy` решает.
5. **Ключи в `TheoryText`** (`task-view.tsx:19,26`) — `paragraph.slice(0, 24)` и сам текст как
   `key`. Два абзаца с одинаковым началом дадут коллизию ключей; индекс надёжнее.
6. **`ImplementRun` держит `useState(card.starter)`** (`task-view.tsx:201`) и синхронизируется
   эффектом — смена карточки без размонтирования оставит прошлый черновик до срабатывания
   эффекта. `key={card.id}` на `<TaskView>` в `tasks/$taskId.tsx:61` снимает вопрос.
7. **Доступность:** точки тропы — `<Link>` с `aria-label`, это хорошо; но `locked`-узлы
   (`path-view.tsx:68`) — `<div>` без `role`/`tabIndex`, а подпись «Сейчас» дублируется
   текстом внутри ссылки. Стоит проверить фокус-порядок скринридером.
8. **Нет проверки инвариантов контента в CI.** 63 карточки сейчас согласованы (проверено),
   но ничто не мешает добавить дубль `id`, пропуск в `order` или карточку уровня, которого нет
   в `levels.ts`. Дешёвый тест на `cards.json` + `extra-cards.json` (уникальность, непрерывность
   `order`, наличие полей) закрывает класс ошибок навсегда.
9. **`.grok/` в `.gitignore`, но тесты на него опираются.** 4 файла тестов читают
   `.grok/app-env.json` и `.grok/skills/og/SKILL.md`; в свежем клоне это 8 падений. Либо
   создавать фикстуры в `mkdtempSync`, либо `skip` с причиной.
10. **`startup.sh`** перезапускает dev-сервер, если `curl` к `127.0.0.1:8080` не ответил, но
    ничего не делает с `preview:restart` (порт 8081) и не проверяет, что поднялся именно наш
    процесс, а не посторонний слушатель на 8080.

---

## Что проверено и работает корректно

Чтобы это не потерялось за списком дефектов:

* **Контент и ленты.** Все 63 карточки + 1 вариант прогнаны независимой реализацией раннера:
  **64/64 совпадений** с `expected`. Ни одного расхождения, ни одной карточки с пустыми
  `theory`/`title`, дублей `id`, дублей `level+order`, пропусков в `order`, битых `rev`/`updatedAt`.
  У всех 27 implement-карточек есть `solution`, непустые `tests` и хотя бы одно обращение
  к `__test.` (то есть тесты не могут пройти «вхолостую»).
* **Песочница браузера** (`browser-runner.ts`): `sandbox="allow-scripts"` без `allow-same-origin`
  — opaque origin; `postMessage(..., "*")` здесь законен, и приём защищён
  `event.source === iframe.contentWindow` + одноразовым UUID-токеном; `</script` экранируется;
  поздние логи отбрасываются по токену.
* **Preview-bridge**: `postMessage` нигде не шлёт в `"*"` (цель — вычисленный `parentOrigin`),
  входящие требуют **и** `event.source === window.parent`, **и** совпадения origin; формы
  сообщений валидируются zod с проверкой `version`; `isSafeBridgePath` действительно удерживает
  навигацию в пределах origin (`//evil.com`, `/\evil.com`, `https://evil.com/*`, `///evil.com`
  отклоняются, `/%2f%2fevil.com` и `/..//evil.com` остаются same-origin), а `defaultNavigate`
  перепроверяет origin.
* **Сессионные куки**: `__Host-` + `useSecureCookies: false` с явными `secure/sameSite/path` —
  верная защита от «подброса» куки соседним поддоменом; `isolation.server.ts` закрывает
  scripted same-site запросы через `Sec-Fetch-Site`.
* **Синхронизация контента**: tombstone побеждает seed (`withoutTombstones`), `planSync`
  не тянет удалённое, `seedVersion` считается из штампов и tombstone-ов — контракт соблюдён.
* **`write-atomic.mjs`** использует `rename(2)`; `app-env-plugin.mjs` отдаёт только
  `VITE_`-префиксные значения и работает лишь в `serve`; `install-page.html` экранирует
  подстановки; `sign-out-plan.mjs` не даёт «позднему» запросу разлогина убить свежую сессию.

### Что осталось непроверенным (честная граница ревью)

1. **`tsc --noEmit` и `vite build` не запускались** (`node_modules/` отсутствует). Ошибки
   типов и сборки этим ревью не покрыты. `golden.test.ts`, `app-data.test.ts` и
   `gate-identity.test.ts` тоже не запускались как есть — `golden.test.ts` воспроизведён
   побайтово равнозначным стендом на реальных модулях раннера.
2. **Браузерные сценарии не прогонялись** (нет Playwright/Chromium). Находки по
   `browser-runner.ts` и M-19 (тексты ошибок Gecko/JSC) — результат чтения кода и сверки
   со спецификацией, а не живого прогона в Safari/Firefox.
3. **zod не установлен**, поэтому гипотеза о том, что дефолтный strip-режим молча
   выбрасывает опечатанные ключи карточек (`"strictt"`), не подтверждена исполнением.
   Если это так — лечится `.strict()` на объектах карточки.

### Про `answer` — снято

Отдельный проход по всем 36 predict-карточкам выполнен: **ни одно поле `answer` не противоречит
реальному выводу кода**, включая тонкие случаи 1.5, 1.9, 1.17, 1.19, 3.1, 5.4. Заявленные
31 проверка в implement-карточках действительно исполняются для эталонных решений — молчаливых
пропусков нет.

---

## Предлагаемый порядок работ

**Спринт 0 — вернуть доказательную силу проверкам (1-2 дня).**
CRITICAL-1, CRITICAL-2, HIGH-10, HIGH-11, HIGH-13, M-15. Пока падающий кандидат получает
зелёный вердикт, все остальные исправления проверить нечем: тест не отличает работающий код
от сломанного. Это первое, что нужно починить.

**Спринт 1 — вернуть доверие к инфраструктуре (1-2 дня).**
HIGH-1, HIGH-2, HIGH-3, симлинк-гейты, M-6, M-8, M-9. После этого `npm test` снова что-то
значит, гейты не врут, smoke не врёт про baseline.

**Спринт 2 — устойчивость прогресса (2-3 дня).**
HIGH-4..HIGH-9. Это путь пользователя «оценил → уехало на второе устройство», то есть смысл
продукта.

**Спринт 3 — эксплуатация и миграции (1-2 дня).**
M-10..M-13, L-6..L-9. Дешёвые правки, снимающие целый класс инцидентов на деплое.

**Спринт 4 — контент и гигиена (1-2 дня).**
HIGH-12, HIGH-14, M-14, M-16..M-20, L-1..L-5, L-13..L-15 и прочее удаление мёртвого кода.

**Отдельно стоит решить продуктово:** оставлять ли `app-data/` и `preview-host-bridge`
вообще. Тренажёру они не нужны, а это ~1000 строк кода, который никто не проверяет
сценариями, зато он разбирает `postMessage` от родительского окна.

