# Epic 3: Giao Dịch (Transactions)

---

## US-3.1: Tạo bill qua chat (AI Parser)

### Function
- User gõ tin nhắn VD: "500k ăn trưa 6 người"
- AI Parser (regex local, không LLM):
  - Số tiền: "500k" → 500.000đ, "1tr2" → 1.200.000đ
  - Mô tả: "ăn trưa", "bún bò", "café"
  - Số người: "6 người", "cả team"
- Đủ thông tin → hiện Bill Confirm Sheet (US-3.2)
- Thiếu → hiện AI Follow-up Card

### Edge cases
- Tin nhắn không có số tiền → gửi như text thường, không trigger
- Chỉ có số tiền, không có mô tả → vẫn trigger, description = null
- "cả team" → peopleCount = -1 (= group size)
- Số tiền < 1.000đ hoặc > 1 tỷ → bỏ qua

### UX/UI
**AI Follow-up Card:** inline trước thanh nhập
- "Chia 500k cho ăn trưa. Bạn muốn chia như nào?" (14px)
- 3 pill: "Bill mở" | "Chia đều" | "Tuỳ chỉnh" (nền #F2F2F7, 13px, rounded full)

### Tiêu chí
- [ ] "500k bún bò 6 người" → parse đúng amount/description/people
- [ ] "1tr2 ăn trưa" → 1.200.000đ
- [ ] Tin nhắn thường → không trigger
- [ ] Follow-up hiện khi thiếu split type

---

## US-3.2: Xác nhận bill (Confirm Sheet)

### Function
1. Hiện sau AI parse đủ info hoặc chọn follow-up option
2. Xác nhận → tạo bill + bill_participants + debts
3. Chèn chat message type "bill_card"
4. Thông báo participants qua Telegram
5. Payer mặc định = user hiện tại
6. Số tiền mỗi người = floor(tổng / số người)

### Edge cases
- Tổng không chia hết → dư phân bổ +1 cho N người đầu
- Amount = 0 → nút disabled
- Description trống → nút disabled
- Đóng sheet bằng tap backdrop hoặc nút X

### UX/UI
Half-sheet từ dưới, rounded top 20px, shadow blur 20px, backdrop 40% đen

**Thành phần:** drag handle 36x4px → "✦ Xác nhận bill" + "✕" → "Mô tả" | value → "Chia cho" | avatars 22px → "Mỗi người" | amount #3A5CCC → "Người trả" | avatar + name → divider → "📎 Thêm ảnh bill" → "Tạo bill" #3A5CCC 48px

### Tiêu chí
- [ ] Sheet hiện đúng avatars, amount, payer
- [ ] Confirm tạo bill + debts + chat message
- [ ] Sheet đóng sau confirm
- [ ] Toast "Đã tạo bill!"

---

## US-3.3: Chọn người & số tiền (Split Sheet)

### Function
- **Chia đều:** tổng / số người chọn, dư +1 cho N đầu
- **Chia %:** mỗi người nhập %, tổng = 100%
- **Tuỳ chỉnh:** nhập thủ công, tổng = tổng bill
- Validate: không cho xác nhận nếu tổng không khớp

### Edge cases
- Bỏ chọn tất cả → nút xác nhận disabled
- Chia đều 1 người → 1 người nhận toàn bộ
- Tuỳ chỉnh nhập 0 cho 1 người → cho phép (người đó không nợ)
- Tổng tuỳ chỉnh > tổng bill → hiện error

### UX/UI
Full bottom sheet, dim overlay

Tabs pill: "Chia đều" (active #EEF2FF) | "Chia %" | "Tuỳ chỉnh" (inactive #F2F2F7)

Member row 60px: avatar 36px + tên 14px bold + amount pill #F2F2F7 + checkbox 22px

Footer: "Còn lại chưa chia" | "0đ" #34C759 + nút "Xác nhận" #3A5CCC 52px

### Tiêu chí
- [ ] Toggle modes thay đổi UI
- [ ] Chia đều: auto-calculate
- [ ] "Còn lại" = 0 khi chia hết
- [ ] Xác nhận chỉ khi tổng = tổng bill

---

## US-3.4: Bill mở (Open Bill)

### Function
1. Tạo: bill_type = "open", status = "active"
2. Check-in: thành viên tap "Tôi có ăn" → tạo bill_checkins
3. Thêm khách: guest_name (không cần tài khoản)
4. Đóng bill: per_person = floor(tổng / checkin_count), tạo debts trừ payer
5. Chỉ payer/admin được đóng bill

### Edge cases
- Check-in 2 lần → chặn (unique constraint)
- Đóng bill 0 checkins → error "Chưa có ai check-in"
- Khách check-in → nợ không tạo (không có member_id)
- Payer tự check-in → không tạo debt cho chính mình

### UX/UI
**Card trong chat:** avatar cam #FF9500 + nền #FFF8EC + badge "Bill mở · N check-in" + nút "Tôi có ăn" / "Đã check-in"

**Sheet thêm người:** handle + "Thêm người vào bill" + search + member list + "Người ngoài nhóm"

### Tiêu chí
- [ ] Check-in tạo record + update UI
- [ ] Đóng bill tạo debts đúng
- [ ] Khách check-in được
- [ ] Chỉ payer/admin thấy "Đóng bill"
- [ ] Check-in trùng → chặn

---

## US-3.5: Chuyển tiền / Thanh toán

### Function
1. QR tạo từ VietQR API với bank info creditor
2. Deep link mở app ngân hàng
3. "Đã chuyển tiền" → tạo payment_confirmation (pending)
4. Chủ nợ xác nhận → debt status = "confirmed"
5. Notify Telegram 2 chiều

### Edge cases
- Creditor chưa liên kết NH → hiện "Người nhận chưa liên kết ngân hàng"
- Copy số TK → toast "Đã sao chép"
- Network error khi tạo confirmation → toast error

### UX/UI
**Transfer page:** back + "Chuyển tiền" → amount lớn bold + "cho" + avatar → QR card (rounded 14px) + bank info + copy + "Lưu QR" | "Chia sẻ" → CTA "Đã chuyển tiền" #3A5CCC 52px

### Tiêu chí
- [ ] QR đúng bank info creditor
- [ ] Copy số TK hoạt động
- [ ] "Đã chuyển tiền" tạo payment_confirmation
- [ ] Thông báo Telegram
- [ ] Hiện thông báo khi chưa có bank info
