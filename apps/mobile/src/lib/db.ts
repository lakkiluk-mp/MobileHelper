import type { Card, ProgressStatus } from "@etalon/shared";
import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";

export type ProgressRow = {
  taskId: string;
  status: ProgressStatus;
  updatedAt: string;
  draft?: string;
};

const STATUSES = new Set<ProgressStatus>(["knew", "unsure", "missed"]);

let opening: Promise<SQLite.SQLiteDatabase> | null = null;

export async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS progress (
      task_id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      draft TEXT
    );
    CREATE TABLE IF NOT EXISTS outbox (
      task_id TEXT PRIMARY KEY NOT NULL,
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

export function database(): Promise<SQLite.SQLiteDatabase> {
  if (!opening) {
    opening = SQLite.openDatabaseAsync("etalon").then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return opening;
}

export async function readMeta(key: string): Promise<string | null> {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = ?", key);
  return row?.value ?? null;
}

export async function writeMeta(key: string, value: string): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}

export async function deviceId(): Promise<string> {
  const existing = await readMeta("etalon-device");
  if (existing) return existing;
  const created = Crypto.randomUUID();
  await writeMeta("etalon-device", created);
  return created;
}

export async function readCards(): Promise<Card[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ json: string }>("SELECT json FROM cards");
  return rows.flatMap((row) => {
    try {
      return [JSON.parse(row.json) as Card];
    } catch {
      return [];
    }
  });
}

export async function writeCards(cards: Card[]): Promise<void> {
  const db = await database();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM cards");
    for (const card of cards) {
      await db.runAsync("INSERT INTO cards (id, json) VALUES (?, ?)", card.id, JSON.stringify(card));
    }
  });
}

function asRow(row: { task_id: string; status: string; updated_at: string; draft: string | null }): ProgressRow | null {
  if (!STATUSES.has(row.status as ProgressStatus)) return null;
  return {
    taskId: row.task_id,
    status: row.status as ProgressStatus,
    updatedAt: row.updated_at,
    draft: row.draft ?? undefined,
  };
}

export async function readProgress(): Promise<ProgressRow[]> {
  const db = await database();
  const rows = await db.getAllAsync<{
    task_id: string;
    status: string;
    updated_at: string;
    draft: string | null;
  }>("SELECT task_id, status, updated_at, draft FROM progress");
  return rows.flatMap((row) => {
    const parsed = asRow(row);
    return parsed ? [parsed] : [];
  });
}

export async function writeProgress(row: ProgressRow): Promise<void> {
  await deviceId();
  const db = await database();
  const draft = row.draft ?? null;
  const json = JSON.stringify(row);
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO progress (task_id, status, updated_at, draft) VALUES (?, ?, ?, ?)
       ON CONFLICT(task_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at, draft = excluded.draft`,
      row.taskId,
      row.status,
      row.updatedAt,
      draft,
    );
    await db.runAsync(
      `INSERT INTO outbox (task_id, json) VALUES (?, ?)
       ON CONFLICT(task_id) DO UPDATE SET json = excluded.json`,
      row.taskId,
      json,
    );
  });
}

export async function readDrafts(): Promise<Record<string, string>> {
  const db = await database();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM meta WHERE key LIKE 'draft:%'",
  );
  return Object.fromEntries(rows.map((row) => [row.key.slice("draft:".length), row.value]));
}

export async function writeDraft(taskId: string, value: string): Promise<void> {
  await writeMeta(`draft:${taskId}`, value);
}

export type OutboxEntry = { row: ProgressRow; json: string };

export async function readOutbox(): Promise<OutboxEntry[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ json: string }>("SELECT json FROM outbox");
  return rows.flatMap((item) => {
    try {
      return [{ row: JSON.parse(item.json) as ProgressRow, json: item.json }];
    } catch {
      return [];
    }
  });
}

export async function dropOutbox(entries: OutboxEntry[]): Promise<void> {
  const db = await database();
  await db.withTransactionAsync(async () => {
    for (const entry of entries) {
      await db.runAsync("DELETE FROM outbox WHERE task_id = ? AND json = ?", entry.row.taskId, entry.json);
    }
  });
}

export async function mergeRemoteProgress(rows: ProgressRow[]): Promise<void> {
  const db = await database();
  await db.withTransactionAsync(async () => {
    for (const row of rows) {
      if (!STATUSES.has(row.status)) continue;
      await db.runAsync(
        `INSERT INTO progress (task_id, status, updated_at, draft) VALUES (?, ?, ?, ?)
         ON CONFLICT(task_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at, draft = excluded.draft
         WHERE progress.updated_at < excluded.updated_at`,
        row.taskId,
        row.status,
        row.updatedAt,
        row.draft ?? null,
      );
    }
  });
}
