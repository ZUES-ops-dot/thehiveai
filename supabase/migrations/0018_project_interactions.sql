-- Project Lens interaction tracking
-- Records when a user views a project for 30+ seconds

CREATE TABLE IF NOT EXISTS project_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('play-solana', 'indie-fun', 'moddio')),
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_interactions_user ON project_interactions(user_id);
CREATE INDEX idx_project_interactions_created ON project_interactions(created_at DESC);
CREATE INDEX idx_project_interactions_user_date ON project_interactions(user_id, created_at);
