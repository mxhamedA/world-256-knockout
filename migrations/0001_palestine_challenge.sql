CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  email TEXT,
  email_verified_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  user_agent_hash TEXT
);
CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id, expires_at);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  prize_json TEXT NOT NULL,
  locked_team_id TEXT NOT NULL CHECK (locked_team_id = 'team-131'),
  upset_mode TEXT NOT NULL CHECK (upset_mode = 'balanced'),
  goal_level TEXT NOT NULL CHECK (goal_level = 'normal'),
  created_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO challenges (
  id, title, description, starts_at, ends_at, prize_json,
  locked_team_id, upset_mode, goal_level, created_at
) VALUES (
  'palestine-2026-01',
  'Palestine Challenge',
  'Lead Palestine to World Cup glory before time runs out.',
  1784674800000,
  1788217199000,
  '[{"place":1,"label":"1st Place","prize":"Prize details announced soon"},{"place":2,"label":"2nd Place","prize":"Prize details announced soon"},{"place":3,"label":"3rd Place","prize":"Prize details announced soon"}]',
  'team-131', 'balanced', 'normal', 1784674800000
);

CREATE TABLE IF NOT EXISTS challenge_runs (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  state_json TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  goals INTEGER NOT NULL DEFAULT 0,
  furthest_round TEXT NOT NULL DEFAULT 'Round of 256',
  tournament_won INTEGER NOT NULL DEFAULT 0,
  semi_final INTEGER NOT NULL DEFAULT 0,
  strongest_opponent TEXT,
  strongest_opponent_rank INTEGER,
  counted INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  next_action_at INTEGER NOT NULL,
  completed_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_challenge_run ON challenge_runs(account_id, challenge_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS challenge_runs_account_idx ON challenge_runs(account_id, challenge_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS challenge_runs_score_idx ON challenge_runs(challenge_id, counted, score DESC);

CREATE TABLE IF NOT EXISTS challenge_run_matches (
  run_id TEXT NOT NULL REFERENCES challenge_runs(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL,
  result_json TEXT NOT NULL,
  score_awarded INTEGER NOT NULL,
  played_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, round_index)
);

CREATE TABLE IF NOT EXISTS challenge_commands (
  account_id TEXT NOT NULL REFERENCES accounts(id),
  command_id TEXT NOT NULL,
  action TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, command_id)
);

CREATE TABLE IF NOT EXISTS challenge_leaderboard (
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  total_score INTEGER NOT NULL,
  best_run INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  tournament_wins INTEGER NOT NULL,
  semi_finals INTEGER NOT NULL,
  goals INTEGER NOT NULL,
  strongest_opponent TEXT,
  strongest_opponent_rank INTEGER,
  latest_completion INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (challenge_id, account_id)
);
CREATE INDEX IF NOT EXISTS challenge_leaderboard_rank_idx ON challenge_leaderboard(challenge_id, total_score DESC, best_run DESC, latest_completion ASC);
