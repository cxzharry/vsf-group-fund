# Epic 1: Đăng Nhập & Onboarding (Auth)

---

## Function

### Luồng OTP
1. User nhập email → tap "Gửi mã OTP"
2. Supabase gửi **mã 6 số** về email (KHÔNG phải magic link)
3. User nhập 6 số → verify
4. Thành công → tự tạo member nếu chưa có
5. Nếu user mới (setup_done = false) → redirect "/setup"
6. Nếu user cũ (setup_done = true) → redirect "/"

### Luồng Password
1. Tap "Nhập mật khẩu" → hiện form email + password
2. Login thành công → redirect "/" (user đã có password = đã setup)

### Auto-create member
- Trigger SQL `handle_new_user()` tạo member từ auth.users
- Fallback: AuthProvider client-side tạo nếu trigger fail
- Member mới: `setup_done = false`, `display_name = email prefix`

### Luồng Onboarding (chỉ user mới, sau OTP verify)

**Step 1: Avatar & Tên (Optional)**
- Hiện avatar mặc định (chữ cái đầu email, nền màu)
- Ô nhập tên hiển thị (pre-filled = email prefix)
- Tap avatar → chọn ảnh từ device (upload to Supabase Storage)
- Nút "Tiếp tục" → lưu display_name + avatar_url → sang step 2
- Nút "Bỏ qua" → giữ default → sang step 2

**Step 2: Đặt Mật Khẩu (Optional)**
- Ô nhập mật khẩu mới (min 6 ký tự)
- Ô xác nhận mật khẩu
- Nút "Hoàn tất" → set password via supabase.auth.updateUser → đánh dấu setup_done = true → redirect "/"
- Nút "Bỏ qua" → đánh dấu setup_done = true → redirect "/"

### Database
- Thêm cột `setup_done BOOLEAN DEFAULT false` vào bảng members
- Existing users: UPDATE SET setup_done = true

### Edge cases
- User tắt app giữa chừng onboarding → lần sau login OTP vẫn vào /setup (vì setup_done = false)
- User nhập tên trống → giữ default (email prefix)
- Password không khớp → hiện error, không cho submit
- Password quá ngắn (<6 ký tự) → hiện error
- Avatar upload lỗi → toast error, giữ default avatar
- User quay lại step 1 từ step 2 → giữ data đã nhập

---

## UX/UI

### Màn Login (giữ nguyên)
- Full-page, căn giữa dọc trên mobile
- Desktop: căn giữa cả dọc lẫn ngang, card có shadow
- App icon 72x72px, "NoPay\nFreeLunch", subtitle 2 dòng
- Form OTP → Form verify → redirect

### Màn Setup Step 1: Avatar & Tên
- Cùng layout container như login (max-w-430px, rounded card)
- Header: "Chào mừng!" (24px bold, căn giữa)
- Subtitle: "Thiết lập hồ sơ của bạn" (15px gray, căn giữa)
- Avatar: tròn 80px, nền màu hash, chữ cái đầu 28px bold trắng
  - Tap → native file picker (accept image/*)
  - Sau chọn ảnh: hiện preview tròn, crop center
  - Overlay icon camera nhỏ (20px) góc dưới phải avatar
- Khoảng cách avatar → input: 24px
- Ô "Tên hiển thị": border-bottom #E5E5EA, font 15px, pre-filled email prefix
- Khoảng cách input → buttons: 32px
- Nút "Tiếp tục": nền #3A5CCC, chữ trắng, rounded 14px, cao 54px, full width
- Nút "Bỏ qua": text only, 15px, #8E8E93, căn giữa, dưới nút chính
- Khoảng cách giữa 2 nút: 12px

### Màn Setup Step 2: Đặt Mật Khẩu
- Cùng layout container
- Header: "Đặt mật khẩu" (24px bold, căn giữa)
- Subtitle: "Để đăng nhập nhanh hơn lần sau" (15px gray, căn giữa)
- Icon khoá: 48px, nền #F2F2F7, rounded 14px, căn giữa
- Khoảng cách icon → form: 24px
- 2 ô trong card rounded border:
  - "Mật khẩu mới" (border-bottom)
  - "Xác nhận mật khẩu"
  - Font 15px, type password
- Gợi ý: "Tối thiểu 6 ký tự" (12px gray, dưới card)
- Nút "Hoàn tất": nền #3A5CCC, rounded 14px, cao 54px
- Nút "Bỏ qua": text only, #8E8E93
- Error state: chữ đỏ #FF3B30 dưới form (password mismatch, quá ngắn)

### Progress indicator
- 2 dots ở trên header (step indicator)
- Dot active: #3A5CCC, 8px
- Dot inactive: #E5E5EA, 8px
- Gap giữa dots: 8px

---

## Tiêu chí thành công

### Function
- [ ] OTP gửi **mã số**, không gửi link
- [ ] Login OTP user mới → redirect "/setup"
- [ ] Login OTP user cũ → redirect "/"
- [ ] Login password → redirect "/" (luôn)
- [ ] Member mới tạo với setup_done = false
- [ ] Step 1 "Tiếp tục": lưu display_name (+ avatar nếu có)
- [ ] Step 1 "Bỏ qua": giữ default, sang step 2
- [ ] Step 2 "Hoàn tất": set password + setup_done = true → redirect "/"
- [ ] Step 2 "Bỏ qua": setup_done = true → redirect "/" (không set password)
- [ ] User tắt app giữa onboarding → lần sau vẫn vào /setup
- [ ] Password < 6 ký tự → hiện error
- [ ] Password không khớp → hiện error

### UX/UI
- [ ] Step indicator (2 dots) hiện đúng step
- [ ] Avatar 80px tròn, tap mở file picker
- [ ] Tên pre-filled email prefix
- [ ] Password card: 2 ô, rounded border, gợi ý "Tối thiểu 6 ký tự"
- [ ] Nút skip: text only, gray, dưới nút chính
- [ ] Cùng layout container với login (max-w-430, shadow desktop)
- [ ] Mobile + Desktop hiển thị đúng
