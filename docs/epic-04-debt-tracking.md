# Epic 4: Theo Dõi Nợ (Debt Tracking)

---

## US-4.1: Hiện banner nợ trong Group Detail

### Function
- Query debts trong nhóm: user là debtor hoặc creditor
- Tính nợ ròng mỗi người: sum(nợ họ nợ tôi) - sum(nợ tôi nợ họ)
- Hiện khoản nợ ròng lớn nhất
- Chỉ đếm debts status = "pending"

### Edge cases
- Không có nợ → banner ẩn hoàn toàn
- Nhiều khoản nợ → chỉ hiện lớn nhất
- Nợ ròng = 0 (2 chiều triệt tiêu) → banner ẩn
- Debt vừa confirmed → banner cập nhật real-time

### UX/UI
- Vị trí: ngay dưới nav bar, trên chat feed
- Đỏ #FFF3F0 nếu nợ: "Bạn nợ [Tên] [Số tiền]" + nút "Trả nợ" #FF3B30
- Xanh #F0FFF4 nếu được nợ: "[Tên] nợ bạn [Số tiền]" + nút "Nhắc nợ" #34C759
- Cao 56px, padding ngang 16px
- Ẩn không chiếm space

### Tiêu chí
- [ ] Nợ ròng tính đúng
- [ ] Chỉ đếm pending
- [ ] Đỏ khi nợ, xanh khi được nợ
- [ ] Ẩn khi không có nợ
- [ ] Số tiền format "1.200.000đ"

---

## US-4.2: Tính nợ ròng

### Function
```
Với user A và user B:
  a_nợ_b = sum(debts where debtor=A, creditor=B, status=pending)
  b_nợ_a = sum(debts where debtor=B, creditor=A, status=pending)
  ròng = b_nợ_a - a_nợ_b
  Dương → họ nợ tôi | Âm → tôi nợ họ
```

### Edge cases
- User có nợ cả 2 chiều với cùng 1 người → net correctly
- Debts từ nhiều bills → sum tất cả
- Debt status = "confirmed" → không tính

### Tiêu chí
- [ ] Net debt tính đúng 2 chiều
- [ ] Chỉ count pending debts
- [ ] Tổng nợ trên Home khớp với detail

---

## US-4.3: Xác nhận thanh toán 2 chiều

### Function
1. Người nợ tap "Đã chuyển tiền" → payment_confirmation (pending)
2. Notify chủ nợ qua Telegram
3. Chủ nợ xác nhận → debt status = "confirmed"
4. Notify người nợ: "Đã xác nhận"

### Edge cases
- Chủ nợ chưa link Telegram → không gửi notification (silent)
- Người nợ bấm nhiều lần → chỉ tạo 1 confirmation
- Chủ nợ từ chối → chưa implement (future)

### Tiêu chí
- [ ] Payment confirmation tạo đúng
- [ ] Debt chuyển "confirmed" sau xác nhận
- [ ] Telegram notification gửi 2 chiều
- [ ] Banner cập nhật sau confirm
