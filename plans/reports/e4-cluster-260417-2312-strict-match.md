# E4 Debts — Strict-Match Cluster Report

## Files touched

| File | Changes |
|---|---|
| `src/app/(app)/debts/page.tsx` | Segmented toggle colors + pill shape; chip count variant; empty states; dialog buttons; QR CTA button sizing |
| `src/app/(app)/debts/[id]/confirm/page.tsx` | Primary CTA → h-54 + rounded-14; secondary CTA → h-44 + rounded-14; removed unused Button import |
| `src/app/(app)/transfer/[debtId]/page.tsx` | Primary CTA "Đã chuyển tiền" → h-54 + rounded-14 |
| `src/lib/simplify-debts.ts` | UNTOUCHED — algorithm correct |
| `src/lib/__tests__/simplify-debts.test.ts` | UNTOUCHED — 12 tests already present |

## Gaps fixed (per US)

### US-E4-1 — Banner (group detail page — NOT in ownership)
- Banner is in `src/app/(app)/groups/[id]/page.tsx` (not owned).
- Existing: h-[56px] ✓, bg tokens match error_tint/success_tint/warning_tint ✓
- Gap: no `rounded-[14px]` on banner strip (it spans full width — by design as a strip). Read as acceptable for strip pattern; lead to decide if a floating card shape is needed instead.

### US-E4-2 — Pairwise net debt calculation
- AC-E4-2.1, AC-E4-2.2: `simplifyDebts()` pairwise netting logic is correct — UNTOUCHED.
- AC-E4-2.3: debts page totals computed from pending-only debts ✓

### US-E4-3 — 2-way payment confirmation
- AC-E4-3.1: `payment_confirmations` insert in both `debts/page.tsx` + `debts/[id]/confirm/page.tsx` ✓
- AC-E4-3.2: debt status → "confirmed" on creditor approval ✓
- AC-E4-3.3: Telegram notify both directions via `/api/notify` ✓
- AC-E4-3.4: realtime channel refreshes on debt change ✓

### US-E4-4 — Simplify Debts toggle
- **Segmented toggle bg**: Fixed `bg-[#F2F2F7]` → `bg-[#EEF2FF]` (primary_tint per tokens) ✓
- **Toggle pill shape**: Fixed `rounded-xl`/`rounded-lg` → `rounded-full`/`rounded-full` ✓
- **Chip count variant**: Fixed `bg-[#F2F2F7] text-[#8E8E93]` → `bg-[#EEF2FF] text-[#3A5CCC]` (components.md §6 count variant) ✓
- **Empty state simplified**: Replaced plain `<p>` with icon(72) + title(17px bold) + subtitle(14px gray) per components.md §11 ✓
- **Empty state detail**: Replaced plain `<p>` with same icon+title+subtitle pattern ✓
- **AC-E4-4.5**: `handleBatchConfirmPaid` / `handleBatchCreditorConfirm` — batch settle underlying debts ✓
- **AC-E4-4.6**: 12 unit tests exist in `simplify-debts.test.ts` (no runner configured → blocked)

### Button sizing
- transfer `[debtId]/page.tsx`: primary CTA → `h-[54px] rounded-[14px] text-[17px] font-semibold` ✓
- `debts/page.tsx` QR dialog CTA: same sizing applied ✓
- `debts/[id]/confirm/page.tsx` screenshot CTA: `h-[54px] rounded-[14px]` ✓
- `debts/[id]/confirm/page.tsx` manual CTA: `h-[44px] rounded-[14px]` (md size, secondary action) ✓
- Confirm dialog buttons: `rounded-[14px]` per components.md §9 dialog pattern ✓

## Gaps NOT fixed (require lead)

### Pen frame fixes
- **US-E4-1 banner rounded**: Banner is a full-width strip in group detail — per current code it has `h-[56px]` + tint bg but NO border-radius. Design spec says `rounded-[14px]`. If banner should float as a card within the page (not stretch edge-to-edge), it needs margin + border-radius. This is in `groups/[id]/page.tsx` which is NOT in E4 file ownership. Lead to decide.
- **AC-E4-4.6 tests runner**: No `npm test` script configured. Tests exist but cannot be run to verify pass state.
- **Batch settle edge**: `handleBatchCreditorConfirm` for simplified view directly confirms all underlying debts without a confirmation dialog — acceptable per current UX but worth a UX review.

## Unresolved questions

1. Should the debt banner in group detail be a floating card (with `mx-4 rounded-[14px]`) or a full-bleed strip? Current code = full-bleed strip, no radius. Changing it requires editing `groups/[id]/page.tsx` which is outside E4 ownership.
2. No Jest/Vitest runner configured — AC-E4-4.6 "12/12 PASS" cannot be verified automatically. Should test runner be configured as a separate task?
3. The `simplifyDebtsGraph` function is not used in the UI (only `simplifyDebts` is called). Should graph-based simplification be exposed via a toggle or sub-option?
