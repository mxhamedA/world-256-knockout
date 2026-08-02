CREATE TABLE IF NOT EXISTS ucl_attempts (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  season_seed INTEGER NOT NULL,
  club_id TEXT NOT NULL,
  best_stage_index INTEGER NOT NULL DEFAULT -1 CHECK (best_stage_index BETWEEN -1 AND 5),
  achieved INTEGER NOT NULL DEFAULT 0 CHECK (achieved IN (0, 1)),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (account_id, season_seed, club_id)
);

CREATE INDEX IF NOT EXISTS idx_ucl_attempts_account_club
  ON ucl_attempts (account_id, club_id, started_at);
