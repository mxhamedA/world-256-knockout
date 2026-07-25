CREATE TABLE IF NOT EXISTS account_deletion_requests (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('not_using', 'privacy', 'technical', 'other')),
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  requested_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status
  ON account_deletion_requests (status, requested_at);
