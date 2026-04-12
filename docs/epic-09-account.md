# Epic 9: Tài Khoản (Account)

## Màn hình: Tab 2

### Header
"Tài khoản" (20px bold, căn giữa)

### Phần hồ sơ
- Avatar tròn (lớn, nền màu, chữ cái đầu)
- Tên hiển thị (bold) + email (gray)
- Icon điện thoại + nút "Sửa"

### Phần ngân hàng
- Nhãn: "NGÂN HÀNG" (gray, 11px, uppercase)
- Card ngân hàng (trắng, rounded 14px):
  - "Tài khoản ngân hàng" + chevron
  - Tên ngân hàng + tài khoản ẩn (****XXXX) + badge "Đã liên kết"
  - HOẶC: "Chưa liên kết" + nút "Liên kết ngay" (xanh)

### Phần liên kết
- Nhãn: "LIÊN KẾT" (gray, 11px, uppercase)
- Card Telegram: icon + "Telegram" + nút "Liên kết"
  - Nếu đã liên kết: badge "Đã liên kết"

### Đăng xuất
- Dưới cùng: chữ đỏ "Đăng xuất" với icon logout

## Luồng sửa hồ sơ

1. Tap "Sửa" → dialog nhập tên mới
2. Lưu → cập nhật members table
3. Toast thành công

## Luồng liên kết ngân hàng

1. Tap card ngân hàng → dialog chỉnh sửa
2. Chọn ngân hàng (10 ngân hàng phổ biến) hoặc nhập tên
3. Nhập số tài khoản + tên chủ tài khoản
4. Lưu → cập nhật members table

## Luồng liên kết Telegram

1. Tap "Liên kết" → mở Telegram bot
2. Gửi `/start email@example.com` cho bot
3. Bot tìm member theo email → cập nhật telegram_chat_id
4. Quay lại app → badge "Đã liên kết"

## Tiêu chí thành công

- [ ] Hiện đúng thông tin hồ sơ
- [ ] Sửa tên hoạt động
- [ ] Liên kết ngân hàng: lưu bank_name, account_no, account_name
- [ ] Liên kết Telegram: chuyển đến bot
- [ ] Đăng xuất xoá session và redirect về login
