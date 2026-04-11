# Phase 1: Database Migration

## Priority: P1 | Status: pending | Effort: 2h

All other phases depend on this. New tables + alterations to support chat, open bills, guests.

## Context
- Existing schema: `members`, `bills`, `bill_participants`, `debts`, `payment_confirmations`, `groups`, `group_members`
- Migrations in `supabase/migrations/` (currently 001-004)

## New Migration: `005-chat-and-open-bills.sql`

### New Tables

**`chat_messages`** — group chat history
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| group_id | uuid FK groups | |
| sender_id | uuid FK members | nullable for system messages |
| message_type | text | `'text' \| 'bill_card' \| 'transfer_card' \| 'ai_response' \| 'system'` |
| content | text | chat text or JSON payload for cards |
| metadata | jsonb | AI parse result, bill_id ref, etc |
| created_at | timestamptz | |

**`bill_checkins`** — open bill check-ins
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| bill_id | uuid FK bills | |
| member_id | uuid FK members | nullable (guest) |
| guest_name | text | for non-member participants |
| added_by | uuid FK members | who added this person |
| checked_in_at | timestamptz | |
| unique(bill_id, member_id) | | only when member_id not null |

### Alter Existing Tables

**`bills`** — add open bill support
| New Column | Type | Notes |
|------------|------|-------|
| bill_type | text | `'standard' \| 'open'` default `'standard'` |
| status | text | `'active' \| 'closed'` default `'active'` |
| chat_message_id | uuid FK chat_messages | nullable, links bill to chat card |
| photo_url | text | optional bill photo |

### RLS Policies
- `chat_messages`: viewable by group members, insertable by group members
- `bill_checkins`: viewable by all auth, insertable by group members, deletable by bill creator

### Indexes
- `idx_chat_messages_group_created` on `(group_id, created_at desc)`
- `idx_bill_checkins_bill` on `(bill_id)`

### Supabase Realtime
- Enable realtime on `chat_messages` and `bill_checkins` tables

## Implementation Steps
1. Create `supabase/migrations/005-chat-and-open-bills.sql`
2. Add new tables with RLS
3. Alter `bills` table
4. Add indexes
5. Enable Realtime publication
6. Update `src/lib/types.ts` with new TypeScript interfaces
7. Test migration locally with `supabase db reset`

## Success Criteria
- [ ] Migration runs clean on `supabase db reset`
- [ ] All new tables have proper RLS
- [ ] TypeScript types match schema
- [ ] Realtime enabled for chat_messages and bill_checkins

## Risk
- Altering `bills` table could affect existing queries — verify `bill_type` defaults to `'standard'` so old bills unaffected
