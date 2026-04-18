-- US-E3-2 Case C (Guest) + Case D (Anonymous) participants
-- Allow bill_participants to hold non-member entries

alter table bill_participants
  add column if not exists guest_name text,
  add column if not exists is_anonymous boolean not null default false;

-- Drop NOT NULL on member_id to allow guest/anon rows
alter table bill_participants
  alter column member_id drop not null;

-- Enforce: every row must identify as member, named guest, or anonymous
alter table bill_participants
  add constraint bill_participants_identity_check check (
    member_id is not null
    or guest_name is not null
    or is_anonymous = true
  );
