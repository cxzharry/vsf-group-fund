# UAT — Duy (casual-guest-vn)

Persona: [`personas/casual-guest-vn.md`](../../personas/casual-guest-vn.md)
Target: https://nopay-freelunch.vercel.app

## Scenario D1: Nhận invite link qua Zalo → join group lần đầu

**Given:** Duy chưa có NoPay account, Minh gửi invite link qua Zalo
**When:**
1. Duy tap link trong Zalo → mở Safari/Chrome
2. Landing page "Bạn được Minh mời vào nhóm 'UAT Team'"
3. Tap "Vào nhóm"
4. Auth screen → nhập email + OTP (hoặc password nếu đã có account)
5. Onboarding completes → land ở group chat

**Then:**
- Landing page minimal, không force download native app
- Auth: email input + "Gửi mã OTP" button → nhập OTP 6 số → vào app (≤ 2 steps)
- Duy nhìn thấy group chat trong < 90s từ tap link
- Telegram connect được defer (không force upfront)

**Regression watch:**
- Invite link expired → error 404/500
- Auth flow > 3 steps (email → OTP là max acceptable)
- Landing page load > 3s → Duy bỏ
- Auth redirect loop
- OTP email delay > 30s → Duy bỏ

**Evidence:** screenshot mỗi step, network HAR (tổng load time)
**Pass criteria:** Tap link → group chat < 90s với OTP flow

---

## Scenario D2: Check-in Bill mở — hiểu UI lần đầu

**Given:** Vừa join group, thấy Bill mở card "Lẩu tối nay · 1.2M · 8 người"
**When:**
1. Duy xem card
2. Đọc label "Tôi có ăn" button

**Then:**
- Hiểu "Tôi có ăn" = confirm mình tham gia chia bill (không cần explain thêm)
- Status line "150.000đ/người" hiện rõ — Duy biết sẽ nợ bao nhiêu
- Tap → check-in, avatar hiện trong stack

**Regression watch:**
- Label ambiguous ("Có ăn" vs "Đã ăn" vs "Check-in") → Duy confuse
- Per-person amount không hiện → Duy không biết cam kết gì
- Check-in không có undo option

**Evidence:** screenshot UI trước khi tap + sau khi tap + Duy verbal feedback
**Pass criteria:** Duy hiểu button trong < 10s không cần hỏi Minh

---

## Scenario D3: Thanh toán bill 150k qua QR — first-time payment

**Given:** Bill mở đóng với Duy check-in, Duy nhận Telegram "Nợ Minh 150k"
**When:**
1. Duy tap notify → mở NoPay
2. Tap "Trả nợ" → QR
3. Mở app ngân hàng riêng → scan

**Then:**
- QR có logo bank + tên Minh → Duy tin đây là QR thật, không phải scam
- Amount 150.000đ pre-fill đầy đủ
- Sau khi chuyển, tap "Đã chuyển tiền"

**Regression watch:**
- QR không có tên người nhận rõ → Duy sợ lừa đảo
- Bank sai (Duy thấy Momo nhưng QR là VietQR interbank)
- "Đã chuyển" không có button → Duy không biết next step

**Evidence:** screenshot QR, log payment flow
**Pass criteria:** Duy thanh toán không cần gọi Minh verify

---

## Scenario D4: Không spam sau event — 2 tuần silent

**Given:** Event xong, Duy trả nợ xong, không dùng app nữa
**When:**
1. 14 ngày không mở app
2. Quan sát notifications

**Then:**
- Không có weekly digest Telegram
- Không có push notify "Bạn có bill mới" trừ khi thực sự có
- App không yêu cầu login lại unnecessarily

**Regression watch:**
- Spam weekly summary dù Duy ko subscribe
- Push notify cho event Duy không liên quan
- Forced re-auth mỗi 3 ngày

**Evidence:** Telegram log 14 ngày, notification log
**Pass criteria:** 0 unsolicited notifications trong 14 ngày

---

## Unresolved

- D1 Google sign-in flow chưa rõ có magic link fallback không → test cả 2 paths.
- D4 Notification frequency policy chưa có trong PRD — cần PO define default "silent after 7 days idle".
