// Tests of the server keeping the answers (src/worker.js deal and answer), with Node's built-in SQLite standing in for D1.
// Expected values are worked from the question bank (src/questions.js) and by hand, not from the Worker's own code.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker, { setClock } from "../src/worker.js";
import { BANK, TIME, GRACE } from "../src/questions.js";

// a tiny D1 lookalike (copied from scatter-exe test/worker.test.mjs)
function fakeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  const prep = (sql, args = []) => ({
    sql, args,
    bind: (...a) => prep(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
  });
  return { prepare: (sql) => prep(sql), batch: async () => [], raw: db };
}

const T0 = Date.parse("2027-01-01T08:00:00Z") / 1000;
function setup() {
  let t = T0;
  setClock(() => t);
  const env = { DB: fakeD1() };
  const jar = {};
  const call = async (who, path, body) => {
    const headers = { "content-type": "application/json" };
    if (jar[who]) headers.cookie = jar[who];
    const res = await worker.fetch(new Request("https://tm.test" + path, { method: "POST", headers, body: JSON.stringify(body) }), env);
    for (const c of res.headers.getSetCookie()) jar[who] = c.split(";")[0];
    return { status: res.status, ...(await res.json()) };
  };
  return { env, call, wait: (s) => (t += s) };
}

const LANE_TAGS = ["def", "str", "int"];
// the item of the bank a dealt question is, found by its text and picture
const itemOf = (lane, d) => BANK[LANE_TAGS[lane]].find((x) => x.q === d.q && x.img === d.img);
// the place in what was shown of the right option (the bank lists the right one first)
const rightAt = (lane, d) => d.opts.indexOf(itemOf(lane, d).a[0]);

test("a deal is a question of that lane with its four options and the time, and no answer", async () => {
  const { call } = setup();
  const d = await call("ann", "/api/deal", { lane: 1 });
  assert.equal(d.status, 200);
  assert.deepEqual(Object.keys(d).sort(), ["deal", "opts", "q", "status", "time"]);
  const item = itemOf(1, d);
  assert.ok(item, "the question is one of STR's");
  assert.deepEqual([...d.opts].sort(), [...item.a].sort());
  assert.equal(d.time, TIME);
});

test("a right pick is right and a wrong one is wrong; both show the right answer", async () => {
  const { call } = setup();
  const a = await call("ann", "/api/deal", { lane: 0 });
  const ok = await call("ann", "/api/answer", { deal: a.deal, pick: rightAt(0, a) });
  assert.deepEqual([ok.right, ok.answer, ok.late], [true, itemOf(0, a).a[0], false]);
  const b = await call("ann", "/api/deal", { lane: 2 });
  const no = await call("ann", "/api/answer", { deal: b.deal, pick: (rightAt(2, b) + 1) % 4 });
  assert.deepEqual([no.right, no.answer, no.late], [false, itemOf(2, b).a[0], false]);
});

test("20 seconds after the question was sent still counts, 21 is too late and counts as time's up", async () => {
  assert.equal(TIME + GRACE, 20);
  const { call, wait } = setup();
  const a = await call("ann", "/api/deal", { lane: 0 });
  wait(20);
  assert.equal((await call("ann", "/api/answer", { deal: a.deal, pick: rightAt(0, a) })).right, true);
  const b = await call("ann", "/api/deal", { lane: 0 });
  wait(21);
  const late = await call("ann", "/api/answer", { deal: b.deal, pick: rightAt(0, b) });
  assert.deepEqual([late.right, late.late, late.answer], [false, true, itemOf(0, b).a[0]]);
});

test("time's up (null) can't come early to peek, and counts as wrong once the time has run out", async () => {
  const { call, wait } = setup();
  const a = await call("ann", "/api/deal", { lane: 0 });
  wait(5);
  const early = await call("ann", "/api/answer", { deal: a.deal, pick: null });
  assert.equal(early.status, 409); assert.equal(early.answer, undefined);
  wait(10);
  const up = await call("ann", "/api/answer", { deal: a.deal, pick: null });
  assert.deepEqual([up.status, up.right, up.late], [200, false, false]);
});

test("a question is answered once: asking again gives back the first result; nobody else can answer it", async () => {
  const { call } = setup();
  const a = await call("ann", "/api/deal", { lane: 0 });
  const wrong = (rightAt(0, a) + 1) % 4;
  const first = await call("ann", "/api/answer", { deal: a.deal, pick: wrong });
  const again = await call("ann", "/api/answer", { deal: a.deal, pick: rightAt(0, a) });
  assert.deepEqual([first.right, again.right, again.answer], [false, false, first.answer]);
  await call("bo", "/api/deal", { lane: 0 });
  assert.equal((await call("bo", "/api/answer", { deal: a.deal, pick: 0 })).status, 404);
  assert.equal((await call("ann", "/api/answer", { deal: a.deal + 99, pick: 0 })).status, 404);
});

test("a lane's five questions all come round before any repeats", async () => {
  const { call } = setup();
  const seen = [];
  for (let i = 0; i < 10; i++) seen.push((await call("ann", "/api/deal", { lane: 1 })).q);
  assert.equal(new Set(seen.slice(0, 5)).size, 5);
  assert.equal(new Set(seen.slice(5)).size, 5);
});

test("INT deals 8 planet pictures among its questions: each picture is a file in public/img, named without its answer, and no file is left over", async () => {
  const { call } = setup();
  const bank = BANK.int, pics = bank.filter((x) => x.img);
  assert.equal(pics.length, 8);
  const seen = [];
  for (let i = 0; i < bank.length; i++) seen.push(await call("ann", "/api/deal", { lane: 2 }));
  assert.equal(new Set(seen.map((d) => d.q + "|" + (d.img || ""))).size, bank.length, "all of INT's questions come round before any repeats");
  const dealt = seen.filter((d) => d.img);
  assert.equal(dealt.length, 8);
  for (const d of dealt) {
    assert.deepEqual(Object.keys(d).sort(), ["deal", "img", "opts", "q", "status", "time"]);
    assert.ok(existsSync(new URL("../public/" + d.img, import.meta.url)), d.img + " is not in public/");
    assert.ok(!d.img.toLowerCase().includes(bank.find((x) => x.img === d.img).a[0].toLowerCase()), "a file name gives the answer away");
  }
  const onDisk = readdirSync(new URL("../public/img/", import.meta.url)).sort();
  assert.deepEqual(onDisk, pics.map((x) => x.img.replace("img/", "")).sort());
});

test("a bad lane is refused, and deals are limited to 600 an hour from one place", async () => {
  const { call } = setup();
  assert.equal((await call("ann", "/api/deal", { lane: 3 })).status, 400);
  assert.equal((await call("ann", "/api/deal", {})).status, 400);
  for (let i = 0; i < 600; i++) assert.equal((await call("ann", "/api/deal", { lane: 0 })).status, 200);
  assert.equal((await call("ann", "/api/deal", { lane: 0 })).status, 429);
});

test("nothing in public/ holds a question (an answer on its own is no use, and short ones like 15 turn up in any page)", () => {
  const files = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })
    .flatMap((e) => e.isDirectory() ? files(dir + e.name + "/") : [dir + e.name]);
  const all = files("../public/").filter((f) => /\.(html|js)$/.test(f)).map((f) => readFileSync(new URL(f, import.meta.url), "utf8")).join("\n");
  for (const lane of Object.values(BANK)) for (const x of lane) assert.ok(!all.includes(x.q), "the page holds: " + x.q);
});
