# PM Review: Group Fund App Full Scope Audit

**Date:** 2026-04-11
**Reviewer:** PM Agent
**App:** vsf-group-fund (Next.js 15 + Supabase)
**Live:** https://vsf-group-fund.vercel.app

---

## 1. Flow Mapping

### 1A. Auth Flow
```
Login page (/login)
  -> Enter email -> Send OTP -> Verify 6-digit code -> Redirect to /
  -> OR: Enter email + password -> Redirect to /
  -> Auth middleware redirects unauthenticated users to /login
  -> AuthProvider auto-creates member record if missing (user_id, display_name from email prefix)
```

### 1B. Group Management Flow
```
Home (/) -> See group list with net debt per group
  -> "+" button -> Create group dialog (name only) -> Auto-join as admin
  -> "Tham gia" -> Join group dialog (8-char invite code) -> API validates code, adds member
  -> Tap group card -> Navigate to /groups/[id] (chat view)
  -> Group card shows "Tra no" button if user owes money (links to /transfer/[debtId])
```

### 1C. Group Chat + Bill Creation (AI-Powered)
```
/groups/[id] -> Chat feed with text messages + bill cards + transfer pills
  -> Text input: type message -> send
    -> POST /api/ai/parse-intent (local regex parser)
    -> If bill intent detected + ready to confirm -> BillConfirmSheet slides up
    -> If bill intent detected but needs more info -> AiFollowupCard shows inline
    -> User answers follow-up -> re-evaluates -> BillConfirmSheet
  -> BillConfirmSheet: edit amount, description, split type (equal/custom/open), people count, payer -> "Tao bill"
    -> Inserts bill, debts (for equal split), bill_card chat message
  -> Blue receipt button -> navigates to /bills/new?group=[id] (manual form)
```

### 1D. Open Bill Flow
```
Create open bill from BillConfirmSheet (splitType=open)
  -> OpenBillCard rendered in chat feed
  -> Members tap "Toi co an" to check-in
  -> "Them nguoi" -> AddPeopleSheet (add group members or guests by name)
  -> Payer taps "Dong bill" -> calculates equal split among checked-in members -> creates debts
```

### 1E. Manual Bill Creation Flow
```
/bills/new -> Form: title, total amount, who paid, who participated, split type (equal/custom)
  -> Creates bill + bill_participants + debts
  -> Sends Telegram notifications via /api/notify
  -> Redirects to /bills (list page)
```

### 1F. Debt Tracking Flow
```
/debts -> Summary cards (I owe / owed to me), net balances per person
  -> "QR" button -> VietQR dialog (if creditor has bank info)
  -> "Tra no" button -> /transfer/[debtId] (full payment screen)
  -> "Da nhan tien" (creditor confirm) -> inserts payment_confirmation + updates debt to confirmed
```

### 1G. Payment (Transfer) Flow
```
/transfer/[debtId] -> Shows amount, creditor info
  -> VietQR code (if creditor has bank info linked)
  -> Copy account number, save QR, share QR, deep link to bank app
  -> "Da chuyen tien" -> inserts payment_confirmation (status=pending) -> router.back()
  -> Upload receipt -> NOT IMPLEMENTED (shows "coming soon" toast)
```

### 1H. Account Flow
```
/account -> View profile (avatar initials, name, email)
  -> Edit display name dialog
  -> Bank info section: link bank (bank name chips, account no, account name)
  -> Telegram linking: deep link to @vsf_product_bot
  -> Sign out with confirmation dialog
```

---

## 2. Missing Features

### Critical Missing
| # | Feature | Status |
|---|---------|--------|
| 1 | **Group settings page** | Settings button in group header links to `/groups/[id]/settings` which **DOES NOT EXIST** (404) |
| 2 | **Invite code display** | No way to see/copy/share group invite code after creation. Dead feature. |
| 3 | **Receipt upload/OCR** | Transfer page has upload button but shows "coming soon" toast. `PaymentConfirmation` type supports `screenshot_ocr` but unimplemented. |
| 4 | **Partial payments** | Debt has `status: "partial"` type but no UI or logic for partial payment. Only full confirm exists. |
| 5 | **Debts tab in bottom nav** | Bottom nav only has "Nhom" and "Tai khoan". No "No" (debts) tab. Debts page exists at `/debts` but unreachable from nav. |
| 6 | **Bills tab in bottom nav** | `/bills` and `/bills/[id]` exist but unreachable from bottom nav. Only accessible from bills/new redirect. |
| 7 | **Remind debtor** | Debt banner shows "Nhac no" button for creditors but it just links to `/debts` -- no actual reminder notification sent. |
| 8 | **Transfer intent handling** | AI parser detects `transfer` intent type but `handleBillConfirm` only creates bills, not transfers. Transfer intent is dead code. |
| 9 | **AiResponseCard unused** | Component exists in `chat/ai-response-card.tsx` but never rendered anywhere in the app. |
| 10 | **Notification for chat bill creation** | Bills created from chat (BillConfirmSheet) do NOT call `/api/notify`. Only `/bills/new` form does. |

### Nice-to-Have Missing
| # | Feature |
|---|---------|
| 11 | No member removal from group |
| 12 | No bill deletion or editing |
| 13 | No debt history/settled debts view |
| 14 | No push notifications (only Telegram) |
| 15 | No image/photo sharing in chat |
| 16 | No group avatar/photo |
| 17 | No currency support beyond VND |
| 18 | No bill category/tags |
| 19 | No search in chat messages |
| 20 | No offline support / optimistic updates |

---

## 3. Broken Flows

### P0 - Blocking
| # | Issue | Impact |
|---|-------|--------|
| B1 | **Group settings 404** | Tapping gear icon in group chat -> 404 page. No way to manage group, see invite code, or leave group. |
| B2 | **Debts page unreachable** | `/debts` exists with full QR/confirm functionality but no nav link. Users can only reach it via debt banner in group chat (if they have debts). |
| B3 | **Bills list unreachable** | After creating bill via `/bills/new`, redirects to `/bills` which has no nav entry. User stranded on page with no way back except browser back. |
| B4 | **New bill form redirects to orphan page** | `router.push("/bills")` after bill creation -- but `/bills` is orphaned from the nav. Should redirect to group chat. |

### P1 - Important
| # | Issue | Impact |
|---|-------|--------|
| B5 | **Chat bill creation skips notifications** | Bills created via AI chat flow don't trigger Telegram notifications. Only manual form does. Debtors won't know they owe. |
| B6 | **No bill_participants for chat-created bills** | `handleBillConfirm` inserts bill + debts but never inserts `bill_participants`. This means `billParticipantCounts` will be 0 for all chat-created bills, breaking the BillCardBubble footer display ("0 nguoi"). |
| B7 | **Creditor one-click confirm has no guard** | `handleCreditorConfirm` in debts page immediately marks debt as confirmed with no confirmation dialog. One accidental tap = debt cleared. |
| B8 | **Custom split from chat is incomplete** | BillConfirmSheet allows selecting "Tuy chinh" split type but provides no UI to set per-person amounts. Creates bill with split_type="custom" but no actual custom amounts. |
| B9 | **Payment confirmation is one-way** | Debtor clicks "Da chuyen" -> inserts pending confirmation -> goes back. No way for creditor to see pending confirmations or approve/reject them from UI. Creditor can only blanket "Da nhan" the debt. |
| B10 | **"Tra no" on group card navigates to wrong place** | Group card's "Tra no" button goes to `/transfer/[debtId]` using the biggest debt. But debt calculation uses first result sorted by remaining desc -- may pick wrong debt if multiple debts exist. |

### P2 - Minor
| # | Issue | Impact |
|---|-------|--------|
| B11 | **First date divider always renders** | `isSameDay` called with `lastDate=""` on first iteration, always triggers a new divider. Not a bug per se but empty string date comparison is fragile. |
| B12 | **Bills page loads ALL bills, not user's** | `/bills` page queries ALL bills in the system, not filtered by user or group. Security/privacy issue. |
| B13 | **Debts page `supabase` in dependency array** | `createClient()` creates new instance every render, causing infinite re-renders of `loadDebts`. Not memoized like other pages. |
| B14 | **Bill close doesn't split correctly** | `handleCloseBill` divides total by ALL checkins including payer. Payer ends up owing themselves a share that nobody pays. |

---

## 4. Edge Cases Not Handled

### No Groups
- **Handled**: Home page shows empty state with "Tao nhom moi" and "Nhap ma moi" buttons. Good.

### Bill Amount is 0
- **Not handled**: BillConfirmSheet allows amount=0 (disabled only when falsy). `perPerson` would be 0. Bills/new validates `totalAmount <= 0` but chat flow doesn't validate negative/zero before calling confirm.
- **Not handled**: `parseVND("0")` behavior untested.

### Only 1 Person in Group
- **Not handled**: If group has 1 member and creates equal bill for 1 person, `peopleCount=1`, `perPerson=total`, but `debtInserts` filters out payer, so no debts created. Bill exists but is pointless.
- **Not handled**: Chat message "1tr2 bun bo 1 nguoi" would create a bill for 1 person with no debts.

### User Pays Themselves
- **Partially handled**: `/bills/new` filters out payer from debt creation (`filter(id !== paidBy)`). `/groups/[id]` also does this. But no user-facing warning.

### Error States
- **Partially handled**: Most forms show toast errors. But:
  - No retry mechanism for failed API calls
  - No error boundary for the app shell
  - No fallback if Supabase realtime disconnects
  - No handling if user's session expires mid-usage

### Loading States
- **Handled**: All pages have spinner loading states. 

### Empty States
- **Home**: Handled (no groups message)
- **Group chat**: Handled ("Chua co hoat dong nao")
- **Debts**: Handled ("Khong co khoan no nao")
- **Bills**: Handled ("Chua co hoa don nao")
- **Transfer with no bank info**: Handled (shows "chua cai ngan hang" message)

### Other Edge Cases
| Case | Handled? |
|------|----------|
| User navigates to non-existent group | Yes - "Khong tim thay nhom" |
| User navigates to non-existent debt | Yes - "Khong tim thay khoan no" |
| User double-clicks check-in | No - no duplicate prevention in UI (DB may have unique constraint) |
| User creates group with same name | No validation |
| Invite code collision | Not handled - relies on DB uniqueness |
| Very long group/bill names | No truncation in some places |
| User removed from auth but member record exists | Not handled |
| Concurrent bill close | No optimistic locking |

---

## 5. Priority Recommendations

### P0 - Blocking (Fix immediately)
1. **Create group settings page** (`/groups/[id]/settings`) - invite code display, member list, leave group
2. **Add debts/bills to bottom nav** - users can't reach critical pages
3. **Fix bill creation redirect** - chat bill should stay in group, form bill should go back to group
4. **Fix chat bill missing bill_participants** - breaks participant count display

### P1 - Important (Fix this sprint)
5. **Add Telegram notifications for chat-created bills** - debtors not notified
6. **Add confirmation dialog for creditor debt confirmation** - prevent accidental taps
7. **Fix bills page to filter by user** - currently shows all system bills (privacy)
8. **Fix open bill close splitting** - payer's share should be excluded from debt calc
9. **Fix supabase client memoization in debts page** - potential infinite re-render
10. **Implement "Nhac no" (remind debtor)** - send Telegram notification to debtor

### P2 - Nice to Have (Backlog)
11. Implement receipt upload + OCR for payment confirmation
12. Implement partial payment support
13. Add custom split UI in BillConfirmSheet
14. Handle transfer intent from AI parser
15. Use AiResponseCard component (currently unused)
16. Add member management (remove from group)
17. Add bill editing/deletion
18. Add debt settlement history

---

## 6. Feature Gaps vs Design

Since the Pencil design file exists at `/Users/haido/untitled.pen`, here's what I can assess from code vs design intent:

### Implemented Matching Design
- Login page with OTP + password
- Groups list with debt summary
- Group chat with message bubbles
- Bill cards in chat feed
- Open bill with check-in flow
- VietQR payment screen
- Account page with bank linking
- Bottom navigation (2 tabs)

### Gaps Likely in Design but Missing
| Feature | Evidence |
|---------|----------|
| Group settings/invite screen | Settings button exists in group header but page doesn't exist |
| Bill detail from chat | Bill cards in chat are not tappable -- no drill-down |
| Payment confirmation flow (creditor side) | payment_confirmations table exists but no dedicated UI |
| Notification center/inbox | Telegram notifications exist server-side but no in-app notification |
| Transfer between members without a bill | Transfer intent detected by AI but not handled |
| Member debt summary within group | Only aggregate net shown in banner, no breakdown |

### Architecture Notes
- **Two parallel bill creation paths** with different behaviors (chat vs form). Form path is more complete (has bill_participants, notifications). Chat path is missing both.
- **Dead code**: `AiResponseCard`, transfer intent handling, `ai_response` chat message type
- **No group settings page** despite header button suggesting it exists
- **Bottom nav has only 2 tabs** -- design likely intended 3-4 tabs (groups, debts, bills, account)

---

## Unresolved Questions

1. Does the Pencil design file contain screens for group settings, notification inbox, or bill detail? (Cannot read .pen file without MCP tool)
2. Is the `bills` page at `/bills` intended to be a global bill list or group-scoped? Currently loads ALL bills system-wide.
3. What is the intended behavior for `equal_ask` follow-up option? Currently the follow-up card shows this option but the handler only processes `open`, `equal`, `custom`, and numeric values.
4. Should the bottom nav include debts and/or bills tabs? Current 2-tab layout makes major features unreachable.
5. Is partial payment a required feature? Type system supports it but zero implementation exists.
6. What should happen when a user who is not in the group navigates to `/groups/[id]`? Currently shows the group data anyway (no membership check in frontend).
