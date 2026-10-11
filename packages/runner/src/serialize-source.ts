/** Classic-script serializer. Injected into the browser runner and evaluated once in Node. */
export const SERIALIZE_SOURCE = `function __serialize(value, depth, seen) {
  if (depth === undefined) depth = 0;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  var kind = typeof value;
  if (kind === "boolean") return value ? "true" : "false";
  if (kind === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (value === Infinity) return "Infinity";
    if (value === -Infinity) return "-Infinity";
    if (Object.is(value, -0)) return "-0";
    return String(value);
  }
  if (kind === "bigint") return String(value) + "n";
  if (kind === "string") return JSON.stringify(value);
  if (kind === "symbol") return "Symbol(" + (value.description || "") + ")";
  if (kind === "function") return "[Function: " + (value.name || "anonymous") + "]";
  if (kind !== "object") return String(value);
  if (depth >= 3) return Array.isArray(value) ? "[Array]" : "[Object]";
  if (!seen || typeof seen.has !== "function" || typeof seen.add !== "function") seen = new WeakSet();
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  try {
    if (Object.prototype.toString.call(value) === "[object Date]") {
      var iso = value.toISOString ? value.toISOString() : "Invalid";
      return "Date(" + iso + ")";
    }
    if (Array.isArray(value)) {
      var items = [];
      for (var i = 0; i < value.length; i++) items.push(__serialize(value[i], depth + 1, seen));
      return "[" + items.join(", ") + "]";
    }
    var keys = Object.keys(value);
    var parts = [];
    for (var k = 0; k < keys.length; k++) {
      parts.push(JSON.stringify(keys[k]) + ": " + __serialize(value[keys[k]], depth + 1, seen));
    }
    return "{" + parts.join(", ") + "}";
  } finally {
    seen.delete(value);
  }
}`;
