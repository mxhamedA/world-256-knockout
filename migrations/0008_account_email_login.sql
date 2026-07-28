UPDATE accounts
SET email = CASE
  WHEN trim(email) = '' THEN NULL
  ELSE lower(trim(email))
END
WHERE email IS NOT NULL;

WITH ranked_emails AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email COLLATE NOCASE
      ORDER BY created_at ASC, id ASC
    ) AS duplicate_rank
  FROM accounts
  WHERE email IS NOT NULL
)
UPDATE accounts
SET email = NULL,
  email_verified_at = NULL
WHERE id IN (
  SELECT id
  FROM ranked_emails
  WHERE duplicate_rank > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_unique_idx
ON accounts(email COLLATE NOCASE)
WHERE email IS NOT NULL;
