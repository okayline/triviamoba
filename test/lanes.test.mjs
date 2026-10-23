// The lane rules (public/engine/lanes.js), with expected spaces worked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../public/engine/lanes.js";
const L = globalThis.LANES;
const DEF = 0, STR = 1, INT = 2;

test("lanes are DEF, STR, INT; 5 rounds; crowd rounds are 2 and 4; markers start on 3", () => {
  assert.deepEqual(L.LANES, ["def", "str", "int"]);
  assert.equal(L.ROUNDS, 5); assert.deepEqual(L.CROWD_ROUNDS, [1, 3]);
  assert.deepEqual(L.fresh().k, [3, 3, 3]);
});

test("STR: right pushes by the call; space 5 takes the tower and it stays taken", () => {
  const s = L.fresh();
  L.play(s, STR, "CLUTCH", true); assert.equal(s.k[STR], 5); assert.ok(s.taken[STR]);   // 3 + 2
  L.play(s, STR, "CLUTCH", false); assert.equal(s.k[STR], 2);                         // 5 − 2 − 1 wave
  assert.ok(L.won(s, STR), "the tower stays taken");
  const t = L.fresh();
  L.play(t, STR, "TILT", true, false); assert.equal(t.k[STR], 2);                      // tails: 3 − 1
  L.play(t, STR, "TILT", true, true); assert.equal(t.k[STR], 5);                       // heads: 2 + 3
  L.play(t, STR, "FEED", false); assert.equal(t.k[STR], 4);                            // 5 + 0 − 1 wave
});

test("wrong answers: the call's penalty plus the wave; never below space 1", () => {
  const s = L.fresh();
  L.play(s, STR, "FEED", false); assert.equal(s.k[STR], 2);     // 3 + 0 − 1
  L.play(s, STR, "CLUTCH", false); assert.equal(s.k[STR], 1);   // 2 − 2 − 1, held at 1
});

test("DEF: a right answer shields any lane; a shield blocks one wave there; DEF is won by holding space 3", () => {
  const s = L.fresh();
  const ev = L.play(s, DEF, "FEED", true, false, STR);
  assert.equal(ev.shield, STR); assert.deepEqual(s.k, [3, 3, 3]);
  const w = L.play(s, STR, "FEED", false); assert.ok(w.blocked); assert.equal(s.k[STR], 3);   // wave blocked, FEED costs 0
  L.play(s, STR, "FEED", false); assert.equal(s.k[STR], 2);                                    // shield used up
  assert.ok(L.won(s, DEF));
  L.play(s, DEF, "FEED", false); assert.equal(s.k[DEF], 2); assert.ok(!L.won(s, DEF));
});

test("INT: right heals its own lane, or the lowest lane once INT is on space 5", () => {
  const s = L.fresh();
  L.play(s, INT, "FEED", true); assert.equal(s.k[INT], 4);
  L.play(s, INT, "FEED", true); assert.equal(s.k[INT], 5); assert.ok(s.taken[INT]);
  s.k[DEF] = 1; s.k[STR] = 2;
  const ev = L.play(s, INT, "CLUTCH", true); assert.equal(ev.healed, DEF); assert.equal(s.k[DEF], 2);
});
