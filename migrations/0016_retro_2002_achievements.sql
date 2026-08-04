CREATE TABLE IF NOT EXISTS retro_2002_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  seed INTEGER NOT NULL,
  won INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  UNIQUE (account_id, team_name, seed)
);

CREATE INDEX IF NOT EXISTS idx_retro_2002_attempts_account_team
  ON retro_2002_attempts (account_id, team_name, started_at);
