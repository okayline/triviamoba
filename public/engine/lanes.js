// TriviaMoba lane rules (player vs. map), loaded by the page (a plain <script>) and the tests. Change a rule here, once.
//
// Three lanes, played in order: DEF, STR, INT. Each lane is 5 spaces, your marker starts on space 3, and every lane
// plays all 5 rounds. Every round you make a call (CLUTCH, FEED or TILT), then answer. Right answers beat the map's
// creep wave and do the lane's action; a wrong answer pays the call's penalty and lets the wave through (−1),
// unless the lane has a shield, which blocks that one wave.
//   STR  right: push forward by the call (CLUTCH +2, FEED +1, TILT coin flip +3 or −1). Reaching space 5 takes the
//        tower: the lane is won and stays won.
//   INT  right: heal +1 in the INT lane, or, if it is already on space 5, in your lowest lane. Space 5 takes the tower.
//   DEF  right: place a shield on any lane (it blocks the next wave there). DEF is won by holding: still on space 3
//        or better after its 5 rounds.
(function () {
  var LANES = ["def", "str", "int"];
  var ROUNDS = 5, START = 3, TOP = 5, WAVE = 1;
  var CROWD_ROUNDS = [1, 3];   // rounds 2 and 4 of every lane are crowd rounds

  var RIGHT = { CLUTCH: 2, FEED: 1 };          // TILT: heads +3, tails −1
  var WRONG = { CLUTCH: -2, FEED: 0, TILT: -1 };

  function fresh() { return { k: [START, START, START], shields: [0, 0, 0], taken: [false, false, false] }; }
  var clamp = function (n) { return Math.max(1, Math.min(TOP, n)); };

  function move(st, lane, by) {
    st.k[lane] = clamp(st.k[lane] + by);
    if (LANES[lane] !== "def" && st.k[lane] === TOP) st.taken[lane] = true;
  }

  // The lane INT heals: itself, unless it is on space 5, then the lowest lane (the first one on a tie).
  function healTarget(st, lane) {
    if (st.k[lane] < TOP) return lane;
    var low = 0;
    for (var i = 1; i < st.k.length; i++) if (st.k[i] < st.k[low]) low = i;
    return low;
  }

  // One round in `lane`. `shieldLane` is where a DEF right answer puts its shield. Returns what happened, for the reveal.
  function play(st, lane, call, right, heads, shieldLane) {
    var kind = LANES[lane], ev = { lane: lane, right: right, from: st.k.slice() };
    if (right) {
      if (kind === "str") { ev.push = call === "TILT" ? (heads ? 3 : -1) : RIGHT[call]; move(st, lane, ev.push); }
      else if (kind === "int") { ev.healed = healTarget(st, lane); move(st, ev.healed, 1); }
      else { ev.shield = shieldLane; st.shields[shieldLane]++; }
    } else {
      ev.penalty = WRONG[call];
      if (st.shields[lane] > 0) { st.shields[lane]--; ev.blocked = true; } else ev.wave = -WAVE;
      move(st, lane, ev.penalty + (ev.blocked ? 0 : -WAVE));
    }
    ev.to = st.k.slice();
    return ev;
  }

  // Is the lane won so far: STR and INT once their tower is taken, DEF by holding its starting space.
  function won(st, lane) { return LANES[lane] === "def" ? st.k[lane] >= START : st.taken[lane]; }

  var api = { LANES: LANES, ROUNDS: ROUNDS, START: START, TOP: TOP, WAVE: WAVE, CROWD_ROUNDS: CROWD_ROUNDS, RIGHT: RIGHT, WRONG: WRONG,
              fresh: fresh, play: play, healTarget: healTarget, won: won };
  globalThis.LANES = api;   // a plain script in the page; the tests import the file and read globalThis.LANES
})();
