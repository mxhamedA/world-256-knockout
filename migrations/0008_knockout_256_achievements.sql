CREATE TABLE IF NOT EXISTS knockout_256_attempts (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tournament_seed INTEGER NOT NULL,
  team_id TEXT NOT NULL,
  best_round_index INTEGER NOT NULL DEFAULT 0 CHECK (best_round_index BETWEEN 0 AND 7),
  champion INTEGER NOT NULL DEFAULT 0 CHECK (champion IN (0, 1)),
  achieved INTEGER NOT NULL DEFAULT 0 CHECK (achieved IN (0, 1)),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (account_id, tournament_seed, team_id)
);

CREATE INDEX IF NOT EXISTS idx_knockout_256_attempts_account_team
  ON knockout_256_attempts (account_id, team_id, started_at);
