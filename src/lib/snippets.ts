export const SNIPPETS_KEY = "etalon-snippets";

export type SnippetMode = "immediate" | "boundary";

export type Snippet = {
  trigger: string;
  /** Exactly one `|` is the caret. */
  body: string;
  mode: SnippetMode;
};

export type SnippetEdit = {
  from: number;
  to: number;
  text: string;
  caret: number;
};

const SNIPPETS: readonly Snippet[] = [
  { trigger: "console", body: "console.log(|)", mode: "immediate" },
  { trigger: "setTimeout", body: "setTimeout(() => {\n  |\n}, 0)", mode: "immediate" },
  { trigger: "setInterval", body: "setInterval(() => {\n  |\n}, 0)", mode: "immediate" },
  { trigger: "addEventListener", body: 'addEventListener("|", () => {\n  \n})', mode: "immediate" },
  { trigger: "querySelectorAll", body: 'querySelectorAll("|")', mode: "immediate" },
  { trigger: "requestAnimationFrame", body: "requestAnimationFrame(() => {\n  |\n})", mode: "immediate" },
  { trigger: "forEach", body: "forEach((|) => {\n  \n})", mode: "immediate" },
  { trigger: "querySelector", body: 'querySelector("|")', mode: "boundary" },
  { trigger: "if", body: "if (|) {\n  \n}", mode: "boundary" },
  { trigger: "else", body: "else {\n  |\n}", mode: "boundary" },
  { trigger: "for", body: "for (let i = 0; i < |; i++) {\n  \n}", mode: "boundary" },
  { trigger: "while", body: "while (|) {\n  \n}", mode: "boundary" },
  { trigger: "const", body: "const | = ", mode: "boundary" },
  { trigger: "let", body: "let | = ", mode: "boundary" },
  { trigger: "var", body: "var | = ", mode: "boundary" },
  { trigger: "function", body: "function |() {\n  \n}", mode: "boundary" },
  { trigger: "return", body: "return |", mode: "boundary" },
  { trigger: "async", body: "async |", mode: "boundary" },
  { trigger: "await", body: "await |", mode: "boundary" },
  { trigger: "try", body: "try {\n  |\n} catch (error) {\n  \n}", mode: "boundary" },
  { trigger: "catch", body: "catch (error) {\n  |\n}", mode: "boundary" },
  { trigger: "class", body: "class | {\n  \n}", mode: "boundary" },
  { trigger: "throw", body: "throw new Error(|)", mode: "boundary" },
  { trigger: "promise", body: "new Promise((resolve, reject) => {\n  |\n})", mode: "boundary" },
  { trigger: "map", body: "map((|) => )", mode: "boundary" },
  { trigger: "filter", body: "filter((|) => )", mode: "boundary" },
  { trigger: "reduce", body: "reduce((acc, item) => |, )", mode: "boundary" },
  { trigger: "switch", body: "switch (|) {\n  case :\n    break;\n  default:\n}", mode: "boundary" },
];

const IDENT = /[A-Za-z0-9_$]/;

function isIdent(char: string): boolean {
  return IDENT.test(char);
}

function effectiveMode(snippet: Snippet): SnippetMode {
  if (snippet.mode !== "immediate") return "boundary";
  const blocked = SNIPPETS.some(
    (other) => other.trigger !== snippet.trigger && other.trigger.startsWith(snippet.trigger),
  );
  return blocked ? "boundary" : "immediate";
}

function wordStart(value: string, index: number): number {
  let cursor = index;
  while (cursor > 0 && isIdent(value[cursor - 1] ?? "")) cursor -= 1;
  return cursor;
}

/** True when `index` sits inside a string or comment. Template `${}` is treated as still inside the string. */
export function blocksSnippet(source: string, index: number): boolean {
  let quote: string | null = null;
  let lineComment = false;
  let blockComment = false;
  for (let i = 0; i < index; i += 1) {
    const ch = source[i] ?? "";
    const next = source[i + 1];
    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") quote = ch;
  }
  return quote !== null || lineComment || blockComment;
}

function materialize(body: string, indent: string): { text: string; caret: number } {
  const lines = body.split("\n").map((line, index) => (index === 0 ? line : indent + line));
  const joined = lines.join("\n");
  const pipe = joined.indexOf("|");
  if (pipe < 0) return { text: joined, caret: joined.length };
  return { text: joined.slice(0, pipe) + joined.slice(pipe + 1), caret: pipe };
}

function build(value: string, from: number, to: number, snippet: Snippet): SnippetEdit {
  const lineStart = value.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
  const prefix = value.slice(lineStart, from);
  const indent = /^[ \t]*$/.test(prefix) ? prefix : "";
  const made = materialize(snippet.body, indent);
  return { from, to, text: made.text, caret: from + made.caret };
}

/**
 * The character before `caret` was just inserted.
 * Immediate triggers expand on their last letter. Every trigger also expands
 * when a space, `(`, or newline finishes the word — short words wait for that,
 * so `const` can still become `console`.
 */
export function snippetAfterInput(value: string, caret: number): SnippetEdit | null {
  if (caret <= 0 || caret > value.length) return null;
  const typed = value[caret - 1] ?? "";
  if (isIdent(typed)) {
    if (caret < value.length && isIdent(value[caret] ?? "")) return null;
    const from = wordStart(value, caret);
    const word = value.slice(from, caret);
    const snippet = SNIPPETS.find((item) => item.trigger === word);
    if (!snippet || effectiveMode(snippet) !== "immediate") return null;
    if (blocksSnippet(value, from)) return null;
    return build(value, from, caret, snippet);
  }
  if (typed !== " " && typed !== "(" && typed !== "\n") return null;
  const boundaryAt = caret - 1;
  const from = wordStart(value, boundaryAt);
  if (from === boundaryAt) return null;
  const word = value.slice(from, boundaryAt);
  const snippet = SNIPPETS.find((item) => item.trigger === word);
  if (!snippet || blocksSnippet(value, from)) return null;
  return build(value, from, caret, snippet);
}

export function snippetPreview(body: string): string {
  const one = body.replace("|", "·").replace(/\s+/g, " ").trim();
  return one.length > 52 ? `${one.slice(0, 49)}…` : one;
}

export function snippetCatalog(): Array<{ trigger: string; preview: string; mode: SnippetMode }> {
  return SNIPPETS.map((snippet) => ({
    trigger: snippet.trigger,
    preview: snippetPreview(snippet.body),
    mode: effectiveMode(snippet),
  }));
}

export function readSnippetsEnabled(stored: string | null | undefined): boolean {
  return stored !== "off";
}

export function snippetsEnabled(): boolean {
  if (typeof localStorage === "undefined") return true;
  return readSnippetsEnabled(localStorage.getItem(SNIPPETS_KEY));
}

export function setSnippetsEnabled(on: boolean): void {
  localStorage.setItem(SNIPPETS_KEY, on ? "on" : "off");
}
