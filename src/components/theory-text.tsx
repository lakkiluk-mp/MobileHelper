export function TheoryText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-pretty text-ink">
      {text.split(/\n\n+/).map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>
          {paragraph.split(/(`[^`]+`)/g).map((part) =>
            part.startsWith("`") && part.endsWith("`") ? (
              <code key={part} className="font-mono text-mark">
                {part.slice(1, -1)}
              </code>
            ) : (
              <span key={part}>{part}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
