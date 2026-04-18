# UI/UX Design Review — 2026-04-12

## Summary
- **Total issues found: 42**
- P0 (Critical): 0 | P1 (Major): 14 | P2 (Minor): 19 | P3 (Nit): 9
- Screenshots: `plans/reports/screenshots/ui-review-{mobile|desktop}-*.png`
- Script: `plans/reports/ui-review-audit.mjs`

### What's Working Well
- Font: Inter used consistently across all pages (confirmed programmatically)
- Home header: 28px bold #1C1C1E — correct
- Body bg: #F2F2F7 — correct
- Card bg: #FFFFFF, border-radius: 14px, height: 88px — all correct
- Card padding: 0px 16px — consistent across all cards
- Main content: px-4 (16px) — consistent
- Desktop sidebar: present at 256px width with brand + nav
- Bottom nav: hidden on desktop (correct), visible on mobile
- Color tokens: primary blue #3A5CCC, green #34C759, red #FF3B30 used correctly on home
- Vietnamese diacritics render correctly throughout
- Loading spinners present with brand-color border
- Debt chip bar: rounded-[12px] with correct bg-white

---

## Issues by Page

### 1. Login Page

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 1 | OTP submit button "Gui ma OTP" appears disabled/faded (opacity reduced). Visual feedback unclear — button looks unclickable even when email is empty | Both | P2 | Only reduce opacity to 0.5 when disabled; at rest show full opacity with correct #3A5CCC |
| 2 | Login card on desktop has shadow but floats in center of large white void. No background texture/pattern to fill the space | Desktop | P3 | Add subtle bg-[#F2F2F7] to body on login, or add decorative bg element |
| 3 | "Dung OTP thay the" link at bottom has no hover state on desktop | Desktop | P3 | Add `hover:underline` or `hover:text-[#2d4aaa]` |

### 2. Home / Groups List

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 4 | **Add group "+" button is 36x36px** — below 44px min touch target | Both | P1 | Change `h-9 w-9` to `h-11 w-11` in page.tsx line 201 |
| 5 | Cards have NO shadow at all (confirmed: `boxShadow: none`). Flat cards on flat bg makes them feel like they float without depth | Both | P2 | Add `shadow-sm` or `shadow-[0_1px_3px_rgba(0,0,0,0.08)]` to group card links |
| 6 | Chip bar ("Ban duoc no 1.500.000d") has no shadow either — same as cards, no visual separation | Both | P3 | Add subtle shadow or border to chip bar for hierarchy |
| 7 | Card "Nhac no" / "Tra no" action buttons have no min tap target enforcement. At ~58x28px, height is below 44px threshold | Mobile | P2 | Wrap in larger tappable area or increase button padding |
| 8 | Desktop: main content area is ~576px wide (good) but no max-width is explicitly set — it could expand if sidebar shrinks | Desktop | P3 | Add explicit `max-w-[600px]` or `max-w-xl` to content area |
| 9 | Desktop: only 2 hover CSS rules detected. Cards have no hover state (no shadow lift, no scale, no bg change) | Desktop | P2 | Add `hover:shadow-md hover:scale-[1.01]` transition to card links |
| 10 | Bottom nav on mobile: detected height=0 during audit (likely due to nav selector hitting desktop nav). Visual confirms nav is present with ~56px | Mobile | P3 | Verify — likely no issue, audit selector matched wrong `nav` |

### 3. Group Detail (Chat View)

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 11 | **Back button is 32x32px** (h-8 w-8) — below 44px min | Both | P1 | Change `h-8 w-8` to `h-11 w-11` in groups/[id]/page.tsx line 612 |
| 12 | **Settings gear button is 32x32px** (h-8 w-8) — below 44px min | Both | P1 | Change `h-8 w-8` to `h-11 w-11` in groups/[id]/page.tsx line 628 |
| 13 | Back/settings buttons use `text-gray-600 hover:bg-gray-100` — Tailwind generic grays instead of design tokens | Both | P2 | Use `text-[#3A5CCC]` for back, `text-[#8E8E93]` for settings, `hover:bg-[#F2F2F7]` |
| 14 | Group name in header uses `text-gray-900` and member count uses `text-gray-400` — not design tokens | Both | P2 | Use `text-[#1C1C1E]` and `text-[#AEAEB2]` respectively |
| 15 | Chat input border uses `border-gray-200 bg-gray-50 focus:border-blue-300` — all Tailwind grays | Both | P2 | Use `border-[#E5E5EA] bg-[#F2F2F7] focus:border-[#3A5CCC]` |
| 16 | AI followup card ("Chia 100k cho bua an") options show A/B/C with yellow bg — inconsistent with app's color palette. Yellow not in design tokens | Both | P2 | Use `bg-[#EEF2FF]` (blue tint) or `bg-[#F2F2F7]` for option cards |
| 17 | Bill card in chat feed: "1 nguoi - 350.000d/nguoi" text color is a teal/link blue — not matching any design token | Both | P3 | Use `text-[#3A5CCC]` or `text-[#8E8E93]` |

### 4. Group Settings

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 18 | **Back button is 32x32px** (h-8 w-8) — same as group detail | Both | P1 | Change to `h-11 w-11` in settings/page.tsx line 171 |
| 19 | Back button color is `text-gray-600` — should be `text-[#3A5CCC]` per PageHeader pattern | Both | P2 | Match PageHeader component: `text-[#3A5CCC]` |
| 20 | **18 elements** use Tailwind `gray-*` classes instead of design tokens throughout settings page | Both | P2 | Replace: `gray-900` -> `#1C1C1E`, `gray-400` -> `#8E8E93`/`#AEAEB2`, `gray-200` -> `#E5E5EA`, `gray-100` -> `#F2F2F7`, `gray-50` -> `#F2F2F7` |
| 21 | "Sua" (edit name) button is 22x16px — extremely small tap target | Both | P1 | Wrap in min 44x44px tappable area with padding |
| 22 | "Sao chep" (copy invite) button is 78x28px — height below 44px | Both | P1 | Change to `py-2.5` for minimum 44px height |
| 23 | Member avatar in list is 36x36px (h-9 w-9) — slightly small compared to home cards (44px) | Both | P3 | Consider h-10 w-10 for visual consistency, but not blocking |
| 24 | Header title "Cai dat nhom" uses `text-base font-semibold text-gray-900` — differs from PageHeader's `text-[17px] font-semibold text-[#1C1C1E]` | Both | P2 | Use `text-[17px] text-[#1C1C1E]` for consistency |
| 25 | Leave group confirm dialog uses `gray-900`, `gray-500`, `gray-200`, `gray-700` — not design tokens | Both | P2 | Replace with design token colors |

### 5. Account Page

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 26 | **"Sua" (edit profile) link is 26x20px** — far below 44px min | Both | P1 | Wrap in 44x44px tap target or add generous padding |
| 27 | **"Lien ket" (Telegram) link is 53x20px** — below 44px | Both | P1 | Same fix as above |
| 28 | **"Dang xuat" button height is 20px** — line-height only, no padding | Both | P1 | Add `py-3` to make button at least 44px tall |
| 29 | Bank info row: "Tai khoan ngan hang" text wraps awkwardly on mobile — "ngan hang" drops to second line | Mobile | P2 | Use `text-[14px]` or `whitespace-nowrap` and adjust layout |
| 30 | "Da lien ket" badge is very small — the green pill + bank info + chevron crowd the right side | Mobile | P3 | Consider moving badge below or simplifying layout |

### 6. Bill Confirm / AI Followup

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 31 | No bill confirm sheet detected (sheet/dialog selectors returned null). The AI followup card appears inline instead of as a bottom sheet | Both | P3 | The AI followup card works as designed (inline card, not sheet). No action needed unless sheet was intended |
| 32 | AI followup options A/B/C use yellow-ish background that doesn't match design palette | Both | P2 | Use brand-consistent background colors |

### 7. Debts Page

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 33 | Summary cards use `text-red-600` and `text-green-600` (Tailwind) instead of `#FF3B30` and `#34C759` (design tokens) | Both | P2 | Replace with design token colors |
| 34 | Section title "Nguoi khac no toi (6)" uses green text — title color should be design token green `#34C759` not `text-green-600` | Both | P2 | Use `text-[#34C759]` |
| 35 | "Da nhan tien" buttons use `h-7 text-xs` — 28px height, well below 44px | Both | P1 | Increase to `h-10 py-2` minimum |
| 36 | QR/Tra no buttons also `h-7` (28px) | Both | P1 | Same fix |
| 37 | Confirm dialog uses `gray-900`, `gray-500`, `gray-200` instead of design tokens | Both | P2 | Replace with token colors |

### 8. Summary Page

| # | Issue | Viewport | Sev | Fix |
|---|-------|----------|-----|-----|
| 38 | Same issues as Debts page — uses Tailwind gray and red/green instead of design tokens | Both | P2 | Apply same token fixes |

---

## Desktop-Specific Issues

| # | Issue | Sev | Fix |
|---|-------|-----|-----|
| 39 | Only 2 CSS hover rules detected across the entire app. Interactive elements (cards, buttons, links) have no hover feedback | P2 | Add hover states: cards get `hover:shadow-md`, buttons get `hover:bg-[#2d4aaa]`, links get `hover:underline` |
| 40 | Desktop sidebar shows but group detail/settings pages also show sidebar — creates sidebar + sub-page navigation which may confuse. Back button in header competes with sidebar nav | P3 | Consider hiding sidebar on drill-down pages or making sidebar contextual |
| 41 | Group detail chat area on desktop is ~576px wide within ~1184px content area — lots of empty space. Chat feels squeezed while background is barren | P2 | Consider 2-column layout on desktop: chat left + group info/debts panel right |

## Mobile-Specific Issues

| # | Issue | Sev | Fix |
|---|-------|-----|-----|
| 42 | Bottom nav label font-size detected as 15px (should be 10px) — likely audit selector matched desktop sidebar nav link. Visual confirms mobile bottom nav labels are small/correct | P3 | No action — false positive from audit |

---

## Recommendations

### High Priority (P1)

1. **Touch targets**: The most pervasive issue. 14 buttons across the app are below 44px minimum. Fix by:
   - Group detail/settings back button: `h-8 w-8` -> `h-11 w-11`
   - Group detail settings gear: `h-8 w-8` -> `h-11 w-11`
   - Settings "Sua" button: wrap in 44px tap area
   - Settings "Sao chep": increase padding
   - Account text links ("Sua", "Lien ket", "Dang xuat"): add py-3 or min-h-[44px]
   - Debts QR/action buttons: `h-7` -> `h-10`
   - Home add "+" button: `h-9 w-9` -> `h-11 w-11`

### Medium Priority (P2)

2. **Design token consistency**: Settings page and group detail header use Tailwind `gray-*` classes instead of the established design tokens. Create a single migration pass:
   - `text-gray-900` -> `text-[#1C1C1E]`
   - `text-gray-600` -> `text-[#636366]` or `text-[#8E8E93]`
   - `text-gray-500` -> `text-[#8E8E93]`
   - `text-gray-400` -> `text-[#AEAEB2]`
   - `border-gray-200` / `border-gray-100` -> `border-[#E5E5EA]`
   - `bg-gray-100` / `bg-gray-50` -> `bg-[#F2F2F7]`
   - `hover:bg-gray-100` -> `hover:bg-[#F2F2F7]`
   - `text-red-600` -> `text-[#FF3B30]`
   - `text-green-600` -> `text-[#34C759]`

3. **Hover states on desktop**: Add hover transitions to all interactive elements for desktop users. Cards, buttons, and links all need visual hover feedback.

4. **Card shadows**: Home group cards and chip bar have no shadow. Add subtle `shadow-sm` for depth hierarchy.

### Low Priority (P3)

5. **Desktop layout**: Consider a max-width constraint on content area and 2-column layout on group detail for better use of wide viewport.

6. **Settings header**: Align with PageHeader component pattern (`text-[17px]`, design token colors, 44px back button).

7. **AI followup card**: Option backgrounds use yellow which isn't in the design palette. Align with brand colors.

---

## Files Requiring Changes

| File | Priority | Changes |
|------|----------|---------|
| `src/app/(app)/page.tsx` | P1 | Add btn `h-11 w-11`, card `shadow-sm`, desktop hover |
| `src/app/(app)/groups/[id]/page.tsx` | P1 | Back/settings btns `h-11 w-11`, replace gray-* with tokens |
| `src/app/(app)/groups/[id]/settings/page.tsx` | P1+P2 | Back btn `h-11 w-11`, replace all 18 gray-* with tokens, fix small btns |
| `src/app/(app)/account/page.tsx` | P1 | Fix "Sua"/"Lien ket"/"Dang xuat" tap targets |
| `src/app/(app)/debts/page.tsx` | P1+P2 | Fix button heights h-7->h-10, replace red/green-600 with tokens |
| `src/components/chat/chat-input-bar.tsx` | P2 | Replace gray-200/gray-50/blue-300 with tokens |
| `src/components/chat/ai-followup-card.tsx` | P2 | Replace yellow option bg with brand colors |
| `src/app/(app)/summary/page.tsx` | P2 | Same token fixes as debts page |
