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
    Promise,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Symbol,
    BigInt,
    Date,
    Math,
    JSON,
    Error,
    TypeError,
    ReferenceError,
    RangeError,
    SyntaxError,
    EvalError,
    URIError,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    NaN,
    Infinity,
    undefined,
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
