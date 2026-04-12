# Epic 4: Theo Dõi Nợ (Debt Tracking)

---

## Function

### Logic banner nợ
- Query tất cả debts trong nhóm mà user hiện tại là debtor hoặc creditor
- Nợ ròng mỗi người: sum(nợ tôi nợ họ) - sum(nợ họ nợ tôi)
- Hiện khoản nợ ròng lớn nhất
- Chỉ hiện nợ có status = "pending"

### Tính nợ ròng
```
Với user A và user B:
  a_nợ_b = sum(debts where debtor=A, creditor=B, status=pending)
  b_nợ_a = sum(debts where debtor=B, creditor=A, status=pending)
  ròng = b_nợ_a - a_nợ_b
  Dương → họ nợ tôi | Âm → tôi nợ họ
```

### Luồng trả nợ
1. Tap "Trả nợ" trên banner nợ
2. Chuyển đến trang Transfer (/transfer/[debtId])
3. User chuyển tiền qua app ngân hàng
4. Tap "Đã chuyển tiền" → tạo payment_confirmation (pending)
5. Chủ nợ nhận thông báo Telegram
6. Chủ nợ xác nhận → debt status = "confirmed"

---

## UX/UI

### Banner nợ (trong Group Detail header)
- Vị trí: ngay dưới nav bar, trên chat feed
- Nền đỏ (#FFF3F0) nếu tôi nợ: "Bạn nợ [Tên] [Số tiền]" + nút "Trả nợ" (đỏ #FF3B30)
- Nền xanh (#F0FFF4) nếu được nợ: "[Tên] nợ bạn [Số tiền]" + nút "Nhận tiền" (xanh #34C759)
- Chiều cao: 56px, padding ngang 16px
- Ẩn hoàn toàn nếu không có nợ pending
- Chỉ hiện 1 khoản nợ lớn nhất (không hiện danh sách)

### Trạng thái
- Loading: skeleton bar 56px
- Không có nợ: banner ẩn, không chiếm không gian
- Có nhiều khoản nợ: chỉ hiện lớn nhất

---

## Tiêu chí thành công

### Function
- [ ] Nợ ròng tính đúng (sum debtor - sum creditor)
- [ ] Chỉ đếm debts status = "pending"
- [ ] Payment confirmation 2 chiều hoạt động
- [ ] Debt status chuyển "confirmed" sau khi chủ nợ xác nhận

### UX/UI
- [ ] Banner đỏ khi nợ, xanh khi được nợ
- [ ] Banner ẩn khi không có nợ
- [ ] Banner không gây layout shift khi ẩn/hiện
- [ ] Số tiền format đúng (VD: 1.200.000đ)
