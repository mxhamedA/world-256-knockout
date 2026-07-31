CREATE TABLE IF NOT EXISTS account_custom_teams (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  team_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, team_id)
);

CREATE INDEX IF NOT EXISTS account_custom_teams_updated_idx
ON account_custom_teams(account_id, updated_at DESC);
