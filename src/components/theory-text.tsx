export function TheoryText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-pretty text-ink">
      {text.split(/\n\n+/).map((paragraph, index) => (
        <p key={index}>
          {paragraph.split(/(`[^`]+`)/g).map((part, partIndex) =>
            part.startsWith("`") && part.endsWith("`") ? (
              <code key={partIndex} className="font-mono text-mark">
                {part.slice(1, -1)}
              </code>
            ) : (
              <span key={partIndex}>{part}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
