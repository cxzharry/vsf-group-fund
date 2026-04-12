# Epic 4: Tạo Bill (Chat Intent)

## Luồng chính

User gõ tin nhắn trong group chat → AI parse → confirm sheet → tạo bill.

## AI Parser (regex local, không dùng LLM)

- Phát hiện số tiền: "500k" → 500.000đ, "1tr2" → 1.200.000đ
- Phát hiện mô tả: "ăn trưa", "bún bò", "café"...
- Phát hiện số người: "6 người", "6 ng", "cả team"
- Nếu đủ thông tin → hiện Bill Confirm Sheet
- Nếu thiếu → hiện AI Follow-up Card

## AI Follow-up Card

- Inline trong chat, trước thanh nhập
- Câu hỏi: "Chia 500k cho ăn trưa. Bạn muốn chia như nào?"
- 3 lựa chọn:
  - A: "Bill mở" (chưa biết mấy người)
  - B: "Chia đều" (nhập số người)
  - C: "Tuỳ chỉnh" (nhập từng người)

## Bill Confirm Sheet (Half-Sheet)

Thiết kế: half-sheet từ dưới lên, rounded top 20px, shadow, backdrop 40% đen.

### Thành phần (từ trên xuống)
- Drag handle (thanh xám, căn giữa, 36x4px)
- Header: "✦ Xác nhận bill" (bold) + nút "✕" đóng (xám)
- Dòng: "Mô tả" | nội dung mô tả
- Dòng: "Chia cho" | avatar thành viên (tối đa 5, 22px) + "+N"
- Dòng: "Mỗi người" | số tiền (xanh, bold)
- Dòng: "Người trả" | avatar + tên ("Bạn" nếu là user hiện tại)
- Đường kẻ (#E5E5EA)
- Nút "📎 Thêm ảnh bill" (nền xám, căn giữa)
- Nút "Tạo bill" (xanh, full width, 48px, rounded 12px)

### Khi xác nhận
1. Tạo bill + participants + debts
2. Chèn tin nhắn bill_card trong chat
3. Đóng sheet
4. Toast "Đã tạo bill!"
5. Thông báo participants qua Telegram

## Tiêu chí thành công

- [ ] "500k bún bò 6 người" → parse đúng amount, description, people
- [ ] Hiện follow-up khi thiếu split type
- [ ] Tap option → hiện Bill Confirm Sheet
- [ ] Sheet hiện avatar thành viên đúng
- [ ] Số tiền mỗi người = floor(tổng / số người)
- [ ] Xác nhận tạo bill + debts + chat message
- [ ] Sheet đóng sau khi xác nhận
