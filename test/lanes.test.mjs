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

test("STR: right pushes by the call; space 5 takes the tower and it stays taken", () => {
  const s = L.fresh();
  L.play(s, STR, "CLUTCH", true); L.play(s, STR, "CLUTCH", true); assert.equal(s.k[STR], 4);   // 0 + 2 + 2
  L.play(s, STR, "FEED", true); assert.equal(s.k[STR], 5); assert.ok(s.taken[STR]);
  L.play(s, STR, "CLUTCH", false); assert.equal(s.k[STR], 2);                                    // 5 − 2 − 1 wave
  assert.ok(L.won(s, STR), "the tower stays taken");
  const t = L.fresh();
  L.play(t, STR, "TILT", true, true); assert.equal(t.k[STR], 3);                                // heads: 0 + 3
  L.play(t, STR, "TILT", true, false); assert.equal(t.k[STR], 2);                               // tails: −1
  L.play(t, STR, "FEED", false); assert.equal(t.k[STR], 1);                                      // + 0 − 1 wave
});

test("wrong answers: the call's penalty plus the wave; never behind the start pad", () => {
  const s = L.fresh();
  L.play(s, STR, "FEED", true); L.play(s, STR, "FEED", true); assert.equal(s.k[STR], 2);
  L.play(s, STR, "FEED", false); assert.equal(s.k[STR], 1);     // 2 + 0 − 1
  L.play(s, STR, "CLUTCH", false); assert.equal(s.k[STR], 0);   // 1 − 2 − 1, held at the pad
});

test("DEF: a right answer pushes like STR and shields any lane; a shield blocks one wave; DEF is won at the tower like the others", () => {
  const s = L.fresh();
  const ev = L.play(s, DEF, "FEED", true, false, STR);
  assert.equal(ev.shield, STR); assert.deepEqual(s.k, [1, 0, 0]);
  L.play(s, STR, "CLUTCH", true); assert.equal(s.k[STR], 2);
  const w = L.play(s, STR, "FEED", false); assert.ok(w.blocked); assert.equal(s.k[STR], 2);   // wave blocked, FEED costs 0
  L.play(s, STR, "FEED", false); assert.equal(s.k[STR], 1);                                    // shield used up
  assert.ok(!L.won(s, DEF));
  L.play(s, DEF, "CLUTCH", true, false, DEF); L.play(s, DEF, "CLUTCH", true, false, DEF);
  assert.equal(s.k[DEF], 5); assert.ok(L.won(s, DEF)); assert.equal(s.shields[DEF], 2);
});

test("INT: right heals its own lane, or the lowest lane once INT is on space 5", () => {
  const s = L.fresh();
  for (let n = 0; n < 5; n++) L.play(s, INT, "FEED", true);
  assert.equal(s.k[INT], 5); assert.ok(s.taken[INT]);
  s.k[DEF] = 2; s.k[STR] = 1;
  const ev = L.play(s, INT, "CLUTCH", true); assert.equal(ev.healed, STR); assert.equal(s.k[STR], 2);
});
