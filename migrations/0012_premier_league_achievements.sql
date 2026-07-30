CREATE TABLE IF NOT EXISTS premier_league_attempts (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  season_seed INTEGER NOT NULL,
  club_id TEXT NOT NULL,
  final_position INTEGER CHECK (final_position BETWEEN 1 AND 20),
  achieved INTEGER NOT NULL DEFAULT 0 CHECK (achieved IN (0, 1)),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (account_id, season_seed, club_id)
);

CREATE INDEX IF NOT EXISTS idx_premier_league_attempts_account_club
  ON premier_league_attempts (account_id, club_id, started_at);
