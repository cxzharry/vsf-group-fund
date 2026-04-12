# NoPay FreeLunch - Product Requirements Document

**Version:** 1.0 | **Updated:** 2026-04-12

---

## 1. Product Vision

App chia bill cho nhóm bạn bè tại Việt Nam. Tạo bill nhanh qua chat, theo dõi nợ, chuyển tiền qua QR.

**URL:** https://nopay-freelunch.vercel.app

---

## 2. Navigation

- **2 tabs only:** "Nhóm" (Home) + "Tài khoản" (Account)
- Mobile: bottom tab bar | Desktop: left sidebar
- Bills, debts, transfers truy cập từ **trong group detail** — KHÔNG phải top-level tabs
- Nút back trên tất cả sub-pages

---

## 3. Screens & Flows

### 3.1 Login (Auth)

**Màn hình:** Full-page, căn giữa dọc trên mobile

**Thành phần:**
- App icon: hình vuông bo tròn xanh (#3A5CCC) với people icon, 72x72px
- Tiêu đề: "NoPay" (dòng 1) + "FreeLunch" (dòng 2), 28px bold, căn giữa
- Phụ đề: "Nhập email để đăng nhập" (dòng 1) + "hoặc tạo tài khoản mới." (dòng 2), 15px gray, căn giữa
- Ô nhập email
- Nút "Gửi mã OTP" (primary blue, full width)
- Đường kẻ phân cách: "hoặc"
- Nút "Nhập mật khẩu" (secondary gray, full width)

**Luồng OTP:**
1. User nhập email → tap "Gửi mã OTP"
2. Supabase gửi **mã 6 số** về email (KHÔNG phải magic link)
3. Hiện form nhập 6 số OTP
4. Verify thành công → redirect về Home

**Luồng Password:**
1. Tap "Nhập mật khẩu" → hiện form email + password
2. Login thành công → redirect về Home

**Tiêu chí thành công:**
- [ ] OTP gửi **mã số**, không gửi link
- [ ] Login thành công redirect về "/"
- [ ] Branding đúng: "NoPay\nFreeLunch"

---

### 3.2 Home / Nhóm (Groups List)

**Màn hình:** Tab 1, màn hình mặc định sau login

**Header:**
- Tiêu đề: "Nhóm" (28-30px bold, căn trái)
- Phải: nút "+" xanh (tạo nhóm) + chữ "Tham gia"

**Nội dung:**
- Chip tổng nợ: "Tổng: Bạn đang nợ X | Bạn được nợ Y"
- Card nhóm (list, rounded 14px, white bg):
  - Trái: avatar tròn màu với chữ cái đầu nhóm
  - Giữa: tên nhóm (bold) + "X thành viên" (gray)
  - Phải: số nợ ròng (đỏ nếu nợ, xanh nếu được nợ) + link "Trả nợ" nếu có

**Bottom tab bar:**
- 2 tabs: Nhóm (people icon, active blue) + Tài khoản (person icon, gray)

**Trạng thái trống:**
- Icon người lớn (gray)
- "Chưa có nhóm nào" (20px bold)
- "Tạo nhóm để bắt đầu chia bill với bạn bè." (15px gray)
- Nút "Tạo nhóm mới" (outline, blue border)

**Hành động:**
- Tap card nhóm → Group Detail
- Tap "+" → Dialog tạo nhóm
- Tap "Tham gia" → Dialog tham gia nhóm

**Tiêu chí thành công:**
- [ ] Chỉ hiện 2 tabs
- [ ] Card nhóm hiện đúng số nợ
- [ ] Trạng thái trống khi chưa có group

---

### 3.3 Group Detail (Chat View)

**Màn hình:** Màn hình tương tác chính, dạng chat

**Thanh nav:**
- Nút back "<" (xanh)
- Giữa: tên nhóm (bold) + "X thành viên" (gray, nhỏ hơn)
- Phải: icon cài đặt hình bánh răng (vòng tròn xám)

**Banner nợ (có điều kiện):**
- Nền đỏ (#FFF3F0) nếu user nợ: "Bạn nợ [Tên] [Số tiền]" + nút "Trả nợ"
- Nền xanh (#F0FFF4) nếu user được nợ: "[Tên] nợ bạn [Số tiền]" + nút "Nhận tiền"
- Ẩn nếu không có nợ

**Feed chat:**
- Dải phân cách ngày: "28 tháng 1, 2026" (gray, căn giữa)
- Card bill (bubble trắng, rounded 14px):
  - Avatar người gửi (trái, vòng tròn 34px)
  - Card: tên người gửi + giờ, tiêu đề bill, ngày, tổng tiền
  - Số tiền ròng cho user hiện tại (đỏ/xanh)
- Sự kiện chuyển tiền: pill căn giữa "#E8EDFF", "[Tên] đã chuyển [Số tiền] cho [Tên]"
- Tin nhắn văn bản: bubble chat tiêu chuẩn

**FAB (Nút hành động nổi):**
- Dưới phải, xanh (#3A5CCC), bo tròn, có shadow
- Chữ "+ Thêm hoá đơn" với icon receipt
- Tap → kích hoạt luồng tạo bill

**Tiêu chí thành công:**
- [ ] Feed chat hiện bill cards, transfers, tin nhắn văn bản
- [ ] Banner nợ hiện đúng số nợ ròng
- [ ] FAB luôn hiện ở dưới phải
- [ ] Real-time: bill mới từ người khác hiện ngay

---

### 3.4 Tạo Bill - Chat Intent (Luồng chính)

**Kích hoạt:** User gõ tin nhắn trong group chat, VD: "500k ăn trưa 6 người"

**AI Parser (regex local, không dùng LLM):**
- Phát hiện số tiền: "500k" → 500.000đ
- Phát hiện mô tả: "ăn trưa" → "ăn trưa"
- Phát hiện số người: "6 người" → 6
- Nếu đủ thông tin → hiện Bill Confirm Sheet
- Nếu thiếu thông tin → hiện AI Follow-up Card

**AI Follow-up Card:**
- Inline trong chat, trước thanh nhập
- Câu hỏi: "Chia 500k cho ăn trưa. Bạn muốn chia như nào?"
- 3 lựa chọn:
  - A: "Bill mở" (chưa biết mấy người)
  - B: "Chia đều" (nhập số người)
  - C: "Tuỳ chỉnh" (nhập từng người)

**Tiêu chí thành công:**
- [ ] "500k bún bò 6 người" → parse đúng amount, description, people
- [ ] Hiện follow-up khi thiếu split type
- [ ] Tap option → hiện Bill Confirm Sheet

---

### 3.5 Bill Confirm Sheet (Half-Sheet Bottom Modal)

**Kích hoạt:** Sau khi AI parse đủ info hoặc user chọn follow-up option

**Thiết kế:** Half-sheet từ dưới lên, rounded top 20px, shadow, backdrop 40% đen

**Thành phần (từ trên xuống):**
- Drag handle (thanh xám, căn giữa, 36x4px)
- Header: "✦ Xác nhận bill" (bold) + nút "✕" đóng (xám)
- Dòng: "Mô tả" | nội dung mô tả
- Dòng: "Chia cho" | avatar thành viên (tối đa 5, vòng tròn 22px) + "+N" nếu nhiều hơn
- Dòng: "Mỗi người" | số tiền mỗi người (xanh, bold)
- Dòng: "Người trả" | avatar người trả + tên ("Bạn" nếu là user hiện tại)
- Đường kẻ phân cách (#E5E5EA)
- Dòng upload: nút "📎 Thêm ảnh bill" (nền xám, căn giữa)
- Nút "Tạo bill" (xanh, full width, cao 48px, rounded 12px)

**Khi xác nhận:**
1. Tạo bill + participants + debts
2. Chèn tin nhắn bill_card trong chat
3. Đóng sheet
4. Toast "Đã tạo bill!"
5. Thông báo participants qua Telegram

**Tiêu chí thành công:**
- [ ] Sheet hiện avatar thành viên đúng
- [ ] Số tiền mỗi người = floor(tổng / số người)
- [ ] Xác nhận tạo bill + debts + chat message
- [ ] Sheet đóng sau khi xác nhận

---

### 3.6 Sheet Chọn Người & Số Tiền (Full Bottom Sheet)

**Kích hoạt:** Khi user muốn chọn người và số tiền chi tiết

**Thiết kế:** Bottom sheet full-height với dim overlay

**Thành phần:**
- Drag handle
- Header: "Chọn người & số tiền" + "Xong" (chữ xanh, bên phải)
- Tabs chế độ chia (pill buttons, gap 8px):
  - "Chia đều" (active: nền xanh nhạt #EEF2FF, chữ xanh)
  - "Chia %" (inactive: nền xám #F2F2F7)
  - "Tuỳ chỉnh" (inactive: nền xám #F2F2F7)
- Dòng tổng: "Tổng" | "500.000đ" (bold)
- Danh sách thành viên (mỗi dòng cao 60px):
  - Avatar tròn (36px, có màu) với chữ cái đầu
  - Tên (bold 14px) + phụ đề nếu có
  - Pill số tiền (nền xám, chữ xanh, rounded 8px)
  - Checkbox tròn (22px, xanh nếu chọn, xám nếu không)
- Đường kẻ phân cách
- Dòng còn lại: "Còn lại chưa chia" | "0đ" (xanh lá nếu = 0)
- Nút "Xác nhận" (xanh, full width, 52px, rounded 14px)

**Logic chia:**
- **Chia đều:** tổng / số người chọn, phần dư phân bổ +1 cho N người đầu
- **Chia %:** % của tổng mỗi người (tổng phải = 100%)
- **Tuỳ chỉnh:** nhập thủ công mỗi người (tổng phải = tổng bill)

**Tiêu chí thành công:**
- [ ] Chuyển đổi chế độ chia thay đổi UI tương ứng
- [ ] Chia đều: tự tính số tiền mỗi người
- [ ] Dòng còn lại hiện "0đ" khi chia hết
- [ ] Xác nhận chỉ khi tổng = tổng bill

---

### 3.7 Bill Mở (Open Bill)

**Trường hợp:** Ăn trưa, chưa biết ai tham gia. Mọi người check-in khi đến.

**Tạo bill:** Qua chat intent (chọn "Bill mở") hoặc form

**Card Bill Mở (trong chat):**
- Giao diện cam (#FF9500 avatar, #FFF8EC nền)
- Badge: "Bill mở · N người đã check-in"
- Thông tin: người trả, tiêu đề, tổng tiền
- Nút: "Tôi có ăn" (check-in) hoặc "Đã check-in" (disabled)
- Hành động admin: "+ Thêm người", "Đóng bill"

**Luồng check-in:**
1. Tap "Tôi có ăn" → tạo bản ghi bill_checkins
2. Nút đổi thành "Đã check-in"
3. Thông báo người trả

**Luồng đóng bill:**
1. Người trả/admin tap "Đóng bill"
2. Tính: tổng / số người check-in
3. Tạo debts cho tất cả thành viên đã check-in (trừ người trả)
4. Trạng thái bill → "closed"
5. Thông báo tất cả người nợ

**Sheet thêm người:**
- Bottom sheet với danh sách thành viên nhóm
- Ô tìm kiếm: "Tìm thành viên..."
- Thành viên: tap để thêm/bỏ với badge "Thêm"
- Mục: "Người ngoài nhóm" → thêm bằng tên (không cần tài khoản)

**Tiêu chí thành công:**
- [ ] Check-in tạo bản ghi và cập nhật UI
- [ ] Đóng bill tạo debts đúng số tiền mỗi người
- [ ] Khách (không có tài khoản) vẫn check-in được
- [ ] Chỉ người trả/admin thấy "Đóng bill"

---

### 3.8 Theo Dõi Nợ (trong Group Detail)

**Hiển thị:** Banner nợ ở đầu group detail

**Logic banner nợ:**
- Query tất cả debts trong nhóm mà user hiện tại là debtor hoặc creditor
- Nợ ròng mỗi người: sum(nợ tôi nợ họ) - sum(nợ họ nợ tôi)
- Hiện khoản nợ ròng lớn nhất
- Đỏ nếu tôi nợ, xanh nếu được nợ

**Luồng trả nợ:**
1. Tap "Trả nợ" trên banner nợ
2. Chuyển đến trang Transfer (/transfer/[debtId])
3. Hiện mã QR + thông tin ngân hàng
4. User chuyển tiền qua app ngân hàng
5. Tap "Đã chuyển tiền" → đánh dấu payment pending
6. Chủ nợ nhận thông báo Telegram
7. Chủ nợ xác nhận → trạng thái nợ = "confirmed"

**Tiêu chí thành công:**
- [ ] Banner nợ hiện đúng số nợ ròng
- [ ] Trang transfer hiện QR + thông tin ngân hàng
- [ ] Xác nhận thanh toán 2 chiều (người nợ báo + chủ nợ xác nhận)

---

### 3.9 Trang Chuyển Tiền / Thanh Toán

**Màn hình:** Full page, truy cập từ nút "Trả nợ"

**Thành phần:**
- Header: "Chuyển tiền" + nút back
- Thông tin bill: tiêu đề + ngày
- Hiển thị số tiền: số tiền lớn bold + "cho" + tên/avatar chủ nợ
- Card QR (nếu chủ nợ có thông tin ngân hàng):
  - Hình ảnh mã QR (chuẩn VietQR)
  - Tên ngân hàng
  - Số tài khoản (có nút sao chép)
  - Tên chủ tài khoản
  - Nút hành động: "Lưu QR" | "Chia sẻ" | Deep link app ngân hàng
- CTA: Nút "Đã chuyển tiền" (xanh, full width)

**Trạng thái không có thông tin ngân hàng:**
- Thông báo: "Người nhận chưa liên kết ngân hàng"
- Hướng dẫn chuyển tiền thủ công

**Tiêu chí thành công:**
- [ ] QR tạo đúng với thông tin ngân hàng của chủ nợ
- [ ] Sao chép số tài khoản hoạt động
- [ ] "Đã chuyển tiền" tạo bản ghi payment_confirmation
- [ ] Thông báo chủ nợ qua Telegram

---

### 3.10 Tài Khoản (Account)

**Màn hình:** Tab 2

**Header:** "Tài khoản" (20px bold, căn giữa)

**Phần hồ sơ:**
- Avatar tròn (lớn, nền màu, chữ cái đầu)
- Tên hiển thị (bold) + email (gray)
- Icon điện thoại + nút "Sửa"

**Phần ngân hàng:**
- Nhãn: "NGÂN HÀNG" (gray, 11px, uppercase)
- Card ngân hàng (trắng, rounded 14px):
  - Icon ngân hàng + "Tài khoản ngân hàng" + chevron
  - Dòng phụ: tên ngân hàng + tài khoản ẩn (****XXXX) + badge "Đã liên kết"
  - HOẶC: "Chưa liên kết" + nút "Liên kết ngay" (xanh)

**Phần liên kết:**
- Nhãn: "LIÊN KẾT" (gray, 11px, uppercase)
- Card Telegram: icon Telegram + "Telegram" + nút "Liên kết"
  - Nếu đã liên kết: badge "Đã liên kết"

**Đăng xuất:**
- Dưới cùng: chữ đỏ "Đăng xuất" với icon logout

**Tiêu chí thành công:**
- [ ] Hiện đúng thông tin hồ sơ
- [ ] Sửa tên hoạt động
- [ ] Liên kết ngân hàng: lưu bank_name, account_no, account_name
- [ ] Liên kết Telegram: chuyển đến bot
- [ ] Đăng xuất xoá session

---

## 4. Logic Chia Bill (Quy tắc nghiệp vụ cốt lõi)

### 4.1 Bill Tiêu Chuẩn (Chia đều)
```
Input: total_amount, paid_by, participants[]
Mỗi người = floor(total_amount / participants.length)
Phần dư = total_amount - (mỗi_người * participants.length)
[phần dư] người đầu tiên được +1 VND

Nợ tạo ra:
  Với mỗi participant (trừ người trả):
    debt = { debtor: participant, creditor: payer, amount: phần_của_họ }
```

### 4.2 Chia Tuỳ Chỉnh (Custom Split)
```
Input: total_amount, paid_by, amounts: { member_id: amount }
Validation: sum(amounts) PHẢI bằng total_amount
Debts: tương tự nhưng với số tiền tuỳ chỉnh
```

### 4.3 Bill Mở (Open Bill)
```
Tạo: bill_type = "open", status = "active"
Check-in: thành viên tap "Tôi có ăn" → bản ghi bill_checkins
Đóng: mỗi_người = floor(tổng / số_checkin)
Nợ: tạo cho tất cả thành viên đã check-in trừ người trả
```

### 4.4 Tính Nợ Ròng
```
Với user A và user B:
  a_nợ_b = sum(debts where debtor=A, creditor=B, status=pending)
  b_nợ_a = sum(debts where debtor=B, creditor=A, status=pending)
  ròng = b_nợ_a - a_nợ_b
  Nếu ròng > 0: "B nợ A [ròng]"
  Nếu ròng < 0: "A nợ B [abs(ròng)]"
```

---

## 5. Thông Báo (Telegram)

| Sự kiện | Người nhận | Tin nhắn |
|---------|------------|----------|
| Tạo bill | Tất cả người nợ | "Bạn nợ [Người trả] [Số tiền] cho [Tiêu đề]" |
| Báo đã chuyển | Chủ nợ | "[Người nợ] báo đã chuyển [Số tiền]" |
| Xác nhận nhận tiền | Người nợ | "[Chủ nợ] đã xác nhận nhận [Số tiền]" |
| Tạo bill mở | Thành viên nhóm | "[Người tạo] tạo bill mở: [Tiêu đề]" |
| Check-in | Người trả | "[Thành viên] đã check-in vào [Tiêu đề]" |
| Đóng bill | Tất cả người nợ | "Bill [Tiêu đề] đã đóng. Mỗi người: [Số tiền]" |

---

## 6. Design Tokens

| Token | Giá trị |
|-------|---------|
| Primary Blue | #3A5CCC |
| Success Green | #34C759 |
| Error Red | #FF3B30 |
| Warning Orange | #FF9500 |
| Text Primary | #1C1C1E |
| Text Secondary | #8E8E93 |
| Text Tertiary | #AEAEB2 |
| Border | #E5E5EA |
| Background | #F2F2F7 |
| Card Background | #FFFFFF |
| Font | Inter (system fallback) |
| Corner Radius (card) | 14px |
| Corner Radius (sheet) | 20px |
| Corner Radius (avatar) | 50% |
| Chiều cao tab bar | 56px + safe-area |

---

## 7. Checklist QC

Evaluator PHẢI verify TẤT CẢ mục dưới đây qua Playwright:

### P0 - Quan trọng
- [ ] Login với OTP (mã 6 số, KHÔNG phải link)
- [ ] Login với password
- [ ] Chỉ 2 tabs: Nhóm + Tài khoản
- [ ] Tạo group
- [ ] Tham gia group bằng invite code
- [ ] Tạo bill qua chat ("500k bún bò 6 người")
- [ ] Bill confirm sheet hiện đúng và tạo bill
- [ ] Nợ hiện trong group detail
- [ ] Trang transfer hiện QR

### P1 - Cần có
- [ ] Bill mở: check-in + đóng bill
- [ ] Xác nhận thanh toán 2 chiều
- [ ] Thông báo Telegram gửi đúng
- [ ] Liên kết ngân hàng trong Tài khoản
- [ ] Sửa tên hiển thị
- [ ] Đăng xuất

### P2 - Nên có
- [ ] Trạng thái trống (không có nhóm, không có nợ)
- [ ] Skeleton loading
- [ ] Xử lý lỗi (mạng, input không hợp lệ)
- [ ] Cập nhật real-time (bill từ người khác)
