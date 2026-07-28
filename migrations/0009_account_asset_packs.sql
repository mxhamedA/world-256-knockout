CREATE TABLE IF NOT EXISTS account_asset_packs (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  installed_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, pack_id)
);

CREATE INDEX IF NOT EXISTS account_asset_packs_pack_idx
ON account_asset_packs(pack_id, installed_at);
