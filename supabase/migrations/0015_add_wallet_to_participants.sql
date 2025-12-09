alter table if exists participants
  add column if not exists wallet_address text;

create index if not exists idx_participants_wallet
  on participants (campaign_id, wallet_address)
  where wallet_address is not null;
