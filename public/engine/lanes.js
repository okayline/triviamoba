// TriviaMoba lane rules (player vs. map), loaded by the page (a plain <script>) and the tests. Change a rule here, once.
//
// Three lanes: DEF, STR, INT. Each lane is 5 spaces; your marker starts on the start pad (space 0) out at the edge and
// moves in toward the common goal. Every round you pick a lane (tap its start pad) and answer one of its questions. There
// is no round limit: the game is to fill ONE lane. A right answer beats the map's creep wave and does the lane's
// action; a wrong answer lets the wave through (−1), unless the lane has a shield, which blocks that one wave.
//   STR  right: push forward 2.
//   DEF  right: push forward 2, and place a shield on any lane (it blocks the next wave there).
//   INT  right: heal +1 in any lane you pick (tap its start pad).
// Reaching space 5 in any lane takes the tower by the goal and ends the game.
(function () {
  var LANES = ["def", "str", "int"];
  var TOP = 5, START = 0, WAVE = 1, PUSH = 2, HEAL = 1;   // 0 is the start pad
  var CYCLE = 5, CROWD_ROUNDS = [1, 3];   // in each lane, its 2nd and 4th questions of every 5 are crowd rounds

  function fresh() { return { k: [START, START, START], shields: [0, 0, 0] }; }
  var clamp = function (n) { return Math.max(START, Math.min(TOP, n)); };
  function move(st, lane, by) { st.k[lane] = clamp(st.k[lane] + by); }

  // Is this lane's n-th question (0 is the first) a crowd round?
  function isCrowd(n) { return CROWD_ROUNDS.indexOf(n % CYCLE) >= 0; }

  // One round in `lane`. `target` is the lane a DEF right answer puts its shield on, or the lane an INT right answer heals. Returns what happened, for the reveal.
  function play(st, lane, right, target) {
    var kind = LANES[lane], ev = { lane: lane, right: right, from: st.k.slice() };
    if (right) {
      if (kind === "int") { ev.healed = target; move(st, target, HEAL); }
      else {
        move(st, lane, PUSH);
        if (kind === "def") { ev.shield = target; st.shields[target]++; }
      }
    } else if (st.shields[lane] > 0) { st.shields[lane]--; ev.blocked = true; }
    else { ev.wave = -WAVE; move(st, lane, -WAVE); }
    ev.to = st.k.slice();
    return ev;
  }

  // Is the lane won: its marker is on space 5, at the tower by the goal.
  function won(st, lane) { return st.k[lane] === TOP; }
  // The lane that ended the game, or -1 while it is still on.
  function winner(st) { for (var i = 0; i < st.k.length; i++) if (won(st, i)) return i; return -1; }

  var api = { LANES: LANES, START: START, TOP: TOP, WAVE: WAVE, PUSH: PUSH, HEAL: HEAL, CYCLE: CYCLE, CROWD_ROUNDS: CROWD_ROUNDS,
              fresh: fresh, play: play, isCrowd: isCrowd, won: won, winner: winner };
  globalThis.LANES = api;   // a plain script in the page; the tests import the file and read globalThis.LANES
})();
