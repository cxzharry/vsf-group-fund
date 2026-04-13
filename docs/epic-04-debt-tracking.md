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

---

## US-4.4: Rút gọn nợ (Simplify Debts)

### Function
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

### UI — Trang /debts

**Segmented toggle** ở header:
- `[Chi tiết] [Nợ ròng]` — pill tabs
- Active: bg #3A5CCC text white
- Inactive: bg #F2F2F7 text #8E8E93
- Default: "Chi tiết"

**Khi mode = "Nợ ròng"**:
- Call `simplifyDebts(allDebts)` (v1) hoặc `simplifyDebtsGraph()` (v2)
- Render simplified list thay vì debts gốc
- Mỗi row thêm chip "Nợ ròng · gộp {n}" (n = underlying_ids.length)
- Chip style: `bg-[#F2F2F7] text-[#8E8E93] rounded-full px-2 py-0.5 text-[11px]`

**Empty state khi nợ ròng rỗng**:
- "🎉 Tất cả đã cân bằng!" (center, 17px bold)
- Subtitle "Không còn khoản nợ nào cần thanh toán"

**Batch settle**:
- Khi user tap "Đã chuyển tiền" ở simplified row → atomic update qua `.in('id', [underlying_ids])`
- Tạo multiple payment_confirmations (1 per underlying debt) với cùng amount split

### Edge cases
- Không có debt → hiện empty state
- Tất cả đã confirmed → không hiện ở simplified view
- Mode switch khi đang xử lý → cancel pending UI action
- Pairwise vs Graph kết quả khác nhau → v1 giữ per-pair history, v2 optimize tối đa

### Thuật toán — tham khảo code
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

### Tiêu chí
- [ ] Segmented toggle "Chi tiết" / "Nợ ròng" hoạt động
- [ ] Mode "Nợ ròng" gộp debts bằng `simplifyDebts()`
- [ ] Row chip "Nợ ròng · gộp N" hiện đúng count
- [ ] Empty state "🎉 Tất cả đã cân bằng!" khi list rỗng
- [ ] Batch settle tạo payment_confirmations cho tất cả underlying debts
- [ ] Unit tests 12/12 PASS
- [ ] Switch mode không gây flash / lag
