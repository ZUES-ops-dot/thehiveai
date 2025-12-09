alter table invite_redemptions
  add column if not exists awarded_to_msp boolean not null default false;
