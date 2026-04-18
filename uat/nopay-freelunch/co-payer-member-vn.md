# UAT — An (co-payer-member-vn)

Persona: [`personas/co-payer-member-vn.md`](../../personas/co-payer-member-vn.md)
Target: https://nopay-freelunch.vercel.app

## Scenario A1: Quick-add bill nhỏ 180k cafe 4 người

**Given:** An sáng thứ 3, vừa order Grab cafe 4 ly cho team
**When:**
1. Mở group chat
2. Gõ "180k cafe 4 đứa"
3. AI parse → confirm card hiện số 180.000đ, 4 người
4. Tap Tạo bill

**Then:**
- Bill card hiển thị `180.000đ`, `45.000đ/người`, An là payer
- Format dấu `.` đúng: `180.000đ` không phải `180000đ`
- 3 người kia nhận Telegram "Nợ An 45.000đ"

**Regression watch:**
- AI parse "180k" thành 180 hoặc 180.000.000
- Number input thiếu dấu `.` separator
- Payer mặc định không phải An (current user)

**Evidence:** screenshot chat → AI card → bill card
**Pass criteria:** amount = 180000, per-person = 45000, flow < 15s

---

## Scenario A2: Nợ ròng 2 chiều — An nợ Minh 160k, Minh nợ An 45k

**Given:** Scenario M1 (An nợ Minh 300k từ ăn trưa) + A1 (Minh nợ An 45k cafe) đã chạy. An check debts.
**When:**
1. Vào tab "Nhóm" → group "UAT Team" → Debts
2. Toggle mode "Nợ ròng"
3. Xem dòng với Minh

**Then:**
- Hiển thị "Nợ Minh: 255.000đ" (= 300k - 45k, **không** 2 rows riêng)
- Tap → option "Trả nợ ròng 255k" với QR
- Sau khi settle, 2 bills cả 2 chiều đều đánh dấu "đã thanh toán"

**Regression watch:**
- Hiển thị 2 rows riêng biệt không net → An phải tự tính
- Simplify debts graph sai — số cuối khác 255k
- Settle 1 lần không clear cả 2 bills → An phải trả lẻ

**Evidence:** screenshot Debts view 2 mode, manual calc = 255000
**Pass criteria:** Net debt = 255000, 1-tap settle clears both bills

---

## Scenario A3: Chia bill không đều (Guest + Anonymous)

**Given:** An tạo bill 500k gồm An + Minh + 1 khách vãng lai (chưa app)
**When:**
1. Tạo bill 500k "ship KFC"
2. Mở Split sheet
3. Chọn An + Minh từ member list
4. Tap "Thêm khách" → nhập tên "Bạn Nam" → add guest
5. Save

**Then:**
- Bill chia 3 người, per-person = 166.667đ
- Guest "Bạn Nam" hiện trong bill detail nhưng không nhận Telegram (no account)
- An track guest debt manually hoặc qua Notes

**Regression watch:**
- Guest option không available (theo audit report: US-E3-2 Case C/D missing)
- Guest gây crash / gửi Telegram tới unknown chat
- Per-person calc lỗi khi có guest

**Evidence:** screenshot split sheet with guest, bill detail
**Pass criteria:** 3 participants (2 members + 1 guest), per-person = 166666-166667

---

## Scenario A4: Settle all với Minh sau event

**Given:** Sau weekend, An có 5 bills mixed với Minh (net 420k An nợ Minh)
**When:**
1. Vào Debts → tìm Minh
2. Tap "Trả tất cả" (hoặc "Nợ ròng")
3. QR 420k mở → An scan + chuyển
4. Quay lại app, tap "Đã chuyển"

**Then:**
- Telegram ping Minh "An đã chuyển 420.000đ, xác nhận?"
- Sau Minh confirm, 5 bills switch status "Đã thanh toán" cùng lúc
- Debts row với Minh → 0đ

**Regression watch:**
- Chỉ clear 1 bill thay vì 5
- QR không pre-fill 420k → An phải gõ tay
- Timeout confirmation loop

**Evidence:** screenshot before (5 bills pending) + after (all settled)
**Pass criteria:** 5 bills all marked settled, debt with Minh = 0

---

## Scenario A5: History filter theo counterparty

**Given:** An đã có 30+ transactions trong 3 tháng
**When:**
1. Vào tab "Tài khoản" → "Lịch sử"
2. Filter dropdown → chọn "Minh"
3. Date range → 3 tháng gần nhất

**Then:**
- List chỉ hiện transactions giữa An và Minh
- Tổng đã chuyển Minh + tổng Minh đã chuyển An hiện rõ
- Export CSV option (nice-to-have)

**Regression watch:**
- Filter không work — hiện all
- Totals tính sai (gộp cả group khác)

**Evidence:** screenshot filtered list
**Pass criteria:** Chỉ hiện txns với Minh, totals verify manual

---

## Unresolved

- A3 Guest+Anonymous: theo audit report là missing code → scenario sẽ FAIL cho tới khi implement. Flag skip-until-done.
- A5 Export CSV chưa có trong PRD — nice-to-have, không block ship.
