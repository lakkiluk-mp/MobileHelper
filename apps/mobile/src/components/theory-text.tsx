import { colors } from "@/theme";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { CodeSnippet } from "./code-block";
import { T } from "./text";

type Block =
  | { kind: "heading"; text: string }
  | { kind: "code"; lines: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <T key={key} mono size={13} color={colors.mark} style={styles.code}>
          {part.slice(1, -1)}
        </T>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <T key={key} size={14} weight="semibold">
          {part.slice(2, -2)}
        </T>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <T key={key} size={14}>
          {part.slice(1, -1)}
        </T>
      );
    }
    return (
      <T key={key} size={14}>
        {part}
      </T>
    );
  });
}

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
    <View style={styles.wrap}>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "heading") {
          return (
            <T key={key} size={12} weight="semibold" color={colors.muted} style={styles.heading}>
              {block.text.toUpperCase()}
            </T>
          );
        }
        if (block.kind === "code") return <CodeSnippet key={key} code={block.lines.join("\n")} />;
        if (block.kind === "list") {
          return (
            <View key={key} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={`${key}-${itemIndex}`} style={styles.item}>
                  <View style={styles.dot} />
                  <T size={14} style={styles.itemText}>
                    {inline(item, `${key}-${itemIndex}`)}
                  </T>
                </View>
              ))}
            </View>
          );
        }
        return (
          <T key={key} size={14} style={styles.paragraph}>
            {inline(block.text, key)}
          </T>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  heading: { paddingTop: 8, letterSpacing: 1.2 },
  paragraph: { lineHeight: 22 },
  list: { gap: 6, marginLeft: 4 },
  item: { flexDirection: "row", gap: 8 },
  itemText: { flex: 1, lineHeight: 22 },
  dot: {
    width: 4,
    height: 4,
    marginTop: 9,
    borderRadius: 2,
    backgroundColor: colors.mark,
  },
  code: {
    backgroundColor: colors.raised,
    borderRadius: 4,
    overflow: "hidden",
  },
});
