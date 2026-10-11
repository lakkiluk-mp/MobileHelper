import tombstones from "../tombstones.json";
import { cardSchema, tombstoneSchema, type Card, type Tombstone } from "@etalon/shared";
import { LEVELS } from "./levels.ts";
import { CARDS as level01 } from "./level-01.ts";
import { CARDS as level02 } from "./level-02.ts";
import { CARDS as level03 } from "./level-03.ts";
import { CARDS as level04 } from "./level-04.ts";
import { CARDS as level05 } from "./level-05.ts";
import { CARDS as level06 } from "./level-06.ts";

export { LEVELS };

/**
 * Карточки всех уровней в порядке тропы. Источник — по одному файлу на уровень
 * (`level-NN.ts`), чтобы правки одной темы не конфликтовали с другой.
 */
export const ALL_CARDS: Card[] = [
  ...level01,
  ...level02,
  ...level03,
  ...level04,
  ...level05,
  ...level06,
];

export function loadBundledCards(): Card[] {
  return cardSchema.array().parse(ALL_CARDS);
}

export function loadBundledTombstones(): Tombstone[] {
  return tombstoneSchema.array().parse(tombstones);
}
