# E3 Transactions — Strict-Match Cluster Report

## Files touched

| File | Changes |
|------|---------|
| `src/components/chat/bill-card-bubble.tsx` | p-3→p-4, amount color #1C1C1E→#3A5CCC, title font 15px bold, category badge text-secondary, "Đã sửa" pill→inline text |
| `src/components/chat/bill-confirm-sheet.tsx` | Add "Bill mở" toggle (AC-E3-1.7/1.8), fix isValid logic for open bill, fix CTA h-12/rounded-xl→h-[54px]/rounded-[14px], font 15→17px |
| `src/components/chat/split-sheet.tsx` | Rewrite: remove 3rd "percent" mode (2 modes only per PRD), add search filter (AC-E3-2.11), fix canConfirm for equal mode, add auto-switch logic (AC-E3-2.8), fix CTA to Button.lg spec, fix sheet shadow to tokens.shadow.sheet |
| `src/components/chat/add-people-sheet.tsx` | rounded-t-2xl→rounded-t-[20px], drag handle w-10/[#C7C7CC]→w-9/[#D1D1D6], shadow updated |
| `src/components/chat/open-bill-card.tsx` | rounded-2xl→rounded-[14px], p-3→p-4, check-in button h-[54px]/rounded-[14px]/text-[17px], "Đã check-in" div same height |
| `src/app/(app)/bills/new/page.tsx` | All rounded-2xl→rounded-[14px], submit button h-[54px]/rounded-[14px]/text-[17px]/font-semibold |

## Gaps fixed (per US-E3-1 → US-E3-9)

### US-E3-1 (Create Bill Sheet)
- [x] AC-E3-1.7: "Bill mở" toggle added — ON hides "Chia cho", shows "Số người ước tính" input
- [x] AC-E3-1.8: billType="open" submitted when toggle ON
- [x] AC-E3-1.4: isValid now respects open-bill mode (no splits required when ON)
- [x] CTA button matches Button.lg spec: h-[54px] rounded-[14px] text-[17px] semibold

### US-E3-2 (Split Sheet)
- [x] AC-E3-2.7: Only 2 modes shown (percent mode removed)
- [x] AC-E3-2.8: Auto-switch equal→custom when user edits any amount input
- [x] AC-E3-2.11: Search filter with Vietnamese diacritic normalization
- [x] AC-E3-2.9: Overage shown in red (#FF3B30), underage in orange (#FF9500)
- [x] canConfirm fixed: equal mode always valid when ≥1 selected (splits balanced by math)
- [x] CTA matches Button.lg spec; sheet shadow matches tokens.shadow.sheet
- [x] Default: all members selected (Case A per case matrix)
- [x] Payer label "· người trả" shown inline

### US-E3-4 (Bill Card)
- [x] AC-E3-4.2: Category badge now shows emoji + label (not just emoji)
- [x] AC-E3-4.3: "Đã sửa" is now inline quiet text `text-[11px] text-[#8E8E93]`, no pill/bg
- [x] Card padding p-3→p-4 (Card anatomy: padding 16)
- [x] Amount color → #3A5CCC (17px bold primary)
- [x] Title font → 15px bold #1C1C1E

### US-E3-5 (Open Bill Card)
- [x] Card radius rounded-[14px], padding p-4
- [x] Check-in button h-[54px] rounded-[14px] text-[17px]
- [x] "Đã check-in" state consistent height with button

### Sheet pattern (all sheets)
- [x] add-people-sheet: rounded-t-[20px], drag handle 36x4 #D1D1D6
- [x] All sheets use shadow-[0_-8px_24px_rgba(0,0,0,0.12)] (tokens.shadow.sheet)
- [x] Backdrop bg-black/40 was already correct

## Gaps NOT fixed (require lead)

### Pen frame fixes
- **US-E3-4 Bill Details Sheet** — full-info half-sheet (tap card → details) not implemented. Only inline card exists. Needs new component with participant rows + status badges per spec.
- **US-E3-2 Case C/D** — Guest section and anonymous people count ("Số người chia" input) not in split-sheet. Only group members shown.
- **US-E3-2 Case G validation** — `canConfirm` already gates on `selected.size > 0` but no toast feedback when 0 selected.
- **US-E3-4 AC-E3-4.6** — Status indicator ("Bạn nợ X" / "họ nợ X") not on bill card. Requires debt data prop — not yet wired.
- **US-E3-1 AC-E3-1.5** — Người trả is locked to currentMember (`useState` fixed). Picker for changing payer not implemented.
- **US-E3-3 AI Follow-up Card** — AC-E3-3.4: 3 options shown (correct). But "Bill mở" as 3rd option in follow-up is not wired to set isOpenBill=true when opening BillConfirmSheet.
- **US-E3-6** — in `/transfer/**` (E4 ownership, not touched).

### Shared UI changes needed
- `bills/[id]/page.tsx` — Uses shadcn `Card`/`Badge`/`Separator` (from `src/components/ui/`). Cannot align radius/padding without touching ui/ primitives. Bill details page needs redesign as half-sheet component, not standalone page.
- `bills/page.tsx` — Uses shadcn `Card`/`Button`/`Badge`. Outer button links to `/bills/new` (standalone page) rather than opening inline sheet. Architecture conflict — standalone page vs sheet flow.

## Build status

`npm run build` — PASS (clean, no type errors)

## Unresolved questions

1. **Bill details** — should it be a half-sheet in group context or standalone `/bills/[id]` page? Current standalone page uses shadcn Card and can't match sheet spec without touching ui/.
2. **US-E3-4 debt status** — `BillCardBubble` needs debts passed in to show "Bạn nợ X" — is this plumbed from groups/[id]/page.tsx or loaded per-card?
3. **US-E3-2 Case C/D** — guest + anonymous split: should this be an extension of SplitSheet or a separate sheet layer?
4. **Split-sheet canConfirm equal mode** — when totalAmount=0 (not yet entered), equal splits all equal 0 and remaining=0, so confirm is allowed. Should it be blocked when amount=0?
