# triviamoba: working notes

## This repo

TriviaMoba: trivia in three MOBA lanes, a game in the Dungeons family. Design notes: "Lane Game: Design Notes" (working title in that doc) and `triviamoba/design.md` in the private dungeon-notes repo. Not Trivial Pursuit's look or name: that is Hasbro's. The Worker `triviamoba` is connected to this repo, so a push to `main` is a release.

**The page and the questions**
- The page is `public/index.html` plus the lane rules in `public/engine/lanes.js` (DEF, STR, INT against the map's creep waves; a plain script the page loads and the tests import). Change a lane rule there, once. Sample heroes live in the page.
- **The questions and their answers live in `src/questions.js` (the Worker), never in `public/`** (a test checks). The page gets a question without its answer from `POST /api/deal` and the verdict from `POST /api/answer`, which allows `TIME` + `GRACE` seconds (15 + 5 for lag).
- Questions are only added, never edited or reordered. A question can have a picture in `public/img/` (named by a hash, never by its answer); the picture's answer is only in `src/questions.js`.
- There is no ghost anywhere in the page (owner, Oct 23); the backend keeps its own logic. The page doesn't use the rest of the API (today, write, seed) yet.
- **No bad vibes:** no negative questions, answers or headlines. No browser popups.

**The crowd rules.** They live in one file, `public/engine/crowd.js` (prompts and starting counts, the day's pick, answer keys, the word filter), loaded by the Worker and the tests. Prompts and counts are from ProtoQA (CC BY 4.0): keep the credit in `README.md`.

**The backend**
- `src/worker.js`, `src/ledger.js` and `src/registry.js` (copied from moba-beat) use the moba-beat D1 and share SCATTER.EXE's `scatter_players`, `scatter_rate_limits` and `scatter_ledger` chain. TriviaMoba's own data is `scatter_writes`, `scatter_counts` and the ledger kinds `crowd` and `write`.
- Never touch SCATTER.EXE's `scatter_sheets` or its `day`/`sheet` entries. Don't weaken `prev_hash UNIQUE`. Records hold player ids, never names.
- **The day's pick** comes from the day's seed: HMAC-SHA256 of the shared registry's head at 00:00 UTC (as moba-beat) and the day, keyed with the Worker secret `DAILY_SECRET` (as scoundrel.exe). It is sealed in the day's `crowd` entry as `seed_hash` with the crowd counts frozen, and never sent to a page. Never change `DAILY_SECRET`: a new one would pick different days and past hashes would stop matching. The Worker answers 503 until it is set.
- **Database changes** need a file in `migrations/`, `schema.sql` updated to match, and the live moba-beat D1 migrated before the push that needs it.

**Testing and releases**
- `npm test` must pass before any commit, plus one quick check of whatever changed. Expected values come from hand-worked examples or node:crypto, not the code under test.
- Every release bumps the version in `public/index.html` (`<div class="ver">`) and adds a `CHANGELOG.md` entry (a test checks they match), plus the detailed dev entry in dungeon-notes `triviamoba/changelog-v0.1.md`.
