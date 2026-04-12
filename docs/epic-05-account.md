# Epic 5: Tài Khoản (Account)

---

## US-5.1: Xem thông tin tài khoản

### Function
- Hiện: avatar, display_name, email
- Hiện trạng thái liên kết: ngân hàng (có/chưa), Telegram (có/chưa)

### Edge cases
- Member chưa có avatar → hiện chữ cái đầu + nền màu
- Email dài → truncate

### UX/UI
**Header:** "Tài khoản" (20px bold, căn giữa)

**Hồ sơ (card trắng, rounded 14px, padding 16px):**
- Avatar 44px tròn, nền màu hash, chữ cái đầu trắng
- Tên 17px bold + email 13px gray
- Nút "Sửa" xanh #3A5CCC

**Ngân hàng:** nhãn "NGÂN HÀNG" 11px uppercase → card: "Tài khoản ngân hàng" + chevron + trạng thái

**Liên kết:** nhãn "LIÊN KẾT" 11px uppercase → card Telegram + trạng thái

**Đăng xuất:** nền #FFF0F0, chữ đỏ #FF3B30, rounded 10px, cao 36px, dưới cùng

Gap sections: 16px, padding ngang: 16px

### Tiêu chí
- [ ] Hiện đúng tên + email
- [ ] Avatar màu nhất quán
- [ ] Bank status: "Đã liên kết" hoặc "Chưa liên kết"
- [ ] Spacing 16px giữa sections

---

## US-5.2: Sửa tên hiển thị

### Function
1. Tap "Sửa" → dialog nhập tên mới
2. Lưu → UPDATE members SET display_name
3. Toast "Đã lưu!"

### Edge cases
- Tên trống → không cho lưu (disabled)
- Tên giống cũ → vẫn cho lưu (idempotent)

### Tiêu chí
- [ ] Sửa tên lưu đúng vào database
- [ ] Toast thành công
- [ ] Dialog đóng sau lưu

---

## US-5.3: Liên kết ngân hàng

### Function
1. Tap card ngân hàng → dialog chỉnh sửa
2. Chọn ngân hàng (10 NH phổ biến) hoặc nhập tên
3. Nhập số tài khoản + tên chủ tài khoản (auto uppercase)
4. Lưu → UPDATE members: bank_name, bank_account_no, bank_account_name

### Edge cases
- Số TK chứa chữ → lọc chỉ giữ số
- Tên chủ TK → auto uppercase
- Xoá thông tin NH → cho phép clear

### UX/UI
- Dialog: chips 10 NH phổ biến + ô nhập manual
- 2 ô: số TK (numeric) + tên chủ TK
- Badge "Đã liên kết" xanh lá khi đã link
- Masked display: ****XXXX (last 4 digits)

### Tiêu chí
- [ ] Lưu 3 trường: bank_name, account_no, account_name
- [ ] Masked account ****XXXX
- [ ] Badge "Đã liên kết" sau khi save
- [ ] Auto uppercase tên chủ TK

---

## US-5.4: Liên kết Telegram

### Function
1. Tap "Liên kết" → mở `https://t.me/vsf_product_bot?start={email}`
2. Bot nhận `/start email` → tìm member → UPDATE telegram_chat_id
3. Quay lại app → badge "Đã liên kết"

### Edge cases
- Email không khớp → bot báo "Không tìm thấy tài khoản"
- Đã liên kết → gửi lại /start → update chat_id (cho phép đổi device)

### Tiêu chí
- [ ] Mở đúng Telegram bot URL
- [ ] Badge "Đã liên kết" sau khi link
- [ ] Bot xử lý đúng /start command

---

## US-5.5: Đăng xuất

### Function
1. Tap "Đăng xuất" → dialog xác nhận
2. Supabase sign out → clear session
3. Redirect về /login

### Edge cases
- Đăng xuất khi đang offline → clear local, redirect anyway

### Tiêu chí
- [ ] Dialog xác nhận trước khi logout
- [ ] Session cleared
- [ ] Redirect về /login
