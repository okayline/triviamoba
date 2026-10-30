# TriviaMoba Changelog

Newest first. Times are Hawaii time (HST). The page shows its version in the lower right since v0.3.1; earlier versions were numbered here from the commits.

---

## v0.22
**Thu Oct 29, 2026 · 2:53 PM HST**

- The footer is a bit smaller and a few pixels higher. Removed: the larger footer text.

## v0.21
**Thu Oct 29, 2026 · 2:49 PM HST**

- The footer sits right under the game panel. Removed: about 10px of space between them.

## v0.20
**Thu Oct 29, 2026**

- **The shared footer** from dungeon-items ("© ~*~88x31~*~ cLuB, year · ≡ v0.20"), the same line every 88x31 game shows. Its ≡ opens the carry window (`/api/carry`): save codes, passkeys, logging in and out, and your copies with Pin. Removed: the version under the game panel.
- **No USER page.** Removed: the [USER] button and the full-screen USER page (`account.js`).

## v0.19
**Mon Oct 26, 2026 · 12:39 AM HST** (run SCATTER.EXE's `migrations/002_sessions.sql` first; it makes `scatter_sessions`)

- **[USER] next to the version.** Save codes and passkeys, the shared 88x31 ones, so your player follows you to another browser and the other 88x31 games. Passkeys only work on an 88x31.app address.
- **Carry.** USER shows the copy you carry into every 88x31 game (gold if the Moon blessed it) and every copy your account holds in any game, with Pin to carry another. Writing both crowd answers marks the copy you carry.
- The ACCOUNTS and REGISTRY bindings to dungeon-items. The account code is SCATTER.EXE's (`src/accounts.js`).
- Removed: nothing.

---

## v0.18
**Fri Oct 23, 2026 · 7:12 AM HST** (no migration; nothing new to run)

- The thin axis line moves from Neptune to Uranus, at the owner’s request. Neptune’s picture is back to the plain photo. Uranus’s picture gets a thin light line sticking out of its two poles (about 22 px each, outside the ball only). It leans 14.5° from straight up, because the ring in the photo slopes about 14.5° (measured by tracing the ring’s two ends) and the axis stands square to the ring. It is not the real tilt: Wikipedia’s Uranus article gives 82.23° to its orbit, which would run the line along the ring. Removed: the v0.17 Neptune picture (with the 28.32° line) and the v0.12 Uranus picture (without a line).

---

## v0.17
**Fri Oct 23, 2026 · 7:02 AM HST** (no migration; nothing new to run)

- Neptune’s axis line now leans 28.32° from straight up, Neptune’s real axial tilt to its orbit (Wikipedia’s Neptune article, from NASA’s planetary fact sheet), at the owner’s request. Removed: the v0.16 picture, where the line leaned 15° (my guess). The lean is to the right as in v0.16; which way the real tilt leans in the photo is not known.

---

## v0.16
**Fri Oct 23, 2026 · 6:55 AM HST** (no migration; nothing new to run)

- Neptune’s picture gets a thin light axis line sticking out of its north and south poles (about 22 px each, outside the ball only), leaning 15° to the right to show it tilted, at the owner’s request. The 15° is my choice, not measured from the photo. Removed: the v0.12 Neptune picture without the line.

---

## v0.15
**Fri Oct 23, 2026 · 6:47 AM HST** (no migration; nothing new to run)

- Mercury’s picture is made 60% of Earth’s width (about 124 px against Earth’s about 207 px) at the owner’s request, and the part of the ball that was cut off straight at the bottom of the original photo (about 9 px) and the sliver cut off at the top (about 1 px) are filled in by mirroring the surface rows next to the cut, so it is a whole round ball. The fill is not part of the original photo. The real ratio is 38%, so this is bigger than to scale. Removed: the v0.14 Mercury picture (50%, still cut off at the bottom).

---

## v0.14
**Fri Oct 23, 2026 · 6:43 AM HST** (no migration; nothing new to run)

- Mercury’s picture is made 50% of Earth’s width (about 104 px against Earth’s about 207 px) at the owner’s request. The real ratio is 38% (4,878 km against 12,742 km, from Wikidata), so this is bigger than to scale. Removed: the v0.13 Mercury picture (38%).

---

## v0.13
**Fri Oct 23, 2026 · 6:43 AM HST** (no migration; nothing new to run)

- Mercury’s picture is now to scale with Earth’s in the sheet: Mercury is 38% of Earth’s width (diameters 4,878 km and 12,742 km, from Wikidata), so its ball is about 80 px wide against Earth’s about 207 px. Removed: the full-frame Mercury picture (replaced by the smaller one). The other planets in the sheet are not changed and are not to scale with each other, as the sheet’s maker drew them.

---

## v0.12
**Fri Oct 23, 2026 · 6:39 AM HST** (no migration; nothing new to run)

- INT gets 8 picture questions, "Which planet is this?", each a picture of one planet (Earth, Jupiter, Uranus, Mars, Venus, Neptune, Saturn, Mercury) with four planet names. The pictures are cropped from a sheet the owner sent (`public/img/`, named by a hash so a file name never gives the answer; where the sheet comes from and its licence are not known). A question can now carry a picture: `POST /api/deal` sends `img` and the page shows it above the question. Removed: nothing (INT's 5 text questions are still there).

---

## v0.11
**Fri Oct 23, 2026 · 6:20 AM HST** (needs migration 002 run on the moba-beat database before the push: `npx wrangler d1 execute moba-beat --remote --file=migrations/002_deals.sql`)

- The server now keeps the answers. Each round the page asks `POST /api/deal` for a question (the text and its four options, no answer) and sends the pick to `POST /api/answer`, which says if it was right and shows the right answer. The server starts a clock when it sends a question and allows 15 seconds plus 5 for lag; a pick later than that counts as time's up. A question can be answered once (asked again, it gives back the first result), and a "time's up" can't come early to peek at the answer. A player gets all of a lane's questions before any repeats. Deals are limited to 600 an hour from one place. New table `scatter_deals` (`migrations/002_deals.sql`). The page shows "One moment…" while it waits, and "Try again" if a try didn't get through.
- The questions and answers moved to `src/questions.js` (the Worker; nothing in `public/` holds them). Removed: the 15 questions and their answers in the page, the page's own question picking, shuffling and right/wrong check, `S.used`, and the page's 15-second constant (the server sends the time).

---

## v0.10
**Fri Oct 23, 2026 · 6:08 AM HST** (no migration; needs `DAILY_SECRET`, as v0.9)

- `GET /api/seed?day=YYYY-MM-DD` shows a finished day's seed with its hash, so anyone can check that day's picks. It answers 403 for today or a later day, 404 for a day with no `seed_hash` on the ledger (every day sealed before v0.9), and never shows a seed that doesn't match its sealed hash. Removed: nothing.

---

## v0.9
**Fri Oct 23, 2026 · 5:58 AM HST** (needs `DAILY_SECRET` set on the Worker before the push; no migration)

- The day's picks now come from a secret seed: HMAC-SHA256 of the registry's head and the day, keyed with the Worker secret `DAILY_SECRET`, the same method as scoundrel.exe and Daily Pitch. The day's `crowd` entry gets a `seed_hash` (the SHA-256 of the seed) and the seed never leaves the Worker. Until `DAILY_SECRET` is set, `/api/today` answers 503. Removed: the public seed (SHA-256 of the day and the registry head), which anyone could recompute. Days already sealed keep their old picks and have no `seed_hash`.

---

## v0.8
**Fri Oct 23, 2026 · 5:45 AM HST**

- Crowd rounds are gone: every question is trivia with a right answer. Removed: the "match the crowd" rounds (a lane's 2nd and 4th questions of every 5), the 10 sample crowd prompts and their counts in the page, the crowd note on the question, the "No right answer. The crowd picked…" reveal line, `isCrowd`, `CYCLE` and `CROWD_ROUNDS` in `lanes.js`, and their test. The backend (crowd prompts, written answers, ProtoQA counts) is unchanged and no longer used by the page.

---

## v0.7
**Fri Oct 23, 2026 · 4:36 AM HST**

- A right INT answer always moves INT forward 1 and also heals +1 in the lane you tap. Tap INT's own pad and INT moves 2. The pad shows "+1" (or "+2" on INT's own pad), and the reveal reads "Pushed, healed X". Removed: the heal being INT's whole reward (before, tapping another lane left INT's marker where it was).

---

## v0.6.1
**Fri Oct 23, 2026 · 4:33 AM HST**

- INT's heal is +1 again (owner: "the game is way too fast already, we need to slow it down"). The pad shows "+1" and the heal glows one cell. Removed: the +2 heal, so INT needs 5 right answers to fill its own lane again, against 3 for STR and DEF.

---

## v0.6 — "One Spoke"
**Fri Oct 23, 2026 · 4:25 AM HST**

- The game is to fill ONE spoke: reaching space 5 in any lane takes its tower and ends the game, and the result says which tower and in how many rounds. There is no round limit.
- Every round you choose the lane by tapping its start pad on the board (the pad lights up when you hover it and works from the keyboard). The question comes from that lane. A lane's 2nd and 4th questions of every 5 are crowd rounds.
- INT's right answer heals +2 in the lane you choose (it was +1, which made INT the slowest spoke: 5 rights to fill, against 3 for STR and DEF): you hover a start pad to see "+2" on it and tap it to heal (a heal can take another lane's tower).
- The "+1" sits in the exact centre of the pad and draws over the marker. Removed: its place below the centre, where the marker covered it.
- In the heal step, hovering a start pad (or focusing it with the keyboard) makes the pad and the cells the heal would fill glow from around their edges in the lane's colour. The pad used to just brighten.
- Fixed: "Correct: X" ran into the next sentence ("Correct: Tungsten Marker on space…"); it now ends with a full stop.
- Removed: the fixed order (DEF, then STR, then INT), the 5 rounds per lane and "round N of 5" (also in the header line under the title), "Next lane", the lane count on the result ("N of 3 lanes won"), the rule that a tower stays taken after the marker falls back, INT's old "heal your lowest lane once it is full", and the marker and creeps catching taps on the pads.

---

## v0.5.3
**Fri Oct 23, 2026 · 4:17 AM HST**

- The Moon question reads "About how long does light take to travel from the Moon to Earth?" with the same answers (about 1 second). Removed: "moonlight take to reach Earth", which could also be read as the sunlight's whole trip from the Sun (about 8 minutes).

---

## v0.5.2
**Fri Oct 23, 2026 · 4:15 AM HST**

- The reveal no longer asks "How did you get it?" (I knew it / I guessed / I looked it up), and the result no longer says "Declared: N knew, N guessed, N looked up". Removed: that question and its three chips, the "Nothing to look up on this one" note on crowd rounds, the saved answers, the result line, and the chip CSS.

---

## v0.5.1
**Fri Oct 23, 2026 · 4:13 AM HST**

- The goal's tower of each lane stands beside the middle tile (space 3) instead of the tile next to the goal. Removed: its place beside the tile next to the goal. Your tower at the edge is unchanged.

---

## v0.5
**Fri Oct 23, 2026 · 4:10 AM HST**

- No more call before each question: you go straight to the question. A right answer in DEF or STR pushes forward 2, a wrong answer lets the wave push you back 1 (a shield blocks it) and costs nothing more, and INT's right answer still heals +1. Removed: the explainer text under the lane line (each lane's action description, `ACTION`), the "Commit a call" menu and its CSS, CLUTCH, FEED and TILT (the +2 / +1 / coin-flip pushes and the −2 / 0 / −1 penalties), the TILT coin flip, the "called …" tag on the question and the reveal, and their colours.
- The towers are fully solid. They were drawn inside their lane's group, which is dimmed to 60% whenever the lane isn't the one in play, so they looked see-through. Removed: the dimming on the towers (the tiles and markers keep it).

---

## v0.4.1
**Fri Oct 23, 2026 · 4:05 AM HST**

- The lanes start further out from the goal (50 units, was 30), so the chunky tiles of the three lanes no longer overlap where they meet the goal. Removed: the overlap.

---

## v0.4 — "Creep Waves"
**Fri Oct 23, 2026 · 4:10 AM HST**

- The board is flipped: the common goal is at the top, and the three lanes start out at the edges and run in to it. You start on your lit start pad and the tiles light up as you move in.
- Three lanes with their own topic and action, played in order: DEF (history), then STR (body, moon and Earth), then INT (science and tech). Every lane plays all 5 rounds; rounds 2 and 4 are crowd rounds. Reaching space 5 in a lane takes its tower by the goal.
- You play the map, not the ghost: a wrong answer lets the map's creep wave push you back a space, on top of your call's penalty. STR right pushes forward by your call (CLUTCH +2, FEED +1, TILT +3 or −1). DEF right pushes the same way and puts a shield on any lane you pick, which blocks the next wave there. INT right heals +1 there, or your lowest lane once its tower is taken.
- The board is bigger: wider than the panels below it on a computer (up to 760 px, was 520), taller and much wider tiles (22 → 48 units across), a wider start pad (radius 18 → 32), and less empty space around it. Removed: the board's 320 px height cap.
- 15 new questions, 5 per lane. The rules live in `public/engine/lanes.js`, with tests.
- Removed: the tug of war against the ghost, the hero weights and their bars (SCI, ART, PLC, POP), the four old categories and their 20 questions, the random 0-or-1 mystery round, a lane ending early at space 1 or 5, starting in the middle of a lane, "YOU" on the hub (it reads GOAL), the "Draw" headline, and the ghost everywhere in the page (its scripted run, its place on the board, "ghost:" on the lanes and results, and its CSS). The backend is unchanged.

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
