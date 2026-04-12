# Epic 1: Đăng Nhập (Auth)

## Màn hình

Full-page, căn giữa dọc trên mobile.

## Thành phần UI

- App icon: hình vuông bo tròn xanh (#3A5CCC) với people icon, 72x72px
- Tiêu đề: "NoPay" (dòng 1) + "FreeLunch" (dòng 2), 28px bold, căn giữa
- Phụ đề: "Nhập email để đăng nhập" (dòng 1) + "hoặc tạo tài khoản mới." (dòng 2), 15px gray
- Ô nhập email
- Nút "Gửi mã OTP" (primary blue, full width)
- Đường kẻ phân cách: "hoặc"
- Nút "Nhập mật khẩu" (secondary gray, full width)

## Luồng OTP

1. User nhập email → tap "Gửi mã OTP"
2. Supabase gửi **mã 6 số** về email (KHÔNG phải magic link)
3. Hiện form nhập 6 số OTP
4. Verify thành công → redirect về "/"

## Luồng Password

1. Tap "Nhập mật khẩu" → hiện form email + password
2. Login thành công → redirect về "/"

## Tiêu chí thành công

- [ ] OTP gửi **mã số**, không gửi link
- [ ] Login thành công redirect về "/"
- [ ] Branding đúng: "NoPay\nFreeLunch" (2 dòng)
- [ ] Subtitle đúng: "Nhập email để đăng nhập\nhoặc tạo tài khoản mới."
- [ ] Icon 72x72, bo tròn, nền #3A5CCC
