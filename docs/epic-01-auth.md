# Epic 1 — Đăng Nhập & Onboarding

> **Epic ID:** E1 · **Priority:** P0 · **Persona:** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) · [`personas/group-member-vn.md`](../personas/group-member-vn.md)
> **Brief:** OTP + password login, 2-step onboarding, branding NoPay

---

## US-E1-1 — Đăng nhập bằng OTP

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** log in with an OTP sent to my email **so that** I can quickly access the app without a password on first login.

- **Priority:** P0 · **Effort:** S

### Rules / Function
1. User nhập email → tap "Gửi mã OTP"
2. Supabase gửi **mã 6 số** về email (KHÔNG phải magic link)
3. Hiện form nhập 6 số OTP
4. Verify thành công → tự tạo member nếu chưa có
5. Nếu user mới (setup_done = false) → redirect "/setup"
6. Nếu user cũ (setup_done = true) → redirect "/"

### Edge cases
- Email không hợp lệ → hiện error
- OTP sai → hiện error "Mã không đúng"
- OTP hết hạn → hiện error, cho gửi lại
- Gửi OTP nhiều lần → rate limit từ Supabase

### Acceptance Criteria
- [ ] AC-E1-1.1: OTP gửi **mã số**, không gửi link
- [ ] AC-E1-1.2: User mới → redirect "/setup"
- [ ] AC-E1-1.3: User cũ → redirect "/"
- [ ] AC-E1-1.4: Lỗi OTP hiện error message

---

## US-E1-2 — Đăng nhập bằng mật khẩu

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** log in with my email and password **so that** I can access the app after setting a password on first onboarding.

- **Priority:** P0 · **Effort:** S

### Rules / Function
1. Tap "Nhập mật khẩu" → hiện form email + password
2. Login thành công → redirect "/" (luôn, vì có password = đã setup)

### Edge cases
- Sai password → hiện error "Invalid login credentials"
- Email chưa có tài khoản → hiện error

### Acceptance Criteria
- [ ] AC-E1-2.1: Login password thành công → redirect "/"
- [ ] AC-E1-2.2: Sai password → error message
- [ ] AC-E1-2.3: Chuyển qua lại giữa OTP và password mode

---

## US-E1-3 — Onboarding Step 1 — Avatar & Tên

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** set up my avatar and display name after OTP verification **so that** my profile is personalized in the group.

- **Priority:** P0 · **Effort:** M

### Rules / Function
1. Hiện sau OTP verify cho user mới (setup_done = false)
2. Avatar mặc định: chữ cái đầu email, nền màu
3. Ô nhập tên hiển thị: pre-filled email prefix
4. "Tiếp tục" → lưu display_name → sang step 2
5. "Bỏ qua" → giữ default → sang step 2

### Edge cases
- Tên trống khi tap "Tiếp tục" → giữ email prefix
- Tên quá dài (>50 ký tự) → truncate
- User tắt app giữa chừng → lần sau login OTP vẫn vào /setup

### Acceptance Criteria
- [ ] AC-E1-3.1: Step indicator hiện bước 1
- [ ] AC-E1-3.2: Avatar generated từ email
- [ ] AC-E1-3.3: Tên pre-filled email prefix
- [ ] AC-E1-3.4: "Tiếp tục" lưu display_name
- [ ] AC-E1-3.5: "Bỏ qua" giữ default, sang step 2

---

## US-E1-4 — Onboarding Step 2 — Đặt Mật Khẩu

**As a** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) or [`personas/group-member-vn.md`](../personas/group-member-vn.md), **I want to** optionally set a password for faster login in the future **so that** I can choose to remember my password or skip this step.

- **Priority:** P0 · **Effort:** M

### Rules / Function
1. 2 ô: mật khẩu mới + xác nhận mật khẩu
2. Validate: min 6 ký tự, 2 ô phải khớp
3. "Hoàn tất" → supabase.auth.updateUser({ password }) → setup_done = true → redirect "/"
4. "Bỏ qua" → setup_done = true → redirect "/"

### Edge cases
- Password < 6 ký tự → error "Tối thiểu 6 ký tự"
- Password không khớp → error "Mật khẩu không khớp"
- updateUser thất bại → toast error, giữ form

### Acceptance Criteria
- [ ] AC-E1-4.1: Step indicator hiện bước 2
- [ ] AC-E1-4.2: Password < 6 ký tự → error
- [ ] AC-E1-4.3: Password không khớp → error
- [ ] AC-E1-4.4: "Hoàn tất" set password + setup_done = true → redirect "/"
- [ ] AC-E1-4.5: "Bỏ qua" → setup_done = true → redirect "/"

---

## US-E1-5 — Branding màn Login

**As a** new visitor, **I want to** see app name and logo on login page **so that** I recognize the product clearly.

- **Priority:** P0 · **Effort:** S

### Rules / Function
1. Login page displays app branding (name + logo)
2. Logo visible before user enters email
3. App name shown in login header

### Edge cases
None.

### Acceptance Criteria
- [ ] AC-E1-5.1: App name + logo displayed on login page
- [ ] AC-E1-5.2: Logo visible before user interacts with form

---

## AC Coverage Summary

- **Total ACs this epic:** 19 (functional only, was 20)
- **Legacy ID mapping:** `US-1.1` → `US-E1-1`, `US-1.2` → `US-E1-2`, `US-1.3` → `US-E1-3`, `US-1.4` → `US-E1-4`, `US-1.5` → `US-E1-5`
