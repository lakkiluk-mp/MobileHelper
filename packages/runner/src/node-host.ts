import vm from "node:vm";
import { DEFAULT_TIMEOUT_MS, DEFAULT_WAIT_MS, type RunOptions } from "./host.ts";
import { serializeArg, serializeThrown, type TapeEvent } from "./tape.ts";

/**
 * Node host for CI. Classic script unless the card sets `strict`.
 * Each run closes over its own token: a timer that fires after the wait
 * window cannot append to this tape or to the next run.
 */
export async function runInNode(code: string, options: RunOptions): Promise<TapeEvent[]> {
  const token = options.runId ?? crypto.randomUUID();
  let open: string | null = token;
  const events: TapeEvent[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const push = (event: TapeEvent) => {
    if (open !== token) return;
    events.push(event);
  };

  const guard = (fn: TimerHandler, args: unknown[]) => {
    if (open !== token) return;
    try {
      if (typeof fn === "function") fn(...args);
    } catch (error) {
      push({ type: "error", ...serializeThrown(error) });
    }
  };

  // В песочницу кладём ТОЛЬКО то, чего у неё нет: свой console, таймеры и мост
  // отчёта. Встроенные объекты (`Object`, `Array`, `Promise`, `Error`, …) vm
  // создаёт в самом контексте — они обязаны быть в его realm.
  //
  // Раньше сюда передавались host-версии `Object`, `Array` и прочих. Из-за
  // этого код ученика получал объекты чужого realm, и в песочнице ломалось
  // то, что в браузере работает: `[] instanceof Array` давало `false`,
  // `[].constructor === Array` — тоже, а `Array.prototype.last = ...` не
  // влияло на литералы массивов. Node-хост расходился с iframe, то есть
  // golden-тест проверял не то поведение, которое видит ученик.
  const sandbox: Record<string, unknown> = {
    console: {
      log: (...args: unknown[]) => push({ type: "log", args: args.map((arg) => serializeArg(arg)) }),
      info: (...args: unknown[]) => push({ type: "log", args: args.map((arg) => serializeArg(arg)) }),
      warn: (...args: unknown[]) => push({ type: "log", args: args.map((arg) => serializeArg(arg)) }),
      error: (...args: unknown[]) => push({ type: "log", args: args.map((arg) => serializeArg(arg)) }),
    },
    setTimeout: (fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      const id = setTimeout(() => {
        timers.delete(id);
        guard(fn, args);
      }, ms);
      timers.add(id);
      return id;
    },
    clearTimeout: (id: ReturnType<typeof setTimeout>) => {
      timers.delete(id);
      clearTimeout(id);
    },
    queueMicrotask: (fn: () => void) => {
      queueMicrotask(() => {
        if (open !== token) return;
        try {
          fn();
        } catch (error) {
          push({ type: "error", ...serializeThrown(error) });
        }
      });
    },
    __serialize: serializeArg,
    __report: (event: TapeEvent) => {
      if (!event || (event.type !== "log" && event.type !== "error" && event.type !== "test")) return;
      push(event);
    },
  };

  const context = vm.createContext(sandbox);
  const source = options.strict ? `"use strict";\n${code}` : code;

  try {
    new vm.Script(source, { filename: "task.js" }).runInContext(context, {
      timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });
  } catch (error) {
    push({ type: "error", ...serializeThrown(error) });
  }

  await new Promise((resolve) => {
    setTimeout(resolve, options.waitMs ?? DEFAULT_WAIT_MS);
  });

  open = null;
  for (const id of timers) clearTimeout(id);
  return events;
}
