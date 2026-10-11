import { getSql } from "@/lib/db";
import { loadCardsFromDisk, loadTombstonesFromDisk } from "../../packages/content/src/node-load.ts";
import { hashAnyCard, seedVersion } from "@etalon/runner";
import { manifestSchema, type Card, type Manifest } from "@etalon/shared";

function hashOf(card: Card): string {
  return hashAnyCard(card);
}

export async function readManifest(): Promise<Manifest> {
  const cards = await loadCardsFromDisk();
  const tombstones = await loadTombstonesFromDisk();
  const dead = new Set(tombstones.map((tomb) => tomb.id));
  const sql = await getSql();

  for (const card of cards) {
    if (dead.has(card.id)) continue;
    const body = JSON.stringify(card);
    await sql`
      insert into content_task (id, kind, level, sort_order, updated_at, rev, hash, body)
      values (
        ${card.id},
        ${card.kind},
        ${card.level},
        ${card.order},
        ${card.updatedAt},
        ${card.rev},
        ${hashOf(card)},
        ${body}::jsonb
      )
      on conflict (id) do update set
        kind = excluded.kind,
        level = excluded.level,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at,
        rev = excluded.rev,
        hash = excluded.hash,
        body = excluded.body
    `;
  }

  for (const tomb of tombstones) {
    await sql`delete from content_task where id = ${tomb.id}`;
    await sql`
      insert into content_tombstone (id, deleted_at)
      values (${tomb.id}, ${tomb.deletedAt})
      on conflict (id) do update set deleted_at = excluded.deleted_at
    `;
  }

  const rows = await sql<{ id: string; updated_at: string; rev: number; hash: string }>`
    select id, updated_at, rev, hash from content_task
  `;
  const tombRows = await sql<{ id: string; deleted_at: string }>`
    select id, deleted_at from content_tombstone
  `;
  const manifest = {
    seedVersion: seedVersion(
      rows.map((row) => ({
        id: row.id,
        updatedAt: row.updated_at,
        rev: Number(row.rev),
        hash: row.hash,
      })),
      tombRows.map((row) => ({ id: row.id, deletedAt: row.deleted_at })),
    ),
    tasks: rows.map((row) => ({
      id: row.id,
      updatedAt: row.updated_at,
      rev: Number(row.rev),
      hash: row.hash,
    })),
    tombstones: tombRows.map((row) => ({ id: row.id, deletedAt: row.deleted_at })),
  };
  return manifestSchema.parse(manifest);
}

export async function readTasks(ids: string[]): Promise<Card[]> {
  await readManifest();
  const wanted = new Set(ids);
  const sql = await getSql();
  const rows = await sql<{ body: Card | string }>`select body from content_task`;
  const cards: Card[] = [];
  for (const row of rows) {
    const body = typeof row.body === "string" ? (JSON.parse(row.body) as Card) : row.body;
    if (wanted.has(body.id)) cards.push(body);
  }
  return cards;
}
