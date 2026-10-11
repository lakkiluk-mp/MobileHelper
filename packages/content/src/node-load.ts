import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { tombstoneSchema, type Card, type Tombstone } from "../../shared/src/index.ts";

async function readJson(name: string): Promise<unknown> {
  const raw = await readFile(new URL(`../${name}`, import.meta.url), "utf8");
  return JSON.parse(raw);
}

/**
 * Источник карточек — по одному модулю на уровень (`level-NN.ts`). Читаем их с
 * диска и вычисляем литерал `CARDS`, а не импортируем: так сервер не тянет
 * клиентскую цепочку модулей, а zod-схему применяет вызывающая сторона.
 * Файлы уровней — статические данные без импортов, поэтому вычисление безопасно.
 */
async function loadLevelModule(file: string): Promise<unknown[]> {
  const raw = await readFile(new URL(`./${file}`, import.meta.url), "utf8");
  const start = raw.indexOf("= [");
  const end = raw.lastIndexOf("];");
  if (start < 0 || end < 0) throw new Error(`${file}: не найден литерал CARDS`);
  const make = new Function(`return ${raw.slice(start + 2, end + 1)};`) as () => unknown[];
  return make();
}

async function levelFiles(): Promise<string[]> {
  const dir = new URL(".", import.meta.url);
  const entries = await readdir(dir);
  return entries.filter((name) => /^level-\d+\.ts$/.test(name)).sort();
}

export async function loadCardsFromDisk(): Promise<Card[]> {
  const files = await levelFiles();
  if (files.length === 0) throw new Error("не найдено ни одного packages/content/src/level-NN.ts");
  const all: unknown[] = [];
  for (const file of files) all.push(...(await loadLevelModule(file)));
  return all as Card[];
}

export async function loadTombstonesFromDisk(): Promise<Tombstone[]> {
  return tombstoneSchema.array().parse(await readJson("tombstones.json"));
}
