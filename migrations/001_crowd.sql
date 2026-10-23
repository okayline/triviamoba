-- TriviaMoba's tables in the moba-beat database (next to SCATTER.EXE's, which it shares). Run before the push that needs them:
--   npx wrangler d1 execute moba-beat --remote --file=migrations/001_crowd.sql

CREATE UNIQUE INDEX IF NOT EXISTS scatter_ledger_one_crowd ON scatter_ledger (day) WHERE kind = 'crowd';
CREATE UNIQUE INDEX IF NOT EXISTS scatter_ledger_one_write ON scatter_ledger (sheet_id) WHERE kind = 'write';

CREATE TABLE IF NOT EXISTS scatter_writes (
  id          INTEGER PRIMARY KEY,
  player_id   INTEGER NOT NULL REFERENCES scatter_players(id),
  day         TEXT NOT NULL,
  answers     TEXT NOT NULL,
  sealed_at   INTEGER NOT NULL,
  UNIQUE (player_id, day)
);

CREATE TABLE IF NOT EXISTS scatter_counts (
  prompt      INTEGER NOT NULL,
  k           TEXT NOT NULL,
  text        TEXT NOT NULL,
  n           INTEGER NOT NULL,
  PRIMARY KEY (prompt, k)
);
