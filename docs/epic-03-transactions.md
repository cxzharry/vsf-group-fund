# Epic 3: Giao Dịch (Transactions)

Bao gồm: Tạo Bill, Chia Tiền, Bill Mở, Chuyển Tiền.

---

## 3.1 Tạo Bill qua Chat

### Function
- User gõ tin nhắn VD: "500k ăn trưa 6 người"
- AI Parser (regex local, không LLM):
  - Phát hiện số tiền: "500k" → 500.000đ, "1tr2" → 1.200.000đ
  - Phát hiện mô tả: "ăn trưa", "bún bò", "café"
  - Phát hiện số người: "6 người", "cả team"
- Đủ thông tin → hiện Bill Confirm Sheet
- Thiếu → hiện AI Follow-up Card với 3 lựa chọn

### UX/UI
**AI Follow-up Card:**
- Vị trí: inline trong chat, trước thanh nhập
- Câu hỏi: "Chia 500k cho ăn trưa. Bạn muốn chia như nào?" (14px)
- 3 nút pill: "Bill mở" | "Chia đều" | "Tuỳ chỉnh"
- Nút pill: nền #F2F2F7, text 13px, rounded full, padding 6px 14px

---

## 3.2 Bill Confirm Sheet

### Function
- Khi xác nhận:
  1. Tạo bill + bill_participants + debts
  2. Chèn chat message type "bill_card"
  3. Thông báo participants qua Telegram
- Số tiền mỗi người = floor(tổng / số người)
- Payer mặc định = user hiện tại

### UX/UI
- Half-sheet từ dưới lên, rounded top 20px
- Shadow: blur 20px, color #00000022, offset y -4px
- Backdrop: 40% đen
- Padding body: 8px 20px 34px 20px

**Thành phần (từ trên xuống):**
- Drag handle: 36x4px, #D1D1D6, rounded 2px, căn giữa, padding 8px 0
- Header: "✦ Xác nhận bill" (15px bold) + "✕" (16px #AEAEB2)
- Dòng "Mô tả": label 13px #8E8E93 | value 13px #1C1C1E
- Dòng "Chia cho": label | avatar tròn 22px × tối đa 5, gap 4px, "+N" nếu nhiều
- Dòng "Mỗi người": label | số tiền 14px bold #3A5CCC
- Dòng "Người trả": label | avatar 22px + tên 13px bold ("Bạn" nếu current user)
- Gap giữa các dòng: 12px
- Đường kẻ: #E5E5EA, height 0.5px
- Nút "📎 Thêm ảnh bill": nền #F2F2F7, rounded 10px, cao 38px, text 13px #8E8E93
- Nút "Tạo bill": nền #3A5CCC, rounded 12px, cao 48px, text 15px bold trắng

---

## 3.3 Chọn Người & Số Tiền

### Function
- **Chia đều:** tổng / số người chọn, phần dư +1 VND cho N người đầu
- **Chia %:** mỗi người nhập %, tổng phải = 100%
- **Tuỳ chỉnh:** nhập thủ công, tổng phải = tổng bill
- Validate: không cho xác nhận nếu tổng không khớp

### UX/UI
- Full-height bottom sheet, dim overlay
- Drag handle
- Header: "Chọn người & số tiền" (17px bold) + "Xong" (15px #3A5CCC)
- Split mode tabs: pill buttons, gap 8px, padding 8px 16px
  - Active: nền #EEF2FF, text #3A5CCC bold
  - Inactive: nền #F2F2F7, text #8E8E93
- Dòng tổng: "Tổng" (13px #8E8E93) | "500.000đ" (15px bold #1C1C1E), cao 36px, padding 0 20px
- Member row (cao 60px, padding 0 20px, gap 12px):
  - Avatar 36px tròn, nền màu, chữ cái đầu 14px bold trắng
  - Tên 14px bold #1C1C1E + phụ đề 12px #8E8E93
  - Amount pill: nền #F2F2F7, rounded 8px, cao 32px, padding 0 10px, text 13px bold #3A5CCC
  - Checkbox 22px tròn: checked = nền #3A5CCC "✓" trắng | unchecked = nền #F2F2F7
- Separator: #E5E5EA, 0.5px
- Remainder row: "Còn lại chưa chia" #8E8E93 | "0đ" 15px bold #34C759, cao 44px
- Nút "Xác nhận": nền #3A5CCC, rounded 14px, cao 52px, padding wrapper 12px

---

## 3.4 Bill Mở (Open Bill)

### Function
- Tạo: bill_type = "open", status = "active"
- Check-in: tạo bill_checkins record (member_id hoặc guest_name)
- Đóng bill: per_person = floor(tổng / checkin_count), tạo debts trừ payer
- Chỉ payer/admin được đóng bill
- Khách (không có account) check-in qua guest_name

### UX/UI
**Card Bill Mở (trong chat):**
- Avatar: #FF9500, 34px tròn
- Nền card: #FFF8EC (cam nhạt)
- Badge: "Bill mở · N người đã check-in" (11px #FF9500)
- Nút "Tôi có ăn": outline cam, rounded
- Nút "Đã check-in": disabled, gray
- Admin buttons: "+ Thêm người" | "Đóng bill"

**Sheet thêm người:**
- Bottom sheet, rounded top 20px
- Handle + header "Thêm người vào bill" + "Xong"
- Ô tìm kiếm: "Tìm thành viên...", rounded, nền #F2F2F7
- Danh sách: avatar + tên + badge "Thêm" (xanh) hoặc "✓ Đã check-in"
- Section "Người ngoài nhóm": icon "+" + "Thêm người lạ bằng tên"

---

## 3.5 Chuyển Tiền

### Function
- QR tạo từ VietQR API với bank info của creditor
- Deep link mở app ngân hàng trực tiếp
- "Đã chuyển tiền" → tạo payment_confirmation (status: pending)
- Chủ nợ xác nhận → debt status = "confirmed"
- Notify qua Telegram cả 2 chiều

### UX/UI
**Màn hình Transfer (full page):**
- Header: back + "Chuyển tiền" (17px bold)
- Bill info: tiêu đề + ngày (13px #8E8E93)
- Số tiền: 28px bold #1C1C1E + "cho" + avatar 22px + tên bold
- Card QR (trắng, rounded 14px, padding 16px):
  - QR image căn giữa
  - Tên NH (15px bold) + số TK (13px, có nút copy icon) + tên chủ TK (13px)
  - Nút row: "Lưu QR" | "Chia sẻ" | nút bank app (icon ngân hàng)
- CTA: "Đã chuyển tiền" nền #3A5CCC, rounded 14px, cao 52px, full width
- Nếu không có bank info: thông báo "Người nhận chưa liên kết ngân hàng"

---

## Tiêu chí thành công

### Function
- [ ] "500k bún bò 6 người" → parse đúng amount, description, people
- [ ] Follow-up card hiện khi thiếu info
- [ ] Confirm sheet tạo bill + debts + chat message
- [ ] Chia đều: per person = floor(tổng / N), dư +1 cho N đầu
- [ ] Chia tuỳ chỉnh: validate tổng = tổng bill
- [ ] Open bill: check-in + close tạo debts đúng
- [ ] Khách check-in qua guest_name
- [ ] QR tạo đúng bank info
- [ ] Payment confirmation 2 chiều

### UX/UI
- [ ] Confirm sheet: drag handle, rows đúng spacing, avatar 22px
- [ ] Split sheet: tabs pill, member rows 60px, checkbox 22px
- [ ] Open bill card: cam theme, badge, nút check-in
- [ ] Transfer page: QR card, copy button, CTA 52px
- [ ] Tất cả sheet: rounded top 20px, shadow, backdrop 40%
- [ ] Nút xác nhận disabled khi data không hợp lệ
