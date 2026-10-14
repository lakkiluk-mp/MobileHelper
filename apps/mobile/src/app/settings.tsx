import { T } from "@/components/text";
import { useStudy } from "@/lib/study";
import { snippetCatalog } from "@etalon/web-snippets";
import { colors } from "@/theme";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Settings() {
  const { snippetsOn, setSnippetsOn, openAll, setOpenAll, ready } = useStudy();
  const catalog = snippetCatalog();
  const immediate = catalog.filter((item) => item.mode === "immediate");
  const boundary = catalog.filter((item) => item.mode === "boundary");
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { paddingTop: Math.max(insets.top, 32) }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <T size={14} color={colors.mark}>
            ‹ Профиль
          </T>
        </Pressable>
        <T size={12} weight="medium" color={colors.muted} style={styles.kicker}>
          ЭТАЛОН
        </T>
        <T size={36} style={styles.title}>
          Настройки
        </T>
        <T size={24} style={styles.section}>
          Темы
        </T>
        <T size={14} color={colors.muted} style={styles.copy}>
          Все уровни открыты, можно зайти в любую задачу. Выключи — снова по порядку тропы.
        </T>
        {ready ? (
          <Pressable
            accessibilityState={{ selected: openAll }}
            onPress={() => setOpenAll(!openAll)}
            style={openAll ? styles.on : styles.off}
          >
            <T size={14} color={openAll ? colors.paper : colors.ink}>
              {openAll ? "Все темы открыты" : "Темы по порядку"}
            </T>
          </Pressable>
        ) : (
          <View style={styles.pulse} />
        )}
        <T size={24} style={styles.section}>
          Автодополнение
        </T>
        <T size={14} color={colors.muted} style={styles.copy}>
          Списка вариантов нет. Дописанное слово само становится конструкцией: console сразу
          превращается в console.log(), курсор встаёт между скобками. Короткие слова ждут пробела,
          скобки или новой строки — иначе const нельзя было бы дописать до console.
        </T>
        {ready ? (
          <Pressable
            accessibilityState={{ selected: snippetsOn }}
            onPress={() => setSnippetsOn(!snippetsOn)}
            style={snippetsOn ? styles.on : styles.off}
          >
            <T size={14} color={snippetsOn ? colors.paper : colors.ink}>
              {snippetsOn ? "Автодополнение включено" : "Автодополнение выключено"}
            </T>
          </Pressable>
        ) : (
          <View style={styles.pulse} />
        )}
        <T size={14} color={colors.muted} style={styles.copy}>
          Если нужно само слово, а не конструкция — выключи здесь. Точка · в примере показывает, куда
          встанет курсор.
        </T>
        <SnippetGroup title="Сразу" items={immediate} />
        <SnippetGroup title="После пробела, скобки или новой строки" items={boundary} />
      </ScrollView>
    </View>
  );
}

function SnippetGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ trigger: string; preview: string }>;
}) {
  return (
    <View style={styles.group}>
      <T size={14} color={colors.muted}>
        {title}
      </T>
      {items.map((item) => (
        <View key={item.trigger} style={styles.item}>
          <T mono size={14}>
            {item.trigger}
          </T>
          <T mono size={12} color={colors.muted} style={styles.preview}>
            {item.preview}
          </T>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 20, paddingBottom: 32 },
  back: { minHeight: 44, justifyContent: "center" },
  kicker: { marginTop: 16, letterSpacing: 2 },
  title: { marginTop: 8 },
  section: { marginTop: 32 },
  copy: { marginTop: 12, lineHeight: 22 },
  on: {
    marginTop: 20,
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: colors.mark,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  off: {
    marginTop: 20,
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  pulse: { marginTop: 20, height: 44, width: 224, borderRadius: 999, backgroundColor: colors.line },
  group: { marginTop: 40 },
  item: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 12 },
  preview: { marginTop: 4 },
});
