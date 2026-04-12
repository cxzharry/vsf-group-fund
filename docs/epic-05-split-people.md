# Epic 5: Chọn Người & Số Tiền

## Màn hình: Full Bottom Sheet

Khi user muốn chọn người và số tiền chi tiết.

### Thành phần
- Drag handle
- Header: "Chọn người & số tiền" + "Xong" (chữ xanh, phải)
- Tabs chế độ chia (pill buttons, gap 8px):
  - "Chia đều" (active: nền #EEF2FF, chữ xanh)
  - "Chia %" (inactive: nền #F2F2F7)
  - "Tuỳ chỉnh" (inactive: nền #F2F2F7)
- Dòng tổng: "Tổng" | "500.000đ" (bold)
- Danh sách thành viên (mỗi dòng 60px):
  - Avatar tròn (36px) với chữ cái đầu
  - Tên (bold 14px) + phụ đề nếu có
  - Pill số tiền (nền xám, chữ xanh, rounded 8px)
  - Checkbox tròn (22px, xanh/xám)
- Đường kẻ phân cách
- Dòng "Còn lại chưa chia" | "0đ" (xanh lá nếu = 0)
- Nút "Xác nhận" (xanh, full width, 52px, rounded 14px)

## Logic chia

### Chia đều
- Mỗi người = floor(tổng / số người chọn)
- Phần dư phân bổ +1 VND cho N người đầu

### Chia %
- Mỗi người nhập % → tính số tiền = tổng × %
- Tổng % phải = 100%

### Tuỳ chỉnh
- Nhập thủ công số tiền mỗi người
- Tổng phải = tổng bill

## Tiêu chí thành công

- [ ] Chuyển đổi chế độ chia thay đổi UI tương ứng
- [ ] Chia đều: tự tính số tiền mỗi người
- [ ] Dòng còn lại hiện "0đ" khi chia hết
- [ ] Xác nhận chỉ khi tổng = tổng bill
- [ ] Bỏ chọn thành viên → tính lại số tiền
