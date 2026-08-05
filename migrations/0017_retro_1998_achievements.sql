CREATE TABLE IF NOT EXISTS retro_1998_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  seed INTEGER NOT NULL,
  won INTEGER NOT NULL DEFAULT 0 CHECK (won IN (0, 1)),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  UNIQUE (account_id, team_name, seed)
);

CREATE INDEX IF NOT EXISTS idx_retro_1998_attempts_account_team
  ON retro_1998_attempts (account_id, team_name, started_at);
