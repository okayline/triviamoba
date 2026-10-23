// TriviaMoba lane rules (player vs. map), loaded by the page (a plain <script>) and the tests. Change a rule here, once.
//
// Three lanes: DEF, STR, INT. Each lane is 5 spaces; your marker starts on the start pad (space 0) out at the edge and
// moves in toward the common goal. Every round you pick a lane (tap its start pad) and answer one of its questions. There
// is no round limit: the game is to fill ONE lane. A right answer beats the map's creep wave and does the lane's
// action; a wrong answer lets the wave through (−1), unless the lane has a shield, which blocks that one wave.
//   STR  right: push forward 2.
//   DEF  right: push forward 2, and place a shield on any lane (it blocks the next wave there).
//   INT  right: push forward 1, and heal +1 in any lane you pick (tap its start pad; heal INT itself and it moves 2).
// Reaching space 5 in any lane takes the tower by the goal and ends the game.
(function () {
  var LANES = ["def", "str", "int"];
  var TOP = 5, START = 0, WAVE = 1, PUSH = 2, INT_PUSH = 1, HEAL = 1;   // 0 is the start pad

  function fresh() { return { k: [START, START, START], shields: [0, 0, 0] }; }
  var clamp = function (n) { return Math.max(START, Math.min(TOP, n)); };
  function move(st, lane, by) { st.k[lane] = clamp(st.k[lane] + by); }

  // One round in `lane`. `target` is the lane a DEF right answer puts its shield on, or the lane an INT right answer heals. Returns what happened, for the reveal.
  function play(st, lane, right, target) {
    var kind = LANES[lane], ev = { lane: lane, right: right, from: st.k.slice() };
    if (right) {
      if (kind === "int") { move(st, lane, INT_PUSH); ev.healed = target; move(st, target, HEAL); }
      else {
        move(st, lane, PUSH);
        if (kind === "def") { ev.shield = target; st.shields[target]++; }
      }
    } else if (st.shields[lane] > 0) { st.shields[lane]--; ev.blocked = true; }
    else { ev.wave = -WAVE; move(st, lane, -WAVE); }
    ev.to = st.k.slice();
    return ev;
  }

  // How far a right INT answer moves the lane `target` you tap: the heal, plus INT's own push when you heal INT itself.
  function healGain(target) { return HEAL + (LANES[target] === "int" ? INT_PUSH : 0); }

  // Is the lane won: its marker is on space 5, at the tower by the goal.
  function won(st, lane) { return st.k[lane] === TOP; }
  // The lane that ended the game, or -1 while it is still on.
  function winner(st) { for (var i = 0; i < st.k.length; i++) if (won(st, i)) return i; return -1; }

  var api = { LANES: LANES, START: START, TOP: TOP, WAVE: WAVE, PUSH: PUSH, INT_PUSH: INT_PUSH, HEAL: HEAL, healGain: healGain,
              fresh: fresh, play: play, won: won, winner: winner };
  globalThis.LANES = api;   // a plain script in the page; the tests import the file and read globalThis.LANES
})();
