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

<!-- BEGIN SHARED RULES v8 (2026-10-31). One copy of this block is in every Dungeons repo's CLAUDE.md. The source is dungeon-notes/SHARED-RULES.md. Don't edit the block inside a repo: change the source, then copy it into every repo. -->
## Working rules (shared by every repo)

"kura" is the owner. "4Dungeon" is the repo `daily-dungeon`. Other Claude chats work in these repos and share no memory with you: the repo and its changelog are the shared record. A repo section above beats a rule below, except rules 1 to 4.

**Honesty (never broken)**
1. Never lie. State as fact only what you opened, read or ran this turn; the rest is "not checked", or isn't said. Label opinions "my opinion". "Should work" and "probably" count as not checked.
2. Answers about code or data end with "Not checked:".
3. Check first, then reply once. If you were wrong, the first sentence says what you said, what is true, and the source.
4. Never say something was done, pushed or fixed unless you saw it succeed. Report failures plainly.

**Searching**
5. Before saying "no", or recommending something new, search the chat (if you can reach it), every repo you can reach, and the live state. Say what you searched and what you found. Say "I couldn't find it", never "that isn't true". If kura remembers something you can't find, don't call kura wrong, and don't state it as fact.

**Design**
6. Give honest answers, including "this isn't worth building". Give one recommendation. Never tell kura to playtest the game.
7. Before proposing, name the goal it serves (4Dungeon: `dungeon-notes/daily-dungeon-design.md`, section 15) and how it would most likely fail. No goal, no proposal. Propose the smallest version first.

**Building**
8. Commit locally as asked. Push only when kura says to. "Push" means: commit everything that's changed and push it all to `main` (in repos that deploy from `main`, that also puts it live). Bump the version (with the changelog entry and the dev changelog entry the repo asks for) only when the game itself changes. A push that doesn't change how the game plays (icons, footer, wording, styling) gets one line in the public changelog under an unversioned heading, such as `## Tab icon` with "(no new version: the game itself is unchanged)", and no version bump or dev entry. This rule beats a repo section that says every push is a release.
9. Don't add anything kura didn't ask for (a button, a screen, a page, a feature), change tables or scheduled tasks, or add a dependency: ask first.
10. Delete, don't park: no new flags or "off for now" code. Fix a shared problem once, in the shared place. Prefer changing what exists to adding a file. Each changelog line says what was removed as well as what was added.
11. No new secrets (passwords, tokens, keys such as `DAILY_SECRET`) in files, commits or replies. If you find one already committed, tell kura, and don't repeat it.

**Working with kura**
12. Don't act without kura's explicit permission. A question gets an answer, not an action: "Can you remove that rule?" is a request; "What happens if we remove that rule?" is a question. If you can't tell which, answer, then ask "want me to do it?" and wait. Reading and searching to find the answer is fine.
13. Disagree before building, not after. Silence means "not now": raise each item once.

**Defaults**
- Testing takes 2 to 3 minutes in total, with no edge cases. A repo's required check (such as `npm test`) counts toward that. Need more? Ask first.
- Times are Hawaii time (HST) unless a file says otherwise (88x31-anchors receipts are UTC).
- Some repos get automated commits: fetch before you push.
<!-- END SHARED RULES v8 -->
