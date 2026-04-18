# Epic 3 — Giao Dịch (Transactions)

> **Epic ID:** E3 · **Priority:** P0 · **Persona:** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) (Minh)
> **Brief:** Create bill manually or via AI quick parse, split with members, open bills with check-in, transfer via QR, edit/delete, categorize

US-E3-1 định nghĩa **Create Bill Sheet** — half-sheet với đủ field cần thiết để tạo bill. Sheet này dùng chung cho 2 flow:
- **Flow A — Manual**: US-E3-1. Mở sheet **trống trơn** qua nút ➕, user điền từ đầu.
- **Flow B — AI Quick**: US-E3-3. Gõ tin nhắn, AI parse, mở chính sheet của US-E3-1 với data **prefilled**.

US-E3-2 là **Chọn người chia** — picker chọn thành viên tham gia bill + customize cách chia (đều / % / tuỳ chỉnh), mở từ link "Chọn thành viên" trong Create Bill Sheet.

US-E3-4 là **Bill Details & Actions** — hiển thị bill trong Group Detail feed + tap vào để edit/xoá.

Cả 2 flow tạo đều có thể chọn **Bill mở (US-E3-5)** thay vì bill thường.

---

## US-E3-1 — Tạo bill thủ công (Create Bill Sheet)

**As a** group organizer, **I want to** create a bill manually with required fields **so that** I can set up a split quickly.

- **Priority:** P0 · **Effort:** L

### Rules / Function

**Entry point:** Tap nút ➕ trong chat input bar của group detail.

**Flow:**
1. Tap ➕ → mở Create Bill Sheet ở trạng thái blank
2. User điền các field required
3. Khi đủ required → nút "Tạo" đổi sang màu xanh enabled
4. Tap "Tạo":
   - Nếu **Bill mở OFF** → bill tạo + chia khoản nợ cho từng người + hiện card trong chat
   - Nếu **Bill mở ON** → redirect qua flow **US-E3-5** (tạo bill mở, mọi người check-in sau)
5. Toast "Đã tạo bill" → sheet đóng, feed scroll tới bill card mới
6. Những người được chia nhận thông báo qua Telegram (chỉ bill thường)

**Fields:**

| Field | Required | Default | Ghi chú |
|-------|----------|---------|---------|
| Loại bill | Yes | Chia tiền | Toggle "Chia tiền" \| "Chuyển tiền". Chuyển tiền → đóng sheet, redirect US-E3-6 |
| Số tiền | Yes | — | VND format, phải > 0 |
| Mô tả | Yes | — | Text mô tả khoản chi, không được trống |
| Người trả | Yes | User hiện tại | Một thành viên trong nhóm |
| Chia cho | Conditional | (mở US-E3-2) | Kết quả chọn từ US-E3-2. Required khi Bill mở OFF, ẨN khi Bill mở ON |
| Bill mở | No | OFF | Toggle. ON → chuyển flow US-E3-5, ẨN row "Chia cho", hiện optional input "Số người ước tính" bên cạnh |

**Phân loại:** auto-infer từ description (US-E3-9), không phải field nhập tay để giảm thao tác.

**Điều kiện enable nút "Tạo":**
- Số tiền có giá trị > 0
- Có mô tả
- Có người trả
- **Bill mở OFF:** phải có ít nhất 1 người được chọn ở "Chia cho"
- **Bill mở ON:** không cần chọn ai; nếu nhập số người ước tính thì phải > 0 (optional, có thể bỏ trống)

Thiếu bất kỳ điều kiện nào → nút xám disabled.

**Edge cases:**
- Người trả KHÔNG nằm trong "Chia cho" → hợp lệ, payer không nợ chính mình
- Split customize qua US-E3-2 rồi tổng không khớp số tiền → nút "Tạo" disabled cho tới khi user sửa
- Tap backdrop/✕ → đóng sheet, data discard, không hỏi confirm
- Submit fail (mất mạng) → toast lỗi, giữ sheet mở với data user đã nhập


### Acceptance Criteria
- [ ] AC-E3-1.1: Nút ➕ trong chat input bar mở Create Bill Sheet blank
- [ ] AC-E3-1.2: Toggle "Chia tiền" default, "Chuyển tiền" redirect US-E3-6
- [ ] AC-E3-1.3: Required: Số tiền, Mô tả, Người trả, Chia cho (trừ khi Bill mở ON)
- [ ] AC-E3-1.4: Điền đủ required → nút "Tạo" enabled
- [ ] AC-E3-1.5: Người trả default = currentMember
- [ ] AC-E3-1.6: "Chia cho" là link → mở US-E3-2
- [ ] AC-E3-1.7: **Bill mở toggle**: ON → ẩn row "Chia cho", hiện optional input "Số người ước tính"
- [ ] AC-E3-1.8: **Bill mở ON** + tap "Tạo" → redirect qua flow US-E3-5 (không tạo bill thường)
- [ ] AC-E3-1.11: Submit bill thường → tạo bill + khoản nợ + confirm notification
- [ ] AC-E3-1.12: Huỷ (backdrop/✕) đóng sheet không confirm dialog

---

## US-E3-2 — Chọn người chia (Member Picker + Split Sheet)

**As a** group organizer, **I want to** select members and customize split method (equal/custom) **so that** I can divide costs accurately.

- **Priority:** P0 · **Effort:** L

### Rules / Function

**Mục đích:** Chọn chính xác ai tham gia bill (thành viên nhóm + khách + người ẩn danh), sau đó chia tiền cho họ.

**Entry:** Từ Create Bill Sheet (US-E3-1), user tap link "Chọn thành viên".

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

*Note: Trường hợp user hoàn toàn không biết ai tham gia → xử lý bằng toggle "Bill mở" ở US-E3-1, không phải ở đây.*

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


### Acceptance Criteria
- [ ] AC-E3-2.1: Mở từ link "Chọn thành viên" trong Create Bill Sheet
- [ ] AC-E3-2.2: Case A (full nhóm): all checked default, confirm ok
- [ ] AC-E3-2.3: Case B (subset): user uncheck bớt, confirm ok
- [ ] AC-E3-2.4: Case C (khách): thêm/xoá khách, count vào per-person, không tạo nợ truy đòi
- [ ] AC-E3-2.5: Case D (người ẩn danh): gõ số lớn hơn member+guest count → tạo slot ẩn danh, count vào per-person
- [ ] AC-E3-2.6: Case E (payer không tham gia): payer uncheck chính mình, hợp lệ
- [ ] AC-E3-2.7: Toggle 2 modes: Chia đều / Chia không đều
- [ ] AC-E3-2.8: Auto-switch về Chia không đều khi user sửa amount của row bất kỳ
- [ ] AC-E3-2.9: Chia không đều: validate tổng = total
- [ ] AC-E3-2.10: Ô input "Số người chia" nhận số, gõ nhỏ hơn member+guest → block toast
- [ ] AC-E3-2.11: **Search filter** member list real-time theo tên (không phân biệt dấu)
- [ ] AC-E3-2.12: 0 người → disabled
- [ ] AC-E3-2.13: Max 10 khách/bill
- [ ] AC-E3-2.14: Quay về Create Bill Sheet, row "Chia cho" hiện "{N} người · {per}đ/người"

---

## US-E3-3 — Tạo nhanh bill qua chat (AI Quick Parse)

**As a** group organizer, **I want to** create a bill by typing a natural message that AI parses **so that** I can split costs in under 5 seconds.

- **Priority:** P0 · **Effort:** M

### Rules / Function
Entry point: Chat input bar trong group detail. User gõ tin nhắn tự nhiên.

Flow:
1. User gõ trong chat input: VD "500k ăn trưa 6 người"
2. AI Parser (regex local, không LLM) extract:
   - **Số tiền**: "500k" → 500.000đ, "1tr2" → 1.200.000đ, "350000" → 350.000đ
   - **Mô tả**: "ăn trưa", "bún bò", "café"
   - **Số người**: "6 người", "cả team" (-1 = group size)
3. Parse result xử lý:
   - **Đủ info (có amount + description)** → mở thẳng **Create Bill Sheet (US-E3-1)** với dữ liệu prefilled từ parser
   - **Thiếu split type / description** → hiện **AI Follow-up Card** inline trước chat input
   - **Không có số tiền** → gửi như tin nhắn text thường, không trigger parser
4. User xác nhận ở Create Bill Sheet → tạo bill (cùng submit logic với US-E3-1)

### Điểm khác biệt với US-E3-1
- **Giống**: dùng chung **Create Bill Sheet (US-E3-1)**, cùng field, cùng validation, cùng submit logic
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
- Parse nhầm (VD "500k tiền nhà" — số 500 là nhà không phải tiền) → user có thể edit Mô tả trong Create Bill Sheet (US-E3-1)


### Acceptance Criteria
- [ ] AC-E3-3.1: "500k bún bò 6 người" → parse đúng amount=500000, description="bún bò", people=6
- [ ] AC-E3-3.2: "1tr2 ăn trưa" → amount=1200000
- [ ] AC-E3-3.3: "Chào mọi người" (tin nhắn thường) → KHÔNG trigger parser, gửi như chat
- [ ] AC-E3-3.4: Thiếu split type → AI Follow-up Card hiện với 3 options
- [ ] AC-E3-3.5: Chọn option → mở Create Bill Sheet (US-E3-1) với prefilled data
- [ ] AC-E3-3.6: User có thể edit description + amount trong sheet trước khi submit

---

## US-E3-4 — Bill Details & Actions (hiển thị trong Group Detail)

**As a** group member, **I want to** view bill details and access actions (edit/delete for owner) **so that** I can understand splits and modify bills.

- **Priority:** P0 · **Effort:** M

### Rules / Function
Sau khi tạo bill (qua US-E3-1 hoặc US-E3-3), bill xuất hiện dưới dạng **bill card** trong chat feed của Group Detail. User có thể:
- **Xem** thông tin cơ bản của bill trên card inline
- **Tap vào card** → mở **Bill Details Sheet** xem full info
- **Menu ⋯** (owner only) → "Sửa bill" (US-E3-8) hoặc "Xoá bill" (US-E3-7)

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
  - "Sửa bill" (outline button) → US-E3-8
  - "Xoá bill" (outline đỏ) → US-E3-7

### Menu ⋯ (chỉ hiện khi owner)
Trên bill card top-right, tap → popover menu:
- "Sửa bill" → mở Create Bill Sheet với `mode="edit"` (US-E3-8)
- "Xoá bill" (đỏ) → confirm dialog → cascade delete (US-E3-7)

### Edge cases
- Non-owner → menu ⋯ KHÔNG hiện, không có action buttons trong details sheet
- Bill có payment_confirmation → Sửa bị block với toast (US-E3-8 guard)
- Bill deleted trong lúc đang xem details → sheet đóng + toast "Bill đã bị xoá"
- Bill status "closed" (bill mở đã đóng) → hiện full participant list với amounts

### Acceptance Criteria
- [ ] AC-E3-4.1: Bill card hiện trong chat feed với full info cơ bản
- [ ] AC-E3-4.2: Category emoji + label hiện đúng (US-E3-9)
- [ ] AC-E3-4.3: "Đã sửa" badge hiện khi updated_at > created_at + 60s (US-E3-8)
- [ ] AC-E3-4.4: Tap card → mở Bill Details Sheet
- [ ] AC-E3-4.5: Owner thấy menu ⋯ + action buttons, non-owner không
- [ ] AC-E3-4.6: Status indicator chính xác (bạn nợ / họ nợ / đã xong)
- [ ] AC-E3-4.7: Menu "Sửa" → mở US-E3-8 edit flow
- [ ] AC-E3-4.8: Menu "Xoá" → mở US-E3-7 confirm dialog

---

## US-E3-5 — Bill mở (Open Bill)

**As a** group organizer, **I want to** create an open bill where members check-in later **so that** I can split costs when I don't know who participated upfront.

- **Priority:** P0 · **Effort:** L

### Rules / Function
Flow đặc biệt cho trường hợp chưa biết ai tham gia lúc tạo (VD: "ai ăn thì check-in sau").

Entry points:
- US-E3-1 Manual: bật toggle "Bill mở" trong Create Bill Sheet
- US-E3-3 AI Quick: chọn option "Bill mở" trong AI Follow-up Card

1. Tạo bill mở: fixed participant count `N` đặt lúc tạo (vd 8 người). Per-person = `total / N` cố định. Chưa có khoản nợ.
2. Check-in: thành viên tap "Tôi có ăn" → avatar hiện trong stack, progress bar update. Per-person KHÔNG đổi theo check-in count.
3. Thêm khách: nhập tên khách (không cần tài khoản) — count thêm vào N
4. Không có explicit "Đóng bill" button (decision 2026-04-18). Bill dùng standard edit/delete qua `⋯` menu như bill thường. Debt records tạo khi payer edit/finalize hoặc bill bị delete (soft close).
5. Edit/delete qua `⋯` menu: payer hoặc group admin có quyền
6. Gửi Telegram notify cho tất cả người nợ khi debts được tạo

### Edge cases
- Check-in 2 lần → chặn, hiện thông báo "Đã check-in rồi"
- Edit khi 0 check-in → cho edit, không warning (empty state bình thường)
- Khách check-in → tính vào chia nhưng không bị truy đòi nợ (không có tài khoản)
- Payer tự check-in → tính phần mình nhưng không nợ chính mình
- Bill đủ N người → UI hiện State C (green, "Đủ N người — mỗi người ~Xđ"), không có CTA

### Acceptance Criteria
- [ ] AC-E3-5.1: Check-in tạo record + update UI realtime
- [ ] AC-E3-5.2: Per-person = `total / N` cố định (N set lúc tạo), không đổi theo check-in count
- [ ] AC-E3-5.3: Khách check-in được (không tạo debt)
- [ ] AC-E3-5.4: `⋯` menu hiện ở tất cả states (State A/B/C) cho edit/delete
- [ ] AC-E3-5.5: Check-in trùng → chặn
- [ ] AC-E3-5.6: Telegram notify gửi sau mỗi event
- [ ] AC-E3-5.7: KHÔNG có "Đóng bill" button trên card

---

## US-E3-6 — Chuyển tiền / Thanh toán

**As a** group member, **I want to** generate a VietQR code and confirm payment **so that** I can settle debts quickly.

- **Priority:** P0 · **Effort:** M

### Rules / Function
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

### Acceptance Criteria
- [ ] AC-E3-6.1: QR đúng bank info creditor
- [ ] AC-E3-6.2: Copy số TK hoạt động
- [ ] AC-E3-6.3: "Đã chuyển tiền" tạo payment_confirmation
- [ ] AC-E3-6.4: "Lưu QR" download PNG
- [ ] AC-E3-6.5: Thông báo Telegram cho chủ nợ
- [ ] AC-E3-6.6: Hiện thông báo khi creditor chưa có bank info
- [ ] AC-E3-6.7: Sau "Đã chuyển tiền" → debt chuyển "Chờ xác nhận"

---

## US-E3-7 — Xoá bill

**As a** bill owner, **I want to** delete a bill and cascade-delete all related debts **so that** I can remove incorrect bills.

- **Priority:** P0 · **Effort:** S

### Rules / Function
Chủ bill (người tạo bill) có thể xoá bill đã tạo. Khi xoá sẽ xoá sạch toàn bộ data liên quan (khoản nợ, danh sách người tham gia, bill card trong chat feed).

Flow:
1. Trên bill card trong chat feed, owner tap menu ⋯ (3-dot)
2. Menu hiện 2 option: "Sửa bill" (US-E3-8) | "Xoá bill" (đỏ)
3. Tap "Xoá bill" → dialog xác nhận "Xoá bill? Thao tác này không thể hoàn tác"
4. Confirm → bill + khoản nợ + card trong chat feed đều bị xoá
5. Toast "Đã xoá bill", UI cập nhật ngay

### Edge cases
- Không phải owner → menu ⋯ không hiện
- Bill đã có ai đó xác nhận thanh toán → VẪN cho xoá (v1 — có thể block ở future)
- Mất mạng khi xoá → toast error, giữ nguyên state

### Acceptance Criteria
- [ ] AC-E3-7.1: Menu ⋯ chỉ hiện cho owner
- [ ] AC-E3-7.2: Confirm dialog hiện trước khi xoá
- [ ] AC-E3-7.3: Xoá bill cascade delete khoản nợ + bill card khỏi feed
- [ ] AC-E3-7.4: Chat feed update ngay sau xoá
- [ ] AC-E3-7.5: Confirm notification gửi đến các thành viên bị ảnh hưởng

---

## US-E3-8 — Sửa bill

**As a** bill owner, **I want to** edit bill description and amount **so that** I can correct typos or update details.

- **Priority:** P0 · **Effort:** M

### Rules / Function
Chủ bill có thể sửa mô tả + số tiền + category. KHÔNG cho sửa split type / participants (tránh corrupt audit trail).

Flow:
1. Menu ⋯ → tap "Sửa bill"
2. **Guard**: nếu bill đã có ai xác nhận thanh toán → toast lỗi "Không thể sửa — bill đã có xác nhận thanh toán" và huỷ
3. Mở **Create Bill Sheet (US-E3-1)** ở chế độ edit:
   - Title đổi thành "Sửa bill"
   - Nút CTA đổi thành "Lưu thay đổi"
   - Prefill description + số tiền từ bill hiện tại
   - ẨN "Loại bill" toggle (không cho đổi Chia tiền ↔ Chuyển tiền)
   - ẨN "Chia cho" và "Người trả" (read-only, không cho edit để tránh rối số liệu)
4. User edit → tap "Lưu thay đổi"
5. Hệ thống cập nhật:
   - Tên bill + số tiền + thời gian sửa
   - Category auto-infer lại nếu description thay đổi (US-E3-9)
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

### Acceptance Criteria
- [ ] AC-E3-8.1: Menu ⋯ "Sửa bill" chỉ hiện cho owner
- [ ] AC-E3-8.2: Chặn edit khi bill đã có người xác nhận thanh toán
- [ ] AC-E3-8.3: Sheet mở với data đã điền sẵn từ bill hiện tại
- [ ] AC-E3-8.4: Lưu thay đổi cập nhật bill + chia lại khoản nợ chưa thanh toán (giữ nguyên khoản đã xác nhận)
- [ ] AC-E3-8.5: "Đã sửa" badge hiện trên card sau khi edit
- [ ] AC-E3-8.6: Category auto-infer lại nếu description thay đổi

---

## US-E3-9 — Phân loại chi tiêu (Expense Categories)

**As a** group member, **I want to** categorize bills automatically by keywords **so that** I can track spending by type later.

- **Priority:** P0 · **Effort:** S

### Rules / Function
Mỗi bill có 1 category giúp phân loại chi tiêu (enable analytics sau này). Category **không hiển thị picker trong Create Bill Sheet** (US-E3-1) để giảm thao tác — chỉ auto-infer từ description.

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

Category được tự động suy lại mỗi khi mô tả thay đổi (tạo mới hoặc sửa bill qua US-E3-8).

### Flow
1. User gõ "200k pho bo" → AI parser (US-E3-3) trích description → auto-infer → "Ăn uống"
2. Submit bill → category được lưu cùng bill
3. Bill card trong feed hiện badge 🍽️ Ăn uống

### Acceptance Criteria
- [ ] AC-E3-9.1: 6 categories fixed, không cho custom v1
- [ ] AC-E3-9.2: Auto-infer từ description khi tạo/sửa bill
- [ ] AC-E3-9.3: KHÔNG có category picker trong Create Bill Sheet
- [ ] AC-E3-9.4: Bill card hiện category badge khi khác "Khác"
- [ ] AC-E3-9.5: Category gán đúng theo keyword match
- [ ] AC-E3-9.6: Fallback về "Khác" khi không match được category nào

---

## US-E3-10 — Tạo bill chuyển tiền (Transfer Bill)

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md), **I want to** ghi nhận một giao dịch chuyển tiền trực tiếp cho thành viên trong nhóm (không gắn với debt cũ) **so that** tôi có bản ghi peer-to-peer transfer trong group feed (vd: ứng trước, quà, đóng góp quỹ nhóm).

- **Priority:** P0 · **Effort:** M

### Rules / Function

**Entry point:** Create Bill Sheet (US-E3-1) toggle "Loại bill" = "Chuyển tiền".

**Khác biệt với US-E3-1 (Chia tiền):**
- KHÔNG chia cho nhiều người — 1 người trả tới 1 người nhận
- KHÔNG tạo debt record — là direct transfer log
- KHÔNG infer category
- Ẩn toggle "Bill mở"

**Khác biệt với US-E3-6 (Trả nợ):**
- US-E3-6 đóng 1 debt đã có (input: debtId từ debt banner/list)
- US-E3-10 là log free-form transfer không gắn debt nào

**Fields (khi toggle = Chuyển tiền):**

| Field | Required | Default | Ghi chú |
|-------|----------|---------|---------|
| Loại bill | Yes | Chia tiền | Toggle "Chia tiền" \| "Chuyển tiền" |
| Số tiền | Yes | — | VND format, phải > 0 |
| Người gửi | Yes | User hiện tại | Một thành viên trong nhóm |
| Người nhận | Yes | — | Một thành viên khác (không được trùng Người gửi) |
| Mô tả | No | — | Text mô tả (vd: "Ứng trước tiền khách sạn") |

**Điều kiện enable nút "Tạo":** Số tiền > 0 · Người gửi + Người nhận chọn · Người gửi ≠ Người nhận.

**Flow submit:**
1. Insert `chat_messages` với `message_type='transfer_card'` + metadata `{ from_id, to_id, amount, description }`
2. Notify Người nhận qua Telegram (optional)
3. Feed realtime render `TransferPill`: "↔ {from} đã chuyển {amount}đ cho {to}"
4. Toast "Đã ghi nhận chuyển tiền" → đóng sheet

### Edge cases
- Người gửi = Người nhận → validation error, nút Tạo disabled
- Chỉ 1 thành viên trong nhóm → Người nhận empty, báo "Cần ít nhất 2 thành viên"
- Số tiền ≤ 0 → nút Tạo disabled
- Member rời nhóm sau transfer → card giữ snapshot tên
- Mất mạng submit → toast lỗi, giữ sheet
- Transfer KHÔNG có edit / delete (audit integrity)

### Relationship với debt settlement
- Transfer bill KHÔNG auto-settle debt giữa 2 người
- Muốn settle debt → dùng US-E3-6 (debt banner / /debts)
- Optional v2: sau submit, nếu gửi có debt với nhận, toast gợi ý "Bạn có khoản nợ với {to} — đánh dấu đã trả?" → US-E3-6

### Acceptance Criteria
- [ ] AC-E3-10.1: Toggle "Chuyển tiền" đổi fields (ẩn Chia cho / Bill mở, hiện Người nhận)
- [ ] AC-E3-10.2: Required: Số tiền, Người gửi, Người nhận
- [ ] AC-E3-10.3: Người gửi = Người nhận → Tạo disabled với hint
- [ ] AC-E3-10.4: Submit tạo row `chat_messages` với `message_type='transfer_card'`
- [ ] AC-E3-10.5: Transfer hiển thị feed dạng `TransferPill`
- [ ] AC-E3-10.6: Người nhận nhận Telegram notify (nếu link bot)
- [ ] AC-E3-10.7: KHÔNG tạo debt record
- [ ] AC-E3-10.8: Transfer không có edit / delete menu

---

## AC Coverage Summary

- **Total functional ACs:** 56 (48 original + 8 from US-E3-10)
- **Legacy mapping:** US-3.1 → US-E3-1, ..., US-3.9 → US-E3-9. US-E3-10 mới.
- **All stories:** P0 priority, effort: E3-1=L, E3-2=L, E3-3=M, E3-4=M, E3-5=L, E3-6=M, E3-7=S, E3-8=M, E3-9=S, E3-10=M
- **Logic tables retained:** Fields (US-E3-1), Case matrix (US-E3-2), Categories (US-E3-9), Transfer fields (US-E3-10)
