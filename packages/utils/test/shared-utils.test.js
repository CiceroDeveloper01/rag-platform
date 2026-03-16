const test = require("node:test");
const assert = require("node:assert/strict");
const { formatDate, safeParseJson, truncateText } = require("../dist");

test("truncateText shortens long strings", () => {
  assert.equal(
    truncateText("RAG platform for omnichannel AI", 12),
    "RAG platf...",
  );
});

test("safeParseJson returns parsed object when JSON is valid", () => {
  assert.deepEqual(safeParseJson('{"ok":true}', {}), { ok: true });
});

test("safeParseJson returns fallback when JSON is invalid", () => {
  assert.deepEqual(safeParseJson("{invalid", { ok: false }), { ok: false });
});

test("formatDate returns fallback for empty values", () => {
  assert.equal(formatDate(null, { fallback: "never" }), "never");
});
