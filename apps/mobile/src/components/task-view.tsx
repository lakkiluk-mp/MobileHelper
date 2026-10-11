import { CodeBlock, CodeSnippet } from "@/components/code-block";
import { SyncNote } from "@/components/shell";
import { T } from "@/components/text";
import { TheoryText } from "@/components/theory-text";
import { runInPhone } from "@/lib/runner";
import { useStudy } from "@/lib/study";
import { compareTapes, gradeImplementTape, type TapeEvent } from "@etalon/runner";
import type { Card } from "@etalon/shared";
import { ANSWER_WORDS, checkLine, insertWord, suggestWords } from "@etalon/web-answer";
import { snippetAfterInput } from "@etalon/web-snippets";
import { colors, fonts } from "@/theme";
import { router } from "expo-router";
import { Play, RotateCcw } from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <T mono size={11} color={colors.muted} style={styles.kicker}>
        {title.toUpperCase()}
      </T>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function lineOf(event: TapeEvent): string {
  if (event.type === "log") return event.args.join(" ");
  if (event.type === "error") return `${event.name}: ${event.message}`;
  return `${event.pass ? "ок" : "не ок"} ${event.name}${event.message ? ` — ${event.message}` : ""}`;
}

function Tape({ events, verdict, ok }: { events: TapeEvent[]; verdict?: string; ok?: boolean }) {
  return (
    <View accessibilityLabel="Лента" style={styles.tape}>
      <View style={styles.rowBetween}>
        <T mono size={11} color={colors.muted} style={styles.kicker}>
          ЛЕНТА
        </T>
        {verdict ? (
          <T mono size={11} color={ok ? colors.mark : colors.bad} style={styles.kicker}>
            {verdict.toUpperCase()}
          </T>
        ) : null}
      </View>
      {events.length === 0 ? (
        <T mono size={13} color={colors.muted}>
          пусто
        </T>
      ) : (
        events.map((event, index) => (
          <T
            key={`${event.type}-${index}`}
            mono
            size={13}
            color={
              event.type === "error" || (event.type === "test" && !event.pass)
                ? colors.bad
                : colors.mark
            }
            style={styles.tapeLine}
          >
            › {lineOf(event)}
          </T>
        ))
      )}
    </View>
  );
}

function AnswerResult({ lines, misses }: { lines: string[]; misses: number }) {
  return (
    <View style={[styles.answer, styles.answerOk]}>
      <T mono size={11} color={colors.mark} style={styles.kicker}>
        ВЕРНО
      </T>
      <T size={14} color={misses === 0 ? colors.mark : colors.warn}>
        {misses === 0 ? "Без ошибок — знал" : `Ошибок: ${misses} — сомневался`}
      </T>
      {lines.map((line, index) => (
        <T key={`${index}-${line}`} mono size={13}>
          {line}
        </T>
      ))}
    </View>
  );
}

type Selection = { start: number; end: number };

function AnswerBox({
  value,
  onChange,
  accepted,
  total,
  wrong,
  selection,
  onSelectionChange,
  onFocusChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  accepted: string[];
  total: number;
  wrong: boolean;
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
  onFocusChange: (focused: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.answer}>
      <T mono size={11} color={colors.muted} style={styles.kicker}>
        ЧТО ВЫВЕДЕТ · ВЫВОД {accepted.length + 1} ИЗ {total}
      </T>
      <T size={12} color={colors.faint}>
        По одному выводу за раз. Строки — в кавычках, у ошибки хватит имени. Enter — проверить.
      </T>
      {accepted.map((line, index) => (
        <T key={`${index}-${line}`} mono size={13} color={colors.mark}>
          › {line}
        </T>
      ))}
      <TextInput
        value={value}
        selection={selection}
        onSelectionChange={(event) => onSelectionChange(event.nativeEvent.selection)}
        onChangeText={onChange}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onSubmitEditing={onSubmit}
        submitBehavior="submit"
        returnKeyType="next"
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        keyboardType={Platform.OS === "android" ? "visible-password" : "ascii-capable"}
        maxLength={500}
        placeholder="undefined"
        placeholderTextColor={colors.faint}
        style={[styles.editor, styles.answerInput, wrong ? styles.answerWrong : null]}
      />
      {wrong ? (
        <T size={14} color={colors.bad}>
          Вывод {accepted.length + 1} — неверно
        </T>
      ) : null}
    </View>
  );
}

function AnswerWords({
  value,
  caret,
  onApply,
}: {
  value: string;
  caret: number;
  onApply: (text: string, caret: number) => void;
}) {
  const hints = suggestWords(value, caret);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.words}>
        {hints.map((hint) => (
          <Pressable
            key={`hint-${hint.word}`}
            onPress={() =>
              onApply(
                value.slice(0, hint.from) + hint.word + value.slice(hint.to),
                hint.from + hint.word.length,
              )
            }
            style={[styles.word, styles.wordHint]}
          >
            <T mono size={13} color={colors.paper}>
              {hint.word}
            </T>
          </Pressable>
        ))}
        {ANSWER_WORDS.map((word) => (
          <Pressable
            key={word}
            onPress={() => {
              const next = insertWord(value, caret, word);
              onApply(next.text, next.caret);
            }}
            style={styles.word}
          >
            <T mono size={13}>
              {word}
            </T>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function useKeyboardLift() {
  const rootRef = useRef<View>(null);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const [rootBottom, setRootBottom] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) =>
      setKeyboardTop(event.endCoordinates.screenY),
    );
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () =>
      setKeyboardTop(null),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const onLayout = () => {
    rootRef.current?.measureInWindow((_x, y, _width, height) => setRootBottom(y + height));
  };
  const open = keyboardTop !== null;
  return { rootRef, onLayout, open, overlap: open ? Math.max(rootBottom - keyboardTop, 0) : 0 };
}

function ActionButton({
  onPress,
  pressed,
  disabled,
  primary,
  children,
}: {
  onPress: () => void;
  pressed?: boolean;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.action,
        primary ? styles.actionPrimary : pressed ? styles.actionOn : styles.actionIdle,
        disabled ? styles.disabled : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Подпись кнопки: одна строка, лишнее уходит в «…». Иначе «Дальше · 1.3» выдавливает соседей. */
function ActionLabel({
  children,
  color,
  tone,
}: {
  children: ReactNode;
  color?: string;
  tone?: "plain" | "primary";
}) {
  return (
    <T
      size={14}
      weight={tone === "primary" ? "bold" : "regular"}
      color={color ?? (tone === "primary" ? colors.paper : colors.ink)}
      numberOfLines={1}
      ellipsizeMode="tail"
      style={styles.actionLabel}
    >
      {children}
    </T>
  );
}

function ActionBar({
  children,
  lift,
}: {
  children: ReactNode;
  lift: { open: boolean; overlap: number };
}) {
  const insets = useSafeAreaInsets();
  const bottom = lift.open ? lift.overlap + 8 : Math.max(insets.bottom, 12);
  return <View style={[styles.bar, { paddingBottom: bottom }]}>{children}</View>;
}

function VariantBlock({
  code,
  answer,
  theory,
  expected,
  strict,
}: {
  code: string;
  answer: string;
  theory: string;
  expected: TapeEvent[];
  strict: boolean;
}) {
  const [tape, setTape] = useState<TapeEvent[] | null>(null);
  const [why, setWhy] = useState(false);
  const compared = tape ? compareTapes(tape, expected) : null;
  return (
    <View style={styles.variant}>
      <T mono size={11} color={colors.muted} style={styles.kicker}>
        ВАРИАНТ
      </T>
      <CodeSnippet code={code} />
      {tape && compared ? (
        <Tape
          events={tape}
          ok={compared.ok}
          verdict={compared.ok ? "совпала с эталоном" : "не совпала"}
        />
      ) : null}
      <T mono size={14} weight="bold" color={colors.mark}>
        {answer}
      </T>
      <View style={styles.pair}>
        <ActionButton
          onPress={() => {
            void runInPhone({ code, strict, mode: "predict", waitMs: 60 }).then(setTape);
          }}
        >
          <Play size={16} color={colors.ink} />
          <T size={14}>Запустить</T>
        </ActionButton>
        <ActionButton pressed={why} onPress={() => setWhy((value) => !value)}>
          <T size={14} color={why ? colors.mark : colors.ink}>
            Почему так
          </T>
        </ActionButton>
      </View>
      {why ? <TheoryText text={theory} /> : null}
    </View>
  );
}

export function TaskScreenBody({
  card,
  header,
  nextId,
  nextLocked,
  onNext,
}: {
  card: Card;
  header?: ReactNode;
  nextId: string | null;
  nextLocked: boolean;
  onNext: () => void;
}) {
  const { draft, saveDraft, snippetsOn, progress, rate } = useStudy();
  const [strict, setStrict] = useState(card.kind === "predict" ? card.strict : false);
  const [tape, setTape] = useState<TapeEvent[] | null>(null);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState(false);
  const starter = card.kind === "implement" ? card.starter : "";
  const [code, setCode] = useState(starter);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();
  const prevRef = useRef(starter);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [answer, setAnswer] = useState("");
  const [accepted, setAccepted] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const revealed = solved || gaveUp;
  const [answerSelection, setAnswerSelection] = useState<Selection>({ start: 0, end: 0 });
  const [answerFocused, setAnswerFocused] = useState(false);
  const keyboard = useKeyboardLift();

  function applyAnswer(text: string, at: number) {
    setAnswer(text);
    setAnswerSelection({ start: at, end: at });
  }

  useEffect(() => {
    setTape(null);
    setOpen(false);
    setWhy(false);
    setRunning(false);
    setAnswer("");
    setAnswerSelection({ start: 0, end: 0 });
    setAccepted([]);
    setWrong(false);
    setAttempts(0);
    setSolved(progressRef.current[card.id]?.status === "knew");
    setGaveUp(false);
    if (card.kind === "predict") {
      setStrict(card.strict);
      return;
    }
    const next = draftRef.current(card.id) || card.starter;
    prevRef.current = next;
    setCode(next);
    setSelection(undefined);
  }, [card]);

  function runPredict() {
    if (card.kind !== "predict") return;
    setRunning(true);
    void runInPhone({ code: card.code, strict, mode: "predict", waitMs: 60 }).then((events) => {
      setTape(events);
      setRunning(false);
    });
  }

  function checkPredict() {
    if (card.kind !== "predict") return;
    const event = card.expected[accepted.length];
    if (!event || !answer.trim()) return;
    if (!checkLine(answer, event, card.code)) {
      setWrong(true);
      setAttempts((value) => value + 1);
      return;
    }
    const next = [...accepted, answer.trim()];
    setAccepted(next);
    setAnswer("");
    setAnswerSelection({ start: 0, end: 0 });
    setWrong(false);
    if (next.length < card.expected.length) return;
    Keyboard.dismiss();
    rate(card.id, attempts === 0 ? "knew" : "unsure");
    setSolved(true);
  }

  function giveUp() {
    rate(card.id, "missed");
    setGaveUp(true);
    setOpen(true);
  }

  function retry() {
    setAnswer("");
    setAnswerSelection({ start: 0, end: 0 });
    setAccepted([]);
    setWrong(false);
    setAttempts(0);
    setSolved(false);
    setGaveUp(false);
    setOpen(false);
    setWhy(false);
    setTape(null);
  }

  function runImplement() {
    if (card.kind !== "implement") return;
    setRunning(true);
    void runInPhone({
      code,
      strict: false,
      mode: "implement",
      tests: card.tests,
      waitMs: card.waitMs ?? 80,
    }).then((events) => {
      setTape(events);
      setRunning(false);
      if (!solved && gradeImplementTape(events, card.tests).ok) {
        rate(card.id, gaveUp ? "unsure" : "knew");
        setSolved(true);
      }
    });
  }

  const compared = card.kind === "predict" && tape ? compareTapes(tape, card.expected) : null;
  const graded = card.kind === "implement" && tape ? gradeImplementTape(tape, card.tests) : null;

  return (
    <View ref={keyboard.rootRef} onLayout={keyboard.onLayout} style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        {header}
        <View style={styles.run}>
          {card.kind === "predict" ? (
            <>
              <Pressable accessible={false} onPress={Keyboard.dismiss}>
                <CodeBlock
                  code={card.code}
                  meta={
                    <Pressable
                      accessibilityLabel="Строгий режим"
                      onPress={() => setStrict((value) => !value)}
                    >
                      <T mono size={12} color={strict ? colors.mark : colors.muted}>
                        {strict ? "strict" : "sloppy"}
                      </T>
                    </Pressable>
                  }
                />
              </Pressable>
              {solved && accepted.length > 0 ? (
                <AnswerResult lines={accepted} misses={attempts} />
              ) : null}
              {revealed ? null : (
                <AnswerBox
                  value={answer}
                  onChange={(value) => {
                    setAnswer(value);
                    setWrong(false);
                  }}
                  accepted={accepted}
                  total={card.expected.length}
                  wrong={wrong}
                  selection={answerSelection}
                  onSelectionChange={setAnswerSelection}
                  onFocusChange={setAnswerFocused}
                  onSubmit={checkPredict}
                />
              )}
            </>
          ) : (
            <>
              <T size={15} style={styles.statement}>
                {card.statement}
              </T>
              <CodeBlock code={card.tests.map((test) => test.code).join("\n\n")} label="tests.js" />
              <View style={styles.editorHead}>
                <T mono size={12} color={colors.muted}>
                  solution.js
                </T>
                <Pressable onPress={() => router.push("/settings")} style={styles.settingsLink}>
                  <T size={14} color={colors.muted}>
                    Автодополнение
                  </T>
                </Pressable>
              </View>
              <TextInput
                value={code}
                selection={selection}
                onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
                multiline
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20000}
                onChangeText={(value) => {
                  const prev = prevRef.current;
                  let index = 0;
                  const limit = Math.min(prev.length, value.length);
                  while (index < limit && prev[index] === value[index]) index += 1;
                  const caret = index + Math.max(0, value.length - prev.length);
                  const apply = (next: string, caretAt?: number) => {
                    prevRef.current = next;
                    setCode(next);
                    if (caretAt != null) setSelection({ start: caretAt, end: caretAt });
                    saveDraft(card.id, next);
                  };
                  if (!snippetsOn || value.length <= prev.length) {
                    apply(value);
                    return;
                  }
                  const edit = snippetAfterInput(value, caret);
                  if (!edit) {
                    apply(value);
                    return;
                  }
                  apply(value.slice(0, edit.from) + edit.text + value.slice(edit.to), edit.caret);
                }}
                style={styles.editor}
              />
            </>
          )}
          {revealed ? (
            <Pressable accessibilityLabel="Решить заново" onPress={retry} style={styles.retry}>
              <RotateCcw size={16} color={colors.muted} />
              <T size={14} color={colors.muted}>
                Решить заново
              </T>
            </Pressable>
          ) : null}
          {tape ? (
            <View style={styles.gap}>
              {compared ? (
                <Tape
                  events={tape}
                  ok={compared.ok}
                  verdict={compared.ok ? "совпала с эталоном" : "не совпала"}
                />
              ) : null}
              {graded ? (
                <Tape
                  events={tape}
                  ok={graded.ok}
                  verdict={graded.ok ? "все тесты прошли" : "есть ошибки"}
                />
              ) : null}
              {card.kind === "predict" && compared && strict !== card.strict ? (
                <T size={14} color={colors.muted}>
                  Эталон записан в другом режиме — результат может отличаться из-за него.
                </T>
              ) : null}
              {card.kind === "predict" ? (
                <T size={12} color={colors.faint}>
                  Кавычки в ленте — это строка. Число и undefined без кавычек.
                </T>
              ) : null}
            </View>
          ) : null}
          {open && card.kind === "predict" ? (
            <Panel title="Ответ">
              <T mono size={15} weight="bold" color={colors.mark}>
                {card.answer}
              </T>
              {card.variants?.map((variant) => (
                <VariantBlock
                  key={variant.id}
                  code={variant.code}
                  answer={variant.answer}
                  theory={variant.theory}
                  expected={variant.expected}
                  strict={card.strict}
                />
              ))}
            </Panel>
          ) : null}
          {open && card.kind === "implement" ? (
            <View style={styles.gap}>
              <CodeBlock code={card.solution} label="эталон.js" />
            </View>
          ) : null}
          {why ? (
            <Panel title="Почему так">
              <TheoryText text={card.theory} />
            </Panel>
          ) : null}
        </View>
        <SyncNote />
      </ScrollView>
      <ActionBar lift={keyboard}>
        {keyboard.open ? (
          <>
            {answerFocused && card.kind === "predict" && !revealed ? (
              <AnswerWords value={answer} caret={answerSelection.end} onApply={applyAnswer} />
            ) : null}
            <View style={styles.actions}>
              <ActionButton onPress={Keyboard.dismiss}>
                <ActionLabel>Готово</ActionLabel>
              </ActionButton>
              {card.kind === "implement" ? (
                <ActionButton
                  primary
                  disabled={running}
                  onPress={() => {
                    Keyboard.dismiss();
                    runImplement();
                  }}
                >
                  <Play size={16} color={colors.paper} />
                  <ActionLabel tone="primary">{running ? "Считаю" : "Тесты"}</ActionLabel>
                </ActionButton>
              ) : !revealed ? (
                <ActionButton primary disabled={!answer.trim()} onPress={checkPredict}>
                  <ActionLabel tone="primary">Проверить</ActionLabel>
                </ActionButton>
              ) : null}
            </View>
          </>
        ) : card.kind === "predict" && !revealed ? (
          <View style={styles.actions}>
            <ActionButton onPress={giveUp}>
              <ActionLabel>Сдаюсь</ActionLabel>
            </ActionButton>
            <ActionButton primary disabled={!answer.trim()} onPress={checkPredict}>
              <ActionLabel tone="primary">Проверить</ActionLabel>
            </ActionButton>
          </View>
        ) : (
          <View style={styles.actions}>
            {revealed ? (
              <ActionButton pressed={open} onPress={() => setOpen((value) => !value)}>
                <ActionLabel color={open ? colors.mark : colors.ink}>
                  {card.kind === "predict" ? "Ответ" : "Эталон"}
                </ActionLabel>
              </ActionButton>
            ) : (
              <ActionButton onPress={giveUp}>
                <ActionLabel>Сдаюсь</ActionLabel>
              </ActionButton>
            )}
            <ActionButton pressed={why} onPress={() => setWhy((value) => !value)}>
              <ActionLabel color={why ? colors.mark : colors.ink}>Почему так</ActionLabel>
            </ActionButton>
            <ActionButton
              primary
              disabled={running}
              onPress={card.kind === "predict" ? runPredict : runImplement}
            >
              <Play size={16} color={colors.paper} />
              <ActionLabel tone="primary">
                {running ? "Считаю" : card.kind === "predict" ? "Запуск" : "Тесты"}
              </ActionLabel>
            </ActionButton>
          </View>
        )}
        {keyboard.open ? null : (
          <Pressable
            disabled={nextLocked}
            onPress={onNext}
            style={[styles.next, nextLocked ? styles.disabled : null]}
          >
            <T
              size={15}
              weight="bold"
              color={nextLocked ? colors.faint : colors.paper}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.actionLabel}
            >
              {nextId ? (nextLocked ? "Сначала ответь" : `Дальше · ${nextId}`) : "К пути"}
            </T>
          </Pressable>
        )}
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: 24 },
  run: { marginTop: 16, gap: 12 },
  gap: { marginTop: 12, gap: 8 },
  panel: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
  },
  panelBody: { marginTop: 12 },
  kicker: { letterSpacing: 0.8 },
  tape: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 2,
  },
  tapeLine: { lineHeight: 22 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  answer: { gap: 8 },
  retry: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  answerOk: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.mark,
    backgroundColor: colors.markSoft,
    padding: 12,
  },
  answerInput: { minHeight: 48 },
  answerWrong: { borderColor: colors.bad },
  words: { flexDirection: "row", gap: 6 },
  word: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  wordHint: { borderColor: colors.mark, backgroundColor: colors.mark },
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.raised,
    backgroundColor: colors.paper,
    paddingTop: 12,
    gap: 10,
  },
  next: {
    flex: 1,
    minWidth: 104,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.mark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    minWidth: 88,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  actionLabel: { flexShrink: 1, minWidth: 0, textAlign: "center" },
  actionPrimary: { backgroundColor: colors.ink },
  actionOn: { borderWidth: 1, borderColor: colors.mark, backgroundColor: colors.markSoft },
  actionIdle: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  disabled: { opacity: 0.6 },
  variant: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 16,
    gap: 12,
  },
  pair: { flexDirection: "row", gap: 8 },
  statement: { lineHeight: 22, marginBottom: 4 },
  editorHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingsLink: { minHeight: 44, justifyContent: "center" },
  editor: {
    minHeight: 224,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 12,
    color: colors.ink,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 20,
    textAlignVertical: "top",
  },
});
