# Epic 2: Nhóm (Groups)

## Màn hình: Home / Nhóm (Tab 1)

Màn hình mặc định sau login.

### Header
- Tiêu đề: "Nhóm" (28-30px bold, căn trái)
- Phải: nút "+" xanh (tạo nhóm) + chữ "Tham gia"

### Nội dung
- Chip tổng nợ: "Tổng: Bạn đang nợ X · Bạn được nợ Y"
- Card nhóm (rounded 14px, white bg):
  - Trái: avatar tròn màu với chữ cái đầu nhóm
  - Giữa: tên nhóm (bold) + "X thành viên" (gray)
  - Phải: số nợ ròng (đỏ nếu nợ, xanh nếu được nợ) + "Trả nợ"

### Bottom tab bar
- 2 tabs: Nhóm (active blue) + Tài khoản (gray)

### Trạng thái trống
- Icon người lớn (gray)
- "Chưa có nhóm nào" (20px bold)
- "Tạo nhóm để bắt đầu chia bill với bạn bè." (15px gray)
- Nút "Tạo nhóm mới" (outline, blue border)

## Luồng tạo nhóm

1. Tap "+" → dialog nhập tên nhóm
2. Tạo group + tự thêm creator là admin
3. Chuyển đến group detail

## Luồng tham gia nhóm

1. Tap "Tham gia" → dialog nhập invite code (8 ký tự)
2. Tìm group theo code → thêm user là member
3. Toast thành công + reload danh sách

## Màn hình: Cài Đặt Nhóm

- Nav: nút back + "Cài đặt nhóm"
- Đổi tên nhóm (chỉ admin)
- Mã mời: hiện + nút sao chép
- Danh sách thành viên với role (Admin/Member)
- Nút "Rời nhóm" (có xác nhận)

## Tiêu chí thành công

- [ ] Chỉ hiện 2 tabs
- [ ] Card nhóm hiện đúng số nợ
- [ ] Trạng thái trống khi chưa có group
- [ ] Tạo nhóm thành công + chuyển đến detail
- [ ] Tham gia nhóm bằng invite code
- [ ] Sao chép mã mời hoạt động
- [ ] Rời nhóm có dialog xác nhận
