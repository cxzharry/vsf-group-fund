# UI Review Cycle 3 — 2026-04-13 02:50

## Target Files Audit (10 files)

All 10 files in scope are **clean** (0 raw Tailwind color tokens):

| File | gray-* | red/grn/etc | Status |
|---|---|---|---|
| app/(app)/bills/page.tsx | 0 | 0 | CLEAN |
| app/(app)/bills/new/page.tsx | 0 | 0 | CLEAN |
| app/(app)/bills/[id]/page.tsx | 0 | 0 | CLEAN |
| app/(app)/activity/page.tsx | 0 | 0 | CLEAN |
| app/(app)/members/page.tsx | n/a (stub 187B) | n/a | CLEAN |
| app/(app)/profile/page.tsx | n/a (stub 162B) | n/a | CLEAN |
| app/(app)/debts/[id]/confirm/page.tsx | 0 | 0 | CLEAN |
| components/bottom-nav.tsx | 0 | 0 | CLEAN |
| components/desktop-nav.tsx | 0 | 0 | CLEAN |
| components/auth-provider.tsx | 0 | 0 | CLEAN |

Note: scoped target files already migrated. Focus next cycle on the remaining 8 source files.

## Remaining Token Migration Priority (app-wide)

Total raw color tokens app-wide: **51 across 8 files** (down from 69 in cycle 2 → 26% further reduction).

| Rank | File | Count | Priority |
|---|---|---|---|
| 1 | components/chat/add-people-sheet.tsx | 16 | P2 — chat sheet, high visibility |
| 2 | components/chat/bill-card-bubble.tsx | 12 | P2 — appears in every group chat |
| 3 | components/chat/open-bill-card.tsx | 7 | P2 — chat bubble variant |
| 4 | components/chat/ai-response-card.tsx | 6 | P3 |
| 5 | app/(app)/debts/page.tsx | 6 | P3 |
| 6 | app/(app)/summary/page.tsx | 2 | P3 |
| 7 | components/chat/date-divider.tsx | 1 | P4 |
| 8 | components/screenshot-upload.tsx | 1 | P4 |

## Hover Rules — Major Improvement

`hover:` rules: **2 → 37 across 18 files** (cycle 2 → cycle 3). Issue #9/#39 from previous reviews effectively resolved. Still missing on: `bottom-nav.tsx` (mobile-only OK), `auth-provider.tsx` (no UI). All key interactive surfaces now have hover states.

## New Issues
None detected via static analysis. No new files breaking conventions.

## Recommendations for Dev Step (Cycle 3 → Cycle 4)
1. **Top 3 migration**: `add-people-sheet.tsx` (16), `bill-card-bubble.tsx` (12), `open-bill-card.tsx` (7) — clears 35 of 51 remaining tokens (69%) in one batch.
2. **Bump debt action buttons** from h-10 (40px) → h-11 (44px) to fully meet WCAG 2.5.5 (cycle 2 carry-over, low effort).
3. **Add `<a href>` semantics** to "+" add-group button on home (cycle 2 issue #45) for keyboard/cmd-click support.
4. Defer P3/P4 single-occurrence files (date-divider, screenshot-upload) — bundle with whatever feature touches them.

## Summary
- Target files: 10/10 CLEAN
- App-wide gray/color tokens: 69 → 51 (26% drop this cycle)
- Hover coverage: 2 → 37 (1750% increase) — previously P2 issue resolved
- New issues: 0
- Carry-over P1: debt button height (h-10 vs h-11)

## Unresolved Questions
- Should chat bubble components migrate to design tokens or keep semantic chat colors as a deliberate exception? (Affects whether 35 tokens in 3 files are "fixes" or by-design.)
