# Epic 5 — Tài Khoản (Account)

> **Epic ID:** E5 · **Priority:** P0 · **Persona:** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) · [`personas/group-member-vn.md`](../personas/group-member-vn.md)
> **Brief:** Hồ sơ, ngân hàng VN, Telegram link, đăng xuất

---

## US-E5-1 — Xem thông tin tài khoản

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** view my profile information and connection status **so that** I can see my account details and know if my bank and Telegram are linked.

- **Priority:** P0 · **Effort:** S

### Rules / Function
- Hiện: avatar, display_name, email
- Hiện trạng thái liên kết: ngân hàng (có/chưa), Telegram (có/chưa)

### Edge cases
- Member chưa có avatar → hiện chữ cái đầu + nền màu
- Email dài → truncate

### Acceptance Criteria
- [ ] AC-E5-1.1: Hiện đúng tên + email
- [ ] AC-E5-1.2: Bank status: "Đã liên kết" hoặc "Chưa liên kết"

---

## US-E5-2 — Sửa tên hiển thị

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** edit my display name **so that** I can change how my name appears to others in the group.

- **Priority:** P0 · **Effort:** S

### Rules / Function
1. Tap "Sửa" → dialog nhập tên mới
2. Lưu → UPDATE members SET display_name
3. Toast "Đã lưu!"

### Edge cases
- Tên trống → không cho lưu (disabled)
- Tên giống cũ → vẫn cho lưu (idempotent)

### Acceptance Criteria
- [ ] AC-E5-2.1: Sửa tên lưu đúng vào database
- [ ] AC-E5-2.2: Dialog đóng sau lưu

---

## US-E5-3 — Liên kết ngân hàng

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md), **I want to** link my bank account information **so that** others can pay me via VietQR with my account details pre-filled.

- **Priority:** P0 · **Effort:** M

### Rules / Function
1. Tap card ngân hàng → dialog chỉnh sửa
2. Chọn ngân hàng (10 NH phổ biến) hoặc nhập tên
3. Nhập số tài khoản + tên chủ tài khoản (auto uppercase)
4. Lưu → UPDATE members: bank_name, bank_account_no, bank_account_name
5. Masked display: ****XXXX (last 4 digits)

### Edge cases
- Số TK chứa chữ → lọc chỉ giữ số
- Tên chủ TK → auto uppercase
- Xoá thông tin NH → cho phép clear

### Acceptance Criteria
- [ ] AC-E5-3.1: Lưu 3 trường: bank_name, account_no, account_name
- [ ] AC-E5-3.2: Masked account ****XXXX hiển thị
- [ ] AC-E5-3.3: Auto uppercase tên chủ TK
- [ ] AC-E5-3.4: Badge "Đã liên kết" hiện sau save

---

## US-E5-4 — Liên kết Telegram

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** link my Telegram account **so that** I receive notifications about bills and payments through Telegram.

- **Priority:** P0 · **Effort:** M

### Rules / Function
1. Tap "Liên kết" → mở `t.me/vsf_product_bot?start={email}`
2. Bot nhận `/start email` → tìm member → UPDATE telegram_chat_id
3. Quay lại app → badge "Đã liên kết"

### Edge cases
- Email không khớp → bot báo "Không tìm thấy tài khoản"
- Đã liên kết → gửi lại /start → update chat_id (cho phép đổi device)

### Acceptance Criteria
- [ ] AC-E5-4.1: Mở đúng Telegram bot URL `t.me/vsf_product_bot?start={email}`
- [ ] AC-E5-4.2: Bot xử lý đúng /start command và UPDATE telegram_chat_id
- [ ] AC-E5-4.3: Badge "Đã liên kết" hiện sau link

---

## US-E5-5 — Đăng xuất

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** log out from the app **so that** I can end my session securely.

- **Priority:** P0 · **Effort:** S

### Rules / Function
1. Tap "Đăng xuất" → dialog xác nhận
2. Supabase sign out → clear session
3. Redirect về /login

### Edge cases
- Đăng xuất khi đang offline → clear local, redirect anyway

### Acceptance Criteria
- [ ] AC-E5-5.1: Session cleared
- [ ] AC-E5-5.2: Redirect về /login

---

## AC Coverage Summary

- **Total ACs this epic:** 11 (functional only, visual specs removed)
- **Legacy ID mapping:** `US-5.1` → `US-E5-1`, `US-5.2` → `US-E5-2`, `US-5.3` → `US-E5-3`, `US-5.4` → `US-E5-4`, `US-5.5` → `US-E5-5`
