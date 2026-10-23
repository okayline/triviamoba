# TriviaMoba Changelog

Newest first. Times are Hawaii time (HST). The prototype has no version number on the page; these are numbered here from the commits.

---

## v0.3 — "The Crowd"
**Fri Oct 23, 2026 · 3:30 AM HST** (not deployed; migration `001_crowd.sql` not run yet)

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
