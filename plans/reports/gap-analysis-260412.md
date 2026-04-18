# Gap Analysis Report — 2026-04-12

## Summary
- Total US stories: 19
- DONE: 12 | PARTIAL: 4 | MISSING: 2 | EXTRA: 3

---

## Gap Matrix

| US | Name | Status | Notes |
|----|------|--------|-------|
| 1.1 | Login OTP | DONE | OTP send + verify, redirect logic for new/existing user |
| 1.2 | Login password | DONE | Email+password form, toggle OTP/password modes |
| 1.3 | Onboarding Step 1 — Avatar & Name | DONE | /setup page, step indicator, avatar, name pre-fill, skip |
| 1.4 | Onboarding Step 2 — Password | DONE | Password fields, validation, skip, setup_done flag |
| 1.5 | Branding login | DONE | NoPay/FreeLunch 2-line, 72px icon, desktop card shadow |
| 2.1 | Groups list (Home) | DONE | Debt subtitle with names, chip total, empty state, action buttons |
| 2.2 | Create group | DONE | Full-page 2-step: create + invite (link/QR/share icons) |
| 2.3 | Join group | DONE | Dialog with invite code on /groups page |
| 2.4 | Group detail (Chat) | DONE | Chat feed, bill cards, open bill cards, debt banner, real-time, empty state, AI intent parse |
| 2.5 | Group settings | DONE | Rename (admin), invite code copy, member list with roles, leave group |
| 3.1 | Create bill via chat (AI Parser) | DONE | Regex parser at /api/ai/parse-intent, follow-up card, amount/description/people parsing |
| 3.2 | Bill confirm sheet | DONE | Half-sheet design, avatars, per-person amount, payer, photo stub |
| 3.3 | Split sheet (equal/percent/custom) | DONE | 3-mode tabs, member list with checkboxes, remaining counter |
| 3.4 | Bill mo (Open Bill) | PARTIAL | Check-in, add people, close bill, guest support. **Missing: percent split on close (uses floor only, no +1 remainder distribution to first N). Telegram notifications for open bill events not wired.** |
| 3.5 | Transfer / Payment | PARTIAL | QR via VietQR, bank info display, copy account, deep link, "Da chuyen tien" creates payment_confirmation. **Missing: "Luu QR" downloads QR URL not actual image blob. "Chia se" shares URL not image. Upload receipt is stubbed (toast "tinh nang sap co").** |
| 4.1 | Debt banner in Group Detail | DONE | Red/green banner, net debt calc, "Tra no"/"Nhac no" buttons |
| 4.2 | Net debt calculation | DONE | Implemented in Home page, Group Detail, and /debts page |
| 4.3 | Payment confirmation 2-way | PARTIAL | Debtor can claim "Da chuyen", creditor can confirm "Da nhan tien" on /debts page. **Missing: Telegram notification on creditor confirm sends but debtor-side "Bao da chuyen" notification is fire-and-forget with no guaranteed delivery check. No UI indicator showing "pending confirmation" state on the debt banner.** |
| 5.1 | Account page | DONE | Avatar, name, email, bank status badge, Telegram link status |
| 5.2 | Edit display name | DONE | Dialog with save, toast, reload |
| 5.3 | Bank link | DONE | 10 bank chips, 3 fields, auto uppercase, masked display, badge |
| 5.4 | Telegram link | DONE | Opens t.me/vsf_product_bot?start={email}, badge "Da lien ket" |
| 5.5 | Logout | DONE | Confirm dialog, sign out, redirect /login |

### Extra Pages (not in PRD)

| Page | Status | Notes |
|------|--------|-------|
| /bills (list) | EXTRA | Standalone bills list page — PRD has bills only in group chat |
| /bills/new | EXTRA | Manual bill creation form — PRD only defines chat-based creation |
| /bills/[id] | EXTRA | Bill detail page |
| /debts (list) | EXTRA | Standalone debts dashboard with QR, confirm — useful but not in PRD |
| /debts/[id]/confirm | EXTRA | Screenshot OCR confirmation flow — goes beyond PRD scope |
| /activity | EXTRA | Activity page (exists but not specified in PRD) |
| /summary | EXTRA | Summary page |
| /members | EXTRA | Members page |
| /profile | EXTRA | Profile page |

---

## Critical Gaps

### 1. [US-E3-4] Open Bill — Missing Telegram Notifications

**What's missing:**
- PRD specifies 3 Telegram events for open bills: "tao bill mo", "da check-in", "dong bill". The `/api/notify` endpoint is called for `new_bill` but not for `bill_checkin` or `bill_closed` events.
- When closing an open bill, remainder distribution (+1 VND to first N people) is not implemented — it uses simple `Math.floor` without distributing the remainder.

**Files to modify:**
- `src/app/(app)/groups/[id]/page.tsx` — `handleCheckin()` and `handleCloseBill()` need notify calls
- `src/app/api/notify/route.ts` — add handlers for `bill_checkin` and `bill_closed` event types

**Suggested approach:**
- Add `fetch("/api/notify", ...)` calls after successful check-in and after close bill
- Fix remainder: `const remainder = bill.total_amount - perPerson * totalParticipants; debtors.forEach((c, i) => { perPerson + (i < remainder ? 1 : 0) })`

### 2. [US-E3-5] Transfer — Receipt Upload Stubbed

**What's missing:**
- Upload receipt button shows "Tinh nang upload bien lai se som co" — not functional
- QR save downloads the URL string, not an actual image blob
- QR share shares URL, not image file

**Files to modify:**
- `src/app/(app)/transfer/[debtId]/page.tsx` — `handleSaveQR()` and file upload handler

**Suggested approach:**
- For QR save: fetch the QR URL as blob, create object URL, trigger download (like the /debts page already does)
- For receipt upload: reuse `ScreenshotUpload` component from `/debts/[id]/confirm/page.tsx`

### 3. [US-E4-3] Payment Confirmation — No Pending State in Banner

**What's missing:**
- After debtor taps "Da chuyen tien", the debt banner doesn't show "Cho xac nhan" state
- Banner still shows "Tra no" even if a pending payment_confirmation exists

**Files to modify:**
- `src/app/(app)/groups/[id]/page.tsx` — debt banner logic needs to query `payment_confirmations`

**Suggested approach:**
- When loading debt data, also query `payment_confirmations` where status = "pending"
- If a pending confirmation exists for a debt, show banner as "Cho xac nhan" (yellow/orange) instead of "Tra no"

---

## Minor Gaps

| Area | Issue |
|------|-------|
| US-E2-2 | QR code on invite page is a placeholder icon, not a real QR from the invite URL |
| US-E3-2 | "Them anh bill" button is non-functional (no upload handler) |
| US-E3-4 | When closing open bill, no chat message inserted for "bill_closed" event |
| US-E5-1 | Account page avatar color is hardcoded #3A5CCC, not hash-based per PRD |

---

## Recommendations

1. **P1 — Fix open bill remainder distribution** in `handleCloseBill()`. Simple math bug, high impact on fairness.
2. **P1 — Wire Telegram notifications** for check-in and close-bill events. Core UX promise.
3. **P2 — Fix QR save** on transfer page to download actual image blob (pattern already exists in /debts page).
4. **P2 — Add "pending confirmation" state** to debt banner so users know payment is being processed.
5. **P3 — Replace QR placeholder** on invite page with real QR code (use a library like `qrcode` or VietQR pattern).
6. **P3 — Activate receipt upload** on transfer page by reusing `ScreenshotUpload` component.
7. **P3 — Consider removing EXTRA pages** (/bills, /bills/new, /activity, /summary, /members, /profile) if not needed, or document them as intentional extensions.

---

## Unresolved Questions

1. Are the EXTRA pages (/bills, /debts, /activity, etc.) intentional extensions or leftover scaffolding?
2. Should the "Nhac no" button on home/group detail actually trigger a Telegram reminder to the debtor? Currently it just navigates to /debts.
3. Is the `/debts/[id]/confirm` OCR screenshot flow a planned feature or experimental? Not in PRD but fully built.
