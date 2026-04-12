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

## US-2.2: Tạo nhóm (Full-page flow)

### Function
1. Tap "+" trên Home → navigate đến /groups/create (full page, KHÔNG phải dialog)
2. User nhập tên nhóm + chọn emoji (optional)
3. Tap "Tạo nhóm" → API tạo group + invite_code (8 ký tự) + creator là admin
4. Thành công → chuyển sang màn "Mời thành viên" (step 2)

### Edge cases
- Tên trống → nút "Tạo nhóm" disabled
- Tên quá dài → truncate ở display
- API lỗi → toast error, giữ form

### UX/UI — Step 1: Tạo nhóm

**Nav bar (52px, trắng):**
- Back chevron-left xanh #3A5CCC (24px)
- "Tạo nhóm" (17px bold, căn giữa)
- Spacer 24px bên phải (balance)

**Content (nền #F2F2F7, padding 40px 24px 24px 24px, gap 32px):**

**Avatar section:**
- Vòng tròn 80px, nền #EEF2FF, icon people #3A5CCC
- Overlay icon camera nhỏ (16px) góc dưới phải
- Text dưới: "Ảnh nhóm (tuỳ chọn)" (12px #8E8E93)

**Name card (trắng, rounded 12px, padding 16px, gap 8px):**
- Label: "TÊN NHÓM" (11px bold #8E8E93, uppercase)
- Input row: text input 15px + clear icon (nếu có text)
- Divider: #E5E5EA, 1px
- Hint: "Tên nhóm sẽ hiển thị với tất cả thành viên" (12px #8E8E93)

**Emoji card (trắng, rounded 12px, padding 16px, gap 12px):**
- Label: "EMOJI NHÓM" (11px bold #8E8E93)
- Emoji row: 8 emoji options, mỗi cái 36px, gap 10px
- Selected: border 2px #3A5CCC rounded
- Default emojis: 🍜 🐱 🏖️ 🎮 🏠 ✈️ 🎁 ⋯

**Bottom area (trắng, padding 12px 16px 32px 16px):**
- Nút "Tạo nhóm": nền #3A5CCC, rounded 14px, cao 52px, text 16px bold trắng, full width

### UX/UI — Step 2: Mời thành viên (sau tạo thành công)

**Nav bar:** "Mời thành viên" (17px bold, căn giữa, không có back)

**Content (padding 32px 24px, gap 24px):**

**Group card (trắng, rounded 14px, padding 16px, gap 12px, căn giữa):**
- Avatar nhóm 56px tròn (nền #3A5CCC + emoji/icon)
- Tên nhóm (17px bold)
- "1 thành viên" (13px #8E8E93)

**Link card (trắng, rounded 14px, padding 16px, gap 12px):**
- Label: "LINK MỜI NHÓM" (11px bold #8E8E93)
- Link box: nền #F2F2F7, rounded 10px, padding 12px
  - Text link (13px #1C1C1E) + copy icon bên phải
- Feedback: "✓ Đã sao chép link" (13px #34C759) — hiện sau tap copy

**QR card (trắng, rounded 14px, padding 20px, gap 8px, căn giữa):**
- QR code frame: 140x140px, nền #F2F2F7, rounded 8px, border #E5E5EA
- Text: "Quét mã QR để tham gia nhóm" (13px #8E8E93)

**Share section:**
- Label: "CHIA SẺ QUA" (11px bold #8E8E93)
- Share icons row: Zalo | Telegram | Facebook | More (mỗi icon 44px tròn, gap 16px)

**Bottom:** Nút "Vào nhóm ngay" → navigate đến group detail

### Tiêu chí

**Function:**
- [ ] Tạo nhóm full-page (không phải dialog)
- [ ] Tạo thành công → chuyển sang "Mời thành viên"
- [ ] Creator là admin
- [ ] Invite code + link mời được tạo
- [ ] Copy link hoạt động

**UX/UI:**
- [ ] Step 1: avatar + name card + emoji card đúng layout
- [ ] Name input: label uppercase, hint text, divider
- [ ] Nút "Tạo nhóm" disabled khi tên trống
- [ ] Step 2: group card + link + QR + share icons
- [ ] Copy feedback "✓ Đã sao chép link" xanh lá
- [ ] "Vào nhóm ngay" → navigate group detail

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
- Group trống (chưa có hoạt động) → empty state: icon receipt 64px #E5E5EA + "Chưa có bill nào" 17px bold + "Tạo bill đầu tiên để bắt đầu theo dõi chi tiêu nhóm." 14px gray + banner "Không có khoản nợ nào. Tạo bill đầu tiên! 🎉" nền #EEF2FF
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
