import { runInBrowser } from "@/lib/browser-runner";
import { snippetAfterInput, snippetsEnabled, type SnippetEdit } from "@/lib/snippets";
import { useStudy } from "@/lib/study";
import { TheoryText } from "@/components/theory-text";
import { compareTapes, gradeImplementTape, type TapeEvent } from "@etalon/runner";
import type { Card, PredictCard, ProgressStatus } from "@etalon/shared";
import { Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const RATINGS: Array<{ id: ProgressStatus; label: string }> = [
  { id: "missed", label: "Не знал" },
  { id: "unsure", label: "Сомневался" },
  { id: "knew", label: "Знал" },
];

function WhyPanel({ text }: { text: string }) {
  return (
    <div className="mt-6 border-t border-line pt-4">
      <p className="text-sm text-muted">Почему так</p>
      <div className="mt-3">
        <TheoryText text={text} />
      </div>
    </div>
  );
}

function lineOf(event: TapeEvent): string {
  if (event.type === "log") return event.args.join(" ");
  if (event.type === "error") return `${event.name}: ${event.message}`;
  return `${event.pass ? "ок" : "не ок"} ${event.name}${event.message ? ` — ${event.message}` : ""}`;
}

function Tape({ events }: { events: TapeEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted">Пустая лента</p>;
  return (
    <ol className="overflow-x-auto rounded-lg border border-line bg-card p-4 font-mono text-sm leading-relaxed">
      {events.map((event, index) => (
        <li key={`${event.type}-${index}`} className={event.type === "error" || (event.type === "test" && !event.pass) ? "text-ink" : "text-mark"}>
          {lineOf(event)}
        </li>
      ))}
    </ol>
  );
}

function Ratings({ taskId }: { taskId: string }) {
  const { progress, rate } = useStudy();
  const current = progress[taskId]?.status;
  return (
    <div className="mt-8">
      <p className="text-sm text-muted">Как прошло</p>
      <div className="mt-2 flex flex-wrap gap-2">
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
                  ? "min-h-11 rounded-full bg-mark px-4 text-sm text-paper"
                  : "min-h-11 rounded-full border border-line bg-card px-4 text-sm text-ink"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
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

  return (
    <div className="mt-6">
      <pre className="overflow-x-auto rounded-lg border border-line bg-card p-4 font-mono text-sm leading-relaxed text-ink">
        <code>{card.code}</code>
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => {
            setRunning(true);
            void runInBrowser({ code: card.code, strict, mode: "predict", waitMs: 60 }).then((events) => {
              setTape(events);
              setRunning(false);
            });
          }}
          className="min-h-11 rounded-full bg-mark px-4 text-sm text-paper disabled:opacity-60"
        >
          {running ? "Считаю" : "Запустить"}
        </button>
        <button
          type="button"
          aria-pressed={strict}
          onClick={() => setStrict((value) => !value)}
          className="min-h-11 rounded-full border border-line bg-card px-4 text-sm text-ink"
        >
          {strict ? "strict включён" : "нестрогий режим"}
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-11 rounded-full border border-line px-4 text-sm text-ink"
        >
          {open ? "Скрыть ответ" : "Показать ответ"}
        </button>
        <button
          type="button"
          aria-pressed={why}
          onClick={() => setWhy((value) => !value)}
          className="min-h-11 rounded-full border border-line px-4 text-sm text-ink"
        >
          {why ? "Скрыть разбор" : "Почему так"}
        </button>
      </div>
      {tape ? (
        <div className="mt-4">
          <Tape events={tape} />
          <p className="mt-2 text-sm text-muted">
            {compared
              ? compared.ok
                ? sameMode
                  ? "Лента совпала с эталоном."
                  : "Лента совпала, хотя эталон записан в другом режиме."
                : sameMode
                  ? "Лента не совпала с эталоном."
                  : "Лента не совпала. Эталон записан в другом режиме, это может быть из-за него."
              : ""}
          </p>
          <p className="mt-1 text-sm text-muted">Кавычки в ленте — это строка. Число и undefined без кавычек.</p>
        </div>
      ) : null}
      {open ? (
        <div className="mt-6 border-t border-line pt-4">
          <p className="font-serif text-2xl text-ink">{card.answer}</p>
          {card.variants?.map((variant) => (
            <VariantBlock key={variant.id} code={variant.code} answer={variant.answer} theory={variant.theory} expected={variant.expected} strict={card.strict} />
          ))}
        </div>
      ) : null}
      {why ? <WhyPanel text={card.theory} /> : null}
      <Ratings taskId={card.id} />
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
    <div className="mt-6">
      <p className="text-sm text-muted">Вариант</p>
      <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-card p-4 font-mono text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          void runInBrowser({ code, strict, mode: "predict", waitMs: 60 }).then(setTape);
        }}
        className="mt-3 min-h-11 rounded-full border border-line px-4 text-sm"
      >
        Запустить вариант
      </button>
      {tape ? (
        <div className="mt-3">
          <Tape events={tape} />
          <p className="mt-2 text-sm text-muted">
            {compareTapes(tape, expected).ok ? "Вариант совпал с эталоном." : "Вариант не совпал с эталоном."}
          </p>
        </div>
      ) : null}
      <p className="mt-3 font-medium">{answer}</p>
      <button
        type="button"
        aria-pressed={why}
        onClick={() => setWhy((value) => !value)}
        className="mt-3 min-h-11 rounded-full border border-line px-4 text-sm text-ink"
      >
        {why ? "Скрыть разбор" : "Почему так"}
      </button>
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
    <div className="mt-6">
      <p className="text-sm leading-relaxed text-pretty text-ink">{card.statement}</p>
      <p className="mt-4 text-sm text-muted">Тесты</p>
      <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-card p-4 font-mono text-sm leading-relaxed">
        <code>{card.tests.map((test) => test.code).join("\n\n")}</code>
      </pre>
      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="text-sm text-muted" htmlFor="solution">
          Твоё решение
        </label>
        <Link to="/settings" className="inline-flex min-h-11 items-center text-sm text-muted no-underline">
          Настройки
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
          const insertion = inputType.startsWith("insert") || (!inputType && value.length > prevRef.current.length);
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
        className="mt-2 min-h-48 w-full rounded-lg border border-line bg-card p-4 font-mono text-sm leading-relaxed text-ink"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
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
          className="min-h-11 rounded-full bg-mark px-4 text-sm text-paper disabled:opacity-60"
        >
          {running ? "Считаю" : "Запустить тесты"}
        </button>
        <button type="button" onClick={() => setOpen((value) => !value)} className="min-h-11 rounded-full border border-line px-4 text-sm">
          {open ? "Скрыть эталон" : "Показать эталон"}
        </button>
        <button
          type="button"
          aria-pressed={why}
          onClick={() => setWhy((value) => !value)}
          className="min-h-11 rounded-full border border-line px-4 text-sm text-ink"
        >
          {why ? "Скрыть разбор" : "Почему так"}
        </button>
      </div>
      {tape ? (
        <div className="mt-4">
          <Tape events={tape} />
          <p className="mt-2 text-sm text-muted">
            {gradeImplementTape(tape, card.tests).ok ? "Все тесты прошли." : "Есть непрошедшие тесты или ошибка."}
          </p>
        </div>
      ) : null}
      {open ? (
        <div className="mt-6 border-t border-line pt-4">
          <pre className="overflow-x-auto rounded-lg border border-line bg-card p-4 font-mono text-sm leading-relaxed">
            <code>{card.solution}</code>
          </pre>
        </div>
      ) : null}
      {why ? <WhyPanel text={card.theory} /> : null}
      <Ratings taskId={card.id} />
    </div>
  );
}

export function TaskView({ card }: { card: Card }) {
  return card.kind === "predict" ? <PredictRun card={card} /> : <ImplementRun card={card} />;
}
