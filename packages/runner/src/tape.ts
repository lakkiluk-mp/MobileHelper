import { SERIALIZE_SOURCE } from "./serialize-source.ts";

/** Machine-readable console / exception tape. Args are canonical strings, never raw values. */
export type TapeEvent =
  | { type: "log"; args: string[] }
  | { type: "error"; name: string; message: string }
  | { type: "test"; name: string; pass: boolean; message?: string };

const buildSerialize = new Function(`${SERIALIZE_SOURCE}; return __serialize;`) as () => (
  value: unknown,
  depth?: number,
  seen?: WeakSet<object>,
) => string;

/** Same function the browser iframe runs. Numbers, strings and undefined stay apart. */
export const serializeArg = buildSerialize();

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function serializeThrown(error: unknown): { name: string; message: string } {
  if (isObject(error)) {
    const record = error as { name?: unknown; message?: unknown; code?: unknown };
    if (record.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
      return { name: "TimeoutError", message: "execution timed out" };
    }
    const name = typeof record.name === "string" && record.name ? record.name : "Error";
    const message = typeof record.message === "string" ? record.message : String(error);
    return { name, message };
  }
  return { name: "Error", message: String(error) };
}

export type TapeDiff = { index: number; reason: string };

export function compareTapes(
  actual: TapeEvent[],
  expected: TapeEvent[],
): { ok: true } | { ok: false; diffs: TapeDiff[] } {
  const diffs: TapeDiff[] = [];
  const length = Math.max(actual.length, expected.length);
  for (let index = 0; index < length; index += 1) {
    const left = actual[index];
    const right = expected[index];
    if (!left || !right) {
      diffs.push({
        index,
        reason: !left ? `missing actual, expected ${JSON.stringify(right)}` : `unexpected ${JSON.stringify(left)}`,
      });
      continue;
    }
    if (left.type !== right.type) {
      diffs.push({ index, reason: `type ${left.type} !== ${right.type}` });
      continue;
    }
    if (left.type === "log" && right.type === "log") {
      if (left.args.join("\0") !== right.args.join("\0")) {
        diffs.push({
          index,
          reason: `log ${JSON.stringify(left.args)} !== ${JSON.stringify(right.args)}`,
        });
      }
      continue;
    }
    if (left.type === "error" && right.type === "error") {
      if (left.name !== right.name || left.message !== right.message) {
        diffs.push({
          index,
          reason: `error ${left.name}: ${left.message} !== ${right.name}: ${right.message}`,
        });
      }
      continue;
    }
    if (left.type === "test" && right.type === "test") {
      if (left.name !== right.name || left.pass !== right.pass || (left.message ?? "") !== (right.message ?? "")) {
        diffs.push({ index, reason: `test ${JSON.stringify(left)} !== ${JSON.stringify(right)}` });
      }
    }
  }
  return diffs.length === 0 ? { ok: true } : { ok: false, diffs };
}

export function formatTape(events: TapeEvent[]): string {
  return events
    .map((event) => {
      if (event.type === "log") return `log ${event.args.join(" ")}`;
      if (event.type === "error") return `error ${event.name}: ${event.message}`;
      return `test ${event.pass ? "pass" : "fail"} ${event.name}`;
    })
    .join("\n");
}
