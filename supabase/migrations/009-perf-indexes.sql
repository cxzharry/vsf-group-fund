-- Migration 009: Performance indexes for group detail page load optimization
-- Addresses N+1 query patterns and missing composite indexes

-- bill_participants: queried by bill_id (batch .in() from group bills)
create index if not exists idx_bill_participants_bill_id
  on public.bill_participants (bill_id);

-- debts: queried by bill_id for bill detail sheet
create index if not exists idx_debts_bill_id
  on public.debts (bill_id);

-- debts: queried by debtor_id + status for group debt summary (composite covers both filters)
create index if not exists idx_debts_debtor_status
  on public.debts (debtor_id, status);

-- debts: queried by creditor_id + status for group debt summary
create index if not exists idx_debts_creditor_status
  on public.debts (creditor_id, status);

-- payment_confirmations: queried by debt_id + status
create index if not exists idx_payment_confirmations_debt_status
  on public.payment_confirmations (debt_id, status);

-- bills: composite for group_id ordered by created_at (covers the main bills query)
create index if not exists idx_bills_group_created
  on public.bills (group_id, created_at asc);
