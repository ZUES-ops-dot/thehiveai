-- Add atomic increment function for participant stats
-- This prevents race conditions when multiple posts are tracked simultaneously

CREATE OR REPLACE FUNCTION increment_participant_stats(
  p_campaign_id UUID,
  p_user_id TEXT,
  p_msp_delta INTEGER,
  p_post_count_delta INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE participants
  SET 
    msp = COALESCE(msp, 0) + p_msp_delta,
    post_count = COALESCE(post_count, 0) + p_post_count_delta,
    updated_at = NOW()
  WHERE campaign_id = p_campaign_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add batch rank recalculation function
-- More efficient than updating ranks one by one

CREATE OR REPLACE FUNCTION recalculate_campaign_ranks(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY msp DESC) as new_rank
    FROM participants
    WHERE campaign_id = p_campaign_id
  )
  UPDATE participants p
  SET rank = r.new_rank, updated_at = NOW()
  FROM ranked r
  WHERE p.id = r.id;
END;
$$ LANGUAGE plpgsql;

-- Add index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_participants_campaign_msp 
ON participants(campaign_id, msp DESC);

-- Add index for tracking state lookups
CREATE INDEX IF NOT EXISTS idx_tracking_state_campaign 
ON tracking_state(campaign_id);

-- Add index for post events by campaign and user
CREATE INDEX IF NOT EXISTS idx_post_events_campaign_user 
ON post_events(campaign_id, user_id);
