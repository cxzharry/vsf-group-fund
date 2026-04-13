# Epic 3: Giao Dịch (Transactions)

US-3.1 định nghĩa **Create Bill Sheet** — half-sheet với đủ field cần thiết để tạo bill. Sheet này dùng chung cho 2 flow:
- **Flow A — Manual**: US-3.1. Mở sheet **trống trơn** qua nút ➕, user điền từ đầu.
- **Flow B — AI Quick**: US-3.3. Gõ tin nhắn, AI parse, mở chính sheet của US-3.1 với data **prefilled**.

US-3.2 là **Chọn người chia** — picker chọn thành viên tham gia bill + customize cách chia (đều / % / tuỳ chỉnh), mở từ link "Chọn thành viên" trong Create Bill Sheet.

US-3.4 là **Bill Details & Actions** — hiển thị bill trong Group Detail feed + tap vào để edit/xoá.

Cả 2 flow tạo đều có thể chọn **Bill mở (US-3.5)** thay vì bill thường.

---

## US-3.1: Tạo bill thủ công (Create Bill Sheet)

### Rules

**Entry point:** Tap nút ➕ trong chat input bar của group detail.

**Flow:**
1. Tap ➕ → mở Create Bill Sheet ở trạng thái blank
2. User điền các field required
3. Khi đủ required → nút "Tạo" đổi sang màu xanh enabled
4. Tap "Tạo":
   - Nếu **Bill mở OFF** → bill tạo + chia khoản nợ cho từng người + hiện card trong chat
   - Nếu **Bill mở ON** → redirect qua flow **US-3.5** (tạo bill mở, mọi người check-in sau)
5. Toast "Đã tạo bill" → sheet đóng, feed scroll tới bill card mới
6. Những người được chia nhận thông báo qua Telegram (chỉ bill thường)

**Fields:**

| Field | Required | Default | Ghi chú |
|-------|----------|---------|---------|
| Loại bill | Yes | Chia tiền | Toggle "Chia tiền" \| "Chuyển tiền". Chuyển tiền → đóng sheet, redirect US-3.6 |
| Số tiền | Yes | — | VND format, phải > 0 |
| Mô tả | Yes | — | Text mô tả khoản chi, không được trống |
| Người trả | Yes | User hiện tại | Một thành viên trong nhóm |
| Chia cho | Conditional | (mở US-3.2) | Kết quả chọn từ US-3.2. Required khi Bill mở OFF, ẨN khi Bill mở ON |
| Bill mở | No | OFF | Toggle. ON → chuyển flow US-3.5, ẨN row "Chia cho", hiện optional input "Số người ước tính" bên cạnh |

**Phân loại:** auto-infer từ description (US-3.9), không phải field nhập tay để giảm thao tác.

**Điều kiện enable nút "Tạo":**
- Số tiền có giá trị > 0
- Có mô tả
- Có người trả
- **Bill mở OFF:** phải có ít nhất 1 người được chọn ở "Chia cho"
- **Bill mở ON:** không cần chọn ai; nếu nhập số người ước tính thì phải > 0 (optional, có thể bỏ trống)

Thiếu bất kỳ điều kiện nào → nút xám disabled.

**Edge cases:**
- Người trả KHÔNG nằm trong "Chia cho" → hợp lệ, payer không nợ chính mình
- Split customize qua US-3.2 rồi tổng không khớp số tiền → nút "Tạo" disabled cho tới khi user sửa
- Tap backdrop/✕ → đóng sheet, data discard, không hỏi confirm
- Submit fail (mất mạng) → toast lỗi, giữ sheet mở với data user đã nhập

### UI/UX

**Layout:** Half-sheet từ dưới, rounded top 20px, shadow blur 20px, backdrop 40% đen, max-height ~85vh.

**Components (top → bottom):**
- Drag handle 36×4px #D1D1D6
- Header row: title "Tạo bill" 15px bold center + ✕ close button
- Bill type toggle (2 pill): "Chia tiền" active `#EEF2FF/#3A5CCC` | "Chuyển tiền" inactive `#F2F2F7/#8E8E93`
- Row "Số tiền" — right-aligned, 22px bold, `#3A5CCC` khi có số, placeholder "0đ" `#AEAEB2`
- Row "Mô tả" — right-aligned, 13px `#1C1C1E`, placeholder "VD: Ăn trưa team" `#AEAEB2`
- Row "Người trả" — avatar 22px + "{Tên} (bạn)" 14px `#1C1C1E` + chevron `›`
- Row "Chia cho" — link "Chọn thành viên" 13px `#3A5CCC` gạch chân (no chevron). Khi đã chọn → "N người · Xđ/người" `#3A5CCC`. **Ẩn khi Bill mở ON.**
- Row "Bill mở" — layout ngang: label "Bill mở" + toggle iOS-style bên phải. Khi ON → bên cạnh toggle hiện thêm optional input "Số người ước tính" (placeholder "—", 13px, width ~80px, right-aligned)
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
- [ ] Required: Số tiền, Mô tả, Người trả, Chia cho (trừ khi Bill mở ON)
- [ ] Điền đủ required → nút "Tạo" đổi sang màu xanh enabled
- [ ] Người trả default hiển thị "{Tên} (bạn)" cho currentMember
- [ ] "Chia cho" là link "Chọn thành viên" xanh gạch chân → mở US-3.2
- [ ] **Bill mở toggle**: ON → ẩn row "Chia cho", hiện optional input "Số người ước tính" bên cạnh
- [ ] **Bill mở ON** + tap "Tạo" → redirect qua flow US-3.5 (không tạo bill thường)
- [ ] Nút "Tạo" pinned ở đáy sheet, không nổi giữa màn
- [ ] Focus input → hiện input accessory bar trên keyboard
- [ ] Submit bill thường → tạo bill + khoản nợ + toast "Đã tạo bill"
- [ ] Huỷ (backdrop/✕) đóng sheet không confirm dialog

---

## US-3.2: Chọn người chia (Member Picker + Split Sheet)

### Rules

**Mục đích:** Chọn chính xác ai tham gia bill (thành viên nhóm + khách + người ẩn danh), sau đó chia tiền cho họ.

**Entry:** Từ Create Bill Sheet (US-3.1), user tap link "Chọn thành viên".

**Sheet nhận từ parent:**
- Selection lần trước (khi re-open sau đã confirm)
- List thành viên trong nhóm
- Người trả hiện tại
- Tổng số tiền bill

**Sheet trả cho parent:**
- Danh sách thành viên được chọn
- Danh sách khách (tên + số tiền)
- Số người ẩn danh (nếu có)
- Cách chia (đều / tuỳ chỉnh) và số tiền chi tiết nếu tuỳ chỉnh

**Công thức chia:**
```
Tổng số người = số thành viên chọn + số khách + số người ẩn danh
Chia đều: mỗi người = Tổng bill / Tổng số người (phần dư cộng vào N người đầu)
Chia không đều: user nhập từng số, tổng phải bằng Tổng bill
```

**Split modes (2):**
- **Chia đều** (default): tự động tính, không cần nhập
- **Chia không đều:** user nhập thủ công cho từng người, tổng phải khớp bill

**Auto-switch rule:** Đang ở "Chia đều" mà user sửa số tiền của bất kỳ row nào → tự động chuyển sang "Chia không đều", giữ giá trị user vừa sửa, các row còn lại giữ baseline chia đều.

**Số người chia (người ẩn danh):**
- **Ô input số** với giá trị mặc định = số thành viên chọn + số khách
- User gõ số lớn hơn → phần dư là "người ẩn danh" (counts vào per-person, không có danh tính, không bị truy đòi nợ)
- Gõ số nhỏ hơn (thành viên + khách) → block, toast "Bỏ chọn người trước nếu muốn giảm"
- Check thêm thành viên/khách → số tự tăng; bỏ check → tự giảm (tối thiểu 1)
- Gõ 0 hoặc để trống → revert về số mặc định

**Khách ngoài nhóm:**
- Có tên nhưng không có tài khoản trong app
- Tính vào chia (làm giảm per-person của các người khác)
- KHÔNG tạo khoản nợ truy đòi (vì không có tài khoản)
- Tối đa 10 khách/bill

**Case matrix:**

| # | Tình huống | Default | Behaviour |
|---|---|---|---|
| A | Full nhóm | All checked | Confirm luôn ok |
| B | Subset nhóm | All checked | User uncheck bớt |
| C | Có khách ngoài nhóm | — | Thêm qua section "Khách" + input |
| D | Có người ẩn danh (biết số, không biết ai) | — | Tăng ô "Số người chia" |
| E | Payer không tham gia | — | Payer uncheck chính mình, không nhận chia |
| F | 1 người duy nhất | — | OK, người đó nhận toàn bộ |
| G | 0 người | — | Nút Xác nhận disabled |

*Note: Trường hợp user hoàn toàn không biết ai tham gia → xử lý bằng toggle "Bill mở" ở US-3.1, không phải ở đây.*

**Validation:**

| State | Điều kiện | Effect |
|---|---|---|
| Disabled | Chưa có ai (0 người) | Nút Xác nhận xám |
| Error | Chia không đều: tổng > bill | Nút disabled, hiện "Vượt {diff}đ" đỏ |
| Error | Chia không đều: tổng < bill | Nút disabled, hiện "Còn {diff}đ" cam |
| OK | Tất cả khớp | Nút enabled |

**Edge cases:**
- Chia không đều, 1 người = 0đ → cho phép (người đó không nợ)
- Payer uncheck chính mình → hợp lệ, payer không nhận phần chia
- Mở lại sheet sau đã confirm → phục hồi selection trước đó
- Group chỉ 1 thành viên → default chọn user, gợi ý thêm khách/ẩn danh
- Bill = 0đ (chưa nhập) → vẫn cho chọn người, hiện "—đ/người"
- Đang "Chia không đều" → tap "Chia đều" → confirm dialog "Reset về chia đều?"

### UI/UX

**Layout:** Full bottom sheet (~85% height), dim backdrop, handle trên đầu, padding `[6,0,34,0]`.

**Header:**
- Title "Chia tiền" 17px bold
- Subtitle "Tổng {amount}đ" 13px `#8E8E93`
- ✕ close top-right

**Top tabs pill (2 mode):** "Chia đều" active `#EEF2FF/#3A5CCC` | "Chia không đều" inactive `#F2F2F7/#8E8E93`

**Số người chia row** (đầu sheet, trên list member):
- Label "Số người chia" 13px `#8E8E93`
- **Ô input số** bên phải: frame 60×36 rounded 8px bg `#F2F2F7` border 1px `#E5E5EA`, text 17px bold `#1C1C1E` center-aligned, keyboard number khi focus

**Section "THÀNH VIÊN NHÓM":**
- Label uppercase 10px `#8E8E93`
- **Search input** ngay dưới label: frame full-width 36px bg `#F2F2F7` rounded 10px, padding 0,12, icon 🔍 nhỏ bên trái + placeholder "Tìm thành viên..." 13px `#AEAEB2`. Gõ → filter member list real-time theo tên (case-insensitive, diacritic-insensitive).
- Member row 56px: avatar 36px màu hash + tên 14px semibold ("Hai Do (bạn)" cho self) + amount pill + checkbox 22px
- Amount pill: bg `#F2F2F7`, text 13px bold; mode đều = display, mode chia không đều = input field
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

**Frames trong Pencil:** Case A (default), Case E (payer uncheck), Case C (có khách), Case D (có người ẩn danh).

### Tiêu chí
- [ ] Mở từ link "Chọn thành viên" trong Create Bill Sheet
- [ ] Case A (full nhóm): all checked default, confirm luôn được
- [ ] Case B (subset): user uncheck bớt, confirm ok
- [ ] Case C (khách): thêm/xoá khách, count vào per-person, không tạo nợ truy đòi
- [ ] Case D (người ẩn danh): gõ số lớn hơn member+guest count → tạo slot ẩn danh, count vào per-person
- [ ] Case E (payer không tham gia): payer uncheck chính mình, hợp lệ
- [ ] Toggle 2 modes: Chia đều / Chia không đều
- [ ] Auto-switch về Chia không đều khi user sửa amount của row bất kỳ
- [ ] Chia không đều: validate tổng = total
- [ ] Ô input "Số người chia" nhận số, gõ nhỏ hơn member+guest → block toast
- [ ] **Search input** filter member list real-time theo tên (không phân biệt dấu)
- [ ] 0 người → disabled, hint "Chọn ít nhất 1 người"
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
- 3 pill buttons: "Bill mở" | "Chia đều" | "Chia không đều" (nền #F2F2F7, 13px, rounded full, padding 8×14px)
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
- **Header row**: emoji category (nếu khác "Khác") + tên bill (15px bold #1C1C1E) + menu ⋯ (owner only, top-right)
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

1. Tạo bill mở: chưa có ai tham gia, chưa có khoản nợ
2. Check-in: thành viên tap "Tôi có ăn" → được ghi nhận tham gia
3. Thêm khách: nhập tên khách (không cần tài khoản)
4. Đóng bill: payer hoặc group admin tap "Đóng bill" → chia đều cho tất cả người đã check-in, tạo khoản nợ, dư cộng vào N người đầu
5. Chỉ payer HOẶC group admin được đóng bill
6. Gửi Telegram notify cho tất cả người nợ

### Edge cases
- Check-in 2 lần → chặn, hiện thông báo "Đã check-in rồi"
- Đóng bill khi 0 check-in → báo lỗi "Chưa có ai check-in"
- Khách check-in → tính vào chia nhưng không bị truy đòi nợ (không có tài khoản)
- Payer tự check-in → tính phần mình nhưng không nợ chính mình
- Bill đã đóng → không cho check-in tiếp, card chuyển sang trạng thái "Đã đóng"

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
Chủ bill (người tạo bill) có thể xoá bill đã tạo. Khi xoá sẽ xoá sạch toàn bộ data liên quan (khoản nợ, danh sách người tham gia, bill card trong chat feed).

Flow:
1. Trên bill card trong chat feed, owner tap menu ⋯ (3-dot)
2. Menu hiện 2 option: "Sửa bill" (US-3.8) | "Xoá bill" (đỏ)
3. Tap "Xoá bill" → dialog xác nhận "Xoá bill? Thao tác này không thể hoàn tác"
4. Confirm → bill + khoản nợ + card trong chat feed đều bị xoá
5. Toast "Đã xoá bill", UI cập nhật ngay

### Edge cases
- Không phải owner → menu ⋯ không hiện
- Bill đã có ai đó xác nhận thanh toán → VẪN cho xoá (v1 — có thể block ở future)
- Mất mạng khi xoá → toast error, giữ nguyên state

### UX/UI
**Menu ⋯ trên bill card** (chỉ hiện khi user là người tạo bill):
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
- [ ] Xoá bill cũng xoá hết khoản nợ + bill card khỏi feed
- [ ] Chat feed update ngay sau xoá
- [ ] Toast "Đã xoá bill"

---

## US-3.8: Sửa bill

### Function
Chủ bill có thể sửa mô tả + số tiền + category. KHÔNG cho sửa split type / participants (tránh corrupt audit trail).

Flow:
1. Menu ⋯ → tap "Sửa bill"
2. **Guard**: nếu bill đã có ai xác nhận thanh toán → toast lỗi "Không thể sửa — bill đã có xác nhận thanh toán" và huỷ
3. Mở **Create Bill Sheet (US-3.1)** ở chế độ edit:
   - Title đổi thành "Sửa bill"
   - Nút CTA đổi thành "Lưu thay đổi"
   - Prefill description + số tiền từ bill hiện tại
   - ẨN "Loại bill" toggle (không cho đổi Chia tiền ↔ Chuyển tiền)
   - ẨN "Chia cho" và "Người trả" (read-only, không cho edit để tránh rối số liệu)
4. User edit → tap "Lưu thay đổi"
5. Hệ thống cập nhật:
   - Tên bill + số tiền + thời gian sửa
   - Category auto-infer lại nếu description thay đổi (US-3.9)
   - Chia lại per-person cho các khoản nợ **chưa thanh toán** (khoản đã xác nhận giữ nguyên)
6. Toast "Đã cập nhật bill"

### "Đã sửa" badge
Bill card hiện badge " · Đã sửa" cạnh timestamp khi bill được sửa sau 60 giây kể từ lúc tạo (bỏ qua các save nhanh ngay sau tạo).

Style: inline text, `text-[11px] text-[#8E8E93]`, không pill/bg/icon (quiet metadata).

### Edge cases
- Bill đã có người xác nhận thanh toán → huỷ edit với toast lỗi
- Số tiền = 0 hoặc mô tả trống → nút Lưu disabled
- Mất mạng khi lưu → toast lỗi, rollback lại state
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
- [ ] Menu ⋯ "Sửa bill" chỉ hiện cho owner
- [ ] Chặn edit khi bill đã có người xác nhận thanh toán
- [ ] Sheet mở với data đã điền sẵn từ bill hiện tại
- [ ] Lưu thay đổi cập nhật bill + chia lại khoản nợ chưa thanh toán (giữ nguyên khoản đã xác nhận)
- [ ] "Đã sửa" badge hiện trên card sau khi edit
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

### Auto-infer
Khi tạo bill, hệ thống scan mô tả để tìm keyword match với 1 trong 6 category:
- Match được → gán category đó
- Không match → "khác"

Category được tự động suy lại mỗi khi mô tả thay đổi (tạo mới hoặc sửa bill qua US-3.8).

### Flow
1. User gõ "200k pho bo" → AI parser (US-3.3) trích description → auto-infer → "Ăn uống"
2. Submit bill → category được lưu cùng bill
3. Bill card trong feed hiện badge 🍽️ Ăn uống

### UX/UI

**Category badge trên bill card** (trong chat feed, US-3.4):
- Chỉ hiện khi category không phải "Khác"
- Vị trí: top-right của title row
- Style: `bg-[#F2F2F7] text-[11px] px-2 py-0.5 rounded-full`
- Content: emoji + label (e.g. "🍽️ Ăn uống")

**KHÔNG có picker/chip row** trong Create Bill Sheet — user không chọn category thủ công để giảm thao tác.

### Tiêu chí
- [ ] 6 categories fixed, không cho custom v1
- [ ] Auto-infer từ description khi tạo/sửa bill
- [ ] KHÔNG có chip picker trong Create Bill Sheet
- [ ] Bill card hiện badge khi category khác "Khác"
- [ ] Category gán đúng theo keyword match
- [ ] Fallback về "khác" khi không match được category nào
