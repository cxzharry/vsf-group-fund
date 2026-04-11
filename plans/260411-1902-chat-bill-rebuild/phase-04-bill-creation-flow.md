# Phase 4: Bill Creation Flow (Screen E)

## Priority: P1 | Status: pending | Effort: 5h
## Depends on: Phase 2, Phase 3

Half-screen bottom sheet for confirming/editing parsed bill before creation.

## Context
- [Screen E] Bottom sheet slides up over chat
- Shows parsed info from AI, all fields editable
- Replaces current `/bills/new` page for the chat flow
- Current `bills/new/page.tsx` (388 lines) has all bill creation logic — reuse business logic

## Requirements

### Trigger
- User taps "Tạo bill" on AI response card (Screen B)
- User selects option that resolves to enough info (Screen D)
- User taps 🧾 button in chat input bar (opens with empty form)

### Bottom Sheet Content (Screen E)
- **Header**: "Xác nhận bill" + close (X) button
- **Fields** (all inline-editable, tap to change):
  - Tên: description text
  - Tổng tiền: amount (VND formatted)
  - Chia: split type chip (Đều / Tuỳ chỉnh / Bill mở)
  - Mỗi người: per-person amount (auto-calculated)
  - Người trả: payer selector (defaults to current user)
  - Người tham gia: member chips (add/remove)
- **Photo upload**: optional, tap to add bill photo (camera/gallery)
- **CTA**: "Tạo bill" orange button, full width

### Bill Creation Logic
- Reuse from existing `bills/new/page.tsx`:
  - Equal split calculation with integer rounding
  - Custom split validation (total must match)
  - Debt record creation (participants minus payer)
  - Telegram notification fire-and-forget
- **New**: insert `chat_message` of type `bill_card` into group chat
- **New**: if bill_type = 'open', don't create debts yet (wait for close)

### Standard vs Open Bill
- **Standard**: participants known → create bill + participants + debts immediately
- **Open**: participants TBD → create bill with `bill_type='open'`, `status='active'`, no debts yet. Debts created on "Đóng bill"

## Architecture / File Structure

```
src/components/chat/
  bill-confirm-sheet.tsx    — bottom sheet with editable fields
  bill-confirm-form.tsx     — form fields (extracted for <200 lines)
  member-selector.tsx       — member chip selector for participants

src/lib/
  bill-actions.ts           — extracted bill creation logic (insert bill + participants + debts)
```

## Related Code Files
- **Create**: `src/components/chat/bill-confirm-sheet.tsx`
- **Create**: `src/components/chat/bill-confirm-form.tsx`
- **Create**: `src/components/chat/member-selector.tsx`
- **Create**: `src/lib/bill-actions.ts` — extract from `bills/new/page.tsx`
- **Modify**: `src/app/(app)/bills/new/page.tsx` — refactor to use `bill-actions.ts`
- **Uses**: `src/components/ui/sheet.tsx` (shadcn Sheet component exists)

## Implementation Steps
1. Extract bill creation logic from `bills/new/page.tsx` into `src/lib/bill-actions.ts`
2. Refactor `bills/new/page.tsx` to use extracted logic (keep as fallback)
3. Build `member-selector.tsx` — chip UI, add/remove members
4. Build `bill-confirm-form.tsx` — inline-editable fields
5. Build `bill-confirm-sheet.tsx` — Sheet wrapper, receive AI-parsed data as props
6. Wire "Tạo bill" button on AI card → open sheet with pre-filled data
7. Wire 🧾 button → open sheet with empty form
8. On submit: call `bill-actions.ts`, insert chat_message, close sheet
9. Handle open bill type: skip debt creation, set bill_type='open'

## Success Criteria
- [ ] Bottom sheet opens with AI-parsed data pre-filled
- [ ] All fields editable inline
- [ ] Standard bill creates bill + participants + debts
- [ ] Open bill creates bill without debts
- [ ] Bill card appears in chat after creation
- [ ] Photo upload works (Supabase Storage)
- [ ] Telegram notification sent

## Risk
- Sheet might not cover half screen on all devices — test Sheet component heights
- Photo upload needs Supabase Storage bucket setup (may not exist yet)
