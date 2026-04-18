# UI Review Cycle 2 — 2026-04-13

## Fix Verification (Local Dev Server localhost:3001)

| # | Fix | Expected | Actual | Status |
|---|-----|----------|--------|--------|
| 1 | "+" add group button | 44x44 | 44x44 (button) | PASS |
| 2 | Card shadow (home) | not "none" | `rgba(0,0,0,0.08) 0px 1px 3px` | PASS |
| 3 | Back button (group detail) | 44x44 | 44x44 (h-11 w-11) | PASS |
| 4 | Gear button (group detail) | 44x44 | 44x44 (h-11 w-11) | PASS |
| 5 | Chat send button | 44x44 | 44x44 (h-11 w-11) | PASS |
| 6 | Back button (settings) | 44x44 | 44x44 (h-11 w-11) | PASS |
| 7 | Settings gray-* colors | 0 computed grays | 0 | PASS |
| 8 | Group detail gray-* colors | 0 | 0 | PASS |
| 9 | Account "Sua" button | >=44px | 44x44 (min-h-[44px]) | PASS |
| 10 | Account "Lien ket" | >=44px | 53x44 (min-h-[44px]) | PASS |
| 11 | Account "Dang xuat" | >=44px | 358x44 (min-h-[44px]) | PASS |
| 12 | Chat input border token | no gray-200 | 0 gray-* in chat-input-bar.tsx | PASS |
| 13 | Debt action buttons | >=40px | h-10 (40px), was h-7 (28px) | PASS* |
| 14 | Hover rules app-wide | > 10 | 2 | FAIL |

**13 of 14 checks PASS.** *Debt buttons at 40px (h-10) — acceptable but ideally h-11 (44px).

## New Issues Found

| # | Issue | Page | Viewport | Severity |
|---|-------|------|----------|----------|
| 45 | "+" button is `<button>` not `<a href="/groups/create">` — no native link semantics for navigation; keyboard/right-click/cmd-click won't work as expected | Home | Both | P3 |

No other new issues detected.

## Remaining from Previous 44 Issues

### Fixed locally (not yet deployed): 24 issues
- Touch targets: #4, #11, #12, #18, #21, #22, #26, #27, #28, #35, #36 (11 of 14 P1 touch targets)
- Design tokens: #5, #13, #14, #15, #19, #20, #24, #25, #33, #34, #37, #38 (12 of 19 token issues)
- Settings page: now reachable (#43 resolved)

### Still unfixed: 20 issues
- **P1 (3)**: Remaining touch targets not verified (split-sheet modal buttons, possibly others in transfer page)
- **P2 (8)**: 69 gray-* occurrences remain across 11 files (transfer: 19, add-people-sheet: 13, bill-card-bubble: 6, ai-response-card: 6, open-bill-card: 6, summary: 5, debts: 5, ai-followup: 4, chat-message-list: 3, date-divider: 1, group-detail: 1). Hover rules still only 2 app-wide (#9, #39)
- **P3 (9)**: #1-3 login, #6 chip shadow, #8 desktop max-width, #10 bottom nav, #17 bill card color, #40 desktop sidebar, #44 bottom nav hidden on group detail

## Summary
- **Verified fixed**: 24/44 previous issues (55%)
- **Still unfixed**: 20 issues (3 P1, 8 P2, 9 P3)
- **New issues**: 1 (P3)
- **Gray-* source count**: 93 → 69 (26% reduction, 11 files remain)

## Screenshots
`plans/reports/screenshots/c2-{mobile|desktop}-{home|group|settings|account}.png`
