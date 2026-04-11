-- Members table: auto-created on first Google login
create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  display_name text not null,
  email text not null,
  avatar_url text,
  bank_name text,
  bank_account_no text,
  bank_account_name text,
  created_at timestamptz default now() not null
);

-- Bills table: one per lunch
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  total_amount integer not null, -- VND, integer only
  paid_by uuid references public.members(id) not null,
  split_type text not null default 'equal' check (split_type in ('equal', 'custom')),
  created_by uuid references public.members(id) not null,
  created_at timestamptz default now() not null
);

-- Bill participants: who ate, how much they owe
create table public.bill_participants (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references public.bills(id) on delete cascade not null,
  member_id uuid references public.members(id) not null,
  amount integer not null, -- VND owed for this bill
  unique(bill_id, member_id)
);

-- Debts: individual debt record per bill per debtor→creditor pair
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references public.bills(id) on delete cascade not null,
  debtor_id uuid references public.members(id) not null,
  creditor_id uuid references public.members(id) not null,
  amount integer not null,
  remaining integer not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'partial')),
  created_at timestamptz default now() not null,
  unique(bill_id, debtor_id)
);

-- Payment confirmations: proof of transfer
create table public.payment_confirmations (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid references public.debts(id) on delete cascade not null,
  confirmed_by text not null check (confirmed_by in ('debtor', 'creditor')),
  method text not null check (method in ('screenshot_ocr', 'manual_debtor', 'manual_creditor')),
  image_url text,
  ocr_result jsonb,
  amount_detected integer,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz default now() not null
);

-- Indexes
create index idx_bills_paid_by on public.bills(paid_by);
create index idx_bills_created_at on public.bills(created_at desc);
create index idx_debts_debtor on public.debts(debtor_id);
create index idx_debts_creditor on public.debts(creditor_id);
create index idx_debts_status on public.debts(status);

-- RLS policies
alter table public.members enable row level security;
alter table public.bills enable row level security;
alter table public.bill_participants enable row level security;
alter table public.debts enable row level security;
alter table public.payment_confirmations enable row level security;

-- All authenticated users can read all members (same team)
create policy "Members are viewable by authenticated users"
  on public.members for select to authenticated using (true);

-- Users can update their own member record
create policy "Users can update own member"
  on public.members for update to authenticated
  using (user_id = auth.uid());

-- Members auto-insert handled by trigger
create policy "Users can insert own member"
  on public.members for insert to authenticated
  with check (user_id = auth.uid());

-- Bills: all authenticated can read, create
create policy "Bills viewable by all" on public.bills for select to authenticated using (true);
create policy "Bills creatable by all" on public.bills for insert to authenticated with check (true);

-- Bill participants: all can read, creator can manage
create policy "Participants viewable" on public.bill_participants for select to authenticated using (true);
create policy "Participants insertable" on public.bill_participants for insert to authenticated with check (true);

-- Debts: all can read, involved parties can update
create policy "Debts viewable" on public.debts for select to authenticated using (true);
create policy "Debts insertable" on public.debts for insert to authenticated with check (true);
create policy "Debts updatable by involved"
  on public.debts for update to authenticated
  using (
    debtor_id in (select id from public.members where user_id = auth.uid())
    or creditor_id in (select id from public.members where user_id = auth.uid())
  );

-- Payment confirmations: involved parties only
create policy "Confirmations viewable" on public.payment_confirmations for select to authenticated using (true);
create policy "Confirmations insertable" on public.payment_confirmations for insert to authenticated with check (true);
create policy "Confirmations updatable"
  on public.payment_confirmations for update to authenticated using (true);

-- Auto-create member on first login (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.members (user_id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
