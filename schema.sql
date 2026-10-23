-- TriviaMoba database (Cloudflare D1: the moba-beat database). It shares SCATTER.EXE's tables (scatter_players,
-- scatter_rate_limits, the scatter_ledger chain) and adds its own, all named scatter_... The first four tables are
-- SCATTER.EXE's, copied here as they are on the live database; migrations/001_crowd.sql adds TriviaMoba's.
--   npx wrangler d1 execute moba-beat --remote --file=migrations/001_crowd.sql

-- (SCATTER.EXE) A player is a browser cookie. The cookie holds a random token; only its SHA-256 hash is stored.
CREATE TABLE IF NOT EXISTS scatter_players (
  id          INTEGER PRIMARY KEY,
  token_hash  TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,       -- unix seconds
  seen_at     INTEGER NOT NULL
);

-- (SCATTER.EXE) New players, counted per hashed IP and hour.
CREATE TABLE IF NOT EXISTS scatter_rate_limits (
  key           TEXT NOT NULL,
  window_start  INTEGER NOT NULL,
  count         INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);

-- (SCATTER.EXE) Its 8-answer sheets. TriviaMoba doesn't use this table.
CREATE TABLE IF NOT EXISTS scatter_sheets (
  id          INTEGER PRIMARY KEY,
  player_id   INTEGER NOT NULL REFERENCES scatter_players(id),
  day         TEXT NOT NULL,
  started_at  INTEGER NOT NULL,
  answers     TEXT,
  sealed_at   INTEGER,
  UNIQUE (player_id, day)
);

-- (SCATTER.EXE) One SHA-256 hash chain for both games. SCATTER.EXE writes kinds day and sheet; TriviaMoba writes
-- crowd (the day's prompts and frozen counts) and write (a player's two answers), with sheet_id holding the write's id.
CREATE TABLE IF NOT EXISTS scatter_ledger (
  id          INTEGER PRIMARY KEY,
  kind        TEXT NOT NULL,
  day         TEXT NOT NULL,
  sheet_id    INTEGER,
  record      TEXT NOT NULL,
  prev_hash   TEXT NOT NULL UNIQUE,
  hash        TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS scatter_ledger_one_sheet ON scatter_ledger (sheet_id) WHERE kind = 'sheet';
CREATE UNIQUE INDEX IF NOT EXISTS scatter_ledger_one_day ON scatter_ledger (day) WHERE kind = 'day';

-- ---------- TriviaMoba (migrations/001_crowd.sql) ----------

-- One crowd entry per day, one ledger entry per write.
CREATE UNIQUE INDEX IF NOT EXISTS scatter_ledger_one_crowd ON scatter_ledger (day) WHERE kind = 'crowd';
CREATE UNIQUE INDEX IF NOT EXISTS scatter_ledger_one_write ON scatter_ledger (sheet_id) WHERE kind = 'write';

-- A player's two answers for the day's two write prompts, sealed on the ledger in the same D1 batch.
CREATE TABLE IF NOT EXISTS scatter_writes (
  id          INTEGER PRIMARY KEY,
  player_id   INTEGER NOT NULL REFERENCES scatter_players(id),
  day         TEXT NOT NULL,          -- "2027-01-01" (UTC)
  answers     TEXT NOT NULL,          -- JSON [{ prompt, a }] ("" for a blank)
  sealed_at   INTEGER NOT NULL,
  UNIQUE (player_id, day)
);

-- Players' answers, counted per prompt and answer key (public/engine/crowd.js key). Counts only, never who.
-- The starting counts (ProtoQA) live in crowd.js, not here.
CREATE TABLE IF NOT EXISTS scatter_counts (
  prompt      INTEGER NOT NULL,
  k           TEXT NOT NULL,
  text        TEXT NOT NULL,          -- how the first player wrote it
  n           INTEGER NOT NULL,
  PRIMARY KEY (prompt, k)
);

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
