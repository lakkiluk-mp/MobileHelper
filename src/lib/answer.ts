import type { TapeEvent } from "@etalon/shared";

export type LineVerdict = "ok" | "wrong" | "missing" | "extra";

export type AnswerCheck = {
  ok: boolean;
  lines: LineVerdict[];
};

export const ANSWER_WORDS = [
  "undefined",
  "null",
  "NaN",
  "true",
  "false",
  '""',
  "[]",
  "ReferenceError",
  "TypeError",
  "SyntaxError",
  "RangeError",
];

const QUOTES = new Set(['"', "'", "`"]);
const OPEN = new Set(["[", "{", "("]);
const CLOSE = new Set(["]", "}", ")"]);

export function splitValues(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quote: string | null = null;
  let depth = 0;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (quote) {
      current += char;
      if (char === "\\" && index + 1 < line.length) {
        current += line[index + 1];
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (QUOTES.has(char)) quote = char;
    if (OPEN.has(char)) depth += 1;
    if (CLOSE.has(char)) depth = Math.max(depth - 1, 0);
    if (depth === 0 && (char === "," || /\s/.test(char))) {
      if (current) values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) values.push(current);
  return values;
}

export function canonical(value: string): string {
  let out = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]!;
    if (!QUOTES.has(char)) {
      if (!/\s/.test(char)) out += char;
      continue;
    }
    out += '"';
    for (index += 1; index < value.length && value[index] !== char; index += 1) {
      const inner = value[index]!;
      if (inner === "\\" && index + 1 < value.length) {
        const escaped = value[index + 1]!;
        out += escaped === char && char !== '"' ? escaped : `\\${escaped}`;
        index += 1;
      } else {
        out += inner === '"' && char !== '"' ? '\\"' : inner;
      }
    }
    out += '"';
  }
  return out;
}

function isLabel(arg: string, code: string): boolean {
  if (!arg.startsWith('"') || !arg.endsWith('"') || arg.length < 3) return false;
  const inner = arg.slice(1, -1);
  return [`"${inner}"`, `'${inner}'`, `\`${inner}\``].some((literal) => code.includes(literal));
}

function matchLog(line: string, args: string[], code: string): boolean {
  const given = splitValues(line).map(canonical);
  const wanted = args.map(canonical);
  const labels = args.map((arg) => isLabel(arg, code));
  const optional = labels.some((label) => !label);
  let at = 0;
  for (let index = 0; index < wanted.length; index += 1) {
    if (given[at] === wanted[index]) {
      at += 1;
    } else if (!(optional && labels[index])) {
      return false;
    }
  }
  return at === given.length;
}

function matchError(line: string, name: string): boolean {
  const head = line.split(":")[0]?.trim().toLowerCase();
  return head === name.toLowerCase();
}

export function checkLine(line: string, event: TapeEvent, code: string): boolean {
  if (event.type === "log") return matchLog(line, event.args, code);
  if (event.type === "error") return matchError(line, event.name);
  return false;
}

export function checkAnswer(input: string, expected: TapeEvent[], code: string): AnswerCheck {
  const given = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const size = Math.max(given.length, expected.length);
  const lines: LineVerdict[] = [];
  for (let index = 0; index < size; index += 1) {
    const line = given[index];
    const event = expected[index];
    if (line === undefined) lines.push("missing");
    else if (event === undefined) lines.push("extra");
    else lines.push(checkLine(line, event, code) ? "ok" : "wrong");
  }
  return { ok: lines.every((line) => line === "ok"), lines };
}

export type WordHint = { from: number; to: number; word: string };

export function suggestWords(text: string, caret: number, limit = 3): WordHint[] {
  const before = text.slice(0, caret);
  const prefix = /[A-Za-z]+$/.exec(before)?.[0] ?? "";
  if (prefix.length < 2) return [];
  const lower = prefix.toLowerCase();
  return ANSWER_WORDS.filter((word) => word.toLowerCase().startsWith(lower) && word !== prefix)
    .slice(0, limit)
    .map((word) => ({ from: caret - prefix.length, to: caret, word }));
}

export function insertWord(
  text: string,
  caret: number,
  word: string,
): { text: string; caret: number } {
  const before = text.slice(0, caret);
  const after = text.slice(caret);
  const gap = before && !/[\s,[({]$/.test(before) ? " " : "";
  const next = `${before}${gap}${word}`;
  const inside = word === '""' ? 1 : 0;
  return { text: next + after, caret: next.length - inside };
}

export type OrderChoice = {
  id: string;
  label: string;
  line: string;
};

const ATOMS = new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);

type Scanned = {
  at: number;
  raw: string;
  value: string;
  kind: "string" | "atom";
};

function readQuoted(
  code: string,
  start: number,
): { end: number; raw: string; value: string | null } | null {
  const quote = code[start];
  if (quote !== "'" && quote !== '"' && quote !== "`") return null;
  let value = "";
  for (let index = start + 1; index < code.length; index += 1) {
    const char = code[index]!;
    if (char === "\\") {
      const next = code[index + 1];
      if (next === undefined) return null;
      value += next === "n" ? "\n" : next === "t" ? "\t" : next === "r" ? "\r" : next;
      index += 1;
      continue;
    }
    if (char === quote) {
      const raw = code.slice(start, index + 1);
      return { end: index + 1, raw, value: quote === "`" && raw.includes("${") ? null : value };
    }
    if (char === "\n" && quote !== "`") return null;
    value += char;
  }
  return null;
}

function isNumberStart(code: string, index: number): boolean {
  const char = code[index];
  if (char !== undefined && char >= "0" && char <= "9") return true;
  if (char !== "-" || index + 1 >= code.length) return false;
  const next = code[index + 1]!;
  if (next < "0" || next > "9") return false;
  const prev = index === 0 ? "" : code[index - 1]!;
  return !/[\w$]/.test(prev);
}

function scanLiterals(code: string): Scanned[] {
  const found: Scanned[] = [];
  let index = 0;
  while (index < code.length) {
    const char = code[index]!;
    if (char === "/" && code[index + 1] === "/") {
      const nl = code.indexOf("\n", index);
      index = nl === -1 ? code.length : nl + 1;
      continue;
    }
    if (char === "/" && code[index + 1] === "*") {
      const end = code.indexOf("*/", index + 2);
      index = end === -1 ? code.length : end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      const quoted = readQuoted(code, index);
      if (!quoted) {
        index += 1;
        continue;
      }
      if (quoted.value !== null) {
        found.push({ at: index, raw: quoted.raw, value: quoted.value, kind: "string" });
      }
      index = quoted.end;
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      const raw = /^[A-Za-z_$][\w$]*/.exec(code.slice(index))?.[0] ?? char;
      if (ATOMS.has(raw)) found.push({ at: index, raw, value: raw, kind: "atom" });
      index += raw.length;
      continue;
    }
    if (isNumberStart(code, index)) {
      const raw = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(code.slice(index))?.[0];
      if (raw) {
        found.push({ at: index, raw, value: raw, kind: "atom" });
        index += raw.length;
        continue;
      }
    }
    index += 1;
  }
  return found;
}

function decodeArg(arg: string): { kind: "string" | "atom"; value: string } | null {
  if (arg.startsWith('"')) {
    try {
      const value = JSON.parse(arg) as unknown;
      return typeof value === "string" ? { kind: "string", value } : null;
    } catch {
      return null;
    }
  }
  if (/^(?:-?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|NaN|-?Infinity|true|false|null|undefined)$/.test(arg)) {
    return { kind: "atom", value: arg };
  }
  return null;
}

export type AnswerStep = { kind: "error" } | { kind: "value"; arg: string };

export function answerSteps(expected: TapeEvent[]): AnswerStep[] {
  const steps: AnswerStep[] = [];
  for (const event of expected) {
    if (event.type === "error") steps.push({ kind: "error" });
    else if (event.type === "log") {
      for (const arg of event.args) steps.push({ kind: "value", arg });
    }
  }
  return steps;
}

function presentArg(arg: string): { label: string; line: string } {
  const decoded = decodeArg(arg);
  const event = { type: "log" as const, args: [arg] };
  if (decoded?.kind === "atom" && checkLine(decoded.value, event, "")) {
    return { label: decoded.value, line: decoded.value };
  }
  if (decoded?.kind === "string") {
    const quoted = decoded.value.includes("'") ? JSON.stringify(decoded.value) : `'${decoded.value}'`;
    if (checkLine(quoted, event, "")) return { label: quoted, line: quoted };
  }
  return { label: arg, line: arg };
}

export function orderChoices(code: string, expected: TapeEvent[]): OrderChoice[] | null {
  const steps = answerSteps(expected);
  if (steps.length === 0) return null;
  const unique = new Map<string, OrderChoice>();
  for (const hit of scanLiterals(code)) {
    if (hit.kind === "string" && hit.value.length > 48) continue;
    const choice = { id: canonical(hit.raw), label: hit.raw, line: hit.raw };
    if (!unique.has(choice.id)) unique.set(choice.id, choice);
  }
  for (const step of steps) {
    if (step.kind !== "value") continue;
    const event = { type: "log" as const, args: [step.arg] };
    const covered = [...unique.values()].some((choice) => checkLine(choice.line, event, code));
    if (covered) continue;
    const presented = presentArg(step.arg);
    const id = canonical(presented.line);
    if (!unique.has(id)) unique.set(id, { id, label: presented.label, line: presented.line });
  }
  return [
    ...unique.values(),
    { id: "error", label: "ошибка", line: "ошибка" },
    { id: "nothing", label: "ничего", line: "ничего" },
  ];
}
