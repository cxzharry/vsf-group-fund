# UAT — Tú (bill-skeptic-vn)

Persona: [`personas/bill-skeptic-vn.md`](../../personas/bill-skeptic-vn.md)
Target: https://nopay-freelunch.vercel.app

## Scenario T1: Verify AI parse output — "1.2tr" phải = 1.200.000đ

**Given:** Minh gõ "1tr2 ăn trưa" trong chat. AI parse ra confirm card.
**When:**
1. Tú nhận Telegram "Minh vừa tạo bill 1.200.000đ, chia 8 người"
2. Tú mở app, tap bill
3. Tú đọc số tiền + mô tả
4. Tú check low-confidence chip (⚠ Cần xem lại) nếu AI guess ambiguous

**Then:**
- Số tiền hiển thị `1.200.000đ` (KHÔNG `1.200đ` hay `12.000.000đ`)
- Nếu AI low-conf, card có chip warning orange với suggestion re-edit
- Tú có thể tap "Edit" → sửa amount inline

**Regression watch:**
- AI parse off by 10x, 100x, 1000x → Tú không flag được
- Low-confidence chip không hiện dù confidence < 0.6
- Không cho edit amount sau khi tạo

**Evidence:** screenshot bill card + AI trace log
**Pass criteria:** Amount exact match 1200000, confidence chip logic correct

---

## Scenario T2: Edit split ratio — chia không đều theo bia

**Given:** Bill 2.040.000đ lẩu + bia, 3/6 người uống bia
**When:**
1. Tú mở bill → tap `⋯` → "Edit chia"
2. Switch từ "Chia đều" → "Chia theo người"
3. Giảm phần mình 280k, đẩy 60k sang 3 người uống bia
4. Save

**Then:**
- Total vẫn 2.040.000đ (validation)
- 3 người uống bia auto-nhận notify approve thay đổi
- Bill UI update, per-person breakdown hiện rõ

**Regression watch:**
- Split UI > 10 taps để edit 1 người
- Total không khớp sau edit (bug validation)
- Approval flow skipped — Tú tự ý sửa mà 3 người kia không biết
- Audit log không ghi ai đã edit

**Evidence:** screenshot split sheet before/after, approval notifications
**Pass criteria:** Total stays same, edit approval triggered

---

## Scenario T3: Reject bill — không đồng ý phần chia

**Given:** An tạo bill 500k nhưng Tú không có mặt tối đó
**When:**
1. Tú nhận Telegram "Bạn nợ An 83.333đ"
2. Mở bill → tap `⋯` → "Reject / Tôi không tham gia"
3. Confirm dialog → submit reason "Không có mặt"

**Then:**
- Bill recompute với 5 người thay vì 6
- An nhận Telegram "Tú đã từ chối — bill recalc 100.000đ/người"
- Tú's row disappear khỏi participant list

**Regression watch:**
- Reject không có UI → persona blocked
- Bill recompute sai sau reject
- Telegram vẫn gửi "Bạn nợ" sau khi Tú reject

**Evidence:** screenshot reject flow + recomputed bill
**Pass criteria:** Participant count -1, per-person recalc, Tú removed

---

## Scenario T4: Audit 30-day history — verify tổng đã chuyển

**Given:** Tú đã dùng app 3 tháng, có ~40 transactions
**When:**
1. Vào Account → Lịch sử
2. Filter: last 30 days
3. Group by counterparty
4. Verify tổng với Excel riêng

**Then:**
- Total hiển thị accurate đến từng đồng
- Filter + group by work smoothly
- Export hoặc copy-paste data ra Excel dễ

**Regression watch:**
- Tính tổng sai (floating point rounding)
- Filter không persist sau navigate away
- Không có audit log cho bills bị edit

**Evidence:** screenshot history view + Tú's Excel calc match
**Pass criteria:** Manual calc == app calc đến đơn vị đồng

---

## Unresolved

- T2 Approval flow cho split edit chưa có trong code (audit flagged US-E3-2 edit split incomplete) → scenario có thể FAIL.
- T3 Reject/opt-out UI chưa có trong design frames → PO decide có support hay chỉ dùng edit workflow.
- T4 Export/CSV chưa có — nice-to-have, skip if missing.
