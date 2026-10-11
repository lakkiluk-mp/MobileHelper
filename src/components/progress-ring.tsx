import type { ReactNode } from "react";

export type RingPart = { value: number; color: string };

export function ProgressRing({
  parts,
  total,
  size = 44,
  thickness = 5,
  label,
  children,
}: {
  parts: RingPart[];
  total: number;
  size?: number;
  thickness?: number;
  label: string;
  children?: ReactNode;
}) {
  let cursor = 0;
  const stops = parts.map((part) => {
    const from = cursor;
    cursor += total > 0 ? (part.value / total) * 100 : 0;
    return `${part.color} ${from}% ${cursor}%`;
  });
  stops.push(`var(--color-line) ${cursor}% 100%`);
  return (
    <span
      role="img"
      aria-label={label}
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: `conic-gradient(${stops.join(", ")})` }}
    >
      <span
        className="flex flex-col items-center justify-center rounded-full bg-paper"
        style={{ width: size - thickness * 2, height: size - thickness * 2 }}
      >
        {children}
      </span>
    </span>
  );
}
