CREATE TABLE IF NOT EXISTS retro_2006_attempts (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tournament_seed INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  won INTEGER NOT NULL DEFAULT 0 CHECK (won IN (0, 1)),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (account_id, tournament_seed, team_name)
);

CREATE INDEX IF NOT EXISTS idx_retro_2006_attempts_account_team
  ON retro_2006_attempts (account_id, team_name, started_at);
