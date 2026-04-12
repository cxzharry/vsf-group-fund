# Epic 8: Chuyển Tiền / Thanh Toán

## Màn hình

Full page, truy cập từ nút "Trả nợ" trong banner nợ.

## Thành phần UI

- Header: "Chuyển tiền" + nút back
- Thông tin bill: tiêu đề + ngày
- Số tiền: lớn bold + "cho" + tên/avatar chủ nợ
- Card QR (nếu chủ nợ có thông tin ngân hàng):
  - Hình ảnh mã QR (chuẩn VietQR)
  - Tên ngân hàng
  - Số tài khoản (có nút sao chép)
  - Tên chủ tài khoản
  - Nút: "Lưu QR" | "Chia sẻ" | Deep link app ngân hàng
- CTA: Nút "Đã chuyển tiền" (xanh, full width)

## Trạng thái không có ngân hàng

- Thông báo: "Người nhận chưa liên kết ngân hàng"
- Hướng dẫn chuyển tiền thủ công

## Luồng xác nhận

1. Người nợ tap "Đã chuyển tiền" → tạo payment_confirmation (status: pending)
2. Thông báo chủ nợ qua Telegram
3. Chủ nợ mở app → thấy nút "Xác nhận đã nhận"
4. Chủ nợ xác nhận → debt status = "confirmed"
5. Thông báo người nợ: "Đã xác nhận"

## Tiêu chí thành công

- [ ] QR tạo đúng với thông tin ngân hàng của chủ nợ
- [ ] Sao chép số tài khoản hoạt động
- [ ] "Đã chuyển tiền" tạo bản ghi payment_confirmation
- [ ] Thông báo chủ nợ qua Telegram
- [ ] Hiện thông báo khi chủ nợ chưa liên kết ngân hàng
