-- Questions the server has dealt, in the moba-beat database (next to SCATTER.EXE's tables). Run before the push that needs it:
--   npx wrangler d1 execute moba-beat --remote --file=migrations/002_deals.sql

-- Each question the server has dealt to a player, and the answer it got back. The questions and their answers live in
-- src/questions.js; a row holds only which one was dealt and in what order its options were shown.
CREATE TABLE IF NOT EXISTS scatter_deals (
  id          INTEGER PRIMARY KEY,
  player_id   INTEGER NOT NULL REFERENCES scatter_players(id),
  lane        INTEGER NOT NULL,       -- 0 DEF, 1 STR, 2 INT (the order in public/engine/lanes.js)
  q           INTEGER NOT NULL,       -- the question's place in that lane's list in src/questions.js
  opts        TEXT NOT NULL,          -- JSON: the order the options were shown in, as places in the question's list (0 is the right one)
  sent_at     INTEGER NOT NULL,
  answered_at INTEGER,                -- null until answered
  pick        INTEGER,                -- the option picked, as its place in what was shown; null for time's up or too late
  late        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS scatter_deals_player ON scatter_deals (player_id, lane);
