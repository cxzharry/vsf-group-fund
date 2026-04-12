# Epic 5: Tài Khoản (Account)

---

## Function

### Sửa hồ sơ
1. Tap "Sửa" → dialog nhập tên mới
2. Lưu → cập nhật members table (display_name)
3. Toast thành công

### Liên kết ngân hàng
1. Tap card ngân hàng → dialog chỉnh sửa
2. Chọn ngân hàng (10 ngân hàng phổ biến) hoặc nhập tên
3. Nhập số tài khoản + tên chủ tài khoản (auto uppercase)
4. Lưu → cập nhật members: bank_name, bank_account_no, bank_account_name

### Liên kết Telegram
1. Tap "Liên kết" → mở `https://t.me/vsf_product_bot?start={email}`
2. Bot nhận `/start email` → tìm member → cập nhật telegram_chat_id
3. Quay lại app → badge "Đã liên kết"

### Đăng xuất
1. Tap "Đăng xuất" → dialog xác nhận
2. Supabase sign out → redirect về /login

---

## UX/UI

### Màn hình (Tab 2)

**Header:** "Tài khoản" (20px bold, căn giữa)

**Phần hồ sơ (card trắng, rounded 14px, padding 16px):**
- Avatar tròn lớn (44px, nền màu hash từ tên, chữ cái đầu trắng)
- Tên hiển thị (bold 17px) + email (gray 13px)
- Nút "Sửa" (xanh #3A5CCC, 13px)

**Phần ngân hàng:**
- Nhãn: "NGÂN HÀNG" (gray #8E8E93, 11px, uppercase, letter-spacing 0.8)
- Card (trắng, rounded 14px):
  - "Tài khoản ngân hàng" + chevron ">"
  - Nếu đã liên kết: tên NH + ****XXXX + badge "Đã liên kết" (xanh lá)
  - Nếu chưa: "Chưa liên kết" + nút "Liên kết ngay" (xanh, rounded)

**Phần liên kết:**
- Nhãn: "LIÊN KẾT" (gray, 11px, uppercase)
- Card Telegram (trắng, rounded 14px, padding 14px 16px):
  - Icon Telegram + "Telegram" + nút "Liên kết" hoặc badge "Đã liên kết"

**Đăng xuất:**
- Dưới cùng, trước tab bar
- Nút: nền #FFF0F0, chữ đỏ #FF3B30, rounded 10px, cao 36px
- Icon logout + "Đăng xuất"

### Khoảng cách
- Gap giữa các section: 16px
- Padding ngang content: 16px
- Section label cách card dưới: 6px

---

## Tiêu chí thành công

### Function
- [ ] Sửa tên lưu đúng vào database
- [ ] Liên kết ngân hàng lưu 3 trường: bank_name, account_no, account_name
- [ ] Liên kết Telegram mở đúng bot URL
- [ ] Đăng xuất xoá session + redirect /login

### UX/UI
- [ ] Hiện đúng thông tin hồ sơ (tên + email)
- [ ] Avatar màu nhất quán (hash từ tên)
- [ ] Bank card hiện masked account ****XXXX
- [ ] Badge "Đã liên kết" xanh lá khi đã link
- [ ] Nút đăng xuất màu đỏ nhạt, đặt dưới cùng
- [ ] Khoảng cách giữa sections đều 16px
