import type { Card, Tombstone } from "@etalon/shared";

export declare const LEVELS: ReadonlyArray<{
  level: number;
  title: string;
  blurb: string;
  intro: string;
}>;

export declare function loadBundledCards(): Card[];
export declare function loadBundledTombstones(): Tombstone[];
