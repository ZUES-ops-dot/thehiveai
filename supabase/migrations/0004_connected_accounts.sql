-- Connected Accounts table
-- Stores X accounts linked to a primary user for tracking/filtering
-- Each user can have up to 3 active connected accounts

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Primary user identifier (the X user ID of the logged-in user)
  owner_user_id TEXT NOT NULL,
  -- The connected X account details
  x_user_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  followers_count BIGINT DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure same account can't be connected twice by same owner
  UNIQUE(owner_user_id, x_user_id)
);

-- Index for fast lookups by owner
CREATE INDEX IF NOT EXISTS idx_connected_accounts_owner 
ON connected_accounts(owner_user_id);

-- Index for filtering by x_user_id (used in tracking queries)
CREATE INDEX IF NOT EXISTS idx_connected_accounts_x_user 
ON connected_accounts(x_user_id);

-- Index for active accounts only
CREATE INDEX IF NOT EXISTS idx_connected_accounts_active 
ON connected_accounts(owner_user_id, active) WHERE active = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to enforce max 3 active accounts per user
CREATE OR REPLACE FUNCTION check_max_connected_accounts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active = true THEN
    IF (
      SELECT COUNT(*) FROM connected_accounts 
      WHERE owner_user_id = NEW.owner_user_id 
      AND active = true 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) >= 3 THEN
      RAISE EXCEPTION 'Maximum of 3 active connected accounts allowed per user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce limit
DROP TRIGGER IF EXISTS enforce_max_connected_accounts ON connected_accounts;
CREATE TRIGGER enforce_max_connected_accounts
  BEFORE INSERT OR UPDATE ON connected_accounts
  FOR EACH ROW EXECUTE FUNCTION check_max_connected_accounts();

-- Helper function to get all active connected account IDs for a user
CREATE OR REPLACE FUNCTION get_connected_account_ids(p_owner_user_id TEXT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT x_user_id FROM connected_accounts 
    WHERE owner_user_id = p_owner_user_id AND active = true
  );
END;
$$ LANGUAGE plpgsql;
