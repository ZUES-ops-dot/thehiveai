-- Track the first time a user joins each campaign
CREATE TABLE IF NOT EXISTS user_campaign_history (
  user_id TEXT NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  first_joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_user_campaign_history_user_date
  ON user_campaign_history (user_id, first_joined_at DESC);

ALTER TABLE user_campaign_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage user_campaign_history"
  ON user_campaign_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON user_campaign_history TO service_role;

COMMENT ON TABLE user_campaign_history IS 'Tracks the first time each user joins a campaign.';
