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
