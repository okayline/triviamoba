# TriviaMoba Changelog

Newest first. Times are Hawaii time (HST). The page shows its version in the lower right since v0.3.1; earlier versions were numbered here from the commits.

---

## v0.4 — "Creep Waves"
**Fri Oct 23, 2026 · 4:05 AM HST**

- Three lanes with their own topic and action, played in order: DEF (history), then STR (body, moon and Earth), then INT (science and tech). Every lane plays all 5 rounds; rounds 2 and 4 are crowd rounds.
- You play the map, not the ghost: a wrong answer lets the map's creep wave push you back a space, on top of your call's penalty. STR right pushes forward by your call (CLUTCH +2, FEED +1, TILT +3 or −1); reaching space 5 takes the tower. INT right heals +1 there, or your lowest lane once its tower is taken. DEF right puts a shield on any lane you pick, which blocks the next wave there; DEF is won by holding space 3.
- The ghost is another run on its own track (a dashed ring on the board), compared lane by lane. It never moves your marker.
- 15 new questions, 5 per lane. The rules live in `public/engine/lanes.js`, with tests.
- Removed: the tug of war against the ghost, the hero weights and their bars (SCI, ART, PLC, POP), the four old categories and their 20 questions, the random 0-or-1 mystery round, a lane ending early at space 1 or 5, and the "Draw" headline.

---

## v0.3.1
**Fri Oct 23, 2026 · 3:22 AM HST**

- The version number shows under the game panel, on the right, small and grey. Removed: the note that the page has no version number.
- The ghost is off the bottom panels; it stays on the board above, and the rules are unchanged. Draft: "Pick 3 of 6 heroes, one per lane. Your tag weights are visible." Crowd rounds: "You score if you match the crowd" and "The crowd picked X". Reveal: only your side. Result: no big headline when you lose more lanes (just the lane count), and lane rows without "vs" the ghost's hero. Removed: the ghost's column on the reveal, "Ghost pushes back", "Ghost takes the lane", "Ghost wins", the ghost's sample history in the draft (`GHOST_HISTORY`), and "the ghost's sealed pick".

---

## v0.3 — "The Crowd"
**Fri Oct 23, 2026 · 3:18 AM HST** (migration `001_crowd.sql` run on the live moba-beat database before the push)

- A backend, first step of TriviaMoba and SCATTER.EXE becoming one game. The Worker uses the moba-beat database and shares SCATTER.EXE's players, rate limits and ledger chain; its own data goes in new `scatter_writes` and `scatter_counts` tables and new ledger kinds `crowd` and `write`, so SCATTER.EXE keeps running untouched.
- Every UTC day has 2 write prompts and 6 crowd prompts, picked from the shared registry's head at 00:00 UTC (as moba-beat does; `src/registry.js` is copied from it), and sealed in the day's `crowd` entry with the crowd prompts' counts frozen: everyone plays the same words and counts all day, and nothing written after midnight can change the pick. If the registry can't be read, the day isn't sealed and the next request tries again.
- `POST /api/write`: your two answers, once a day, sealed on the ledger with the counts in one batch. What you write today shows up in a later day's crowd. Blank is fine; blocked words are refused.
- Mystery rounds use 10 real crowd prompts from ProtoQA (CC BY 4.0), and the ghost picks by their counts.
- Removed: the 6 made-up mystery questions and the ghost that always picked the weirdest answer. The page doesn't call the new API yet.

---

## v0.2 — "Towers and Creeps"
**Thu Oct 22, 2026 · 12:16 AM HST**

- The board is a tilted 3D view from above: 5 raised tiles per lane, with towers that fall when a lane is won, and creeps.
- Each lane is a tug of war over 3 rounds. A lane can have one mystery round with no right answer, where you score by picking what the ghost picked.
- Removed: one question per lane, the flat fan lines and the wedge outline.

---

## v0.1 — "Three Lanes"
**Thu Oct 22, 2026 · 12:09 AM HST**

- The first version, a prototype on one page: three lanes of 5 spaces, 3 rounds a lane, 6 creature heroes, 20 gamer and silly questions, CLUTCH/FEED/TILT calls and a scripted ghost to play against.
- Removed: nothing (first version).
