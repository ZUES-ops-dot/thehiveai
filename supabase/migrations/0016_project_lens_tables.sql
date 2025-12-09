-- Project Lens integration tables

-- Automation logs for Moddio and Indie.fun agent runs
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('indie_fun', 'moddio', 'play_solana')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  result JSONB,
  run_by TEXT,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_automation_logs_platform ON automation_logs(platform);
CREATE INDEX idx_automation_logs_run_at ON automation_logs(run_at DESC);

-- Workspace bookmarks for saved devlogs/projects
CREATE TABLE IF NOT EXISTS workspace_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspace_bookmarks_user ON workspace_bookmarks(user_id);
CREATE INDEX idx_workspace_bookmarks_source ON workspace_bookmarks(source);

-- Integration cache for API responses
CREATE TABLE IF NOT EXISTS integration_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_integration_cache_expires ON integration_cache(expires_at);
