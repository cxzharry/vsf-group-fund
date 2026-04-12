# Epic 7: Theo Dõi Nợ

## Hiển thị

Banner nợ ở đầu group detail.

## Logic banner nợ

- Query tất cả debts trong nhóm mà user hiện tại là debtor hoặc creditor
- Nợ ròng mỗi người: sum(nợ tôi nợ họ) - sum(nợ họ nợ tôi)
- Hiện khoản nợ ròng lớn nhất
- Đỏ (#FFF3F0) nếu tôi nợ, xanh (#F0FFF4) nếu được nợ

## Luồng trả nợ

1. Tap "Trả nợ" trên banner nợ
2. Chuyển đến trang Transfer (/transfer/[debtId])
3. Hiện mã QR + thông tin ngân hàng
4. User chuyển tiền qua app ngân hàng
5. Tap "Đã chuyển tiền" → đánh dấu payment pending
6. Chủ nợ nhận thông báo Telegram
7. Chủ nợ xác nhận → trạng thái nợ = "confirmed"

## Tính nợ ròng

```
Với user A và user B:
  a_nợ_b = sum(debts where debtor=A, creditor=B, status=pending)
  b_nợ_a = sum(debts where debtor=B, creditor=A, status=pending)
  ròng = b_nợ_a - a_nợ_b
  Dương → họ nợ tôi | Âm → tôi nợ họ
```

## Tiêu chí thành công

- [ ] Banner nợ hiện đúng số nợ ròng
- [ ] Đỏ khi nợ, xanh khi được nợ
- [ ] Ẩn banner khi không có nợ
- [ ] Xác nhận thanh toán 2 chiều (người nợ báo + chủ nợ xác nhận)
