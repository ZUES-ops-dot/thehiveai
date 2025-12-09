create table if not exists invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id text not null,
  inviter_username text,
  invitee_user_id text not null,
  invitee_username text,
  msp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists invite_redemptions_invitee_unique
  on invite_redemptions (invitee_user_id);
