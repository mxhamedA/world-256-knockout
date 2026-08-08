ALTER TABLE account_deletion_requests ADD COLUMN notification_sent_at INTEGER;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  use_marker TEXT
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_account_idx
  ON password_reset_tokens (account_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS password_reset_tokens_expiry_idx
  ON password_reset_tokens (expires_at, used_at);
