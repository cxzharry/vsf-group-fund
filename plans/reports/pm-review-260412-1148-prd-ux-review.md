# PM Review: NoPay FreeLunch PRD vs Live App

**Date:** 2026-04-12 | **Reviewer:** PM Agent  
**App URL:** https://nopay-freelunch.vercel.app  
**Screens tested:** Login, Home/Groups, Group Detail, Account (mobile 390x844 + desktop 1280x800)

---

## 1. PRD Specification Issues

### 1.1 Debt Banner Button Label Mismatch (PRD vs PRD)
- **Issue:** Epic 3 says green banner should show "Nhận tiền" button, but Epic 7 describes the flow as "Trả nợ" → Transfer page. The creditor action is unclear in the PRD — do they "receive money" or "remind the debtor"?
- **Impact:** Developers must guess intent. Current implementation uses "Nhắc nợ" (remind debt) which is more logical but matches neither PRD label.
- **Fix:** Decide on one label. Recommend "Nhắc nợ" (current impl) for creditor banner. Update Epic 3 to match.

### 1.2 Group Card "Trả nợ" Button Not Clickable
- **Issue:** PRD Epic 2 specifies "Trả nợ" on group cards. Implementation shows it but the button has no `onClick` handler — it's just a `<span>` inside the card's `<button>`. Clicking it navigates to group detail instead of transfer.
- **Impact:** Users expecting to pay from home page must navigate: home → group → banner → transfer (3 taps instead of 1).
- **Fix:** Either (a) make "Trả nợ" a separate button linking to transfer, or (b) remove it from the card and let users pay from group detail. Option B is simpler (KISS).

### 1.3 Debt Summary Chip Incomplete
- **Issue:** PRD says "Tổng: Bạn đang nợ X **·** Bạn được nợ Y". Live app only shows one value: "Bạn được nợ 600.000đ". Missing the split between owed vs owing.
- **Impact:** Users with debts in both directions only see net amount, not breakdown.
- **Fix:** Show both values as PRD specifies, or clarify PRD that net amount is acceptable.

### 1.4 FAB Missing from Group Detail
- **Issue:** Epic 3 specifies a FAB (floating action button) at bottom-right with "+ Thêm hoá đơn" text and receipt icon. Live app instead has an inline icon button next to the chat input.
- **Impact:** The chat-input approach is arguably better UX (more discoverable, less clutter). But the PRD and implementation diverge.
- **Fix:** Update PRD to reflect the chat-input pattern. The inline approach is superior for a chat-based app.

---

## 2. Flow Gaps & Dead Ends

### 2.1 No Bill Detail View on Tap
- **Issue:** Bill cards in chat feed appear non-interactive. Tapping a bill card has no detail view — no breakdown of who owes what, no edit capability.
- **Impact:** Users cannot see individual debt allocations or correct mistakes after bill creation.
- **Fix:** Add a bill detail sheet showing: participants, amount per person, debt status, edit/delete for bill creator.

### 2.2 Creditor Confirmation Flow Missing
- **Issue:** Epic 8 describes a 2-step flow: debtor marks "Đã chuyển tiền" → creditor confirms "Xác nhận đã nhận". The creditor-side confirmation UI is not visible in the app. No "Xác nhận" button appears on the banner or anywhere.
- **Impact:** Debts can never be confirmed as paid by creditors, leaving them permanently pending.
- **Fix:** When a debtor marks payment, show a confirmation prompt/button to the creditor (via banner or notification sheet).

### 2.3 Transfer Page Navigation Unclear
- **Issue:** Epic 7 says "Trả nợ" → `/transfer/[debtId]`. But the banner button "Nhắc nợ" for creditors doesn't have a clear destination. What happens when creditor taps "Nhắc nợ"?
- **Impact:** Button may do nothing or cause confusion.
- **Fix:** Define the "Nhắc nợ" action: send Telegram reminder? Show a confirmation toast? PRD needs to specify.

### 2.4 Group Card Uses `onClick` + `router.push` Instead of `<a>` Tag
- **Issue:** Group cards use `<button onClick={() => router.push(...)}>` instead of `<a href>`.
- **Impact:** No right-click "open in new tab", no link preview, no browser back/forward caching, bad for accessibility (screen readers see button not link).
- **Fix:** Use Next.js `<Link>` component for all navigable cards.

---

## 3. UX Issues

### 3.1 Account Tab Has Unnecessary Back Button
- **Issue:** Account tab (Tab 2) shows a "<" back button in header. This is a root-level tab — there's nothing to go "back" to.
- **Impact:** Confusing — tapping back likely returns to Groups tab, which is already accessible via the tab bar.
- **Fix:** Remove back button from Account tab header. Reserve back buttons for drill-down screens only.

### 3.2 Chat Messages Lack User Avatars
- **Issue:** PRD Epic 3 specifies "Avatar người gửi (trái, 34px)" for bill cards. Live implementation shows bills as simple chat bubbles without avatars. Only the bill card (the structured one) has an avatar.
- **Impact:** Hard to distinguish who said what in a busy chat.
- **Fix:** Add avatars to plain text messages. Or define clearly in PRD which message types get avatars.

### 3.3 Empty Group Detail Missing Guidance
- **Issue:** "Hello" group with 1 member shows "Chưa có hoạt động nào" — plain gray text, no icon, no CTA.
- **Impact:** New users don't know what to do next. Should they invite members? Type a bill? 
- **Fix:** Add empty state with: (1) illustration, (2) "Invite members or type a bill to get started", (3) invite/share code button.

### 3.4 Group Name Truncation
- **Issue:** "VSF Product QC Te..." is truncated on mobile group card. No tooltip or expansion.
- **Impact:** Users with long group names can't read them.
- **Fix:** Allow 2-line wrapping for group names, or show full name on tap/hover.

---

## 4. Mobile vs Desktop

### 4.1 Desktop Layout Works Well
- **Issue:** None critical. Desktop sidebar with 2 nav items + main content area is clean.
- **Impact:** N/A.
- **Fix:** N/A.

### 4.2 Desktop Group Detail Missing Chat Input Affordance
- **Issue:** On desktop, the chat input is at the very bottom of the viewport, far from the content area. The receipt icon button is small (likely <44px tap target).
- **Impact:** Desktop users may miss the bill creation entry point.
- **Fix:** Ensure the icon button meets 44px minimum. Consider adding keyboard shortcut hint.

### 4.3 Bottom Tab Bar Overlaps Content on Mobile Group Detail
- **Issue:** Mobile group detail (VSF group screenshot) shows bottom tab bar overlapping the chat input. Two navigation affordances compete: tab bar + back button.
- **Impact:** The chat input area is cramped. Tab bar takes space that should be for the chat feed.
- **Fix:** Hide bottom tab bar on drill-down pages (group detail, transfer, settings). Only show on root tabs (Home, Account).

---

## 5. Spacing & Layout Inconsistencies

### 5.1 Login Page Vertical Centering
- **Issue:** PRD says "căn giữa dọc" (vertically centered). Live app pushes content to ~60% down the viewport, leaving large empty space above.
- **Impact:** Feels unbalanced, especially on mobile where top half is entirely empty.
- **Fix:** True vertical center, or shift up slightly (40-45% from top).

### 5.2 Empty State Font Size Mismatch
- **Issue:** PRD specifies empty state: "Chưa có nhóm nào" at 20px bold. Implementation appears to use `font-semibold` (not bold) and default size (~16px).
- **Impact:** Minor visual mismatch.
- **Fix:** Match PRD: use `text-xl font-bold`.

---

## 6. Edge Cases

### 6.1 No Error State for Failed Bill Creation
- **Issue:** If AI parser fails to parse amount (e.g., "let's eat"), no feedback shown. Message just appears in chat as plain text.
- **Impact:** Users don't know if their bill was created or just sent as a message.
- **Fix:** Show inline feedback: "Không nhận diện được số tiền. Thử: '500k bún bò 3 người'"

### 6.2 Single-Member Group Allows Bill Creation
- **Issue:** "Hello" group (1 member) has a chat input. User can type bill commands but there's no one to split with.
- **Impact:** Bills created with 0 debtors are useless and confusing.
- **Fix:** Show a prompt: "Mời thêm thành viên để chia bill" when group has <2 members.

### 6.3 No Offline/Network Error Handling
- **Issue:** No visible offline indicator or retry mechanism in screenshots or code review.
- **Impact:** Users in Vietnam may have intermittent connectivity; silent failures lose data.
- **Fix:** Add toast on network error: "Mất kết nối. Đang thử lại..." with retry.

---

## 7. Navigation

### 7.1 Two-Tab Structure is Sufficient
- **Issue:** None. The 2-tab (Nhóm + Tài khoản) structure works for current scope.
- **Impact:** N/A.
- **Fix:** N/A. Resist urge to add more tabs.

### 7.2 Settings Gear Icon Inconsistent
- **Issue:** PRD Epic 3 says gear icon inside "vòng tròn xám" (gray circle). Live app shows gear icon without the gray circle background.
- **Impact:** Minor visual inconsistency. Tap target may be smaller than expected.
- **Fix:** Add gray circle background (40x40px) for better tap target.

---

## 8. Accessibility

### 8.1 Touch Target Sizes
- **Issue:** The receipt icon button next to chat input appears to be ~32x32px. Below the recommended 44x44px minimum.
- **Impact:** Hard to tap accurately on mobile, especially for users with motor impairments.
- **Fix:** Increase to 44x44px minimum for all interactive elements.

### 8.2 Color-Only Debt Indication
- **Issue:** Positive/negative debts distinguished only by color (red vs green). No icon or text prefix.
- **Impact:** Users with red-green color blindness (~8% of males) cannot distinguish debt direction.
- **Fix:** Add prefix: "-" for debts owed, "+" for debts due (currently partially done on home cards but not on banner).

---

## Priority Summary

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 2.2 | Creditor confirmation flow missing | HIGH | M |
| 2.1 | No bill detail view | HIGH | M |
| 4.3 | Tab bar overlaps chat input on mobile | HIGH | S |
| 3.3 | Empty group detail no guidance | MED | S |
| 1.2 | "Trả nợ" button non-functional | MED | S |
| 2.4 | Cards use onClick not Link | MED | S |
| 3.1 | Account tab unnecessary back button | MED | XS |
| 6.2 | Single-member bill creation | MED | S |
| 5.1 | Login vertical centering | LOW | XS |
| 8.1 | Touch targets too small | LOW | S |
| 8.2 | Color-only debt indication | LOW | S |

---

## Unresolved Questions

1. What exactly should "Nhắc nợ" do for creditors? Send Telegram? Show dialog?
2. Should bill cards in chat be tappable for detail view, or is the bill-as-chat-message pattern intentionally flat?
3. PRD mentions "Chia %" split mode — is this implemented? Could not verify from screenshots alone.
4. Is the `/debts` page (found in code) accessible from any UI? Appears to be an orphan route.
5. What happens when a user creates a bill via chat but the parser confidence is low? Is there a threshold?
