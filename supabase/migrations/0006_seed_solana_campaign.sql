-- Seed initial Solana campaign and emblem sponsor

DO $$
DECLARE
  solana_campaign_id UUID;
BEGIN
  SELECT id INTO solana_campaign_id
  FROM campaigns
  WHERE project_tag = 'SOLANA';

  IF solana_campaign_id IS NULL THEN
    INSERT INTO campaigns (
      name,
      project_tag,
      description,
      reward_pool,
      start_date,
      end_date,
      status
    )
    VALUES (
      'Solana Narrative Push',
      'SOLANA',
      'Tracking validator expansion, DePIN growth, and Solana Foundation sponsorships.',
      250000,
      (NOW() - INTERVAL '3 days')::date,
      (NOW() + INTERVAL '21 days')::date,
      'active'
    )
    RETURNING id INTO solana_campaign_id;
  END IF;

  IF solana_campaign_id IS NOT NULL THEN
    INSERT INTO narrative_sponsors (
      campaign_id,
      sponsor_name,
      amount,
      logo_url,
      metadata
    )
    SELECT
      solana_campaign_id,
      'Solana Foundation',
      125000,
      'https://assets.hiveai.xyz/brands/solana-emblem.svg',
      jsonb_build_object('tier', 'primary', 'emblem', true)
    WHERE NOT EXISTS (
      SELECT 1
      FROM narrative_sponsors
      WHERE campaign_id = solana_campaign_id
        AND sponsor_name = 'Solana Foundation'
    );
  END IF;
END $$;
