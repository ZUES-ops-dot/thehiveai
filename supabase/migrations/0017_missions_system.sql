-- Missions System Tables
-- Tracks user mission progress and streaks

-- User Missions table - tracks progress on each mission per user per period
CREATE TABLE IF NOT EXISTS user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed')),
  period_start TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  msp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one mission record per user per mission per period
  UNIQUE (user_id, mission_id, period_start)
);

-- User Streaks table - tracks login streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_status ON user_missions(status);
CREATE INDEX IF NOT EXISTS idx_user_missions_period ON user_missions(period_start);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_period ON user_missions(user_id, period_start);

-- Enable RLS
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - allow service role full access
CREATE POLICY "Service role can manage user_missions" ON user_missions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage user_streaks" ON user_streaks
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to service role
GRANT ALL ON user_missions TO service_role;
GRANT ALL ON user_streaks TO service_role;

-- Comment on tables
COMMENT ON TABLE user_missions IS 'Tracks user progress on missions (daily, weekly, monthly, special)';
COMMENT ON TABLE user_streaks IS 'Tracks user login streaks for streak-based missions';
