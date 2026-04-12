# Epic 1: Đăng Nhập (Auth)

---

## Function

### Luồng OTP
1. User nhập email → tap "Gửi mã OTP"
2. Supabase gửi **mã 6 số** về email (KHÔNG phải magic link)
3. User nhập 6 số → verify
4. Thành công → tự tạo member nếu chưa có → redirect về "/"

### Luồng Password
1. Tap "Nhập mật khẩu" → hiện form email + password
2. Login thành công → redirect về "/"

### Auto-create member
- Trigger SQL `handle_new_user()` tạo member từ auth.users
- Fallback: AuthProvider client-side tạo nếu trigger fail

---

## UX/UI

### Layout
- Full-page, căn giữa dọc trên mobile
- Desktop: căn giữa cả dọc lẫn ngang, card có shadow

### Thành phần (từ trên xuống)
- App icon: hình vuông bo tròn (#3A5CCC), 72x72px, people icon trắng
- Khoảng cách icon → title: 8px
- Tiêu đề: "NoPay" (dòng 1) + "FreeLunch" (dòng 2), 28px bold, căn giữa
- Khoảng cách title → subtitle: 24px (gap trong flex container)
- Phụ đề: "Nhập email để đăng nhập" + "hoặc tạo tài khoản mới.", 15px gray #8E8E93, line-height 1.5
- Khoảng cách subtitle → form: 40px (padding bottom của top section)

### Form OTP (mặc định)
- Ô email: border-bottom #E5E5EA, không có border khác, font 15px
- Nút "Gửi mã OTP": nền #3A5CCC, chữ trắng, rounded 14px, cao 54px, full width
- Đường kẻ "hoặc": text gray #8E8E93 giữa 2 đường kẻ
- Nút "Nhập mật khẩu": nền #F2F2F7, chữ #1C1C1E, rounded 14px, cao 54px

### Form Password (khi tap "Nhập mật khẩu")
- 2 ô: email + password, border-bottom, cùng card
- Nút "Đăng nhập": nền #3A5CCC, rounded 14px, cao 54px
- Link "Dùng OTP thay thế" bên dưới

### Error state
- Chữ đỏ #FF3B30 dưới form, 13px

---

## Tiêu chí thành công

### Function
- [ ] OTP gửi **mã số**, không gửi link
- [ ] Login OTP thành công redirect về "/"
- [ ] Login password thành công redirect về "/"
- [ ] Member tự tạo cho user mới

### UX/UI
- [ ] Branding: "NoPay\nFreeLunch" (2 dòng, 28px bold)
- [ ] Icon 72x72, bo tròn, nền #3A5CCC
- [ ] Subtitle 2 dòng, gray, line-height 1.5
- [ ] Nút OTP cao 54px, rounded 14px
- [ ] Error message hiện rõ ràng màu đỏ
- [ ] Desktop: card có shadow, căn giữa
