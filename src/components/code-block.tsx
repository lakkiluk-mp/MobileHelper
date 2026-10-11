import { CODE_SIZES, setCodePrefs, useCodePrefs } from "@/lib/code-view";
import { highlightLine, indentOf, type TokenKind } from "@/lib/highlight";
import { Maximize2, WrapText, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "text-code-keyword",
  string: "text-code-string",
  number: "text-code-number",
  comment: "text-code-comment italic",
  call: "text-code-call",
};

function CodeLines({ code, wrap, size }: { code: string; wrap: boolean; size: number }) {
  const lines = code.replace(/\s+$/, "").split("\n");
  return (
    <pre
      className={`m-0 py-2.5 pr-3 font-mono leading-[1.65] text-ink ${wrap ? "" : "overflow-x-auto"}`}
      style={{ fontSize: size }}
    >
      <code className={`grid grid-cols-[2.25rem_minmax(0,1fr)] ${wrap ? "" : "w-max min-w-full"}`}>
        {lines.map((line, index) => {
          const indent = indentOf(line);
          const body = wrap ? line.slice(indent) : line;
          return (
            <span key={index} className="contents">
              <span aria-hidden="true" className="pr-2.5 text-right text-faint select-none">
                {index + 1}
              </span>
              <span
                className={wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre"}
                style={wrap ? { paddingLeft: `${indent + 2}ch`, textIndent: "-2ch" } : undefined}
              >
                {body === ""
                  ? " "
                  : highlightLine(body).map((token, tokenIndex) =>
                      token.kind ? (
                        <span key={tokenIndex} className={TOKEN_CLASS[token.kind]}>
                          {token.text}
                        </span>
                      ) : (
                        token.text
                      ),
                    )}
              </span>
            </span>
          );
        })}
      </code>
    </pre>
  );
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex size-10 items-center justify-center rounded-[10px] font-mono text-xs ${
        pressed ? "bg-mark-soft text-mark" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Fullscreen({
  code,
  label,
  onClose,
}: {
  code: string;
  label: string;
  onClose: () => void;
}) {
  const { size } = useCodePrefs();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex flex-col bg-paper"
    >
      <div className="flex items-center justify-between border-b border-line px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2">
        <span className="font-mono text-xs text-muted">{label} · без переноса</span>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="flex size-11 items-center justify-center text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeLines code={code} wrap={false} size={size + 1} />
      </div>
    </div>
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
  const prefs = useCodePrefs();
  const [full, setFull] = useState(false);
  const close = useCallback(() => setFull(false), []);
  const sizeIndex = CODE_SIZES.findIndex((item) => item === prefs.size);

  return (
    <figure className="m-0 overflow-hidden rounded-2xl border border-line bg-card">
      <figcaption className="flex items-center justify-between border-b border-line py-1 pr-1 pl-3">
        <span className="flex min-w-0 gap-1.5 font-mono text-xs">
          <span className="truncate rounded-lg bg-line px-2 py-1 text-ink">{label}</span>
          {meta ? <span className="flex items-center text-muted">{meta}</span> : null}
        </span>
        <span className="flex shrink-0 items-center">
          <ToolButton
            label="Перенос строк"
            pressed={prefs.wrap}
            onClick={() => setCodePrefs({ ...prefs, wrap: !prefs.wrap })}
          >
            <WrapText className="size-[18px]" aria-hidden="true" />
          </ToolButton>
          <ToolButton
            label="Мельче"
            onClick={() =>
              setCodePrefs({ ...prefs, size: CODE_SIZES[Math.max(0, sizeIndex - 1)] ?? prefs.size })
            }
          >
            A−
          </ToolButton>
          <ToolButton
            label="Крупнее"
            onClick={() =>
              setCodePrefs({
                ...prefs,
                size: CODE_SIZES[Math.min(CODE_SIZES.length - 1, sizeIndex + 1)] ?? prefs.size,
              })
            }
          >
            A+
          </ToolButton>
          <ToolButton label="На весь экран" onClick={() => setFull(true)}>
            <Maximize2 className="size-[17px]" aria-hidden="true" />
          </ToolButton>
        </span>
      </figcaption>
      <CodeLines code={code} wrap={prefs.wrap} size={prefs.size} />
      {full ? <Fullscreen code={code} label={label} onClose={close} /> : null}
    </figure>
  );
}

export function CodeSnippet({ code }: { code: string }) {
  const { wrap } = useCodePrefs();
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <CodeLines code={code} wrap={wrap} size={12} />
    </div>
  );
}
