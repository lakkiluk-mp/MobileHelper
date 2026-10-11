import assert from "node:assert/strict";
import test from "node:test";
import { compareTapes, serializeArg } from "./src/tape.ts";

test("serializeArg keeps number, string and undefined apart", () => {
  assert.equal(serializeArg(3), "3");
  assert.equal(serializeArg("3"), '"3"');
  assert.equal(serializeArg(undefined), "undefined");
  assert.equal(serializeArg(null), "null");
  assert.equal(serializeArg(-0), "-0");
  assert.equal(serializeArg(Number.NaN), "NaN");
  assert.equal(serializeArg(["b"]), '["b"]');
});

test("compareTapes reports a mismatched log", () => {
  const result = compareTapes(
    [{ type: "log", args: ["1"] }],
    [{ type: "log", args: ['"1"'] }],
  );
  assert.equal(result.ok, false);
});
