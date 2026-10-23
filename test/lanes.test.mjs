// The lane rules (public/engine/lanes.js), with expected spaces worked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../public/engine/lanes.js";
const L = globalThis.LANES;
const DEF = 0, STR = 1, INT = 2;

test("lanes are DEF, STR, INT; markers start on the start pad (0); no lane is won at the start", () => {
  assert.deepEqual(L.LANES, ["def", "str", "int"]);
  assert.deepEqual(L.fresh().k, [0, 0, 0]);
  assert.equal(L.winner(L.fresh()), -1);
});

test("crowd rounds: a lane's 2nd and 4th questions of every 5", () => {
  const crowd = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(L.isCrowd);
  assert.deepEqual(crowd, [false, true, false, true, false, false, true, false, true, false]);
});

test("STR: right pushes 2; space 5 takes the tower and ends the game", () => {
  const s = L.fresh();
  L.play(s, STR, true); L.play(s, STR, true); assert.equal(s.k[STR], 4);   // 0 + 2 + 2
  assert.equal(L.winner(s), -1);
  L.play(s, STR, true); assert.equal(s.k[STR], 5);                          // 4 + 2, held at 5
  assert.ok(L.won(s, STR)); assert.equal(L.winner(s), STR);
});

test("wrong answers: the wave pushes back 1 and nothing more; never behind the start pad", () => {
  const s = L.fresh();
  L.play(s, STR, true); assert.equal(s.k[STR], 2);
  const w = L.play(s, STR, false); assert.equal(s.k[STR], 1); assert.equal(w.wave, -1);   // 2 − 1
  L.play(s, STR, false); assert.equal(s.k[STR], 0);                                       // 1 − 1
  L.play(s, STR, false); assert.equal(s.k[STR], 0, "held at the pad");
});

test("DEF: a right answer pushes 2 and shields any lane; a shield blocks one wave; DEF also takes its tower at space 5", () => {
  const s = L.fresh();
  const ev = L.play(s, DEF, true, STR);
  assert.equal(ev.shield, STR); assert.deepEqual(s.k, [2, 0, 0]);
  L.play(s, STR, true); assert.equal(s.k[STR], 2);
  const w = L.play(s, STR, false); assert.ok(w.blocked); assert.equal(s.k[STR], 2);   // wave blocked
  L.play(s, STR, false); assert.equal(s.k[STR], 1);                                    // shield used up
  L.play(s, DEF, true, DEF); L.play(s, DEF, true, DEF);                                 // 2 + 2 + 2, held at 5
  assert.equal(s.k[DEF], 5); assert.equal(L.winner(s), DEF); assert.equal(s.shields[DEF], 2);
});

test("INT: a right answer pushes INT 1 and heals +1 in the lane you pick (INT itself: 2); five rights take INT's tower", () => {
  const s = L.fresh();
  const ev = L.play(s, INT, true, STR); assert.equal(ev.healed, STR); assert.deepEqual(s.k, [0, 1, 1]);   // INT +1, STR +1
  L.play(s, INT, true, INT); assert.deepEqual(s.k, [0, 1, 3]);                                          // INT +1 and +1
  assert.equal(L.healGain(INT), 2); assert.equal(L.healGain(STR), 1);
  L.play(s, INT, true, DEF); assert.deepEqual(s.k, [1, 1, 4]);
  L.play(s, INT, true, STR); assert.deepEqual(s.k, [1, 2, 5]); assert.equal(L.winner(s), INT);        // INT 4 + 1, held at 5
  const t = L.fresh(); t.k[STR] = 4;
  L.play(t, INT, true, STR); assert.equal(L.winner(t), STR, "a heal can take another lane's tower");
});
