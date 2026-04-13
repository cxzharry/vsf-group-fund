# Epic 3: Giao Dịch (Transactions)

US-3.1 định nghĩa **Create Bill Sheet** — half-sheet với đủ field cần thiết để tạo bill. Sheet này dùng chung cho 2 flow:
- **Flow A — Manual**: US-3.1. Mở sheet **trống trơn** qua nút ➕, user điền từ đầu.
- **Flow B — AI Quick**: US-3.3. Gõ tin nhắn, AI parse, mở chính sheet của US-3.1 với data **prefilled**.

US-3.2 là **Chọn người chia** — picker chọn thành viên tham gia bill + customize cách chia (đều / % / tuỳ chỉnh), mở từ link "Chọn thành viên" trong Create Bill Sheet.

US-3.4 là **Bill Details & Actions** — hiển thị bill trong Group Detail feed + tap vào để edit/xoá.

Cả 2 flow tạo đều có thể chọn **Bill mở (US-3.5)** thay vì bill thường.

---

## US-3.1: Tạo bill thủ công (Create Bill Sheet)

### Logic

**Entry point:** Tap nút ➕ trong chat input bar của group detail.

**Flow:**
1. Tap ➕ → mở Create Bill Sheet ở trạng thái blank
2. User điền các field required
3. Khi đủ required → CTA "Tạo" enabled
4. Tap "Tạo" → validate → tạo bill + bill_participants + debts + chat_message
5. Toast "Đã tạo bill" → sheet đóng, feed scroll tới bill card mới

**Fields:**

| Field | Required | Default | Ghi chú logic |
|-------|----------|---------|---------|
| Loại bill | Yes | Chia tiền | Toggle "Chia tiền" \| "Chuyển tiền". Chuyển tiền → đóng sheet, redirect US-3.6 |
| Số tiền | Yes | — | Number, VND format, > 0 |
| Mô tả | Yes | — | Text, trim().length > 0 |
| Người trả | Yes | currentMember | member_id từ group |
| Chia cho | Yes | (mở US-3.2) | Result từ US-3.2 picker |

**Phân loại:** auto-infer từ description (US-3.9), không phải field nhập tay.

**Validation rules:**
- `amount > 0`
- `description.trim().length > 0`
- `payerId !== null`
- `peopleCount > 0` (từ US-3.2 result)

CTA "Tạo" enabled chỉ khi tất cả 4 rule pass.

**Submit side effects:**
- INSERT `bills` row
- INSERT `bill_participants` rows cho mỗi người tham gia (có member_id)
- INSERT `debts` rows: cho mỗi participant !== payer, amount = per-person
- INSERT `chat_messages` row với `metadata.bill_id` + `metadata.category`
- Trigger Telegram notify cho debtors (US-3.6 channel)

**Logic edge cases:**
- Người trả KHÔNG nằm trong "Chia cho" → hợp lệ, payer không có debt
- Split customize qua US-3.2 rồi tổng !== amount → CTA disabled
- Tap backdrop/✕ → discard data, không confirm dialog
- Submit fail (network) → toast error, giữ sheet mở với data nguyên

### UI/UX

**Layout:** Half-sheet từ dưới, rounded top 20px, shadow blur 20px, backdrop 40% đen, max-height ~85vh.

**Components (top → bottom):**
- Drag handle 36×4px #D1D1D6
- Header row: title "Tạo bill" 15px bold center + ✕ close button
- Bill type toggle (2 pill): "Chia tiền" active `#EEF2FF/#3A5CCC` | "Chuyển tiền" inactive `#F2F2F7/#8E8E93`
- Row "Số tiền" — right-aligned, 22px bold, `#3A5CCC` khi có số, placeholder "0đ" `#AEAEB2`
- Row "Mô tả" — right-aligned, 13px `#1C1C1E`, placeholder "VD: Ăn trưa team" `#AEAEB2`
- Row "Người trả" — avatar 22px + "{Tên} (bạn)" 14px `#1C1C1E` + chevron `›`
- Row "Chia cho" — link "Chọn thành viên" 13px `#3A5CCC` gạch chân (no chevron). Khi đã chọn → "N người · Xđ/người" `#3A5CCC`
- Spacer `fill_container` đẩy CTA xuống đáy
- CTA "Tạo" full-width 48px — bg `#3A5CCC` text white khi enabled, bg `#C7C7CC` khi disabled

**Input accessory bar** (iOS) — khi focus Số tiền / Mô tả:
- Frame 402×40 pinned trên keyboard (y=650)
- Bg `#F2F2F7`, border-top `#E5E5EA`
- Input field trắng rounded 8px + caret `|`
- Số tiền: text `#3A5CCC` 16px bold
- Mô tả: text `#1C1C1E` 13px

**State variations:** blank · focus Mô tả · focus Số tiền · all filled (confirm-ready). CTA pinned đáy ở mọi state.

### Tiêu chí
- [ ] Nút ➕ trong chat input bar mở Create Bill Sheet blank
- [ ] Toggle "Chia tiền" default, "Chuyển tiền" redirect US-3.6
- [ ] Required: Số tiền, Mô tả, Người trả, Chia cho
- [ ] Điền đủ required → nút "Tạo" đổi sang màu xanh enabled
- [ ] Người trả default hiển thị "{Tên} (bạn)" cho currentMember
- [ ] "Chia cho" là link "Chọn thành viên" xanh gạch chân → mở US-3.2 Split Sheet
- [ ] Nút "Tạo" pinned ở đáy sheet, không nổi giữa màn
- [ ] Focus input → hiện input accessory bar trên keyboard
- [ ] Submit tạo bill + debts + chat_message + toast "Đã tạo bill"
- [ ] Huỷ (backdrop/✕) đóng sheet không confirm dialog

---

## US-3.2: Chọn người chia (Member Picker + Split Sheet)

### Logic

**Mục đích:** chọn chính xác ai tham gia bill (members + khách + anonymous slots), sau đó chia tiền cho họ.

**Entry:** US-3.1 tap link "Chọn thành viên".

**Input từ parent:**
- `knownCount: number | null` — số người AI parser đoán (US-3.3) hoặc null
- `preselected` — selection lần trước (nếu re-open)
- `groupMembers` — list member trong nhóm
- `payerId` — current payer
- `totalAmount` — tổng bill

**Return cho parent:**
- `selectedMemberIds: string[]`
- `guests: { name: string; amount: number }[]`
- `anonymousCount: number`
- `customSplits: Record<key, amount>` — chỉ set khi `splitMode === "custom"`
- `splitMode: "equal" | "custom"`

**Công thức:**
```
peopleCount = selectedMemberIds.length + guests.length + anonymousCount
perPerson (equal mode) = floor(totalAmount / peopleCount)
remainder = totalAmount - perPerson * peopleCount  // distributed +1đ to first N
```

**Split modes (2):**
- **Chia đều** (default): auto compute, không input
- **Tuỳ chỉnh (VND):** input thủ công per row, tổng phải = totalAmount

**Auto-switch rule:** Đang ở "Chia đều" + user sửa amount row bất kỳ → auto switch sang "Tuỳ chỉnh", giữ nguyên các giá trị, các row chưa sửa giữ baseline equal.

**Số người chia (anonymous slots):**
- Stepper N với default = `selectedMemberIds.length + guests.length`
- Tăng N → tạo anonymous slots (count vào per-person, KHÔNG có identity, KHÔNG tạo debt)
- Giảm N < (members + guests) → block, toast "Bỏ chọn người trước nếu muốn giảm"
- Check thêm member/guest → N auto +1; uncheck → N auto −1 (min 1)

**Khách (guest):**
- Có name, KHÔNG có member_id
- Count vào peopleCount, ảnh hưởng per-person
- KHÔNG tạo debt row khi submit bill (untracked)
- Max 10 guest/bill

**Case matrix:**

| # | Tình huống | knownCount | Default | Behaviour |
|---|---|---|---|---|
| A | Blank manual full nhóm | null | All checked | Confirm luôn ok |
| B | Manual subset | null | All checked | User uncheck bớt |
| C | AI match group size | `= N` | All checked | Hint "đúng cả nhóm" |
| D | AI < group size | `< N` | Clear all | Banner "Hãy chọn ai tham gia" |
| E | AI > group size | `> N` | All members | Banner "Thêm khách?" |
| F | Không biết ai | — | — | Banner "Chuyển Bill mở (US-3.5)?" |
| G | Có khách ngoài nhóm | — | — | Section "Khách" + input |
| H | Payer không tham gia | — | — | Payer uncheck mình, không nhận chia |
| I | 1 người duy nhất | — | — | OK, nhận toàn bộ |
| J | 0 người | — | — | Disabled |

**Validation:**

| State | Điều kiện | Effect |
|---|---|---|
| Disabled | `peopleCount === 0` | CTA disabled |
| Warning | `knownCount !== peopleCount` | Banner cam, vẫn confirm được |
| Error | Custom: `total > amount` | CTA disabled, "Vượt {diff}đ" |
| Error | Custom: `total < amount` | CTA disabled, "Còn {diff}đ" |
| OK | Match | CTA enabled |

**Logic edge cases:**
- Custom mode, 1 row = 0đ → cho phép (0 debt row)
- Payer uncheck mình → valid
- Mở lại sheet → restore `preselected`
- Group 1 member → default chọn user, gợi ý guest/anonymous
- `totalAmount = 0` → cho chọn người, hiện "—đ/người"
- "Tuỳ chỉnh" → tap "Chia đều" → confirm dialog "Reset về chia đều?"

### UI/UX

**Layout:** Full bottom sheet (~85% height), dim backdrop, handle trên đầu, padding `[6,0,34,0]`.

**Header:**
- Title "Chia tiền" 17px bold
- Subtitle "Tổng {amount}đ" 13px `#8E8E93`
- ✕ close top-right

**Top tabs pill (2 mode):** "Chia đều" active `#EEF2FF/#3A5CCC` | "Tuỳ chỉnh" inactive `#F2F2F7/#8E8E93`

**Số người chia row** (đầu sheet, trên list member):
- Label "Số người chia" 13px `#8E8E93`
- Stepper bên phải: nút `−` 28×28 `#F2F2F7` + value 17px bold + nút `+` 28×28 `#3A5CCC`

**Banner (conditional, dưới tabs):**
| Case | Bg | Text color | Nội dung |
|---|---|---|---|
| C | `#EEF2FF` | `#3A5CCC` | "AI đoán {N} người, đúng cả nhóm ✓" |
| D | `#EEF2FF` | `#3A5CCC` | "AI đoán {K} người. Hãy chọn ai tham gia." |
| E | `#FFF8EC` | `#FF9500` | "AI đoán {K} người nhưng nhóm có {N}. Thêm khách?" |
| F | `#FFF3F0` | `#FF3B30` | "Chưa biết ai tham gia? → Chuyển Bill mở" |

**Section "THÀNH VIÊN NHÓM":**
- Label uppercase 10px `#8E8E93`
- Member row 56px: avatar 36px màu hash + tên 14px semibold ("Hai Do (bạn)" cho self) + amount pill + checkbox 22px
- Amount pill: bg `#F2F2F7`, text 13px bold; mode đều = display, mode custom = input field
- Checkbox checked: bg `#3A5CCC` + ✓ trắng; unchecked: bg trắng + border 1.5px `#D1D1D6`

**Section "KHÁCH KHÔNG TRONG NHÓM":**
- Label uppercase 10px `#8E8E93`
- Guest rows (avatar initial + tên + amount + ✕ xoá)
- Input row: text input "Tên khách" + nút `+ Thêm` `#EEF2FF/#3A5CCC` (disabled khi input rỗng / ≥10)

**Anonymous slot row** (khi `anonymousCount > 0`):
- Single row mờ (opacity 0.7): avatar xám "?" + "Người ẩn danh × {N}" + per-person amount
- Không checkbox

**Footer sticky:**
- Trái vertical: label "Còn lại chưa chia" 12px `#8E8E93` + value 17px bold (xanh `#34C759` = 0, cam `#FF9500` thiếu, đỏ `#FF3B30` vượt)
- Phải: nút "Xác nhận" 52px width 160 — `#3A5CCC` enabled, `#C7C7CC` disabled

**Frames trong Pencil:** Case A (default), Case D (AI ít), Case E (AI nhiều), Case F (gợi ý Bill mở).

### Tiêu chí
- [ ] Mở từ link "Chọn thành viên" trong Create Bill Sheet
- [ ] Case A (blank full group): all checked default, confirm luôn được
- [ ] Case C (AI match): hint "đúng cả nhóm" hiện
- [ ] Case D (AI ít hơn): clear preselection, banner yêu cầu chọn
- [ ] Case E (AI nhiều hơn): banner gợi ý thêm khách
- [ ] Case F (bill mở): banner gợi ý chuyển US-3.5
- [ ] Case G (khách): thêm/xoá khách, count vào per-person, không tạo debt
- [ ] Case H (payer uncheck): hợp lệ, payer không nợ
- [ ] Toggle 2 modes: Chia đều / Tuỳ chỉnh
- [ ] Auto-switch về Tuỳ chỉnh khi user sửa amount của row bất kỳ
- [ ] Tuỳ chỉnh: validate tổng = total
- [ ] Số người chia stepper: tăng tạo anonymous slots, giảm bị block khi < members+guests
- [ ] Anonymous slots count vào per-person, không tạo debt
- [ ] 0 người chọn → disabled, hint "Chọn ít nhất 1 người"
- [ ] Max 10 khách/bill
- [ ] Quay về Create Bill Sheet, row "Chia cho" hiện "{N} người · {per}đ/người"

---

## US-3.3: Tạo nhanh bill qua chat (AI Quick Parse)

### Function
Entry point: Chat input bar trong group detail. User gõ tin nhắn tự nhiên.

Flow:
1. User gõ trong chat input: VD "500k ăn trưa 6 người"
2. AI Parser (regex local, không LLM) extract:
   - **Số tiền**: "500k" → 500.000đ, "1tr2" → 1.200.000đ, "350000" → 350.000đ
   - **Mô tả**: "ăn trưa", "bún bò", "café"
   - **Số người**: "6 người", "cả team" (-1 = group size)
3. Parse result xử lý:
   - **Đủ info (có amount + description)** → mở thẳng **Create Bill Sheet (US-3.1)** với dữ liệu prefilled từ parser
   - **Thiếu split type / description** → hiện **AI Follow-up Card** inline trước chat input
   - **Không có số tiền** → gửi như tin nhắn text thường, không trigger parser
4. User xác nhận ở Create Bill Sheet → tạo bill (cùng submit logic với US-3.1)

### Điểm khác biệt với US-3.1
- **Giống**: dùng chung **Create Bill Sheet (US-3.1)**, cùng field, cùng validation, cùng submit logic
- **Khác**:
  - Entry: gõ tin nhắn trong chat input (không tap ➕)
  - Initial data: prefilled từ AI parser (description, amount, peopleCount, category inferred)
  - Có thêm bước **AI Follow-up Card** nếu parser thiếu info
  - Nhanh hơn vì đã có sẵn data

### Edge cases
- Tin nhắn không có số tiền → gửi như chat bình thường, không parse
- Chỉ có số tiền, không có mô tả → trigger Follow-up Card hỏi "Chi tiêu cho gì?"
- Số tiền < 1.000đ hoặc > 1 tỷ → bỏ qua, coi như text thường
- "cả team" → peopleCount = số members hiện tại trong group
- Parse nhầm (VD "500k tiền nhà" — số 500 là nhà không phải tiền) → user có thể edit Mô tả trong Create Bill Sheet (US-3.1)

### UX/UI
**AI Follow-up Card** — inline card hiện trên chat input bar khi parse thiếu info:
- Nền trắng, rounded 14px, border-top #E5E5EA
- Text: "Chia 500k cho ăn trưa. Bạn muốn chia như nào?" (14px #1C1C1E)
- Nếu thiếu description: "Chia 500k. Chi tiêu cho gì? Bạn có thể chọn cách chia bên dưới hoặc gõ lại chi tiết hơn."
- 3 pill buttons: "Bill mở" | "Chia đều" | "Tuỳ chỉnh" (nền #F2F2F7, 13px, rounded full, padding 8×14px)
- Chọn 1 option → mở **Create Bill Sheet (US-3.1)** với data từ parser + option đã chọn

### Tiêu chí
- [ ] "500k bún bò 6 người" → parse đúng amount=500000, description="bún bò", people=6
- [ ] "1tr2 ăn trưa" → amount=1200000
- [ ] "Chào mọi người" (tin nhắn thường) → KHÔNG trigger parser, gửi như chat
- [ ] Thiếu split type → AI Follow-up Card hiện với 3 options
- [ ] Chọn option → mở Create Bill Sheet (US-3.1) với prefilled data
- [ ] User có thể edit description + amount trong sheet trước khi submit

---

## US-3.4: Bill Details & Actions (hiển thị trong Group Detail)

### Function
Sau khi tạo bill (qua US-3.1 hoặc US-3.3), bill xuất hiện dưới dạng **bill card** trong chat feed của Group Detail. User có thể:
- **Xem** thông tin cơ bản của bill trên card inline
- **Tap vào card** → mở **Bill Details Sheet** xem full info
- **Menu ⋯** (owner only) → "Sửa bill" (US-3.8) hoặc "Xoá bill" (US-3.7)

### Bill Card (inline trong chat feed)

Mỗi bill hiện như 1 message card bên trong chat:
- **Header row**: emoji category (nếu !== khac) + tên bill (15px bold #1C1C1E) + menu ⋯ (owner only, top-right)
- **Amount**: tổng tiền (17px bold #3A5CCC)
- **Metadata row** (13px #8E8E93): "Người trả: {payer}" · "{n} người" · "mỗi người Xđ"
- **Timestamp + badge row** (11px #8E8E93): thời gian tương đối · "Đã sửa" (nếu updated)
- **Status indicator** (phía dưới): 
  - "Bạn nợ {payer} Xđ" (red) nếu current user là debtor
  - "{payer} nợ bạn Xđ" (green) nếu current user là creditor của line này
  - "Đã thanh toán" (gray) nếu tất cả debts của bill đã confirmed

Card style: `bg-white rounded-[14px] p-4 shadow-sm`

### Bill Details Sheet (tap vào card)

Half-sheet full-info:
- Header: tên bill + ✕ close
- Section "Thông tin":
  - Số tiền tổng (large)
  - Người trả (avatar + tên)
  - Loại chia (chia đều / tuỳ chỉnh / bill mở)
  - Phân loại (emoji + label)
  - Thời gian tạo
  - Thời gian sửa cuối (nếu có)
- Section "Chi tiết chia tiền":
  - Mỗi participant row: avatar + tên + số tiền nợ + status badge (pending/confirmed)
- Section "Ảnh bill" (nếu có)
- Footer actions (owner only):
  - "Sửa bill" (outline button) → US-3.8
  - "Xoá bill" (outline đỏ) → US-3.7

### Menu ⋯ (chỉ hiện khi owner)
Trên bill card top-right, tap → popover menu:
- "Sửa bill" → mở Create Bill Sheet với `mode="edit"` (US-3.8)
- "Xoá bill" (đỏ) → confirm dialog → cascade delete (US-3.7)

### Edge cases
- Non-owner → menu ⋯ KHÔNG hiện, không có action buttons trong details sheet
- Bill có payment_confirmation → Sửa bị block với toast (US-3.8 guard)
- Bill deleted trong lúc đang xem details → sheet đóng + toast "Bill đã bị xoá"
- Bill status "closed" (bill mở đã đóng) → hiện full participant list với amounts

### UX/UI — Bill Card
Card trong chat feed:
- Background: white
- Rounded: 14px
- Padding: 16px
- Shadow: `shadow-sm`
- Avatar sender (left-side 32px)
- Content bên phải: header + amount + metadata + status

### UX/UI — Bill Details Sheet
Half-sheet, rounded top 20px, same style as US-3.1 Create Bill Sheet nhưng **read-only** mode.

### Tiêu chí
- [ ] Bill card hiện trong chat feed với full info cơ bản
- [ ] Category emoji + label hiện đúng (US-3.9)
- [ ] "Đã sửa" badge hiện khi updated_at > created_at + 60s (US-3.8)
- [ ] Tap card → mở Bill Details Sheet
- [ ] Owner thấy menu ⋯ + action buttons, non-owner không
- [ ] Status indicator chính xác (bạn nợ / họ nợ / đã xong)
- [ ] Menu "Sửa" → mở US-3.8 edit flow
- [ ] Menu "Xoá" → mở US-3.7 confirm dialog

---

## US-3.5: Bill mở (Open Bill)

### Function
Flow đặc biệt cho trường hợp chưa biết ai tham gia lúc tạo (VD: "ai ăn thì check-in sau").

Entry points:
- US-3.1 Manual: bật toggle "Bill mở" trong Create Bill Sheet
- US-3.3 AI Quick: chọn option "Bill mở" trong AI Follow-up Card

1. Tạo: bill_type = "open", status = "active", KHÔNG tạo debts ngay
2. Check-in: thành viên tap "Tôi có ăn" → tạo bill_checkins row
3. Thêm khách: guest_name (không cần tài khoản, không có member_id)
4. Đóng bill: payer/admin tap "Đóng bill" → tính per_person = floor(tổng / checkin_count), tạo debts cho tất cả trừ payer, remainder +1 cho N đầu
5. Chỉ payer HOẶC group admin được đóng bill
6. Gửi Telegram notify cho tất cả debtors

### Edge cases
- Check-in 2 lần → chặn (unique constraint bill_id + member_id)
- Đóng bill 0 check-in → error "Chưa có ai check-in"
- Khách check-in → tính chi phí nhưng không tạo debt (không có member_id)
- Payer tự check-in → tính chi phí chia, nhưng không tạo debt cho chính mình
- Đóng bill rồi → không cho check-in tiếp, card chuyển trạng thái

### UX/UI
**Bill mở card** trong chat feed:
- Avatar cam #FF9500 (icon: doanh thu/lửa)
- Nền #FFF8EC (cam nhạt)
- Badge "Bill mở · N check-in" (text 11px)
- Nút "Tôi có ăn" (outline #FF9500) hoặc "Đã check-in" (filled #FF9500 + icon ✓)
- Nút "Đóng bill" (chỉ payer/admin thấy, #FF3B30 outline)
- Nút "Thêm người" → mở Sheet thêm người/khách

**Sheet thêm người** (half-sheet):
- Handle + "Thêm người vào bill"
- Search bar
- Member list (avatar + tên + checkbox)
- Divider "Khách không trong nhóm"
- Input "Tên khách" + nút "Thêm"

### Tiêu chí
- [ ] Check-in tạo record + update UI realtime
- [ ] Đóng bill tạo debts đúng, remainder distributed
- [ ] Khách check-in được (không tạo debt)
- [ ] Chỉ payer/admin thấy nút "Đóng bill"
- [ ] Check-in trùng → chặn
- [ ] Telegram notify gửi sau mỗi event

---

## US-3.6: Chuyển tiền / Thanh toán

### Function
Entry point: tap nút "Trả nợ" từ debt banner/card.

1. Mở Transfer page với debt info
2. QR tạo từ VietQR API với bank info của creditor
3. Deep link mở app ngân hàng local (nếu có)
4. User tap "Đã chuyển tiền" → tạo payment_confirmation (status: pending)
5. Debt banner chuyển sang "Chờ xác nhận" (vàng #FFF8EC #FF9500)
6. Chủ nợ nhận thông báo, tap "Đã nhận tiền" → debt.status = "confirmed", payment_confirmation.status = "confirmed"
7. Notify Telegram 2 chiều

### Edge cases
- Creditor chưa liên kết ngân hàng → hiện "Người nhận chưa liên kết ngân hàng" + hướng dẫn
- Copy số TK → toast "Đã sao chép"
- Network error khi tạo confirmation → toast error, cho phép retry
- Chủ nợ reject → debt về pending, payment_confirmation.status = "rejected"

### UX/UI
**Transfer page:**
- Nav: back chevron + "Chuyển tiền" 17px bold center
- Amount block: số tiền lớn 32px bold #1C1C1E + "cho" 13px + avatar 44px + tên
- QR card (trắng, rounded 14px, padding 20px):
  - QR image 200×200px center
  - Bank info rows: tên ngân hàng, số TK (+ nút copy), tên chủ TK
- Action row: "Lưu QR" (outline) | "Chia sẻ" (outline) — 2 nút side by side
- CTA "Đã chuyển tiền" #3A5CCC 52px full-width

### Tiêu chí
- [ ] QR đúng bank info creditor
- [ ] Copy số TK hoạt động → toast
- [ ] "Đã chuyển tiền" tạo payment_confirmation
- [ ] "Lưu QR" download actual PNG blob
- [ ] Thông báo Telegram cho chủ nợ
- [ ] Hiện thông báo khi creditor chưa có bank info
- [ ] Sau tap "Đã chuyển tiền" → debt banner chuyển sang "Chờ xác nhận"

---

## US-3.7: Xoá bill

### Function
Chủ bill (bill.paid_by) có thể xoá bill đã tạo. Xoá cascade toàn bộ data liên quan.

Flow:
1. Trên bill card trong chat feed, owner tap menu ⋯ (3-dot)
2. Menu hiện 2 option: "Sửa bill" (US-3.8) | "Xoá bill" (đỏ)
3. Tap "Xoá bill" → dialog xác nhận "Xoá bill? Thao tác này không thể hoàn tác"
4. Confirm → DELETE cascade:
   - `debts` where `bill_id`
   - `bill_participants` where `bill_id`
   - `bill_checkins` where `bill_id`
   - `bills` row
   - `chat_messages` where `metadata.bill_id` (removes bill card from feed)
5. Toast "Đã xoá bill" + local state update (remove từ bills list + chat feed)

### Edge cases
- Không phải owner → menu ⋯ không hiện
- Bill có payment_confirmation → VẪN cho xoá (v1 — có thể block ở future)
- Network error khi xoá → toast error, giữ nguyên state

### UX/UI
**Menu ⋯ trên bill card** (chỉ hiện khi `bill.paid_by === currentMember.id`):
- Button 28×28px ở góc top-right của bill card
- Icon 3 dot dọc, color #8E8E93
- Tap → popover menu (whitebg, shadow, rounded 10px):
  - "Sửa bill" (text #1C1C1E)
  - Divider
  - "Xoá bill" (text #FF3B30)
- Tap outside → close menu

**Confirm dialog:**
- Overlay 40% đen
- Dialog card trắng rounded 14px, padding 20px
- Title "Xoá bill?" 17px bold #1C1C1E
- Body "Thao tác này không thể hoàn tác" 14px #8E8E93
- 2 buttons row: "Huỷ" (outline) | "Xoá bill" (bg #FF3B30 white)

### Tiêu chí
- [ ] Menu ⋯ chỉ hiện cho owner
- [ ] Confirm dialog hiện trước khi xoá
- [ ] Cascade delete đúng 5 tables
- [ ] Chat feed update ngay sau xoá
- [ ] Toast "Đã xoá bill"

---

## US-3.8: Sửa bill

### Function
Chủ bill có thể sửa mô tả + số tiền + category. KHÔNG cho sửa split type / participants (tránh corrupt audit trail).

Flow:
1. Menu ⋯ → tap "Sửa bill"
2. **Guard**: query `payment_confirmations` cho debts của bill. Nếu có row → toast error "Không thể sửa — bill có xác nhận thanh toán" và abort
3. Mở **Create Bill Sheet (US-3.1)** ở `mode="edit"`:
   - Title đổi thành "Sửa bill"
   - CTA đổi thành "Lưu thay đổi"
   - Prefill: description, amount từ bill hiện tại
   - ẨN "Loại bill" toggle (không cho đổi Chia tiền ↔ Chuyển tiền)
   - ẨN row "Chia cho" và "Người trả" (không cho edit để tránh corrupt audit trail)
4. User edit → tap "Lưu thay đổi"
5. UPDATE:
   - `bills.title`, `bills.total_amount`, `bills.updated_at` (trigger)
   - `chat_messages.metadata.category` (nếu đổi category do re-infer từ description mới)
   - Recompute per-person cho pending debts: `newPer = floor(newTotal / numDebtors)`, remainder +1 VND cho N đầu
   - UPDATE `debts.amount` + `debts.remaining` cho debts status=pending (KHÔNG touch confirmed/partial)
6. Toast "Đã cập nhật bill"

### "Đã sửa" badge
Bill card hiện badge " · Đã sửa" inline cạnh timestamp khi `bills.updated_at > bills.created_at + 60s` (ignore immediate post-create saves).

Style: inline text, `text-[11px] text-[#8E8E93]`, không pill/bg/icon (quiet metadata).

### Edge cases
- Có payment_confirmation → abort với toast
- Amount = 0 hoặc description trống → nút disabled trong sheet
- Network error khi update → toast error, rollback local state
- Không phải owner → menu ⋯ không hiện

### UX/UI
Y hệt **US-3.1 Create Bill Sheet** với `mode="edit"`:
- Header title: "Sửa bill" (thay vì "Tạo bill")
- CTA button: "Lưu thay đổi" (thay vì "Tạo")
- Ẩn bill type toggle (locked Chia tiền)
- Ẩn row "Chia cho" (read-only)
- Ẩn row "Người trả" (read-only)
- Prefill từ bill hiện tại

### Tiêu chí
- [ ] Menu ⋯ "Sửa bill" chỉ cho owner
- [ ] Guard chặn edit khi có payment_confirmation
- [ ] Sheet mở với prefilled data
- [ ] Submit update bills + debts (pending only)
- [ ] "Đã sửa" badge hiện trên card sau edit
- [ ] Toast "Đã cập nhật bill"

---

## US-3.9: Phân loại chi tiêu (Expense Categories)

### Function
Mỗi bill có 1 category giúp phân loại chi tiêu (enable analytics sau này). Category **không hiển thị picker trong Create Bill Sheet** (US-3.1) để giảm thao tác — chỉ auto-infer từ description.

**6 categories cố định** (v1, chưa cho custom):
| ID | Emoji | Label | Keywords |
|----|-------|-------|----------|
| `an_uong` | 🍽️ | Ăn uống | an, com, bun, pho, lau, bbq, cafe, tra sua, bia, nhau, nuoc |
| `di_lai` | 🚗 | Đi lại | xe, taxi, grab, xang, may bay, ve |
| `luu_tru` | 🏠 | Lưu trú | khach san, homestay, airbnb, phong, nha nghi |
| `mua_sam` | 🛒 | Mua sắm | mua, do, quan ao, sieu thi, cho |
| `giai_tri` | 🎮 | Giải trí | karaoke, game, phim, rap, bar |
| `khac` | 📋 | Khác | (fallback) |

### Storage
Category lưu trong `chat_messages.metadata.category` (không cần migration bills table).

### Auto-infer
Khi tạo bill:
- `inferCategory(description)` scan keywords của mỗi category, trả về ID đầu tiên match
- No match → `khac`

Category được re-infer mỗi lần description thay đổi (tạo mới hoặc US-3.8 sửa bill).

### Flow
1. User gõ "200k pho bo" → AI parser (US-3.3) extract description → inferCategory → "an_uong"
2. Submit bill → category "an_uong" lưu vào `chat_messages.metadata`
3. Bill card trong feed hiện badge 🍽️ Ăn uống

### UX/UI

**Category badge trên bill card** (trong chat feed, US-3.4):
- Chỉ hiện khi category !== "khac"
- Vị trí: top-right của title row
- Style: `bg-[#F2F2F7] text-[11px] px-2 py-0.5 rounded-full`
- Content: emoji + label (e.g. "🍽️ Ăn uống")

**KHÔNG có picker/chip row** trong Create Bill Sheet — user không chọn category thủ công để giảm thao tác.

### Tiêu chí
- [ ] 6 categories fixed, không cho custom v1
- [ ] Auto-infer từ description khi tạo/sửa bill
- [ ] KHÔNG có chip picker trong Create Bill Sheet
- [ ] Bill card hiện badge khi category !== khac
- [ ] Metadata lưu đúng trong chat_messages
- [ ] getCategoryById fallback khac khi ID không match
