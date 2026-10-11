import { CODE_SIZE_STEPS, useStudy } from "@/lib/study";
import { highlightLine, indentOf, type TokenKind } from "@etalon/web-highlight";
import { colors, fonts } from "@/theme";
import { Maximize2, WrapText, X } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "./text";

const TOKEN_COLOR: Record<TokenKind, string> = {
  keyword: colors.codeKeyword,
  string: colors.codeString,
  number: colors.codeNumber,
  comment: colors.codeComment,
  call: colors.codeCall,
};

function CodeLines({ code, wrap, size }: { code: string; wrap: boolean; size: number }) {
  const lines = code.replace(/\s+$/, "").split("\n");
  const body = (
    <View>
      {lines.map((line, index) => {
        const indent = indentOf(line);
        const shown = wrap ? line.slice(indent) : line;
        const tokens = shown === "" ? [{ text: " " }] : highlightLine(shown);
        return (
          <View key={index} style={styles.line}>
            <T mono size={size} color={colors.faint} style={styles.gutter}>
              {index + 1}
            </T>
            <T
              mono
              size={size}
              style={wrap ? { paddingLeft: (indent + 2) * (size * 0.6), flex: 1 } : undefined}
            >
              {tokens.map((token, tokenIndex) =>
                token.kind ? (
                  <T
                    key={tokenIndex}
                    mono
                    size={size}
                    color={TOKEN_COLOR[token.kind]}
                    style={token.kind === "comment" ? { fontFamily: fonts.monoItalic } : undefined}
                  >
                    {token.text}
                  </T>
                ) : (
                  token.text
                ),
              )}
            </T>
          </View>
        );
      })}
    </View>
  );
  if (wrap) return <View style={styles.pad}>{body}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pad}>
      {body}
    </ScrollView>
  );
}

function ToolButton({
  label,
  pressed,
  onPress,
  children,
}: {
  label: string;
  pressed?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={{ selected: pressed }}
      onPress={onPress}
      style={[styles.tool, pressed ? styles.toolOn : null]}
    >
      {children}
    </Pressable>
  );
}

export function CodeBlock({
  code,
  label = "main.js",
  meta,
}: {
  code: string;
  label?: string;
  meta?: ReactNode;
}) {
  const { codePrefs, setCodePrefs } = useStudy();
  const [full, setFull] = useState(false);
  const sizeIndex = CODE_SIZE_STEPS.findIndex((item) => item === codePrefs.size);
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.block}>
      <View style={styles.caption}>
        <View style={styles.captionLeft}>
          <T mono size={12} style={styles.file}>
            {label}
          </T>
          {meta}
        </View>
        <View style={styles.tools}>
          <ToolButton
            label="Перенос строк"
            pressed={codePrefs.wrap}
            onPress={() => setCodePrefs({ ...codePrefs, wrap: !codePrefs.wrap })}
          >
            <WrapText size={18} color={codePrefs.wrap ? colors.mark : colors.muted} />
          </ToolButton>
          <ToolButton
            label="Мельче"
            onPress={() =>
              setCodePrefs({
                ...codePrefs,
                size: CODE_SIZE_STEPS[Math.max(0, sizeIndex - 1)] ?? codePrefs.size,
              })
            }
          >
            <T mono size={12} color={colors.muted}>
              A−
            </T>
          </ToolButton>
          <ToolButton
            label="Крупнее"
            onPress={() =>
              setCodePrefs({
                ...codePrefs,
                size: CODE_SIZE_STEPS[Math.min(CODE_SIZE_STEPS.length - 1, sizeIndex + 1)] ?? codePrefs.size,
              })
            }
          >
            <T mono size={12} color={colors.muted}>
              A+
            </T>
          </ToolButton>
          <ToolButton label="На весь экран" onPress={() => setFull(true)}>
            <Maximize2 size={17} color={colors.muted} />
          </ToolButton>
        </View>
      </View>
      <CodeLines code={code} wrap={codePrefs.wrap} size={codePrefs.size} />
      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)}>
        <View style={[styles.full, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.fullBar}>
            <T mono size={12} color={colors.muted}>
              {label} · без переноса
            </T>
            <Pressable accessibilityLabel="Закрыть" onPress={() => setFull(false)} style={styles.close}>
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView>
            <CodeLines code={code} wrap={false} size={codePrefs.size + 1} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export function CodeSnippet({ code }: { code: string }) {
  const { codePrefs } = useStudy();
  return (
    <View style={styles.snippet}>
      <CodeLines code={code} wrap={codePrefs.wrap} size={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  snippet: {
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  caption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  captionLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  file: {
    borderRadius: 8,
    backgroundColor: colors.line,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  tools: { flexDirection: "row", alignItems: "center" },
  tool: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  toolOn: { backgroundColor: colors.markSoft },
  pad: { paddingVertical: 10, paddingRight: 12 },
  line: { flexDirection: "row", alignItems: "flex-start" },
  gutter: { width: 36, textAlign: "right", paddingRight: 10 },
  full: { flex: 1, backgroundColor: colors.paper },
  fullBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
