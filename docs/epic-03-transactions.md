# Epic 3: Giao Dịch (Transactions)

Epic này có **2 flow tạo bill**, cả 2 đều dùng chung **Bill Confirm Sheet (half-sheet)**:
- **Flow A — Tạo bill thủ công (manual)**: US-3.1. Mở sheet **trống trơn**, user điền từ đầu.
- **Flow B — Tạo nhanh qua chat (AI quick)**: US-3.2. Gõ tin nhắn, AI parse, mở sheet **prefilled**.

Sự khác biệt duy nhất là entry point + trạng thái initial của sheet. Logic sheet, layout, validation đều giống nhau.

Cả 2 flow đều có thể chuyển sang **Split Sheet (US-3.4)** khi cần chia phức tạp, và đều có thể tạo **Bill mở (US-3.5)** thay vì bill thường.

---

## US-3.1: Tạo bill thủ công (Manual)

### Function
Entry point: Nút "+" trong chat input bar của group detail (44×44px, #3A5CCC, icon plus).

Flow:
1. Tap "+" → mở **Bill Confirm Sheet (US-3.3)** ở trạng thái **trống trơn** (blank state):
   - Mô tả: "" (placeholder "VD: ăn trưa")
   - Số tiền: 0 (placeholder "0đ")
   - Phân loại: "khac" (📋 mặc định)
   - Chia cho: tất cả members (default)
   - Người trả: user hiện tại (default)
   - Ảnh bill: none
2. User điền các field trực tiếp trong sheet
3. Tap "Tạo bill" → validate + tạo bill + debts + chat_message
4. Toast "Đã tạo bill" → sheet đóng

### Điểm khác biệt với US-3.2 (AI Quick)
- **Giống**: cùng dùng Bill Confirm Sheet (US-3.3), cùng layout, cùng validation, cùng logic submit
- **Khác**:
  - Entry: tap nút "+" (không qua AI parser)
  - Initial state: blank (không có data prefilled)
  - Không có bước AI Follow-up Card

### Edge cases
- Mô tả trống → nút "Tạo bill" disabled
- Số tiền 0 hoặc trống → nút disabled
- Chia cho 0 người → nút disabled
- Tap backdrop → đóng sheet, data discard (không confirm dialog vì sheet nhẹ)

### UX/UI
Y hệt như **US-3.3 Bill Confirm Sheet** — tham khảo section đó. Chỉ khác initial state là blank thay vì prefilled.

Header title vẫn là "✦ Xác nhận bill" (KHÔNG đổi title theo flow — user experience nhất quán).

### Tiêu chí
- [ ] Nút "+" trong chat input bar mở Confirm Sheet trống
- [ ] Sheet layout y hệt flow AI (US-3.2 → US-3.3)
- [ ] Điền đủ description + amount → nút "Tạo bill" enabled
- [ ] Submit tạo bill + debts + chat_message + toast
- [ ] Hủy (backdrop/✕) đóng sheet, không confirm dialog

---

## US-3.2: Tạo nhanh bill qua chat (AI Quick Parse)

### Function
Entry point: Chat input bar trong group detail. User gõ tin nhắn tự nhiên.

Flow:
1. User gõ trong chat input: VD "500k ăn trưa 6 người"
2. AI Parser (regex local, không LLM) extract:
   - **Số tiền**: "500k" → 500.000đ, "1tr2" → 1.200.000đ, "350000" → 350.000đ
   - **Mô tả**: "ăn trưa", "bún bò", "café"
   - **Số người**: "6 người", "cả team" (-1 = group size)
3. Parse result xử lý:
   - **Đủ info (có amount + description)** → mở thẳng **Bill Confirm Sheet (US-3.3)** với dữ liệu prefilled
   - **Thiếu split type** → hiện **AI Follow-up Card** inline trước chat input
   - **Không có số tiền** → gửi như tin nhắn text thường, không trigger parser
4. User xác nhận ở Confirm Sheet → tạo bill

### Điểm khác biệt với US-3.1
- **Nhanh hơn**: 1 dòng text → sheet đã prefill, chỉ cần confirm
- **Ít field hơn**: không chọn category thủ công (infer từ description), không pick payer (mặc định user hiện tại), không pick split type (mặc định chia đều, mở Split Sheet nếu cần)
- **Không có form đầy đủ**: chỉ có Confirm Sheet (half-sheet, US-3.3)
- **Không upload ảnh được** ở bước này (phải dùng flow manual nếu muốn gắn ảnh)

### Edge cases
- Tin nhắn không có số tiền → gửi như chat bình thường, không parse
- Chỉ có số tiền, không có mô tả → vẫn trigger, description = null, Confirm Sheet mở cho user điền
- Số tiền < 1.000đ hoặc > 1 tỷ → bỏ qua, coi như text thường
- "cả team" → peopleCount = số members hiện tại trong group
- Parse nhầm (VD "500k tiền nhà" — số 500 là nhà không phải tiền) → user có thể edit Mô tả trong Confirm Sheet

### UX/UI
**AI Follow-up Card** — inline card hiện trên chat input bar khi parse thiếu split type:
- Nền trắng, rounded 14px, border-top #E5E5EA
- Text: "Chia 500k cho ăn trưa. Bạn muốn chia như nào?" (14px #1C1C1E)
- 3 pill buttons: "Bill mở" | "Chia đều" | "Tuỳ chỉnh" (nền #F2F2F7, 13px, rounded full, padding 8×14px)
- Chọn 1 option → mở Confirm Sheet tương ứng

### Tiêu chí
- [ ] "500k bún bò 6 người" → parse đúng amount=500000, description="bún bò", people=6
- [ ] "1tr2 ăn trưa" → amount=1200000
- [ ] "Chào mọi người" (tin nhắn thường) → KHÔNG trigger parser, gửi như chat
- [ ] Thiếu split type → AI Follow-up Card hiện
- [ ] Chọn option ở card → mở Confirm Sheet
- [ ] Confirm Sheet mở với prefilled data từ parser
- [ ] User có thể edit description + amount trong Confirm Sheet

---

## US-3.3: Bill Confirm Sheet (shared half-sheet)

### Function
Half-sheet **dùng chung** cho cả 2 flow:
- **Flow manual (US-3.1)**: mở với state blank, user điền từ đầu
- **Flow AI (US-3.2)**: mở với data prefilled từ parser, user review + điều chỉnh

1. Hiện sau khi user tap "+" (manual) HOẶC sau AI parse đủ info HOẶC chọn follow-up option
2. Data source khác nhau nhưng sheet layout/validation/submit logic giống hệt:
   - Mô tả (inline input)
   - Số tiền (inline input)
   - Chia cho (mặc định tất cả members, tap avatars 22px để mở Split Sheet)
   - Người trả (mặc định user hiện tại, có thể đổi)
3. Xác nhận → tạo bill + bill_participants + debts
4. Chèn chat_message type "bill_card"
5. Thông báo participants qua Telegram
6. Số tiền mỗi người = floor(tổng / số người), dư +1 VND cho N người đầu

### Edge cases
- Tổng không chia hết → dư phân bổ +1 cho N người đầu
- Amount = 0 hoặc trống → nút disabled
- Description trống → nút disabled
- Đóng sheet bằng tap backdrop hoặc nút X → dữ liệu mất, không confirm

### UX/UI
Half-sheet từ dưới, rounded top 20px, shadow blur 20px, backdrop 40% đen

**Thành phần (top→bottom):**
- Drag handle 36×4px
- Header: "✦ Xác nhận bill" bold + nút ✕
- Row "Mô tả" → input value (editable)
- Row "Số tiền" → input value (editable)
- Row "Phân loại" → category chip (tap để đổi)
- Row "Chia cho" → avatars 22px stack (tap mở Split Sheet)
- Row "Mỗi người" → amount #3A5CCC
- Row "Người trả" → avatar + tên
- Divider
- Row "📎 Thêm ảnh bill" (optional, stub hiện tại)
- CTA "Tạo bill" #3A5CCC 48px full-width

### Tiêu chí
- [ ] Sheet hiện đúng avatars, amount, payer
- [ ] User có thể edit description + amount
- [ ] Tap "Chia cho" mở Split Sheet
- [ ] Confirm tạo bill + debts + chat_message
- [ ] Sheet đóng sau confirm
- [ ] Toast "Đã tạo bill!"

---

## US-3.4: Split Sheet (chia phức tạp)

### Function
Opened từ Bill Confirm Sheet (US-3.3) HOẶC Create Bill Sheet (US-3.1) khi user muốn chia không đều.

- **Chia đều:** tổng / số người chọn, dư +1 cho N đầu
- **Chia %:** mỗi người nhập %, tổng = 100%
- **Tuỳ chỉnh:** nhập thủ công từng số tiền, tổng = tổng bill
- Validate: không cho xác nhận nếu tổng không khớp

### Edge cases
- Bỏ chọn tất cả → nút xác nhận disabled
- Chia đều 1 người → 1 người nhận toàn bộ
- Tuỳ chỉnh nhập 0 cho 1 người → cho phép (người đó không nợ)
- Tổng tuỳ chỉnh > tổng bill → hiện error đỏ "Vượt quá Xđ"
- Tổng % < 100 → nút disabled, hiện "Còn Y%"

### UX/UI
Full bottom sheet, dim overlay backdrop

**Top tabs pill**: "Chia đều" (active #EEF2FF #3A5CCC) | "Chia %" | "Tuỳ chỉnh" (inactive #F2F2F7)

**Member row** (60px): avatar 36px + tên 14px bold + amount pill #F2F2F7 + checkbox 22px bên phải

**Footer sticky:**
- Trái: "Còn lại chưa chia" | "0đ" (xanh #34C759 khi khớp, cam #FF9500 khi lệch)
- Phải: nút "Xác nhận" #3A5CCC 52px

### Tiêu chí
- [ ] Toggle 3 modes thay đổi UI
- [ ] Chia đều: auto-calculate, hiện per-person amount
- [ ] Chia %: input % cho từng người, tổng phải = 100
- [ ] Tuỳ chỉnh: input VND cho từng người, tổng phải = tổng bill
- [ ] "Còn lại" = 0 khi chia hết → xác nhận enabled
- [ ] Trả về `customSplits: Record<memberId, amount>` cho parent sheet

---

## US-3.5: Bill mở (Open Bill)

### Function
Flow đặc biệt cho trường hợp chưa biết ai tham gia lúc tạo (VD: "ai ăn thì check-in sau").

Entry points:
- US-3.1 Manual: bật toggle "Bill mở" trong Create Bill Sheet
- US-3.2 AI Quick: chọn option "Bill mở" trong AI Follow-up Card

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
3. Mở **Bill Confirm Sheet (US-3.3)** ở `mode="edit"`:
   - Title đổi thành "Sửa bill"
   - CTA đổi thành "Lưu thay đổi"
   - Prefill: description, amount, category từ bill hiện tại
   - ẨN row "Chia cho" và "Người trả" (không cho edit)
4. User edit → tap "Lưu thay đổi"
5. UPDATE:
   - `bills.title`, `bills.total_amount`, `bills.updated_at` (trigger)
   - `chat_messages.metadata.category` (nếu đổi category)
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
Y hệt **US-3.3 Bill Confirm Sheet** với `mode="edit"`:
- Header title: "Sửa bill" (thay vì "✦ Xác nhận bill")
- CTA button: "Lưu thay đổi" (thay vì "Tạo bill")
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
Mỗi bill có 1 category giúp phân loại chi tiêu (enable analytics sau này).

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

User có thể override trong Bill Confirm Sheet (US-3.3) trước khi submit.

### Flow
1. User gõ "200k pho bo" → AI parser parse → inferCategory → "an_uong"
2. Bill Confirm Sheet hiện với category 🍽️ Ăn uống được select sẵn
3. User tap category khác nếu muốn override
4. Submit → category lưu vào metadata

### UX/UI

**Category chip row** trong Bill Confirm Sheet (US-3.3):
- Vị trí: giữa row "Mô tả" và row "Chia cho"
- Horizontal row, 6 chip side-by-side
- Selected chip: `bg-[#EEF2FF] text-[#3A5CCC]` border 1px #3A5CCC
- Unselected: `bg-[#F2F2F7] text-[#8E8E93]` no border
- Chip: emoji + label (optional label hide on mobile nếu quá hẹp)
- Rounded full, padding 6×12px, text-xs

**Category badge trên bill card** (trong chat feed):
- Chỉ hiện khi category !== "khac"
- Vị trí: top-right của title row
- Style: `bg-[#F2F2F7] text-[11px] px-2 py-0.5 rounded-full`
- Content: emoji + label (e.g. "🍽️ Ăn uống")

### Tiêu chí
- [ ] 6 categories fixed, không cho custom v1
- [ ] AI parser auto-infer từ description
- [ ] Bill Confirm Sheet có chip row cho user override
- [ ] Bill card hiện chip khi category !== khac
- [ ] Metadata lưu đúng trong chat_messages
- [ ] getCategoryById fallback khac khi ID không match
