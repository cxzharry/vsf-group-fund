# Epic 2 — Nhóm (Groups)

> **Epic ID:** E2 · **Priority:** P0 · **Persona:** [Minh — Người Tổ Chức](../personas/group-organizer-vn.md) · [Linh — Thành Viên](../personas/group-member-vn.md)
> **Brief:** Tạo và quản lý nhóm chia bill, mời thành viên qua code/QR, xem Home với nợ ròng, Group Detail chat view, cài đặt nhóm.

---

## US-E2-1 — Xem danh sách nhóm (Home)

**As a** [Minh — Người Tổ Chức](../personas/group-organizer-vn.md) **or** [Linh — Thành Viên](../personas/group-member-vn.md), **I want to** xem danh sách nhóm mà tôi là thành viên với nợ ròng **so that** tôi có cái nhìn tổng quát về tất cả khoản nợ.

- **Priority:** P0 · **Effort:** M

### Rules / Function
- Sau login, hiện danh sách groups mà user là member
- Mỗi group: tên, số thành viên, nợ ròng trong nhóm đó
- Chip tổng nợ: tổng tất cả nợ + được nợ qua tất cả nhóm
- Card nhóm hiện subtitle nợ + nút hành động nhanh (Trả nợ / Nhắc nợ)

### Hiển thị nợ trên card nhóm

Mỗi card hiện thông tin nợ theo 6 trường hợp:

| # | Trường hợp | Subtitle | Nút |
|---|-----------|----------|-----|
| 1 | Nợ 1 người | "Bạn nợ [Tên] [số tiền]đ" | Trả nợ |
| 2 | Nợ nhiều người | "Bạn nợ [Tên] và [N-1] người khác" | Trả nợ |
| 3 | 1 người nợ mình | "[Tên] nợ bạn [số tiền]đ" | Nhắc nợ |
| 4 | Nhiều người nợ mình | "[Tên] và [N-1] người khác nợ bạn" | Nhắc nợ |
| 5 | Vừa nợ vừa được nợ | Hiện theo nợ ròng: nếu ròng < 0 → case 1/2, nếu ròng > 0 → case 3/4 | Trả nợ / Nhắc nợ |
| 6 | Không có nợ | "[X] thành viên" | Không có nút |

**Logic chọn [Tên]:** Người có khoản nợ ròng lớn nhất với user trong nhóm đó.

### Edge cases
- Chưa có nhóm → hiện empty state
- Group tên dài → truncate 1 dòng
- Nợ = 0 → không hiện số tiền, hiện "Không có nợ" gray
- Nợ ròng = 0 nhưng có nợ 2 chiều → vẫn hiện "Không có nợ" (vì đã triệt tiêu)
- Tên người nợ dài → truncate subtitle 1 dòng

### Acceptance Criteria
- [ ] AC-E2-1.1: Chỉ hiện 2 tabs
- [ ] AC-E2-1.2: Card nhóm hiện đúng nợ ròng
- [ ] AC-E2-1.3: Subtitle hiện tên người nợ lớn nhất
- [ ] AC-E2-1.4: Nợ nhiều người → "[Tên] và [N-1] người khác"
- [ ] AC-E2-1.5: Nút Trả nợ / Nhắc nợ / Không có nợ
- [ ] AC-E2-1.6: Empty state khi chưa có group
- [ ] AC-E2-1.7: Chip tổng nợ hiện cả 2 chiều (nợ + được nợ)

---

## US-E2-2 — Tạo nhóm (Full-page flow)

**As a** [Minh — Người Tổ Chức](../personas/group-organizer-vn.md), **I want to** tạo nhóm mới với tên + emoji tùy chọn **so that** tôi có nhóm để mời bạn bè và chia bill.

- **Priority:** P0 · **Effort:** L

### Rules / Function
1. Tap "+" trên Home → navigate đến /groups/create (full page, KHÔNG phải dialog)
2. User nhập tên nhóm + chọn emoji (optional)
3. Tap "Tạo nhóm" → API tạo group + invite_code (8 ký tự) + creator là admin
4. Thành công → chuyển sang màn "Mời thành viên" (step 2)

### Edge cases
- Tên trống → nút "Tạo nhóm" disabled
- Tên quá dài → truncate ở display
- API lỗi → toast error, giữ form

### Acceptance Criteria
- [ ] AC-E2-2.1: Tạo nhóm full-page (không phải dialog)
- [ ] AC-E2-2.2: Tạo thành công → chuyển sang "Mời thành viên"
- [ ] AC-E2-2.3: Creator là admin
- [ ] AC-E2-2.4: Invite code + link mời được tạo
- [ ] AC-E2-2.5: Copy link hoạt động
- [ ] AC-E2-2.6: Nút "Tạo nhóm" disabled khi tên trống
- [ ] AC-E2-2.7: Copy feedback hiển thị sau khi copy link
- [ ] AC-E2-2.8: "Vào nhóm ngay" → navigate group detail

---

## US-E2-3 — Tham gia nhóm

**As a** [Linh — Thành Viên](../personas/group-member-vn.md), **I want to** tham gia nhóm bằng invite code **so that** tôi có thể xem bill và nợ trong nhóm đó.

- **Priority:** P0 · **Effort:** S

### Rules / Function
1. Tap "Tham gia" → dialog nhập invite code 8 ký tự
2. Tìm group theo code → thêm user là member
3. Kiểm tra trùng lặp (không cho join 2 lần)

### Edge cases
- Code không tồn tại → error "Không tìm thấy nhóm"
- Đã là member → error "Bạn đã trong nhóm này"
- Code đúng → toast + reload danh sách

### Acceptance Criteria
- [ ] AC-E2-3.1: Tham gia thành công bằng invite code
- [ ] AC-E2-3.2: Không cho join trùng
- [ ] AC-E2-3.3: Code sai → error message

---

## US-E2-4 — Xem Group Detail (Chat View)

**As a** [Minh — Người Tổ Chức](../personas/group-organizer-vn.md) **or** [Linh — Thành Viên](../personas/group-member-vn.md), **I want to** xem chat + bill feed trong nhóm với real-time updates **so that** tôi luôn cập nhật hoạt động nhóm.

- **Priority:** P0 · **Effort:** L

### Rules / Function
- Load chat_messages + bills theo group_id
- Real-time subscription (Supabase channel) cho tin nhắn + bill mới
- Debt banner: query debts → tính nợ ròng lớn nhất
- Gửi tin nhắn → trigger AI intent parser

### Edge cases
- Group trống (chưa có hoạt động) → empty state: icon receipt 64px #E5E5EA + "Chưa có bill nào" 17px bold + "Tạo bill đầu tiên để bắt đầu theo dõi chi tiêu nhóm." 14px gray + banner "Không có khoản nợ nào. Tạo bill đầu tiên! 🎉" nền #EEF2FF
- Real-time disconnect → auto reconnect
- Group 1 thành viên → chat input vẫn hoạt động

### Acceptance Criteria
- [ ] AC-E2-4.1: Feed hiện bill cards, transfers, tin nhắn
- [ ] AC-E2-4.2: Debt banner đúng nợ ròng
- [ ] AC-E2-4.3: Real-time: bill/tin nhắn mới hiện ngay
- [ ] AC-E2-4.4: Empty state khi chưa có hoạt động
- [ ] AC-E2-4.5: Tab bar ẩn trên màn này

---

## US-E2-5 — Cài đặt nhóm

**As a** [Minh — Người Tổ Chức](../personas/group-organizer-vn.md) **or** [Linh — Thành Viên](../personas/group-member-vn.md), **I want to** quản lý cài đặt nhóm (tên, thành viên, mã mời, rời nhóm) **so that** tôi có thể điều chỉnh nhóm hoặc rời khỏi.

- **Priority:** P0 · **Effort:** M

### Rules / Function
- Đổi tên (chỉ admin)
- Xem/copy mã mời
- Xem danh sách thành viên + role (Admin/Member)
- Rời nhóm (xoá group_members record, cần xác nhận)

### Edge cases
- Non-admin đổi tên → ẩn nút sửa
- Rời nhóm khi là admin duy nhất → cho phép (group vẫn tồn tại)
- Copy mã mời → toast "Đã sao chép"

### Acceptance Criteria
- [ ] AC-E2-5.1: Admin đổi tên thành công
- [ ] AC-E2-5.2: Copy mã mời hoạt động
- [ ] AC-E2-5.3: Rời nhóm có dialog xác nhận
- [ ] AC-E2-5.4: Non-admin không thấy nút đổi tên

---

## AC Coverage Summary

- **Total ACs this epic:** 18 functional ACs (was 28)
- **Legacy ID mapping:** `US-2.1` → `US-E2-1`, `US-2.2` → `US-E2-2`, `US-2.3` → `US-E2-3`, `US-2.4` → `US-E2-4`, `US-2.5` → `US-E2-5`
