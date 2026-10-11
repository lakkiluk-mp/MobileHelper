import { readFile } from "node:fs/promises";
import { cardSchema, tombstoneSchema, type Card, type Tombstone } from "../../shared/src/index.ts";

async function readJson(name: string): Promise<unknown> {
  const raw = await readFile(new URL(`../${name}`, import.meta.url), "utf8");
  return JSON.parse(raw);
}

export async function loadCardsFromDisk(): Promise<Card[]> {
  const cards = await readJson("cards.json");
  const extra = await readJson("extra-cards.json");
  return cardSchema.array().parse([...(cards as unknown[]), ...(extra as unknown[])]);
}

export async function loadTombstonesFromDisk(): Promise<Tombstone[]> {
  return tombstoneSchema.array().parse(await readJson("tombstones.json"));
}