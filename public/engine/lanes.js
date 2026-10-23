// TriviaMoba lane rules (player vs. map), loaded by the page (a plain <script>) and the tests. Change a rule here, once.
//
// Three lanes, played in order: DEF, STR, INT. Each lane is 5 spaces; your marker starts on the start pad (space 0)
// out at the edge and moves in toward the common goal, and every lane plays all 5 rounds. A right answer beats the
// map's creep wave and does the lane's action; a wrong answer lets the wave through (−1), unless the lane has a
// shield, which blocks that one wave.
//   STR  right: push forward 2.
//   DEF  right: push forward 2, and place a shield on any lane (it blocks the next wave there).
//   INT  right: heal +1 in the INT lane, or, if it is already on space 5, in your lowest lane.
// In every lane, reaching space 5 takes the tower by the goal: the lane is won and stays won.
(function () {
  var LANES = ["def", "str", "int"];
  var ROUNDS = 5, START = 0, TOP = 5, WAVE = 1, PUSH = 2, HEAL = 1;   // 0 is the start pad
  var CROWD_ROUNDS = [1, 3];   // rounds 2 and 4 of every lane are crowd rounds

  function fresh() { return { k: [START, START, START], shields: [0, 0, 0], taken: [false, false, false] }; }
  var clamp = function (n) { return Math.max(START, Math.min(TOP, n)); };

  function move(st, lane, by) {
    st.k[lane] = clamp(st.k[lane] + by);
    if (st.k[lane] === TOP) st.taken[lane] = true;
  }

  // The lane INT heals: itself, unless it is on space 5, then the lowest lane (the first one on a tie).
  function healTarget(st, lane) {
    if (st.k[lane] < TOP) return lane;
    var low = 0;
    for (var i = 1; i < st.k.length; i++) if (st.k[i] < st.k[low]) low = i;
    return low;
  }

  // One round in `lane`. `shieldLane` is where a DEF right answer puts its shield. Returns what happened, for the reveal.
  function play(st, lane, right, shieldLane) {
    var kind = LANES[lane], ev = { lane: lane, right: right, from: st.k.slice() };
    if (right) {
      if (kind === "int") { ev.healed = healTarget(st, lane); move(st, ev.healed, HEAL); }
      else {
        move(st, lane, PUSH);
        if (kind === "def") { ev.shield = shieldLane; st.shields[shieldLane]++; }
      }
    } else if (st.shields[lane] > 0) { st.shields[lane]--; ev.blocked = true; }
    else { ev.wave = -WAVE; move(st, lane, -WAVE); }
    ev.to = st.k.slice();
    return ev;
  }

  // Is the lane won so far: once its tower is taken (every lane the same way).
  function won(st, lane) { return st.taken[lane]; }

  var api = { LANES: LANES, ROUNDS: ROUNDS, START: START, TOP: TOP, WAVE: WAVE, PUSH: PUSH, HEAL: HEAL, CROWD_ROUNDS: CROWD_ROUNDS,
              fresh: fresh, play: play, healTarget: healTarget, won: won };
  globalThis.LANES = api;   // a plain script in the page; the tests import the file and read globalThis.LANES
})();
