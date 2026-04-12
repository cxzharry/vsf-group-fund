# Epic 1: Đăng Nhập & Onboarding

---

## US-1.1: Đăng nhập bằng OTP

### Function
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

### UX/UI
- Ô email: border-bottom #E5E5EA, font 15px
- Nút "Gửi mã OTP": nền #3A5CCC, chữ trắng, rounded 14px, cao 54px, full width
- Form verify: ô nhập 6 số, text-center, font 22px, tracking 0.3em
- Nút "Xác nhận": cùng style nút chính
- Link "Quay lại" dưới nút

### Tiêu chí
- [ ] OTP gửi **mã số**, không gửi link
- [ ] User mới → redirect "/setup"
- [ ] User cũ → redirect "/"
- [ ] Error hiện rõ ràng màu đỏ #FF3B30

---

## US-1.2: Đăng nhập bằng mật khẩu

### Function
1. Tap "Nhập mật khẩu" → hiện form email + password
2. Login thành công → redirect "/" (luôn, vì có password = đã setup)

### Edge cases
- Sai password → hiện error "Invalid login credentials"
- Email chưa có tài khoản → hiện error

### UX/UI
- 2 ô trong card rounded border: email + password
- Nút "Đăng nhập": nền #3A5CCC, rounded 14px, cao 54px
- Link "Dùng OTP thay thế" bên dưới

### Tiêu chí
- [ ] Login password thành công → redirect "/"
- [ ] Sai password → error message
- [ ] Chuyển qua lại giữa OTP và password mode

---

## US-1.3: Onboarding Step 1 — Avatar & Tên

### Function
1. Hiện sau OTP verify cho user mới (setup_done = false)
2. Avatar mặc định: chữ cái đầu email, nền màu
3. Ô nhập tên hiển thị: pre-filled email prefix
4. "Tiếp tục" → lưu display_name → sang step 2
5. "Bỏ qua" → giữ default → sang step 2

### Edge cases
- Tên trống khi tap "Tiếp tục" → giữ email prefix
- Tên quá dài (>50 ký tự) → truncate
- User tắt app giữa chừng → lần sau login OTP vẫn vào /setup

### UX/UI
- Cùng layout container login (max-w-430px, rounded card)
- Step indicator: 2 dots (active #3A5CCC 8px, inactive #E5E5EA 8px, gap 8px)
- Header: "Chào mừng!" (24px bold, căn giữa)
- Subtitle: "Thiết lập hồ sơ của bạn" (15px gray)
- Avatar: tròn 80px, nền màu, chữ cái đầu 28px bold trắng
- Ô tên: border-bottom #E5E5EA, font 15px
- Nút "Tiếp tục": nền #3A5CCC, cao 54px, rounded 14px
- Nút "Bỏ qua": text only, 15px, #8E8E93

### Tiêu chí
- [ ] Step indicator hiện dot 1 active
- [ ] Avatar 80px tròn, màu hash từ email
- [ ] Tên pre-filled email prefix
- [ ] "Tiếp tục" lưu display_name
- [ ] "Bỏ qua" giữ default, sang step 2

---

## US-1.4: Onboarding Step 2 — Đặt Mật Khẩu

### Function
1. 2 ô: mật khẩu mới + xác nhận mật khẩu
2. Validate: min 6 ký tự, 2 ô phải khớp
3. "Hoàn tất" → supabase.auth.updateUser({ password }) → setup_done = true → redirect "/"
4. "Bỏ qua" → setup_done = true → redirect "/"

### Edge cases
- Password < 6 ký tự → error "Tối thiểu 6 ký tự"
- Password không khớp → error "Mật khẩu không khớp"
- updateUser thất bại → toast error, giữ form

### UX/UI
- Step indicator: dot 2 active
- Header: "Đặt mật khẩu" (24px bold)
- Subtitle: "Để đăng nhập nhanh hơn lần sau" (15px gray)
- Icon khoá: 48px, nền #F2F2F7 rounded 14px, căn giữa
- 2 ô trong card rounded: "Mật khẩu mới" + "Xác nhận mật khẩu"
- Gợi ý: "Tối thiểu 6 ký tự" (12px gray)
- Nút "Hoàn tất": nền #3A5CCC, cao 54px
- Nút "Bỏ qua": text only, #8E8E93
- Error: chữ đỏ #FF3B30 dưới form

### Tiêu chí
- [ ] Step indicator hiện dot 2 active
- [ ] Password < 6 ký tự → error
- [ ] Password không khớp → error
- [ ] "Hoàn tất" set password + setup_done = true → redirect "/"
- [ ] "Bỏ qua" → setup_done = true → redirect "/"

---

## US-1.5: Branding màn Login

### UX/UI
- App icon: hình vuông bo tròn (#3A5CCC), 72x72px, people icon trắng
- Tiêu đề: "NoPay" (dòng 1) + "FreeLunch" (dòng 2), 28px bold, căn giữa
- Phụ đề: "Nhập email để đăng nhập\nhoặc tạo tài khoản mới.", 15px gray, line-height 1.5
- Desktop: card có shadow, căn giữa cả dọc lẫn ngang

### Tiêu chí
- [ ] "NoPay\nFreeLunch" (2 dòng, 28px bold)
- [ ] Icon 72x72, bo tròn, nền #3A5CCC
- [ ] Desktop: card shadow, căn giữa
