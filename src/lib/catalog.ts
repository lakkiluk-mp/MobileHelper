import { loadBundledCards, loadBundledTombstones, LEVELS } from "@etalon/content";
import { hashAnyCard, seedVersion } from "@etalon/runner";
import { withoutTombstones, type Card, type Manifest } from "@etalon/shared";

export function bundledCatalog(): { cards: Card[]; manifest: Manifest } {
  const tombstones = loadBundledTombstones();
  const cards = withoutTombstones(loadBundledCards(), tombstones.map((tomb) => tomb.id));
  const stamps = cards.map((card) => ({
    id: card.id,
    updatedAt: card.updatedAt,
    rev: card.rev,
    hash: hashAnyCard(card),
  }));
  return {
    cards,
    manifest: {
      seedVersion: seedVersion(stamps, tombstones),
      tasks: stamps,
      tombstones,
    },
  };
}

export { LEVELS };
