# Epic 4 — Theo Dõi Nợ (Debt Tracking)

> **Epic ID:** E4 · **Priority:** P0 · **Persona:** [Minh — group-organizer-vn](group-organizer-vn.md), [Linh — group-member-vn](group-member-vn.md)
> **Brief:** Banner nợ trong Group Detail, tính nợ ròng, xác nhận thanh toán 2 chiều qua Telegram, rút gọn nợ (netting).

---

## US-E4-1 — Hiện banner nợ trong Group Detail

**As a** [Minh — group-organizer-vn](group-organizer-vn.md) **or** [Linh — group-member-vn](group-member-vn.md), **I want to** see a debt banner with my net debt/credit at the top of Group Detail, **so that** I can immediately see who owes whom and tap through to settle.

- **Priority:** P0 · **Effort:** S

### Rules / Function
- Query debts trong nhóm: user là debtor hoặc creditor
- Tính nợ ròng mỗi người: sum(nợ họ nợ tôi) - sum(nợ tôi nợ họ)
- Hiện khoản nợ ròng lớn nhất
- Chỉ đếm debts status = "pending"

### Edge cases
- Không có nợ → banner ẩn hoàn toàn
- Nhiều khoản nợ → chỉ hiện lớn nhất
- Nợ ròng = 0 (2 chiều triệt tiêu) → banner ẩn
- Debt vừa confirmed → banner cập nhật real-time

### Acceptance Criteria
- [ ] AC-E4-1.1: Nợ ròng tính đúng
- [ ] AC-E4-1.2: Chỉ đếm pending
- [ ] AC-E4-1.3: Banner hiện trạng thái nợ (người nợ vs người cho vay)
- [ ] AC-E4-1.4: Ẩn khi không có nợ

---

## US-E4-2 — Tính nợ ròng

**As a** [Minh — group-organizer-vn](group-organizer-vn.md) **or** [Linh — group-member-vn](group-member-vn.md), **I want to** have an accurate pairwise net debt calculation across all pending debts in a group, **so that** the system correctly netts mutual obligations (2-way debt cancellation).

- **Priority:** P0 · **Effort:** M

### Rules / Function
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

### Acceptance Criteria
- [ ] AC-E4-2.1: Net debt tính đúng 2 chiều
- [ ] AC-E4-2.2: Chỉ count pending debts
- [ ] AC-E4-2.3: Tổng nợ trên Home khớp với detail

---

## US-E4-3 — Xác nhận thanh toán 2 chiều

**As a** [Minh — group-organizer-vn](group-organizer-vn.md) **or** [Linh — group-member-vn](group-member-vn.md), **I want to** confirm payment via 2-way flow (debtor initiates → creditor approves via Telegram), **so that** both parties acknowledge the settlement and the debt status updates to confirmed.

- **Priority:** P0 · **Effort:** M

### Rules / Function
1. Người nợ tap "Đã chuyển tiền" → payment_confirmation (pending)
2. Notify chủ nợ qua Telegram
3. Chủ nợ xác nhận → debt status = "confirmed"
4. Notify người nợ: "Đã xác nhận"

### Edge cases
- Chủ nợ chưa link Telegram → không gửi notification (silent)
- Người nợ bấm nhiều lần → chỉ tạo 1 confirmation
- Chủ nợ từ chối → chưa implement (future)

### Acceptance Criteria
- [ ] AC-E4-3.1: Payment confirmation tạo đúng
- [ ] AC-E4-3.2: Debt chuyển "confirmed" sau xác nhận
- [ ] AC-E4-3.3: Telegram notification gửi 2 chiều
- [ ] AC-E4-3.4: Banner cập nhật sau confirm

---

## US-E4-4 — Rút gọn nợ (Simplify Debts)

**As a** [Minh — group-organizer-vn](group-organizer-vn.md), **I want to** toggle between detailed debt list and a simplified (netting-applied) debt view on the /debts page, **so that** I can optimize multi-person trips with fewer payment settlements using multi-hop debt reduction.

- **Priority:** P0 · **Effort:** L

### Rules / Function
Trên trang `/debts`, user có thể chuyển giữa 2 view:
- **Chi tiết**: hiện từng debt row gốc (mặc định)
- **Nợ ròng**: áp thuật toán netting, gộp nhiều debt thành 1 payment, giảm số lần chuyển tiền

Hai thuật toán (cả 2 đều đã implement):

**1. Pairwise netting (v1)** — `simplifyDebts()`
- Với mỗi cặp 2 người (A, B): tính `net = sum(A→B) - sum(B→A)`
- Drop nếu net = 0, else tạo 1 debt duy nhất theo hướng net
- Giữ `underlying_ids` (traceability: xem bill nào được gộp)
- Không eliminate multi-hop (A→B→C vẫn cần 2 payments)

**2. Graph-based multi-hop (v2)** — `simplifyDebtsGraph()`
- Tính net balance per person qua TẤT CẢ debts
- Greedy match: creditor lớn nhất với debtor lớn nhất, settle min, repeat
- Guaranteed ≤ N-1 payments cho N người
- Classic case: A→B 50, B→C 50, C→A 50 → [] (fully settled)
- Multi-hop: A→B 100, B→C 100 → [A→C 100] (1 payment thay 2)
- Mất traceability per pair

### Edge cases
- Không có debt → hiện empty state
- Tất cả đã confirmed → không hiện ở simplified view
- Mode switch khi đang xử lý → cancel pending UI action
- Pairwise vs Graph kết quả khác nhau → v1 giữ per-pair history, v2 optimize tối đa

### Algorithm reference
```
src/lib/simplify-debts.ts
  ├─ simplifyDebts(debts)       — pairwise netting v1
  └─ simplifyDebtsGraph(debts)  — greedy balance settlement v2

src/lib/__tests__/simplify-debts.test.ts  — 12 unit tests (6 pairwise + 6 graph)
```

Key test cases:
- Empty → []
- A owes B 100, B owes A 30 → [A→B 70] (pairwise)
- A→B 50, B→C 50, C→A 50 → [] (graph, fully settled)
- A→B 100, B→C 100 → [A→C 100] (graph, multi-hop)

### Acceptance Criteria
- [ ] AC-E4-4.1: Toggle "Chi tiết" / "Nợ ròng" hoạt động
- [ ] AC-E4-4.2: Mode "Nợ ròng" gộp debts bằng `simplifyDebts()` hoặc `simplifyDebtsGraph()`
- [ ] AC-E4-4.3: Simplified debt row hiện số lượng debts được gộp
- [ ] AC-E4-4.4: Empty state hiện khi danh sách nợ ròng rỗng
- [ ] AC-E4-4.5: Batch settle tạo payment_confirmations cho tất cả underlying debts
- [ ] AC-E4-4.6: Unit tests 12/12 PASS

---

## AC Coverage Summary
- **Total ACs:** 13 (functional only, design specs removed)
- **Breakdown:** US-E4-1 (4 ACs), US-E4-2 (3 ACs), US-E4-3 (4 ACs), US-E4-4 (6 ACs)
