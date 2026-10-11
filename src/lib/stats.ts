import type { ProgressStatus } from "@etalon/shared";

type Row = { status?: ProgressStatus; updatedAt?: string } | undefined;

export type StatusCounts = Record<ProgressStatus, number>;

export function statusCounts(progress: Record<string, Row>): StatusCounts {
  const counts: StatusCounts = { knew: 0, unsure: 0, missed: 0 };
  for (const row of Object.values(progress)) {
    if (row?.status) counts[row.status] += 1;
  }
  return counts;
}

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function countsByDay(progress: Record<string, Row>): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const row of Object.values(progress)) {
    if (!row?.status || !row.updatedAt) continue;
    const at = new Date(row.updatedAt);
    if (Number.isNaN(at.getTime())) continue;
    const key = dayKey(at);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return byDay;
}

export function activity(
  progress: Record<string, Row>,
  now: Date,
  days: number,
): Array<{ key: string; count: number }> {
  const byDay = countsByDay(progress);
  return Array.from({ length: days }, (_, index) => {
    const key = dayKey(shiftDays(now, index - days + 1));
    return { key, count: byDay.get(key) ?? 0 };
  });
}

export function streak(progress: Record<string, Row>, now: Date): number {
  const byDay = countsByDay(progress);
  let cursor = byDay.has(dayKey(now)) ? now : shiftDays(now, -1);
  let days = 0;
  while (byDay.has(dayKey(cursor))) {
    days += 1;
    cursor = shiftDays(cursor, -1);
  }
  return days;
}
