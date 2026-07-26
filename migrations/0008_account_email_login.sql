UPDATE accounts
SET email = lower(trim(email))
WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_unique_idx
ON accounts(email COLLATE NOCASE)
WHERE email IS NOT NULL;
