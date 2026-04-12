# Epic 2: Nhóm (Groups)

---

## US-2.1: Xem danh sách nhóm (Home)

### Function
- Sau login, hiện danh sách groups mà user là member
- Mỗi group: tên, số thành viên, nợ ròng trong nhóm đó
- Chip tổng nợ: tổng tất cả nợ + được nợ qua tất cả nhóm

### Edge cases
- Chưa có nhóm → hiện empty state
- Group tên dài → truncate 1 dòng
- Nợ = 0 → không hiện số tiền bên phải card

### UX/UI
**Header:** "Nhóm" (28-30px bold, căn trái) + nút "+" 36px tròn #3A5CCC + "Tham gia" xanh

**Chip tổng nợ:** nền trắng, rounded 12px, cao 52px, text 12px gray

**Card nhóm:** nền trắng, rounded 14px, cao 88px, gap 12px, padding 0 16px
- Avatar 44px tròn, 2 chữ cái đầu, nền màu hash
- Tên 15px bold + "X thành viên" 13px gray
- Nợ ròng: 15px bold, đỏ #FF3B30 / xanh #34C759

**Tab bar:** 2 tabs only, cao 56px + safe-area

**Empty state:** icon people 72px gray + "Chưa có nhóm nào" 20px bold + nút "Tạo nhóm mới" outline

### Tiêu chí
- [ ] Chỉ hiện 2 tabs
- [ ] Card nhóm hiện đúng nợ ròng (đỏ/xanh)
- [ ] Empty state khi chưa có group
- [ ] Chip tổng nợ hiện cả 2 chiều (nợ + được nợ)

---

## US-2.2: Tạo nhóm

### Function
1. Tap "+" → dialog nhập tên nhóm
2. API tạo group + invite_code (8 ký tự)
3. Tự thêm creator là admin vào group_members
4. Redirect đến group detail

### Edge cases
- Tên trống → không cho tạo (nút disabled)
- API lỗi → toast error

### UX/UI
- Dialog: tiêu đề "Tạo nhóm mới", ô nhập tên, nút "Tạo nhóm" #3A5CCC

### Tiêu chí
- [ ] Tạo nhóm thành công + redirect detail
- [ ] Creator là admin
- [ ] Invite code 8 ký tự được tạo

---

## US-2.3: Tham gia nhóm

### Function
1. Tap "Tham gia" → dialog nhập invite code 8 ký tự
2. Tìm group theo code → thêm user là member
3. Kiểm tra trùng lặp (không cho join 2 lần)

### Edge cases
- Code không tồn tại → error "Không tìm thấy nhóm"
- Đã là member → error "Bạn đã trong nhóm này"
- Code đúng → toast + reload danh sách

### UX/UI
- Dialog: tiêu đề "Tham gia nhóm", ô nhập mã 8 ký tự, nút "Tham gia"

### Tiêu chí
- [ ] Tham gia thành công bằng invite code
- [ ] Không cho join trùng
- [ ] Code sai → error message

---

## US-2.4: Xem Group Detail (Chat View)

### Function
- Load chat_messages + bills theo group_id
- Real-time subscription (Supabase channel) cho tin nhắn + bill mới
- Debt banner: query debts → tính nợ ròng lớn nhất
- Gửi tin nhắn → trigger AI intent parser

### Edge cases
- Group trống (chưa có hoạt động) → empty state với hướng dẫn
- Real-time disconnect → auto reconnect
- Group 1 thành viên → chat input vẫn hoạt động

### UX/UI
**Nav bar (52px, trắng):** back "<" xanh + tên nhóm 17px bold + "X thành viên" 12px gray + gear icon 36px

**Debt banner (56px, conditional):**
- Đỏ #FFF3F0 nếu nợ | Xanh #F0FFF4 nếu được nợ
- Text: "Bạn nợ [Tên] [Số tiền]" + nút "Trả nợ" / "Nhắc nợ"
- Ẩn nếu không có nợ

**Feed:** nền #F2F2F7, date dividers 11px gray, bill cards rounded 14px, transfer pills #E8EDFF

**Chat input:** ô nhập + nút tạo bill 44x44px

### Tiêu chí
- [ ] Feed hiện bill cards, transfers, tin nhắn
- [ ] Debt banner đúng nợ ròng
- [ ] Real-time: bill/tin nhắn mới hiện ngay
- [ ] Empty state khi chưa có hoạt động
- [ ] Tab bar ẩn trên màn này

---

## US-2.5: Cài đặt nhóm

### Function
- Đổi tên (chỉ admin)
- Xem/copy mã mời
- Xem danh sách thành viên + role (Admin/Member)
- Rời nhóm (xoá group_members record, cần xác nhận)

### Edge cases
- Non-admin đổi tên → ẩn nút sửa
- Rời nhóm khi là admin duy nhất → cho phép (group vẫn tồn tại)
- Copy mã mời → toast "Đã sao chép"

### UX/UI
- Nav: back + "Cài đặt nhóm" 17px bold
- Sections: tên, thành viên, mã mời, rời nhóm
- Gap 16px, padding 8px 16px 32px 16px
- Nút rời nhóm: nền đỏ nhạt, có dialog xác nhận

### Tiêu chí
- [ ] Admin đổi tên thành công
- [ ] Copy mã mời hoạt động
- [ ] Rời nhóm có dialog xác nhận
- [ ] Non-admin không thấy nút đổi tên
