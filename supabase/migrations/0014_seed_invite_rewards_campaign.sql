-- Seed a long-lived campaign used for invite bonus MSP tracking
INSERT INTO campaigns (
  id,
  name,
  project_tag,
  description,
  reward_pool,
  start_date,
  end_date,
  status
)
VALUES (
  '00000000-0000-0000-0000-00000000cafe',
  'Invite Rewards',
  'invite_rewards',
  'Synthetic campaign used to aggregate referral MSP bonuses.',
  0,
  NOW(),
  NOW() + INTERVAL '10 years',
  'active'
)
ON CONFLICT (project_tag) DO NOTHING;
