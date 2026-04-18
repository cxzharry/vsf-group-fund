# UAT — Minh (group-organizer-vn)

Persona: [`personas/group-organizer-vn.md`](../../personas/group-organizer-vn.md)
Target: https://nopay-freelunch.vercel.app

## Scenario M1: Tạo bill ăn trưa 2.400.000đ qua AI Quick Parse

**Given:** Minh đã login, trong group "UAT Team" (8 members), vừa quẹt thẻ nhà hàng
**When:**
1. Mở group chat
2. Gõ "2tr4 ăn trưa" vào chat input
3. Tap Send
4. AI response card hiện ra với prefilled bill (2.400.000đ, mô tả "ăn trưa")
5. Tap "Chia đều 8 người" preset
6. Tap "Tạo bill"

**Then:**
- Bill card xuất hiện trong feed trong < 3s, hiển thị `2.400.000đ`, `8 người`, `300.000đ/người`
- Mỗi thành viên khác nhận Telegram ping "Bạn nợ Minh 300.000đ"
- Minh thấy status "Đang chờ 7 thanh toán"

**Regression watch:**
- AI parse "2tr4" thành 24.000 hoặc 2.400 (sai số 0)
- Bill card không update payer = Minh
- Telegram không gửi (silent fail)

**Evidence:** screenshot (AI card + bill card), network HAR (POST /api/bills), Telegram log
**Pass criteria:** Bill created < 20s end-to-end, amount = 2400000, participants = 8, per-person = 300000

---

## Scenario M2: Tạo bill mở "Ai có ăn thì check-in"

**Given:** Minh book bàn 8 người nhưng chưa chắc ai đến
**When:**
1. Mở chat, tạo bill mới "1tr2 lẩu tối"
2. Toggle "Bill mở" ON, số người = 8
3. Tap Tạo
4. Bill card render với State A (0/8 check-in)

**Then:**
- Bill card giống design US-E3-5 State A (accent orange, progress bar 0%, "Tôi có ăn" primary blue button)
- Không có button "Đóng bill" (theo decision 2026-04-18)
- `⋯` menu hiện ở header (edit/delete entry)
- `~150.000đ/người` hiện đúng

**Regression watch:**
- Per-person = 400k hoặc tính theo check-in count (phải cố định 150k)
- "Đóng bill" button xuất hiện
- Missing ⋯ menu

**Evidence:** screenshot Bill mở card ở 3 states (0/8, 3/8, 8/8)
**Pass criteria:** Visual match với `GroupFund.pen` frame `i0Jex/TRcvd/nmK7P`

---

## Scenario M3: Nhắc nợ qua Telegram cho 2 người chưa trả

**Given:** Bill M1 tạo 3 ngày, 5/7 đã trả, 2 người (Linh + Duy) chưa
**When:**
1. Mở bill detail
2. Thấy list: 5 ✓ trả, 2 ⏳ pending
3. Tap "Nhắc nợ" cho 2 người pending

**Then:**
- 2 người nhận Telegram "Reminder: Nợ Minh 300.000đ · Ăn trưa 15/4"
- Minh thấy UI feedback "Đã nhắc Linh + Duy" toast
- Cooldown 24h — tap lại trong 24h disabled

**Regression watch:**
- Nhắc nợ spam (no cooldown)
- Nhắc cả 5 người đã trả → noise
- Telegram API 429 không graceful degrade

**Evidence:** screenshot before/after, Telegram log
**Pass criteria:** Đúng 2 Telegram messages gửi, cooldown active, toast hiện

---

## Scenario M4: Xem tổng nợ ròng trong group

**Given:** Minh đã tạo 12 bills trong 30 ngày, có 2 chiều (An cũng ứng cho Minh vài bill)
**When:**
1. Vào tab "Nhóm" → tap group "UAT Team"
2. Tap "Debts" (hoặc thấy banner nợ ròng)
3. Toggle "Chi tiết" vs "Nợ ròng"

**Then:**
- Mode "Nợ ròng" hiển thị 1 số cuối cùng per counterparty (vd "An nợ bạn 115.000đ")
- Mode "Chi tiết" liệt kê từng bill contribute
- Total owed TO Minh + total Minh owes rõ ràng

**Regression watch:**
- Tính sai dấu (Minh nợ hiển thị Minh được nợ)
- Simplify debts graph sai → số cuối sai
- Toggle mode không persist giữa sessions

**Evidence:** screenshot 2 modes, manual calc verify
**Pass criteria:** Số khớp manual Excel calc

---

## Scenario M5: Edit bill — đổi người trả sau khi tạo

**Given:** Bill M1 vừa tạo xong, nhưng thực tế An trả (không phải Minh)
**When:**
1. Mở bill detail
2. Tap `⋯` → "Edit bill"
3. Tap row "Người trả" → picker sheet mở
4. Chọn An → save

**Then:**
- Bill chủ thành An, Telegram re-notify (Minh bị xóa khỏi creditor list, An thêm)
- Debts recompute (Minh nợ An thay vì ngược lại)

**Regression watch:**
- Payer row không clickable (bug đã fix ngày 2026-04-18 — regression check)
- Picker sheet không open
- Không recompute debts sau edit

**Evidence:** screenshot sheet open + save confirmation
**Pass criteria:** Payer = An trong DB, debts table recompute

---

## Unresolved

- M3 cooldown hiện có code nhưng chưa có UI hiển thị remaining time → design follow-up
- M4 toggle persist chưa test cross-device
