# UI/UX Review — 2026-04-13 01:15

## Summary
- **Previous review**: 42 issues (14 P1, 19 P2, 9 P3) on 2026-04-12
- **Issues fixed since last review**: 0
- **New issues found**: 2
- **Total active issues**: 44 (14 P1, 20 P2, 10 P3)
- Script: `plans/reports/ui-review-260413.mjs`

### Confirmed Working
- Font: Inter used consistently (all pages, both viewports)
- Body bg: #F2F2F7 correct
- Card bg: #FFFFFF, radius: 14px, height: 88px correct
- Main padding: 16px (px-4) consistent
- Vietnamese diacritics render correctly
- Primary blue #3A5CCC used correctly on home cards + buttons

---

## EXISTING Issues (Unchanged from 04-12)

### P1 — Touch Targets < 44px (14 issues, ALL UNFIXED)

| # | Element | Size | Page | Viewport | Status |
|---|---------|------|------|----------|--------|
| 4 | "+" add group button | 36x36 | Home | Both | EXISTING — `h-9 w-9` still in page.tsx:201 |
| 11 | Back button | 32x32 | Group detail | Both | EXISTING — `h-8 w-8` in groups/[id]/page.tsx:612 |
| 12 | Settings gear button | 32x32 | Group detail | Both | EXISTING — `h-8 w-8` in groups/[id]/page.tsx:629 |
| 18 | Back button | 32x32 | Settings | Both | EXISTING — `h-8 w-8` in settings/page.tsx:173 |
| 21 | "Sua" edit name button | ~22x16 | Settings | Both | EXISTING |
| 22 | "Sao chep" copy button | 78x28 | Settings | Both | EXISTING |
| 26 | "Sua" edit profile | 26x20 | Account | Both | EXISTING — confirmed via audit |
| 27 | "Lien ket" Telegram link | 53x20 | Account | Both | EXISTING — confirmed via audit |
| 28 | "Dang xuat" button | Wx20 | Account | Both | EXISTING — confirmed height=20px |
| 35 | "Da nhan tien" buttons | h-7 (28px) | Debts | Both | EXISTING — `h-7` in debts/page.tsx:282,328 |
| 36 | QR/Tra no buttons | h-7 (28px) | Debts | Both | EXISTING — `h-7` in debts/page.tsx:289 |

### P2 — Design Token Violations (19 issues, ALL UNFIXED)

| # | Issue | File | Status |
|---|-------|------|--------|
| 5 | Cards have NO shadow (boxShadow: none) | page.tsx | EXISTING — 3 cards confirmed no-shadow |
| 7 | Card action buttons < 44px height | page.tsx | EXISTING |
| 9 | No hover states on desktop (only 2 CSS hover rules total) | Global | EXISTING |
| 13 | Back/settings use `text-gray-600 hover:bg-gray-100` | groups/[id]/page.tsx | EXISTING |
| 14 | Group name `text-gray-900`, member count `text-gray-400` | groups/[id]/page.tsx | EXISTING |
| 15 | Chat input uses `border-gray-200 bg-gray-50` | chat-input-bar.tsx | EXISTING |
| 16 | AI followup yellow bg not in palette | ai-followup-card.tsx | EXISTING |
| 19 | Settings back `text-gray-600` | settings/page.tsx | EXISTING |
| 20 | 18+ gray-* classes in settings | settings/page.tsx | EXISTING — now 19 occurrences |
| 24 | Settings header differs from PageHeader | settings/page.tsx | EXISTING |
| 25 | Leave group dialog uses gray-* | settings/page.tsx | EXISTING |
| 33 | Debts uses `text-red-600`/`text-green-600` | debts/page.tsx | EXISTING |
| 34 | Section title wrong green | debts/page.tsx | EXISTING |
| 37 | Confirm dialog gray-* | debts/page.tsx | EXISTING |
| 38 | Summary page same gray issues | summary/page.tsx | EXISTING |
| 39 | Only 2 hover rules app-wide | Global | EXISTING |

**Total Tailwind gray-* usage**: 93 occurrences across 13 files (unchanged)

### P3 — Minor (9 issues, ALL UNFIXED)

Issues #1-3 (login), #6 (chip shadow), #8 (desktop max-width), #10 (bottom nav selector), #17 (bill card color), #23 (member avatar), #40 (desktop sidebar overlap), #42 (false positive) — all unchanged.

---

## NEW Issues

| # | Issue | Page | Viewport | Sev | Fix |
|---|-------|------|----------|-----|-----|
| 43 | Settings page unreachable on mobile — gear icon button in group detail header is indistinguishable from back button (both 32x32 icon-only, same `text-gray-600`). Clicking first button navigates back, second button is the gear but hard to target. Pre-QC also failed to reach settings (test #28 FAIL) | Group detail | Mobile | P2 | Add `aria-label` to both buttons; consider making gear icon visually distinct (e.g., different color or position) |
| 44 | Bottom nav hidden on group detail page (nav element has 0x0 dimensions) — user cannot switch tabs while in group. Must use back button first | Group detail | Mobile | P2 | Ensure bottom nav remains visible on group detail or provide clear back navigation affordance |

---

## Metrics Comparison

| Metric | 04-12 | 04-13 | Delta |
|--------|-------|-------|-------|
| P1 issues | 14 | 14 | 0 |
| P2 issues | 19 | 21 | +2 new |
| P3 issues | 9 | 9 | 0 |
| Total | 42 | 44 | +2 |
| Tailwind gray-* | 93 | 93 | 0 |
| Hover rules | 2 | 2 | 0 |
| Cards w/o shadow | 3 | 3 | 0 |

---

## Top 3 Fix Priorities

1. **Touch targets** (14 P1): Change `h-8 w-8` to `h-11 w-11` on nav buttons, add `min-h-[44px]` to text buttons, change `h-7` to `h-10` on debt action buttons
2. **Design tokens** (93 gray-* occurrences): Single migration pass across 13 files to replace Tailwind gray-* with design token hex values
3. **Desktop hover states** (2 rules total): Add hover transitions to cards, buttons, links

## Screenshots

`plans/reports/screenshots/ui-review-260413-{mobile|desktop}-{login|home|group|settings|account}.png`

Note: mobile-settings captured home (gear click failed), desktop-settings captured home (same issue — audit hit sidebar nav instead of settings page).
