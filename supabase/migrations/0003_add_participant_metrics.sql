-- Add richer creator metrics to participants
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS followers_count BIGINT DEFAULT 0;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS engagement_rate DOUBLE PRECISION DEFAULT 0;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS virality_score DOUBLE PRECISION DEFAULT 0;
