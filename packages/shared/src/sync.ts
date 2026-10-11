export type ContentStamp = {
  id: string;
  updatedAt: string;
  rev: number;
};

/**
 * A remote row is newer when its `updatedAt` is greater.
 * Equal timestamps fall through to `rev`. A server-wide counter is not used.
 */
export function isRemoteNewer(remote: ContentStamp, local: ContentStamp): boolean {
  if (remote.updatedAt > local.updatedAt) return true;
  if (remote.updatedAt < local.updatedAt) return false;
  return remote.rev > local.rev;
}

export function planSync(input: {
  local: ContentStamp[];
  remote: ContentStamp[];
  tombstones: Array<{ id: string }>;
}): { fetchIds: string[]; dropIds: string[] } {
  const localById = new Map(input.local.map((stamp) => [stamp.id, stamp]));
  const dropIds = [...new Set(input.tombstones.map((tomb) => tomb.id))];
  const dead = new Set(dropIds);
  const fetchIds: string[] = [];
  for (const remote of input.remote) {
    if (dead.has(remote.id)) continue;
    const local = localById.get(remote.id);
    if (!local || isRemoteNewer(remote, local)) fetchIds.push(remote.id);
  }
  return { fetchIds, dropIds };
}

/** Tombstones win over a bundled seed so a deleted card cannot come back from the build. */
export function withoutTombstones<T extends { id: string }>(cards: T[], tombstoneIds: Iterable<string>): T[] {
  const dead = new Set(tombstoneIds);
  return cards.filter((card) => !dead.has(card.id));
}
