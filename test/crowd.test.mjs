// Tests of the crowd rules and the Worker API, with Node's built-in SQLite standing in for D1.
// Hashes are recomputed with node:crypto; expected counts are worked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import worker, { setClock } from "../src/worker.js";
import { pickDay, snapshot, key, allowed, PROMPTS, CROWD_PER_DAY, WRITE_PER_DAY } from "../public/engine/crowd.js";

// a tiny D1 lookalike (copied from scatter-exe test/worker.test.mjs)
function fakeD1(file = "../schema.sql") {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL(file, import.meta.url), "utf8"));
  const prep = (sql, args = []) => ({
    sql, args,
    bind: (...a) => prep(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
  });
  const batch = async (stmts) => {
    db.exec("BEGIN");
    try {
      const out = stmts.map((st) => ({ results: [], meta: { changes: db.prepare(st.sql).run(...st.args).changes } }));
      db.exec("COMMIT");
      return out;
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  return { prepare: (sql) => prep(sql), batch, raw: db };
}

const sha = (t) => createHash("sha256").update(t).digest("hex");
const T0 = Date.parse("2027-01-01T08:00:00Z") / 1000;
const G = "0".repeat(64);

function setup() {
  let t = T0;
  setClock(() => t);
  const env = { DB: fakeD1() };
  const jar = {};
  const call = async (who, method, path, body) => {
    const headers = { "content-type": "application/json" };
    if (jar[who]) headers.cookie = jar[who];
    const res = await worker.fetch(new Request("https://tm.test" + path, { method, headers, body: body ? JSON.stringify(body) : undefined }), env);
    for (const c of res.headers.getSetCookie()) jar[who] = c.split(";")[0];
    return { status: res.status, ...(await res.json()) };
  };
  return { env, call, wait: (s) => (t += s), rows: (sql) => env.DB.raw.prepare(sql).all().map((r) => ({ ...r })) };
}

test("a day is 2 write prompts and 6 crowd prompts, the same for the same hash, different ids within each list", () => {
  const a = pickDay(G), b = pickDay(G);
  assert.deepEqual(a, b);
  assert.equal(a.write.length, WRITE_PER_DAY); assert.equal(a.crowd.length, CROWD_PER_DAY);
  assert.equal(new Set(a.write).size, WRITE_PER_DAY); assert.equal(new Set(a.crowd).size, CROWD_PER_DAY);
  assert.notDeepEqual(pickDay("f".repeat(64)), a);
  const ids = new Set(PROMPTS.map((p) => p.id));
  assert.ok([...a.write, ...a.crowd].every((id) => ids.has(id)));
});

test("answers that are the same thing share a key; blocked words are refused", () => {
  assert.equal(key("The Lights"), "lights"); assert.equal(key("  lights! "), "lights"); assert.equal(key("an Eye-Patch"), "eyepatch");
  assert.equal(key(""), "");
  assert.ok(allowed("Top hat")); assert.ok(!allowed("what the fuck"));
});

test("a snapshot merges players' answers into the starting counts by key, biggest first, top 4", () => {
  // prompt 8: Eye patch 32, Hook 24, Hat 21, Wooden leg 7. Players: 3 "eyepatch", 30 "parrot".
  const s = snapshot(8, [{ k: "eyepatch", text: "eyepatch", n: 3 }, { k: "parrot", text: "Parrot", n: 30 }]);
  assert.deepEqual(s.options, [{ a: "Eye patch", n: 35 }, { a: "Parrot", n: 30 }, { a: "Hook", n: 24 }, { a: "Hat", n: 21 }]);
  assert.equal(s.total, 32 + 24 + 21 + 7 + 33); assert.equal(s.players, 33);
});

test("the first request seals the day's crowd entry from the genesis hash; everyone gets the same day; options come without counts", async () => {
  const { call, rows } = setup();
  const a = await call("ann", "GET", "/api/today"), b = await call("bo", "GET", "/api/today");
  const p = pickDay(G);
  const rec = JSON.stringify({ day: "2027-01-01", write: p.write, crowd: p.crowd.map((id) => snapshot(id)) });
  assert.deepEqual(rows("SELECT kind, record, prev_hash, hash FROM scatter_ledger"), [{ kind: "crowd", record: rec, prev_hash: G, hash: sha(G + "|" + rec) }]);
  assert.equal(a.status, 200); assert.deepEqual(a, b);
  assert.deepEqual(a.write.map((w) => w.id), p.write);
  assert.equal(a.crowd.length, 6);
  assert.ok(a.crowd.every((c) => c.options.length === 4 && c.options.every((o) => typeof o === "string")));
  assert.equal(rows("SELECT COUNT(*) AS n FROM scatter_players")[0].n, 0, "just looking makes no player");
});

test("a write is sealed once with its ledger entry and counts; today's entry doesn't change; tomorrow's crowd includes it", async () => {
  const { call, rows, wait } = setup();
  const d = await call("ann", "GET", "/api/today");
  const r = await call("ann", "POST", "/api/write", { day: d.day, answers: ["  The Lights ", ""] });
  assert.equal(r.status, 200);
  const [w1, w2] = d.write.map((w) => w.id);
  assert.deepEqual(r.mine.answers, [{ prompt: w1, a: "The Lights" }, { prompt: w2, a: "" }]);
  const led = rows("SELECT kind, record, prev_hash, hash FROM scatter_ledger ORDER BY id");
  assert.equal(led.length, 2); assert.equal(led[1].kind, "write");
  assert.equal(led[1].prev_hash, led[0].hash); assert.equal(led[1].hash, sha(led[0].hash + "|" + led[1].record));
  assert.equal(r.mine.hash, led[1].hash);
  assert.deepEqual(rows("SELECT prompt, k, text, n FROM scatter_counts"), [{ prompt: w1, k: "lights", text: "The Lights", n: 1 }], "a blank adds nothing");
  assert.equal((await call("ann", "POST", "/api/write", { day: d.day, answers: ["x", "y"] })).status, 409, "once a day");
  assert.equal((await call("bo", "POST", "/api/write", { day: d.day, answers: ["shit", ""] })).status, 400, "blocked word");
  assert.equal(rows("SELECT COUNT(*) AS n FROM scatter_writes")[0].n, 1);
  assert.deepEqual(await call("bo", "GET", "/api/today").then((x) => x.crowd), d.crowd, "today's crowd is frozen");
  wait(86400);
  await call("ann", "GET", "/api/today");
  const next = JSON.parse(rows("SELECT record FROM scatter_ledger WHERE kind = 'crowd' AND day = '2027-01-02'")[0].record);
  for (const c of next.crowd) assert.deepEqual(c, snapshot(c.id, c.id === w1 ? [{ k: "lights", text: "The Lights", n: 1 }] : []), "prompt " + c.id);
});

test("a write for a day that is over is refused", async () => {
  const { call } = setup();
  assert.equal((await call("ann", "POST", "/api/write", { day: "2026-12-31", answers: ["a", "b"] })).status, 409);
});

test("the migration adds exactly TriviaMoba's part of schema.sql on top of SCATTER.EXE's tables", () => {
  const cols = (db) => db.prepare("SELECT name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => [r.name, r.sql.replace(/\s+/g, " ").replace(/ --[^,)]*/g, "")]);
  const full = fakeD1().raw;
  const migrated = new DatabaseSync(":memory:");
  const scatter = readFileSync(new URL("../schema.sql", import.meta.url), "utf8").split("-- ---------- TriviaMoba")[0];
  migrated.exec(scatter);
  migrated.exec(readFileSync(new URL("../migrations/001_crowd.sql", import.meta.url), "utf8"));
  assert.deepEqual(cols(migrated).map((r) => r[0]), cols(full).map((r) => r[0]));
});
