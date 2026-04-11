-- Groups table
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.members(id) not null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now() not null
);

-- Group members (many-to-many)
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now() not null,
  unique(group_id, member_id)
);

-- Add group_id to bills
alter table public.bills add column group_id uuid references public.groups(id);

-- Indexes
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_member on public.group_members(member_id);
create index idx_bills_group on public.bills(group_id);

-- RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "Groups viewable by members" on public.groups for select to authenticated
  using (id in (select group_id from public.group_members where member_id in (select id from public.members where user_id = auth.uid())));

create policy "Groups creatable" on public.groups for insert to authenticated with check (true);

create policy "Groups updatable by admin" on public.groups for update to authenticated
  using (id in (select group_id from public.group_members where member_id in (select id from public.members where user_id = auth.uid()) and role = 'admin'));

create policy "Group members viewable" on public.group_members for select to authenticated using (true);
create policy "Group members insertable" on public.group_members for insert to authenticated with check (true);
create policy "Group members deletable by admin" on public.group_members for delete to authenticated
  using (group_id in (select group_id from public.group_members where member_id in (select id from public.members where user_id = auth.uid()) and role = 'admin'));
