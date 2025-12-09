-- HiveAI Initial Schema
-- Run via Supabase Dashboard SQL Editor or `supabase db push`

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_tag TEXT NOT NULL UNIQUE,
  description TEXT,
  reward_pool NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Participants (users who joined a campaign)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,           -- X user ID
  username TEXT NOT NULL,          -- X handle
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  msp NUMERIC DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Post events (tracked tweets)
CREATE TABLE IF NOT EXISTS post_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tweet_id TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  quotes INTEGER DEFAULT 0,
  msp NUMERIC DEFAULT 0,
  posted_at TIMESTAMPTZ NOT NULL,
  tracked_at TIMESTAMPTZ DEFAULT now()
);

-- Tracking state (checkpoint per campaign)
CREATE TABLE IF NOT EXISTS tracking_state (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  last_tweet_id TEXT,
  last_run_at TIMESTAMPTZ,
  total_posts_tracked INTEGER DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_participants_campaign ON participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_participants_msp ON participants(campaign_id, msp DESC);
CREATE INDEX IF NOT EXISTS idx_post_events_campaign ON post_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_post_events_user ON post_events(user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS participants_updated_at ON participants;
CREATE TRIGGER participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies (enable after testing)
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tracking_state ENABLE ROW LEVEL SECURITY;
