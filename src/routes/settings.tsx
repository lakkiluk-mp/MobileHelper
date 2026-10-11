import { snippetCatalog, setSnippetsEnabled, snippetsEnabled } from "@/lib/snippets";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const [ready, setReady] = useState(false);
  const [on, setOn] = useState(true);
  const catalog = snippetCatalog();
  const immediate = catalog.filter((item) => item.mode === "immediate");
  const boundary = catalog.filter((item) => item.mode === "boundary");

  useEffect(() => {
    setOn(snippetsEnabled());
    setReady(true);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <Link
        to="/profile"
        className="inline-flex min-h-11 items-center text-sm text-mark no-underline"
      >
        ‹ Профиль
      </Link>
      <header className="mt-4">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">Эталон</p>
        <h1 className="mt-2 text-4xl text-ink">Настройки</h1>
      </header>
      <section className="mt-8">
        <h2 className="text-2xl text-ink">Автодополнение</h2>
        <p className="mt-3 text-sm leading-relaxed text-pretty text-muted">
          Списка вариантов нет. Дописанное слово само становится конструкцией: console сразу
          превращается в console.log(), курсор встаёт между скобками. Короткие слова ждут пробела,
          скобки или новой строки — иначе const нельзя было бы дописать до console.
        </p>
        {ready ? (
          <button
            type="button"
            aria-pressed={on}
            onClick={() => {
              const next = !on;
              setOn(next);
              setSnippetsEnabled(next);
            }}
            className={
              on
                ? "mt-5 min-h-11 rounded-full bg-mark px-5 text-sm text-paper"
                : "mt-5 min-h-11 rounded-full border border-line bg-card px-5 text-sm text-ink"
            }
          >
            {on ? "Автодополнение включено" : "Автодополнение выключено"}
          </button>
        ) : (
          <div className="mt-5 h-11 w-56 animate-pulse rounded-full bg-line" />
        )}
        <p className="mt-4 text-sm text-pretty text-muted">
          Если нужно само слово, а не конструкция — выключи здесь. Точка · в примере показывает,
          куда встанет курсор.
        </p>
      </section>
      <SnippetGroup title="Сразу" items={immediate} />
      <SnippetGroup title="После пробела, скобки или новой строки" items={boundary} />
    </main>
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
    <section className="mt-10">
      <h2 className="text-sm text-muted">{title}</h2>
      <ul className="mt-2 list-none p-0">
        {items.map((item) => (
          <li key={item.trigger} className="border-b border-line py-3">
            <code className="font-mono text-sm text-ink">{item.trigger}</code>
            <code className="mt-1 block font-mono text-xs text-pretty text-muted">
              {item.preview}
            </code>
          </li>
        ))}
      </ul>
    </section>
  );
}
