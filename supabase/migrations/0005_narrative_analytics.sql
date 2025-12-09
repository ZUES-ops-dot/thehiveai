-- Narrative analytics tables

CREATE TABLE IF NOT EXISTS narrative_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  keywords JSONB DEFAULT '[]'::jsonb,
  top_accounts JSONB DEFAULT '[]'::jsonb,
  sponsor_pool JSONB DEFAULT '[]'::jsonb,
  insight_notes TEXT,
  last_synced TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS narrative_analytics_campaign_idx
  ON narrative_analytics(campaign_id);

CREATE INDEX IF NOT EXISTS narrative_analytics_last_synced_idx
  ON narrative_analytics(last_synced DESC);

CREATE TABLE IF NOT EXISTS narrative_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  amount NUMERIC(20, 4) DEFAULT 0,
  logo_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS narrative_sponsors_campaign_idx
  ON narrative_sponsors(campaign_id);

-- Trigger hooks for updated_at
DROP TRIGGER IF EXISTS narrative_analytics_updated_at ON narrative_analytics;
CREATE TRIGGER narrative_analytics_updated_at
  BEFORE UPDATE ON narrative_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS narrative_sponsors_updated_at ON narrative_sponsors;
CREATE TRIGGER narrative_sponsors_updated_at
  BEFORE UPDATE ON narrative_sponsors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
