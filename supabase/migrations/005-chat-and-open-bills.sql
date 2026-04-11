-- Migration 005: Chat messages + Open bill support
-- Adds group chat, open bill check-ins, and bill type/status columns

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  sender_id uuid references public.members(id) on delete set null,
  message_type text not null default 'text'
    check (message_type in ('text', 'bill_card', 'transfer_card', 'ai_response', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now() not null
);

-- Bill check-ins for open bills
create table if not exists public.bill_checkins (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references public.bills(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade,
  guest_name text,
  added_by uuid references public.members(id) not null,
  checked_in_at timestamptz default now() not null,
  -- Enforce: either member_id or guest_name must be provided
  check (member_id is not null or guest_name is not null)
);

-- Unique constraint only for non-null member_id (guests can have duplicates by name)
create unique index if not exists idx_bill_checkins_unique_member
  on public.bill_checkins (bill_id, member_id)
  where member_id is not null;

-- Alter bills table for open bill support
alter table public.bills add column if not exists bill_type text not null default 'standard'
  check (bill_type in ('standard', 'open'));
alter table public.bills add column if not exists status text not null default 'active'
  check (status in ('active', 'closed'));
alter table public.bills add column if not exists chat_message_id uuid references public.chat_messages(id);
alter table public.bills add column if not exists photo_url text;

-- Indexes
create index if not exists idx_chat_messages_group_created
  on public.chat_messages (group_id, created_at desc);
create index if not exists idx_bill_checkins_bill
  on public.bill_checkins (bill_id);

-- RLS: chat_messages
alter table public.chat_messages enable row level security;

create policy "Chat messages viewable by group members"
  on public.chat_messages for select to authenticated
  using (
    group_id in (
      select gm.group_id from public.group_members gm
      where gm.member_id in (select id from public.members where user_id = auth.uid())
    )
  );

create policy "Chat messages insertable by group members"
  on public.chat_messages for insert to authenticated
  with check (
    group_id in (
      select gm.group_id from public.group_members gm
      where gm.member_id in (select id from public.members where user_id = auth.uid())
    )
  );

-- RLS: bill_checkins
alter table public.bill_checkins enable row level security;

create policy "Bill checkins viewable by authenticated"
  on public.bill_checkins for select to authenticated
  using (true);

create policy "Bill checkins insertable by group members"
  on public.bill_checkins for insert to authenticated
  with check (
    bill_id in (
      select b.id from public.bills b
      where b.group_id in (
        select gm.group_id from public.group_members gm
        where gm.member_id in (select id from public.members where user_id = auth.uid())
      )
    )
  );

create policy "Bill checkins deletable by bill creator"
  on public.bill_checkins for delete to authenticated
  using (
    bill_id in (
      select b.id from public.bills b
      where b.created_by in (select id from public.members where user_id = auth.uid())
    )
  );
