# NoPay FreeLunch - Product Requirements Document

**Version:** 1.0 | **Updated:** 2026-04-12

---

## 1. Product Vision

App chia bill cho nhom ban be tai Viet Nam. Tao bill nhanh qua chat, theo doi no, chuyen tien qua QR.

**URL:** https://nopay-freelunch.vercel.app

---

## 2. Navigation

- **2 tabs only:** "Nhom" (Home) + "Tai khoan" (Account)
- Mobile: bottom tab bar | Desktop: left sidebar
- Bills, debts, transfers accessed from **within group detail** — NOT top-level tabs
- Back button on all sub-pages

---

## 3. Screens & Flows

### 3.1 Login (Auth)

**Screen:** Full-page, centered vertically on mobile

**Elements:**
- App icon: blue rounded square (#3A5CCC) with people icon, 72x72px
- Title: "NoPay" (line 1) + "FreeLunch" (line 2), 28px bold, centered
- Subtitle: "Nhap email de dang nhap" (line 1) + "hoac tao tai khoan moi." (line 2), 15px gray, centered
- Email input field
- "Gui ma OTP" button (primary blue, full width)
- Divider: "hoac"
- "Nhap mat khau" button (secondary gray, full width)

**OTP Flow:**
1. User nhap email -> tap "Gui ma OTP"
2. Supabase gui **ma 6 so** ve email (KHONG phai magic link)
3. Hien form nhap 6 so OTP
4. Verify thanh cong -> redirect ve Home

**Password Flow:**
1. Tap "Nhap mat khau" -> hien form email + password
2. Login thanh cong -> redirect ve Home

**Success criteria:**
- [ ] OTP gui **ma so**, khong gui link
- [ ] Login thanh cong redirect ve "/"
- [ ] Branding dung: "NoPay\nFreeLunch"

---

### 3.2 Home / Nhom (Groups List)

**Screen:** Tab 1, default screen after login

**Header:**
- Title: "Nhom" (28-30px bold, left-aligned)
- Right: blue "+" button (create group) + "Tham gia" text

**Content:**
- Debt summary chip: "Tong: Ban dang no X | Ban duoc no Y"
- Group cards (list, rounded 14px, white bg):
  - Left: colored avatar circle with group initials
  - Center: group name (bold) + "X thanh vien" (gray)
  - Right: net debt amount (red if owe, green if owed) + "Tra no" link if applicable

**Bottom tab bar:**
- 2 tabs: Nhom (people icon, active blue) + Tai khoan (person icon, gray)

**Empty state:**
- Large people icon (gray)
- "Chua co nhom nao" (20px bold)
- "Tao nhom de bat dau chia bill voi ban be." (15px gray)
- "Tao nhom moi" button (outline, blue border)

**Actions:**
- Tap group card -> Group Detail
- Tap "+" -> Create Group dialog
- Tap "Tham gia" -> Join Group dialog

**Success criteria:**
- [ ] Chi hien 2 tabs
- [ ] Group cards hien dung debt amount
- [ ] Empty state khi chua co group

---

### 3.3 Group Detail (Chat View)

**Screen:** Main interaction screen, chat-based

**Nav bar:**
- Back button "<" (blue)
- Center: group name (bold) + "X thanh vien" (gray, smaller)
- Right: settings gear icon (gray circle)

**Debt banner (conditional):**
- Red bg (#FFF3F0) if user owes: "Ban no [Name] [Amount]" + "Tra no" button
- Green bg (#F0FFF4) if user is owed: "[Name] no ban [Amount]" + "Nhan tien" button
- Hidden if no debt

**Chat feed:**
- Date dividers: "28 thang 1, 2026" (gray, centered)
- Bill cards (white bubble, rounded 14px):
  - Sender avatar (left, 34px circle)
  - Card: sender name + time, bill title, date, total amount
  - Net amount for current user (red/green)
- Transfer events: centered pill "#E8EDFF", "[Name] da chuyen [Amount] cho [Name]"
- Text messages: standard chat bubbles

**FAB (Floating Action Button):**
- Bottom right, blue (#3A5CCC), rounded, shadow
- "+ Them hoa don" text with receipt icon
- Tap -> triggers bill creation flow

**Success criteria:**
- [ ] Chat feed hien bill cards, transfers, text messages
- [ ] Debt banner hien dung net debt
- [ ] FAB luon hien o bottom right
- [ ] Real-time: bill moi tu nguoi khac hien ngay

---

### 3.4 Bill Creation - Chat Intent (Primary Flow)

**Trigger:** User go tin nhan trong group chat, VD: "500k an trua 6 nguoi"

**AI Parser (local regex, khong dung LLM):**
- Detect amount: "500k" -> 500,000d
- Detect description: "an trua" -> "an trua"
- Detect people: "6 nguoi" -> 6
- If du info -> hien Bill Confirm Sheet
- If thieu info -> hien AI Follow-up Card

**AI Follow-up Card:**
- Inline trong chat, truoc input bar
- Question: "Chia 500k cho an trua. Ban muon chia nhu nao?"
- 3 options:
  - A: "Bill mo" (chua biet may nguoi)
  - B: "Chia deu" (nhap so nguoi)
  - C: "Tuy chinh" (nhap tung nguoi)

**Success criteria:**
- [ ] "500k bun bo 6 nguoi" -> parse dung amount, description, people
- [ ] Hien follow-up khi thieu split type
- [ ] Tap option -> hien Bill Confirm Sheet

---

### 3.5 Bill Confirm Sheet (Half-Sheet Bottom Modal)

**Trigger:** Sau khi AI parse du info hoac user chon follow-up option

**Design:** Half-sheet tu duoi len, rounded top 20px, shadow, backdrop 40% black

**Elements (from top to bottom):**
- Drag handle (gray bar, centered, 36x4px)
- Header: "* Xac nhan bill" (bold) + "X" close button (gray)
- Row: "Mo ta" | description text
- Row: "Chia cho" | member avatars (up to 5, 22px circles) + "+N" if more
- Row: "Moi nguoi" | per-person amount (blue, bold)
- Row: "Nguoi tra" | payer avatar + name ("Ban" if current user)
- Divider line (#E5E5EA)
- Upload row: "Them anh bill" button (gray bg, centered)
- "Tao bill" button (blue, full width, 48px height, rounded 12px)

**On confirm:**
1. Create bill + participants + debts
2. Insert bill_card message in chat
3. Close sheet
4. Toast "Da tao bill!"
5. Notify participants via Telegram

**Success criteria:**
- [ ] Sheet hien member avatars dung
- [ ] Per-person amount = floor(total / people)
- [ ] Confirm tao bill + debts + chat message
- [ ] Sheet dong sau khi confirm

---

### 3.6 Bill People & Amount Sheet (Full Bottom Sheet)

**Trigger:** Khi user muon chon nguoi va so tien chi tiet

**Design:** Full-height bottom sheet voi dim overlay

**Elements:**
- Drag handle
- Header: "Chon nguoi & so tien" + "Xong" (blue text, right)
- Split mode tabs (pill buttons, gap 8px):
  - "Chia deu" (active: blue bg #EEF2FF, blue text)
  - "Chia %" (inactive: gray bg #F2F2F7)
  - "Tuy chinh" (inactive: gray bg #F2F2F7)
- Total row: "Tong" | "500.000d" (bold)
- Member list (each row 60px height):
  - Avatar circle (36px, colored) with initial letter
  - Name (bold 14px) + subtitle if applicable
  - Amount pill (gray bg, blue text, rounded 8px)
  - Checkbox circle (22px, blue if checked, gray if unchecked)
- Separator line
- Remainder row: "Con lai chua chia" | "0d" (green if 0)
- "Xac nhan" button (blue, full width, 52px, rounded 14px)

**Split logic:**
- **Chia deu:** total / selected_count, remainder distributed +1 to first N
- **Chia %:** each person's % of total (sum must = 100%)
- **Tuy chinh:** manual input per person (sum must = total)

**Success criteria:**
- [ ] Toggle split modes thay doi UI tuong ung
- [ ] Chia deu: auto-calculate per person
- [ ] Remainder row hien "0d" khi chia het
- [ ] Xac nhan chi khi sum = total

---

### 3.7 Open Bill (Bill Mo)

**Use case:** An trua, chua biet ai tham gia. Moi nguoi check-in khi den.

**Creation:** Via chat intent (chon "Bill mo") hoac form

**Open Bill Card (trong chat):**
- Orange theme (#FF9500 avatar, #FFF8EC background)
- Badge: "Bill mo - N nguoi da check-in"
- Info: payer, title, total
- Button: "Toi co an" (check-in) hoac "Da check-in" (disabled)
- Admin actions: "+ Them nguoi", "Dong bill"

**Check-in flow:**
1. Tap "Toi co an" -> insert bill_checkins record
2. Button changes to "Da check-in"
3. Notify payer

**Close bill flow:**
1. Payer/admin tap "Dong bill"
2. Calculate: total / checkin_count
3. Create debts for all checked-in members (except payer)
4. Bill status -> "closed"
5. Notify all debtors

**Add people sheet:**
- Bottom sheet with group member list
- Search input: "Tim thanh vien..."
- Members: tap to add/remove with "Them" badge
- Section: "Nguoi ngoai nhom" -> add by name (no account needed)

**Success criteria:**
- [ ] Check-in tao record va update UI
- [ ] Close bill tao debts dung per-person amount
- [ ] Guests (khong co account) van check-in duoc
- [ ] Chi payer/admin thay "Dong bill"

---

### 3.8 Debt Tracking (trong Group Detail)

**Hien thi:** Debt banner o top cua group detail

**Debt banner logic:**
- Query all debts trong group where current user la debtor hoac creditor
- Net per person: sum(debts I owe them) - sum(debts they owe me)
- Show largest net debt
- Red if I owe, green if owed to me

**Tra no flow:**
1. Tap "Tra no" tren debt banner
2. Navigate to Transfer page (/transfer/[debtId])
3. Hien QR code + bank info
4. User chuyen tien qua bank app
5. Tap "Da chuyen tien" -> mark payment pending
6. Creditor nhan Telegram notification
7. Creditor confirm -> debt status = "confirmed"

**Success criteria:**
- [ ] Debt banner hien dung net debt amount
- [ ] Transfer page hien QR + bank info
- [ ] Payment confirmation 2 chieu (debtor claim + creditor confirm)

---

### 3.9 Transfer / Payment Page

**Screen:** Full page, accessible from debt "Tra no" button

**Elements:**
- Header: "Chuyen tien" + back button
- Bill info: title + date
- Amount display: large bold amount + "cho" + creditor name/avatar
- QR Card (if creditor has bank info):
  - QR code image (VietQR standard)
  - Bank name
  - Account number (with copy button)
  - Account holder name
  - Action buttons: "Luu QR" | "Chia se" | Bank app deep link
- CTA: "Da chuyen tien" button (blue, full width)

**No bank info state:**
- Message: "Nguoi nhan chua lien ket ngan hang"
- Manual transfer instructions

**Success criteria:**
- [ ] QR generate dung voi bank info cua creditor
- [ ] Copy account number hoat dong
- [ ] "Da chuyen tien" tao payment_confirmation record
- [ ] Notify creditor qua Telegram

---

### 3.10 Tai khoan (Account)

**Screen:** Tab 2

**Header:** "Tai khoan" (20px bold, centered)

**Profile section:**
- Avatar circle (large, colored bg, initials)
- Display name (bold) + email (gray)
- Phone icon + "Sua" button

**Bank section:**
- Label: "NGAN HANG" (gray, 11px, uppercase)
- Bank card (white, rounded 14px):
  - Bank icon + "Tai khoan ngan hang" + chevron
  - Sub-row: bank name + masked account (****XXXX) + "Da lien ket" badge
  - OR: "Chua lien ket" + "Lien ket ngay" button (blue)

**Link section:**
- Label: "LIEN KET" (gray, 11px, uppercase)
- Telegram card: Telegram icon + "Telegram" + "Lien ket" button
  - If linked: "Da lien ket" badge

**Sign out:**
- Bottom: red text "Dang xuat" with logout icon

**Success criteria:**
- [ ] Hien dung profile info
- [ ] Edit name hoat dong
- [ ] Bank linking: save bank_name, account_no, account_name
- [ ] Telegram linking: redirect to bot
- [ ] Sign out clears session

---

## 4. Bill Splitting Logic (Core Business Rules)

### 4.1 Standard Bill (Chia deu)
```
Input: total_amount, paid_by, participants[]
Per person = floor(total_amount / participants.length)
Remainder = total_amount - (per_person * participants.length)
First [remainder] participants get +1 VND

Debts created:
  For each participant (except payer):
    debt = { debtor: participant, creditor: payer, amount: their_share }
```

### 4.2 Custom Split (Tuy chinh)
```
Input: total_amount, paid_by, amounts: { member_id: amount }
Validation: sum(amounts) MUST equal total_amount
Debts: same as above but with custom amounts
```

### 4.3 Open Bill
```
Creation: bill_type = "open", status = "active"
Check-in: members tap "Toi co an" -> bill_checkins record
Close: per_person = floor(total / checkin_count)
Debts: created for all checked-in members except payer
```

### 4.4 Net Debt Calculation
```
For user A and user B:
  a_owes_b = sum(debts where debtor=A, creditor=B, status=pending)
  b_owes_a = sum(debts where debtor=B, creditor=A, status=pending)
  net = b_owes_a - a_owes_b
  If net > 0: "B owes A [net]"
  If net < 0: "A owes B [abs(net)]"
```

---

## 5. Notifications (Telegram)

| Event | Recipient | Message |
|-------|-----------|---------|
| Bill created | All debtors | "Ban no [Payer] [Amount] cho [Title]" |
| Payment claimed | Creditor | "[Debtor] bao da chuyen [Amount]" |
| Payment confirmed | Debtor | "[Creditor] da xac nhan nhan [Amount]" |
| Open bill created | Group members | "[Creator] tao bill mo: [Title]" |
| Check-in | Payer | "[Member] da check-in vao [Title]" |
| Bill closed | All debtors | "Bill [Title] da dong. Moi nguoi: [Amount]" |

---

## 6. Design Tokens

| Token | Value |
|-------|-------|
| Primary Blue | #3A5CCC |
| Success Green | #34C759 |
| Error Red | #FF3B30 |
| Warning Orange | #FF9500 |
| Text Primary | #1C1C1E |
| Text Secondary | #8E8E93 |
| Text Tertiary | #AEAEB2 |
| Border | #E5E5EA |
| Background | #F2F2F7 |
| Card Background | #FFFFFF |
| Font | Inter (system fallback) |
| Corner Radius (card) | 14px |
| Corner Radius (sheet) | 20px |
| Corner Radius (avatar) | 50% |
| Tab bar height | 56px + safe-area |

---

## 7. QC Verification Checklist

Evaluator MUST verify ALL items below via Playwright:

### P0 - Critical
- [ ] Login voi OTP (ma 6 so, KHONG phai link)
- [ ] Login voi password
- [ ] Chi 2 tabs: Nhom + Tai khoan
- [ ] Tao group
- [ ] Tham gia group bang invite code
- [ ] Tao bill qua chat ("500k bun bo 6 nguoi")
- [ ] Bill confirm sheet hien dung va tao bill
- [ ] Debt hien trong group detail
- [ ] Transfer page hien QR

### P1 - Important
- [ ] Open bill: check-in + close
- [ ] Payment confirmation 2 chieu
- [ ] Telegram notification gui dung
- [ ] Bank linking trong Account
- [ ] Edit display name
- [ ] Sign out

### P2 - Nice to have
- [ ] Empty states (no groups, no debts)
- [ ] Loading skeletons
- [ ] Error handling (network, invalid input)
- [ ] Real-time updates (bill tu nguoi khac)
