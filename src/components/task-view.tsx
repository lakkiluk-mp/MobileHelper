import { runInBrowser } from "@/lib/browser-runner";
import { snippetAfterInput, snippetsEnabled, type SnippetEdit } from "@/lib/snippets";
import { useStudy } from "@/lib/study";
import { CodeBlock, CodeSnippet } from "@/components/code-block";
import { TheoryText } from "@/components/theory-text";
import { compareTapes, gradeImplementTape, type TapeEvent } from "@etalon/runner";
import type { Card, PredictCard, ProgressStatus } from "@etalon/shared";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const RATINGS: Array<{ id: ProgressStatus; label: string; idle: string }> = [
  { id: "missed", label: "Не знал", idle: "text-bad" },
  { id: "unsure", label: "Сомневался", idle: "text-warn" },
  { id: "knew", label: "Знал", idle: "text-mark" },
];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-line bg-card p-4">
      <p className="m-0 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function WhyPanel({ text }: { text: string }) {
  return (
    <Panel title="Почему так">
      <TheoryText text={text} />
    </Panel>
  );
}

function ActionButton({
  onClick,
  pressed,
  disabled,
  primary,
  children,
}: {
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  const look = primary
    ? "border-0 bg-ink font-bold text-paper"
    : pressed
      ? "border border-mark bg-mark-soft text-mark"
      : "border border-line bg-card text-ink";
  return (
    <button
      type="button"
      aria-pressed={primary ? undefined : pressed}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm disabled:opacity-60 ${look}`}
    >
      {children}
    </button>
  );
}

function ActionBar({ taskId, children }: { taskId: string; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 flex flex-col gap-2.5 border-t border-raised bg-paper/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur">
      <div className="grid grid-cols-3 gap-2">{children}</div>
      <Ratings taskId={taskId} />
    </div>
  );
}

function lineOf(event: TapeEvent): string {
  if (event.type === "log") return event.args.join(" ");
  if (event.type === "error") return `${event.name}: ${event.message}`;
  return `${event.pass ? "ок" : "не ок"} ${event.name}${event.message ? ` — ${event.message}` : ""}`;
}

function Tape({ events, verdict, ok }: { events: TapeEvent[]; verdict?: string; ok?: boolean }) {
  return (
    <section
      aria-label="Лента"
      className="rounded-2xl border border-line p-3 font-mono text-[13px] leading-[1.7]"
    >
      <p className="m-0 mb-1 flex justify-between gap-3 text-[11px] tracking-[0.08em] text-muted uppercase">
        <span>лента</span>
        {verdict ? <span className={ok ? "text-mark" : "text-bad"}>{verdict}</span> : null}
      </p>
      {events.length === 0 ? (
        <p className="m-0 text-muted">пусто</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {events.map((event, index) => (
            <li
              key={`${event.type}-${index}`}
              className={`-indent-[2ch] pl-[2ch] whitespace-pre-wrap [overflow-wrap:anywhere] ${
                event.type === "error" || (event.type === "test" && !event.pass)
                  ? "text-bad"
                  : "text-mark"
              }`}
            >
              › {lineOf(event)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Ratings({ taskId }: { taskId: string }) {
  const { progress, rate } = useStudy();
  const current = progress[taskId]?.status;
  return (
    <div
      role="group"
      aria-label="Как прошло"
      className="grid grid-cols-3 rounded-2xl border border-line bg-card p-1"
    >
      {RATINGS.map((item) => {
        const selected = current === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => rate(taskId, item.id)}
            className={
              selected
                ? "min-h-[46px] rounded-xl bg-mark text-sm font-bold text-paper"
                : `min-h-[46px] rounded-xl text-sm font-semibold ${item.idle}`
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function PredictRun({ card }: { card: PredictCard }) {
  const [strict, setStrict] = useState(card.strict);
  const [tape, setTape] = useState<TapeEvent[] | null>(null);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState(false);

  const sameMode = strict === card.strict;
  const compared = tape ? compareTapes(tape, card.expected) : null;

  function run() {
    setRunning(true);
    void runInBrowser({ code: card.code, strict, mode: "predict", waitMs: 60 }).then((events) => {
      setTape(events);
      setRunning(false);
    });
  }

  return (
    <div className="mt-4 flex flex-1 flex-col">
      <CodeBlock
        code={card.code}
        meta={
          <button
            type="button"
            aria-pressed={strict}
            aria-label="Строгий режим"
            onClick={() => setStrict((value) => !value)}
            className={`rounded-lg px-2 py-1 ${strict ? "bg-mark-soft text-mark" : "text-muted"}`}
          >
            {strict ? "strict" : "sloppy"}
          </button>
        }
      />
      {tape ? (
        <div className="mt-3">
          <Tape
            events={tape}
            ok={compared?.ok}
            verdict={compared ? (compared.ok ? "совпала с эталоном" : "не совпала") : undefined}
          />
          {compared && !sameMode ? (
            <p className="mt-2 mb-0 text-sm text-muted">
              Эталон записан в другом режиме — результат может отличаться из-за него.
            </p>
          ) : null}
          <p className="mt-1 mb-0 text-xs text-faint">
            Кавычки в ленте — это строка. Число и undefined без кавычек.
          </p>
        </div>
      ) : null}
      {open ? (
        <Panel title="Ответ">
          <p className="m-0 font-mono text-[15px] font-bold whitespace-pre-wrap text-mark">
            {card.answer}
          </p>
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
      {why ? <WhyPanel text={card.theory} /> : null}
      <div className="flex-1" />
      <ActionBar taskId={card.id}>
        <ActionButton pressed={open} onClick={() => setOpen((value) => !value)}>
          Ответ
        </ActionButton>
        <ActionButton pressed={why} onClick={() => setWhy((value) => !value)}>
          Почему так
        </ActionButton>
        <ActionButton primary disabled={running} onClick={run}>
          <Play className="size-4" aria-hidden="true" />
          {running ? "Считаю" : "Запуск"}
        </ActionButton>
      </ActionBar>
    </div>
  );
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
  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="m-0 mb-2 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
        Вариант
      </p>
      <CodeSnippet code={code} />
      {tape ? (
        <div className="mt-3">
          <Tape
            events={tape}
            ok={compareTapes(tape, expected).ok}
            verdict={compareTapes(tape, expected).ok ? "совпала с эталоном" : "не совпала"}
          />
        </div>
      ) : null}
      <p className="mt-3 mb-0 font-mono text-sm font-bold whitespace-pre-wrap text-mark">
        {answer}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ActionButton
          onClick={() => {
            void runInBrowser({ code, strict, mode: "predict", waitMs: 60 }).then(setTape);
          }}
        >
          <Play className="size-4" aria-hidden="true" />
          Запустить
        </ActionButton>
        <ActionButton pressed={why} onClick={() => setWhy((value) => !value)}>
          Почему так
        </ActionButton>
      </div>
      {why ? (
        <div className="mt-3">
          <TheoryText text={theory} />
        </div>
      ) : null}
    </div>
  );
}

function ImplementRun({ card }: { card: Extract<Card, { kind: "implement" }> }) {
  const { draft, saveDraft } = useStudy();
  const [code, setCode] = useState(card.starter);
  const [tape, setTape] = useState<TapeEvent[] | null>(null);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const prevRef = useRef(card.starter);
  const caretRef = useRef<number | null>(null);
  const expanding = useRef(false);

  useEffect(() => {
    const saved = draft(card.id);
    const next = saved || card.starter;
    prevRef.current = next;
    caretRef.current = null;
    setCode(next);
    // Load the saved draft only when the card changes. `draft` identity follows progress updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, card.starter]);

  useLayoutEffect(() => {
    const el = areaRef.current;
    const pos = caretRef.current;
    if (!el || pos == null) return;
    el.selectionStart = el.selectionEnd = pos;
    caretRef.current = null;
  }, [code]);

  function commit(value: string) {
    prevRef.current = value;
    setCode(value);
    saveDraft(card.id, value);
  }

  function applyEdit(el: HTMLTextAreaElement, value: string, edit: SnippetEdit) {
    expanding.current = true;
    caretRef.current = edit.caret;
    el.setSelectionRange(edit.from, edit.to);
    // Replacing the selection keeps the browser undo stack, so one undo restores the word.
    const ok = document.execCommand("insertText", false, edit.text);
    if (ok && !expanding.current) return;
    expanding.current = false;
    const next = ok ? el.value : value.slice(0, edit.from) + edit.text + value.slice(edit.to);
    commit(next);
  }

  return (
    <div className="mt-4 flex flex-1 flex-col">
      <p className="m-0 mb-3 text-[15px] leading-relaxed text-pretty text-ink">{card.statement}</p>
      <CodeBlock code={card.tests.map((test) => test.code).join("\n\n")} label="tests.js" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="font-mono text-xs text-muted" htmlFor="solution">
          solution.js
        </label>
        <Link
          to="/settings"
          className="inline-flex min-h-11 items-center text-sm text-muted no-underline"
        >
          Автодополнение
        </Link>
      </div>
      <textarea
        ref={areaRef}
        id="solution"
        value={code}
        spellCheck={false}
        maxLength={20000}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        onChange={(event) => {
          const el = event.currentTarget;
          const value = el.value;
          const caret = el.selectionStart ?? value.length;
          if (expanding.current) {
            expanding.current = false;
            commit(value);
            return;
          }
          const native = event.nativeEvent;
          const inputType = native instanceof InputEvent ? native.inputType : "";
          const composing = native instanceof InputEvent && native.isComposing;
          const undo = inputType === "historyUndo" || inputType === "historyRedo";
          const deletion = inputType.startsWith("delete");
          const insertion =
            inputType.startsWith("insert") || (!inputType && value.length > prevRef.current.length);
          if (!insertion || undo || deletion || composing || !snippetsEnabled()) {
            commit(value);
            return;
          }
          const edit = snippetAfterInput(value, caret);
          if (!edit) {
            commit(value);
            return;
          }
          applyEdit(el, value, edit);
        }}
        className="min-h-56 w-full rounded-2xl border border-line bg-card p-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-mark"
      />
      {tape ? (
        <div className="mt-3">
          <Tape
            events={tape}
            ok={gradeImplementTape(tape, card.tests).ok}
            verdict={gradeImplementTape(tape, card.tests).ok ? "все тесты прошли" : "есть ошибки"}
          />
        </div>
      ) : null}
      {open ? (
        <div className="mt-4">
          <CodeBlock code={card.solution} label="эталон.js" />
        </div>
      ) : null}
      {why ? <WhyPanel text={card.theory} /> : null}
      <div className="flex-1" />
      <ActionBar taskId={card.id}>
        <ActionButton pressed={open} onClick={() => setOpen((value) => !value)}>
          Эталон
        </ActionButton>
        <ActionButton pressed={why} onClick={() => setWhy((value) => !value)}>
          Почему так
        </ActionButton>
        <ActionButton
          primary
          disabled={running}
          onClick={() => {
            setRunning(true);
            void runInBrowser({
              code,
              strict: false,
              mode: "implement",
              tests: card.tests,
              waitMs: card.waitMs ?? 80,
            }).then((events) => {
              setTape(events);
              setRunning(false);
            });
          }}
        >
          <Play className="size-4" aria-hidden="true" />
          {running ? "Считаю" : "Тесты"}
        </ActionButton>
      </ActionBar>
    </div>
  );
}

export function TaskView({ card }: { card: Card }) {
  return card.kind === "predict" ? <PredictRun card={card} /> : <ImplementRun card={card} />;
}
