# Epic 2: Nhóm (Groups)

---

## Function

### Tạo nhóm
1. Nhập tên nhóm → API tạo group + invite_code (8 ký tự md5)
2. Tự thêm creator là admin vào group_members
3. Redirect đến group detail

### Tham gia nhóm
1. Nhập invite code 8 ký tự
2. Tìm group theo code → thêm user là member
3. Kiểm tra trùng lặp (không cho join 2 lần)

### Cài đặt nhóm
- Đổi tên (chỉ admin)
- Xem/copy mã mời
- Xem danh sách thành viên + role
- Rời nhóm (xoá group_members record, cần xác nhận)

### Group Detail - Chat
- Load chat_messages + bills theo group_id
- Real-time subscription (Supabase channel)
- Debt banner: query debts → tính nợ ròng lớn nhất
- Gửi tin nhắn → trigger AI intent parser

---

## UX/UI

### 2.1 Home / Nhóm (Tab 1)

**Header:**
- "Nhóm" (28-30px bold, căn trái)
- Phải: nút "+" xanh 36px tròn (#3A5CCC) + chữ "Tham gia" xanh

**Chip tổng nợ:**
- Nền trắng, rounded 12px, padding 0 16px, cao 52px
- Text: "Tổng: Bạn đang nợ X · Bạn được nợ Y", font 12px gray #636366

**Card nhóm (mỗi card):**
- Nền trắng, rounded 14px, padding 0 16px, cao 88px, gap 12px
- Trái: avatar 44px tròn, nền màu, chữ cái đầu 2 ký tự trắng bold
- Giữa: tên nhóm (15px bold #1C1C1E) + "X thành viên" (13px #8E8E93)
- Phải: số nợ ròng (15px bold, đỏ #FF3B30 hoặc xanh #34C759) + "Trả nợ" (13px #3A5CCC)
- Gap giữa cards: 8px (từ absolute layout y offset)

**Tab bar:**
- 2 tabs only: "Nhóm" + "Tài khoản"
- Cao 56px + safe-area-inset-bottom
- Active: xanh #3A5CCC, stroke 2 | Inactive: gray #8E8E93, stroke 1.5

**Trạng thái trống:**
- Icon people gray 72x72
- "Chưa có nhóm nào" (20px bold)
- "Tạo nhóm để bắt đầu chia bill với bạn bè." (15px gray, căn giữa, width 260px)
- Nút "Tạo nhóm mới" (outline, border #3A5CCC 1.5px, rounded 10px, cao 46px, padding 0 28px)

### 2.2 Group Detail (Chat View)

**Nav bar (cao 52px, nền trắng):**
- Nút back "<" (xanh #3A5CCC, 28px)
- Giữa: tên nhóm (17px bold) + "X thành viên" (12px gray)
- Phải: icon cài đặt trong vòng tròn xám #E5E5EA 36px

**Debt banner (cao 56px, conditional):**
- Nền đỏ nhạt #FFF3F0 nếu nợ | Nền xanh nhạt #F0FFF4 nếu được nợ
- Text trái: "Bạn nợ [Tên]" (13px) + số tiền (15px bold)
- Nút phải: "Trả nợ" rounded 16px, cao 32px, padding 0 14px

**Feed chat:**
- Nền #F2F2F7
- Date divider: text 11px gray #AEAEB2, căn giữa, padding 0 8px
- Bill card: avatar 34px + bubble trắng rounded 14px, padding 14px 12px, gap 6px
- Transfer pill: nền #E8EDFF, rounded 20px, padding 7px 14px, căn giữa

**FAB:**
- Dưới phải, padding 8px 16px 40px 16px
- Nền #3A5CCC, rounded 26px, cao 52px, padding 0 22px 0 18px
- Shadow: blur 16px, color #3A5CCC55, offset y 4px
- Text: "+ Thêm hoá đơn" trắng + icon receipt

### 2.3 Cài đặt nhóm
- Nav: back + "Cài đặt nhóm" (17px bold)
- Sections: tên, mô tả, thành viên, mã mời, nâng cao
- Gap giữa sections: 16px, padding 8px 16px 32px 16px

---

## Tiêu chí thành công

### Function
- [ ] Tạo nhóm thành công + redirect detail
- [ ] Tham gia nhóm bằng invite code
- [ ] Real-time: tin nhắn/bill mới hiện ngay
- [ ] Debt banner tính đúng nợ ròng
- [ ] Rời nhóm xoá membership

### UX/UI
- [ ] Chỉ hiện 2 tabs
- [ ] Card nhóm: avatar 44px, tên bold, nợ đỏ/xanh
- [ ] Trạng thái trống: icon + text + nút outline
- [ ] Group detail: nav 52px, debt banner 56px
- [ ] FAB: rounded 26px, shadow, luôn ở dưới phải
- [ ] Feed chat: date dividers, bill cards, transfer pills
- [ ] Desktop: sidebar thay tab bar, content giữ max-width
