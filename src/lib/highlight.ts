export type TokenKind = "keyword" | "string" | "number" | "comment" | "call";

export type Token = { text: string; kind?: TokenKind };

const KEYWORDS = new Set([
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "of",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
]);

const PATTERN =
  /(\/\/.*$)|('(?:\\.|[^'\\])*'?|"(?:\\.|[^"\\])*"?|`(?:\\.|[^`\\])*`?)|(\b\d[\d_]*(?:\.\d+)?n?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;

export function highlightLine(line: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of line.matchAll(PATTERN)) {
    const start = match.index ?? 0;
    if (start > last) tokens.push({ text: line.slice(last, start) });
    const [text, comment, string, number, call, word] = match;
    if (comment) tokens.push({ text, kind: "comment" });
    else if (string) tokens.push({ text, kind: "string" });
    else if (number) tokens.push({ text, kind: "number" });
    else if (call) tokens.push({ text, kind: KEYWORDS.has(call) ? "keyword" : "call" });
    else if (word) tokens.push(KEYWORDS.has(word) ? { text, kind: "keyword" } : { text });
    last = start + text.length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

export function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}
