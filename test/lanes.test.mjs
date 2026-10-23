// The lane rules (public/engine/lanes.js), with expected spaces worked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../public/engine/lanes.js";
const L = globalThis.LANES;
const DEF = 0, STR = 1, INT = 2;

test("lanes are DEF, STR, INT; 5 rounds; crowd rounds are 2 and 4; markers start on the start pad (0)", () => {
  assert.deepEqual(L.LANES, ["def", "str", "int"]);
  assert.equal(L.ROUNDS, 5); assert.deepEqual(L.CROWD_ROUNDS, [1, 3]);
  assert.deepEqual(L.fresh().k, [0, 0, 0]);
});

test("STR: right pushes 2; space 5 takes the tower and it stays taken", () => {
  const s = L.fresh();
  L.play(s, STR, true); L.play(s, STR, true); assert.equal(s.k[STR], 4);   // 0 + 2 + 2
  L.play(s, STR, true); assert.equal(s.k[STR], 5); assert.ok(s.taken[STR]);   // 4 + 2, held at 5
  L.play(s, STR, false); assert.equal(s.k[STR], 4);                          // 5 − 1 wave
  assert.ok(L.won(s, STR), "the tower stays taken");
});

test("wrong answers: the wave pushes back 1 and nothing more; never behind the start pad", () => {
  const s = L.fresh();
  L.play(s, STR, true); assert.equal(s.k[STR], 2);
  const w = L.play(s, STR, false); assert.equal(s.k[STR], 1); assert.equal(w.wave, -1);   // 2 − 1
  L.play(s, STR, false); assert.equal(s.k[STR], 0);                                       // 1 − 1
  L.play(s, STR, false); assert.equal(s.k[STR], 0, "held at the pad");
});

test("DEF: a right answer pushes 2 and shields any lane; a shield blocks one wave; DEF is won at the tower like the others", () => {
  const s = L.fresh();
  const ev = L.play(s, DEF, true, STR);
  assert.equal(ev.shield, STR); assert.deepEqual(s.k, [2, 0, 0]);
  L.play(s, STR, true); assert.equal(s.k[STR], 2);
  const w = L.play(s, STR, false); assert.ok(w.blocked); assert.equal(s.k[STR], 2);   // wave blocked
  L.play(s, STR, false); assert.equal(s.k[STR], 1);                                    // shield used up
  assert.ok(!L.won(s, DEF));
  L.play(s, DEF, true, DEF); L.play(s, DEF, true, DEF);                                 // 2 + 2 + 2, held at 5
  assert.equal(s.k[DEF], 5); assert.ok(L.won(s, DEF)); assert.equal(s.shields[DEF], 2);
});

test("INT: right heals +1 in its own lane, or the lowest lane once INT is on space 5", () => {
  const s = L.fresh();
  for (let n = 0; n < 5; n++) L.play(s, INT, true);
  assert.equal(s.k[INT], 5); assert.ok(s.taken[INT]);
  s.k[DEF] = 2; s.k[STR] = 1;
  const ev = L.play(s, INT, true); assert.equal(ev.healed, STR); assert.equal(s.k[STR], 2);
});
