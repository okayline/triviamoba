# Working notes for triviamoba

TriviaMoba: trivia in three MOBA lanes, a game in the Dungeons family. Design notes: "Lane Game: Design Notes" (working title in that doc). Not Trivial Pursuit's look or name: that is Hasbro's.

- **Push only when the user says to.** The Worker `triviamoba` is connected to this repo, so a push to `main` is a release.
- **The page** is one file, `public/index.html`, with sample heroes and trivia questions, the crowd rounds' 10 prompts, and a scripted ghost (on the board only; the bottom panels never mention it). The lane rules (scoring, 5-space lanes, rounds a lane) are in the script at the bottom of that file; change a rule there, once. The page doesn't call the API yet.
- **The crowd rules live in one file**, `public/engine/crowd.js` (prompts and starting counts, the day's pick, answer keys, the word filter), loaded by the Worker and the tests. Prompts and counts are from ProtoQA (CC BY 4.0): keep the credit in README.md.
- **The backend** (`src/worker.js`, `src/ledger.js`, `src/registry.js` copied from moba-beat) uses the moba-beat D1 and shares SCATTER.EXE's `scatter_players`, `scatter_rate_limits` and `scatter_ledger` chain; TriviaMoba's own data is `scatter_writes`, `scatter_counts` and the ledger kinds `crowd` and `write`. Never touch SCATTER.EXE's `scatter_sheets` or its `day`/`sheet` entries. Don't weaken `prev_hash UNIQUE`. Records hold player ids, never names.
- **The day's pick** comes from the shared registry's head at 00:00 UTC (as moba-beat), sealed in the day's `crowd` entry with the crowd counts frozen.
- **Database changes** need a file in `migrations/`, `schema.sql` updated to match, and the live moba-beat D1 migrated before the push that needs it.
- **Keep testing quick**: `npm test` must pass before any commit, plus one quick check of whatever changed. Expected values come from hand-worked examples or node:crypto, not the code under test.
- **No bad vibes**: no negative questions, answers or headlines.
- Every release bumps the version in `public/index.html` (`<div class="ver">`) and adds a `CHANGELOG.md` entry (a test checks they match), plus the detailed dev entry in dungeon-notes `triviamoba/changelog-v0.1.md`. No new dependencies without asking. Times in changelogs are Hawaii time (HST). No browser popups.

## Working rules

The same seventeen rules are in every Dungeons repo and in the project instructions. "ryan" is the owner.

**Honesty (never broken)**
1. Never lie. State as fact only what you opened, read or ran this turn. Everything else gets "Not checked" in the same sentence, or isn't said.
2. Don't infer from the surface. READMEs, titles, file names, comments, timestamps, summaries and earlier replies are leads to check, not facts.
3. Quote it or don't claim it. Don't describe how code, a table, a page or a ledger works, or say something exists or is missing, until you have opened it in this conversation. Give file and line, quoted.
4. Opinions are labelled "my opinion". Hedges like "should work" or "probably" are labelled "not checked".
5. Every answer about code or data ends with "Opened:" (files and lines read this turn) and "Not checked:". If "Opened:" would be empty, open the files before answering.
6. Check first, then reply once. No "I'll look into it" message followed by an answer from memory.
7. If you were wrong, the first sentence says what you said, what is true, and the source.
8. Never say something was done, pushed or fixed unless you saw it succeed. Say what ran and what didn't, and report failures plainly.

**Searching**
9. Search before saying "no": project chat and threads, all eight repos, and the live state. List what was and wasn't searched. Say "I couldn't find it", never "that isn't true", and never "everything". Treat ryan's memory as true until a search disproves it.
10. Before recommending anything new, search the code for whether it already exists, and say what you found.

**Design and proposals**
11. Give honest design answers, including "this isn't worth building". Give one recommendation. Mention "do nothing" only if it is actually the best option. Never tell ryan to play or playtest the game.
12. Before proposing, name the goal it serves (4Dungeon: design doc section 15), what it adds, takes away and touches, what it replaces or lets us delete, what already exists, and how it would most likely fail. No goal means no proposal. Propose the smallest version first.

**Building**
13. Build, push, change tables or scheduled tasks, or add a dependency only when ryan asks. Don't touch anything not asked for, and list extras for approval.
14. Delete, don't park: no new flags or "off for now" code. Fix a shared problem once, in the shared place.
15. Each changelog line says what was removed as well as what was added.

**Working with ryan**
16. Silence means "not now": no nagging, and raise each item at most once.
17. Disagree before building, not after. A bare "ok" to a long answer is not approval of everything in it.
