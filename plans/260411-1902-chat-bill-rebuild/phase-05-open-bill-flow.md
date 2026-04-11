# Phase 5: Open Bill Flow (Screens G, H)

## Priority: P2 | Status: pending | Effort: 5h
## Depends on: Phase 1, Phase 2

Open bills: participants unknown upfront, people check in, bill closed when ready.

## Context
- [Screen G] Orange bill card in chat, "Bill mở" badge, check-in list, "Tôi có ăn" button
- [Screen H] Bottom sheet to add people (group members + guests)
- Open bill lifecycle: create → people check in → creator closes → debts calculated

## Requirements

### Open Bill Card in Chat (Screen G)
- Orange card with "Bill mở" badge + "🟢 Đang mở" status
- Shows: title, total amount, estimated per-person (total ÷ checked-in)
- Member list: who checked in, who added whom
- "Checked in: 4/?" counter
- **"✋ Tôi có ăn"** button (orange) — current user checks in
- **"+ Thêm người"** link — opens add people sheet
- **"Đóng bill (chỉ người trả)"** link at bottom — only visible to bill payer
- Realtime: new check-ins update card live

### Check-in Logic
- Insert into `bill_checkins`: member_id, added_by (self or another member)
- Duplicate check: unique(bill_id, member_id) — ignore if already checked in
- Guest check-in: member_id = null, guest_name filled
- Supabase Realtime on `bill_checkins` updates the card

### Add People Sheet (Screen H)
- Search bar at top
- **Section "TRONG NHÓM"**: group members not yet checked in
  - Each row: avatar + name + "Thêm" button
  - Already checked-in members: show "✓ Đã check-in" (greyed)
- **Section "NGƯỜI NGOÀI NHÓM"**: 
  - "Thêm người lạ bằng tên" text input
  - Guest entries: name + "Người ngoài" tag + ✕ remove button
  - Guests are non-members, tracked by name only

### Close Bill Flow
- Only bill payer (paid_by) can close
- On close:
  1. Set `bills.status = 'closed'`, `bills.bill_type` stays 'open'
  2. Calculate final per-person: total ÷ check-in count (equal split)
  3. Create `bill_participants` from check-ins
  4. Create `debts` for each participant (except payer)
  5. Update chat card to show "🔴 Đã đóng" with final amounts
  6. Send Telegram notification

## Architecture / File Structure

```
src/components/chat/
  open-bill-card.tsx        — Screen G: open bill card in chat
  add-people-sheet.tsx      — Screen H: bottom sheet

src/lib/
  open-bill-actions.ts      — check-in, close bill, calculate splits
```

## Related Code Files
- **Create**: `src/components/chat/open-bill-card.tsx`
- **Create**: `src/components/chat/add-people-sheet.tsx`
- **Create**: `src/lib/open-bill-actions.ts`
- **Modify**: `src/components/chat/chat-message-list.tsx` — render open bill cards
- **Uses**: `src/components/ui/sheet.tsx`

## Implementation Steps
1. Create `open-bill-actions.ts`: checkIn(), addGuest(), closeBill()
2. Build `open-bill-card.tsx`: render card, check-in list, action buttons
3. Build `add-people-sheet.tsx`: search, group members, guest input
4. Wire Realtime subscription for `bill_checkins` → update open bill card
5. Implement close bill: calculate splits, create participants + debts
6. Update chat message on close (change card status)
7. Wire into chat-message-list rendering

## Success Criteria
- [ ] Open bill card renders in chat with correct state
- [ ] "Tôi có ăn" checks in current user, card updates live
- [ ] Add people sheet shows group members + guest input
- [ ] Guest entries persist with name + tag
- [ ] Close bill calculates correct splits and creates debts
- [ ] Card updates to "Đã đóng" after close
- [ ] Only payer sees close button

## Risk
- Race condition on simultaneous check-ins — Supabase handles with unique constraint
- Guest handling: no member_id means debt tracking is name-only (no payment tracking for guests)
