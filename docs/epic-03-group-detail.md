# Epic 3: Group Detail (Chat View)

## Màn hình

Màn hình tương tác chính, dạng chat.

### Thanh nav
- Nút back "<" (xanh)
- Giữa: tên nhóm (bold) + "X thành viên" (gray, nhỏ hơn)
- Phải: icon cài đặt hình bánh răng (vòng tròn xám)

### Banner nợ (có điều kiện)
- Nền đỏ (#FFF3F0) nếu user nợ: "Bạn nợ [Tên] [Số tiền]" + nút "Trả nợ"
- Nền xanh (#F0FFF4) nếu user được nợ: "[Tên] nợ bạn [Số tiền]" + nút "Nhận tiền"
- Ẩn nếu không có nợ

### Feed chat
- Dải phân cách ngày: "28 tháng 1, 2026" (gray, căn giữa)
- Card bill (bubble trắng, rounded 14px):
  - Avatar người gửi (trái, 34px)
  - Tên + giờ, tiêu đề bill, ngày, tổng tiền
  - Số tiền ròng cho user hiện tại (đỏ/xanh)
- Sự kiện chuyển tiền: pill căn giữa nền #E8EDFF
- Tin nhắn văn bản: bubble chat tiêu chuẩn

### FAB (Nút hành động nổi)
- Dưới phải, xanh (#3A5CCC), bo tròn, shadow
- "+ Thêm hoá đơn" với icon receipt
- Tap → kích hoạt luồng tạo bill

## Tiêu chí thành công

- [ ] Feed chat hiện bill cards, transfers, tin nhắn
- [ ] Banner nợ hiện đúng số nợ ròng
- [ ] FAB luôn hiện ở dưới phải
- [ ] Real-time: bill mới từ người khác hiện ngay
- [ ] Tap cài đặt → chuyển đến settings
- [ ] Tap back → về Home
