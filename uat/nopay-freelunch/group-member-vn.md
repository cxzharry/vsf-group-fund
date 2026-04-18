# UAT — Linh (group-member-vn)

Persona: [`personas/group-member-vn.md`](../../personas/group-member-vn.md)
Target: https://nopay-freelunch.vercel.app

## Scenario L1: Nhận Telegram notify → thanh toán qua QR < 60s

**Given:** Minh vừa tạo bill M1 (300k Linh nợ). Linh đang mở Telegram.
**When:**
1. Nhận notify "Bạn nợ Minh 300.000đ — Ăn trưa team 15/4"
2. Tap link → mở NoPay in-app
3. Tap bill → xem breakdown
4. Tap "Trả nợ" → QR mở

**Then:**
- QR hiện bank + số TK + tên Minh + amount `300.000đ` pre-filled
- Linh scan QR với MB Bank app → auto-fill xong
- Back to NoPay → tap "Đã chuyển tiền"
- Sau Minh confirm, Linh nhận Telegram "Minh đã xác nhận"

**Regression watch:**
- QR amount không pre-fill → Linh gõ lại, dễ sai
- QR sai bank (vd VCB thay vì Minh's TCB)
- "Đã chuyển" không update Minh's side → Minh nhắc lại

**Evidence:** screenshot Telegram notify → QR → confirm
**Pass criteria:** E2E < 60s, QR amount correct, status syncs

---

## Scenario L2: Check-in Bill mở "Tôi có ăn"

**Given:** Bill M2 (Bill mở 1.2M, 0/8 check-in) đã tạo
**When:**
1. Linh mở group chat
2. Thấy Bill mở card (State A)
3. Tap "Tôi có ăn" button

**Then:**
- Card transitions sang State B (1/8 check-in, Linh's avatar appears trong stack)
- Progress bar update ~12% fill
- "Tôi có ăn" button persist hoặc chuyển "Đã check-in ✓" cho Linh

**Regression watch:**
- Double-tap check-in → tính 2 lần
- Check-in UI không update realtime (Linh phải refresh)
- "Đóng bill" button xuất hiện (bug — decision 2026-04-18 bỏ)

**Evidence:** screenshot before/after tap
**Pass criteria:** Check-in count +1, avatar in stack, no double-count

---

## Scenario L3: Verify bill breakdown trước khi trả

**Given:** Linh nhận "Nợ Minh 300k" nhưng không nhớ ăn gì
**When:**
1. Tap bill → bill detail mở
2. Scroll xem breakdown

**Then:**
- Hiển thị: tổng 2.400.000đ, 8 people, split type "chia đều", ngày tạo, payer
- List tất cả participants (Minh, Linh, An, Tú, ...) rõ ràng
- Mô tả bill hiển thị ("Ăn trưa team 15/4")

**Regression watch:**
- Breakdown ẩn sau 3 layers menu
- Participant list incomplete
- Detail page là standalone thay vì half-sheet (audit flagged)

**Evidence:** screenshot bill detail
**Pass criteria:** Breakdown visible 1 screen, list 8 participants

---

## Scenario L4: Leave group sau khi settle all nợ

**Given:** Linh đã thanh toán hết nợ với cả nhóm, muốn rời group
**When:**
1. Vào tab Nhóm → group "UAT Team"
2. Tap `⋯` header → "Rời group"
3. Confirm dialog

**Then:**
- Rời group thành công
- Debts history với nhóm này preserved trong Account > Lịch sử
- Không nhận Telegram từ group này nữa

**Regression watch:**
- Rời group khi còn nợ → app phải block hoặc warn
- Sau rời, history bị xóa → mất data audit
- Telegram vẫn ping sau khi rời

**Evidence:** screenshot before/after + history persistence check
**Pass criteria:** Group ko hiện trong list, history preserved

---

## Unresolved

- L3 Bill detail half-sheet vs standalone: audit flagged as mismatch — sẽ ảnh hưởng visual assertions.
- L4 Rời group logic chưa rõ trong PRD — cần confirm warning UX với nợ chưa settled.
