import { CodeSnippet } from "@/components/code-block";

type Block =
  | { kind: "heading"; text: string }
  | { kind: "code"; lines: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

/** `code`, **жирный**, *курсив*. Разметка минимальная: теорию пишут руками в JSON. */
function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-raised px-1 py-0.5 font-mono text-[0.9em] text-mark [overflow-wrap:anywhere]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <span key={key}>{part}</span>;
  });
}

/**
 * Разбирает теорию на блоки. Поддерживается ровно четыре конструкции:
 * `### Заголовок`, ```-блок кода, строки `- пункт` и обычные абзацы,
 * разделённые пустой строкой.
 */
function parse(text: string): Block[] {
  const lines = text.trim().split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = (lines[index] ?? "").trim();

    if (line.startsWith("```")) {
      flush();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").trim().startsWith("```")) {
        body.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push({ kind: "code", lines: body });
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push({ kind: "heading", text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith("- ")) {
      flush();
      const items = [line.slice(2).trim()];
      while (index + 1 < lines.length && (lines[index + 1] ?? "").trim().startsWith("- ")) {
        index += 1;
        items.push((lines[index] ?? "").trim().slice(2).trim());
      }
      blocks.push({ kind: "list", items });
      continue;
    }
    if (line === "") {
      flush();
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks;
}

export function TheoryText({ text }: { text: string }) {
  const blocks = parse(text);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-pretty text-ink">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "heading") {
          return (
            <h3
              key={key}
              className="pt-2 text-xs font-semibold tracking-widest text-muted uppercase"
            >
              {block.text}
            </h3>
          );
        }
        if (block.kind === "code") {
          return <CodeSnippet key={key} code={block.lines.join("\n")} />;
        }
        if (block.kind === "list") {
          return (
            <ul key={key} className="ml-1 space-y-1.5">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] size-1 shrink-0 rounded-full bg-mark"
                  />
                  <span>{inline(item, `${key}-${itemIndex}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{inline(block.text, key)}</p>;
      })}
    </div>
  );
}
