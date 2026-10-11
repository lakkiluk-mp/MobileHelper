import assert from "node:assert/strict";
import test from "node:test";
import { isRemoteNewer, planSync, withoutTombstones } from "./src/sync.ts";

const local = { id: "1.1", updatedAt: "2026-10-11T09:00:00.000Z", rev: 1 };

test("updatedAt wins over rev, then rev breaks the tie", () => {
  assert.equal(
    isRemoteNewer({ ...local, updatedAt: "2026-10-12T00:00:00.000Z", rev: 1 }, local),
    true,
  );
  assert.equal(isRemoteNewer({ ...local, rev: 2 }, local), true);
  assert.equal(isRemoteNewer(local, local), false);
  assert.equal(
    isRemoteNewer({ ...local, updatedAt: "2026-10-10T00:00:00.000Z", rev: 9 }, local),
    false,
  );
});

test("tombstone drops a card even when the seed still has it", () => {
  const plan = planSync({
    local: [local, { id: "1.2", updatedAt: local.updatedAt, rev: 1 }],
    remote: [local, { id: "1.2", updatedAt: local.updatedAt, rev: 4 }],
    tombstones: [{ id: "1.2" }],
  });
  assert.deepEqual(plan.fetchIds, []);
  assert.deepEqual(plan.dropIds, ["1.2"]);
  const visible = withoutTombstones(
    [
      { id: "1.1" },
      { id: "1.2" },
    ],
    plan.dropIds,
  );
  assert.deepEqual(visible.map((card) => card.id), ["1.1"]);
});

test("a new remote id is fetched", () => {
  const plan = planSync({
    local: [],
    remote: [local],
    tombstones: [],
  });
  assert.deepEqual(plan.fetchIds, ["1.1"]);
});
