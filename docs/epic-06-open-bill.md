# Epic 6: Bill Mở (Open Bill)

## Trường hợp sử dụng

Ăn trưa, chưa biết ai tham gia. Mọi người check-in khi đến.

## Tạo bill mở

Qua chat intent (chọn "Bill mở") hoặc form. `bill_type = "open"`, `status = "active"`.

## Card Bill Mở (trong chat)

- Giao diện cam (#FF9500 avatar, #FFF8EC nền)
- Badge: "Bill mở · N người đã check-in"
- Thông tin: người trả, tiêu đề, tổng tiền
- Nút: "Tôi có ăn" (check-in) hoặc "Đã check-in" (disabled)
- Hành động admin: "+ Thêm người", "Đóng bill"

## Luồng check-in

1. Tap "Tôi có ăn" → tạo bản ghi bill_checkins
2. Nút đổi thành "Đã check-in"
3. Thông báo người trả qua Telegram

## Luồng đóng bill

1. Người trả/admin tap "Đóng bill"
2. Tính: mỗi người = floor(tổng / số check-in)
3. Tạo debts cho tất cả thành viên đã check-in (trừ người trả)
4. Trạng thái bill → "closed"
5. Thông báo tất cả người nợ

## Sheet thêm người

- Bottom sheet với danh sách thành viên nhóm
- Ô tìm kiếm: "Tìm thành viên..."
- Thành viên: tap để thêm với badge "Thêm"
- Mục: "Người ngoài nhóm" → thêm bằng tên (không cần tài khoản)

## Tiêu chí thành công

- [ ] Check-in tạo bản ghi và cập nhật UI
- [ ] Đóng bill tạo debts đúng số tiền mỗi người
- [ ] Khách (không có tài khoản) vẫn check-in được
- [ ] Chỉ người trả/admin thấy "Đóng bill"
- [ ] Thông báo Telegram khi check-in và đóng bill
