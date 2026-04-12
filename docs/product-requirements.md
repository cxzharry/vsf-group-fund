# NoPay FreeLunch - PRD Summary

**Version:** 1.1 | **Updated:** 2026-04-12  
**URL:** https://nopay-freelunch.vercel.app  
**PRD:** https://nopay-freelunch.vercel.app/prd

---

## Product Vision

App chia bill cho nhóm bạn bè tại Việt Nam. Tạo bill nhanh qua chat, theo dõi nợ, chuyển tiền qua QR.

---

## Navigation

- **2 tabs only:** "Nhóm" + "Tài khoản"
- Bills, debts, transfers truy cập từ **trong group detail**

---

## Epics

| # | Epic | File | Mô tả |
|---|------|------|--------|
| 1 | Đăng nhập | [epic-01-auth.md](epic-01-auth.md) | OTP + password login, branding |
| 2 | Nhóm | [epic-02-groups.md](epic-02-groups.md) | Tạo/tham gia nhóm, group detail chat, cài đặt |
| 3 | Giao dịch | [epic-03-transactions.md](epic-03-transactions.md) | Tạo bill, chia tiền, bill mở, chuyển tiền |
| 4 | Theo dõi nợ | [epic-04-debt-tracking.md](epic-04-debt-tracking.md) | Banner nợ, nợ ròng, xác nhận thanh toán |
| 5 | Tài khoản | [epic-05-account.md](epic-05-account.md) | Hồ sơ, ngân hàng, Telegram, đăng xuất |

Mỗi epic chia rõ **Function** (logic nghiệp vụ) và **UX/UI** (giao diện, spacing, màu sắc).

---

## Logic Chia Bill

### Chia đều
```
Mỗi người = floor(tổng / số người)
Phần dư → +1 VND cho N người đầu
Nợ: mỗi participant (trừ người trả) nợ người trả
```

### Tuỳ chỉnh
```
Nhập thủ công mỗi người, tổng PHẢI = tổng bill
```

### Bill mở
```
Check-in → đóng bill → mỗi người = floor(tổng / số check-in)
```

### Nợ ròng
```
ròng = sum(họ nợ tôi) - sum(tôi nợ họ)
Dương = họ nợ tôi | Âm = tôi nợ họ
```

---

## Design Tokens

| Token | Giá trị |
|-------|---------|
| Primary Blue | #3A5CCC |
| Success Green | #34C759 |
| Error Red | #FF3B30 |
| Warning Orange | #FF9500 |
| Text Primary | #1C1C1E |
| Text Secondary | #8E8E93 |
| Text Tertiary | #AEAEB2 |
| Border | #E5E5EA |
| Background | #F2F2F7 |
| Card Background | #FFFFFF |
| Font | Inter |
| Corner Radius (card) | 14px |
| Corner Radius (sheet) | 20px |
| Corner Radius (avatar) | 50% |
| Tab bar height | 56px + safe-area |

---

## Thông Báo Telegram

| Sự kiện | Người nhận | Tin nhắn |
|---------|------------|----------|
| Tạo bill | Người nợ | "Bạn nợ [Người trả] [Số tiền]" |
| Báo đã chuyển | Chủ nợ | "[Người nợ] báo đã chuyển [Số tiền]" |
| Xác nhận | Người nợ | "[Chủ nợ] đã xác nhận nhận [Số tiền]" |
| Bill mở | Nhóm | "[Người tạo] tạo bill mở: [Tiêu đề]" |
| Check-in | Người trả | "[Thành viên] đã check-in" |
| Đóng bill | Người nợ | "Bill đã đóng. Mỗi người: [Số tiền]" |
