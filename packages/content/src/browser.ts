import cards from "../cards.json";
import extra from "../extra-cards.json";
import tombstones from "../tombstones.json";
import { cardSchema, tombstoneSchema, type Card, type Tombstone } from "@etalon/shared";
import { LEVELS } from "./levels.ts";

export { LEVELS };

export function loadBundledCards(): Card[] {
  return cardSchema.array().parse([...(cards as unknown[]), ...(extra as unknown[])]);
}

export function loadBundledTombstones(): Tombstone[] {
  return tombstoneSchema.array().parse(tombstones);
}