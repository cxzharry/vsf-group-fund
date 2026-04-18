---
name: casual-guest-vn
display_name: Duy — Khách mới được mời vào nhóm
type: secondary
created_for_prd: nopay-freelunch
last_updated: 2026-04-18
used_by_prds:
  - nopay-freelunch
used_by_uat:
  - uat/nopay-freelunch/casual-guest-vn.md
---

# Duy — Khách mới được mời vào nhóm

> Persona phụ. Người lần đầu dùng NoPay, nhận invite link qua Zalo từ bạn tổ chức. Chưa có account, chưa biết app hoạt động thế nào.

## Profile

| Field | Value |
| --- | --- |
| **Role:** | Bạn bè / đồng nghiệp thỉnh thoảng đi ăn cùng nhóm, 23-32 tuổi |
| **Demographics:** | TP.HCM/HN, không thân với organizer, tham gia 1-2 lần/tháng |
| **Tech savviness:** | Intermediate — dùng nhiều app chat + banking nhưng chưa từng dùng bill-splitting |
| **Tools currently used:** | Zalo, Messenger, app ngân hàng, Grab, Shopee |

## Goals

- Join group nhanh — không muốn tạo account rườm rà
- Hiểu app làm gì trong < 30 giây đầu tiên
- Không bị spam notify sau khi trả nợ xong
- Có thể leave group sau chuyến đi mà không mất data nợ

## Frustrations / Pain Points

- **Invite link mở ra login wall** — không login được vì chưa có account
- **Onboarding dài** — phải nhập SĐT, OTP, avatar, tên — mỗi bước friction
- **Không hiểu "bill mở"** — check-in / không check-in — ý nghĩa gì, hậu quả gì
- **Sợ lừa đảo** — QR lạ, không biết có phải người thật hay scam
- **Notify Telegram** — phải connect Telegram riêng, ngại

## Day-in-the-life Scenario

Tối thứ 6, Duy được Minh rủ đi ăn lẩu với team Minh (Duy không làm cùng công ty). Minh gửi Zalo: "Tối nay 7h, Lẩu Phan Xích Long, tao đã đặt bàn, link group: [NoPay link]". Duy tap link → app mở trình duyệt → thấy "Bạn được Minh mời vào nhóm 'Lẩu T6'". Duy tap "Vào nhóm" → app hỏi Google/Apple sign-in → Duy chọn Google → vào thẳng group chat, thấy bill "Lẩu tối nay · 1.200.000đ · chia 8 người · 150k/người", có nút "Tôi có ăn". Duy tap → check-in thành công. Ăn xong, Duy nhận Telegram "Nợ Minh 150k", tap QR, chuyển tiền → confirm. Tuần sau Duy không mở app nữa — nhưng app không spam.

## UAT Hooks

### Trigger conditions

- Nhận invite link lần đầu qua Zalo/Telegram — chưa có NoPay account
- Được rủ ăn bất chợt bởi người không thân — chưa rõ group rules
- Không quen với UI bill mở (check-in) — lần đầu thấy khái niệm này
- Leave group sau 1-2 tuần không dùng — cần clean UX exit

### Success indicators (delight signals)

- Join group + check-in bill trong < 2 phút từ lúc tap link
- Hiểu "Tôi có ăn" button mà không cần explain (intuitive)
- Thanh toán xong, app silent — không spam weekly digest
- Leave group 1 tap + không hỏi "are you sure" quá nhiều lần

### Failure modes (regression watch)

- Invite link expired → Duy không join được, phải nhắn Minh resend
- Phải nhập SĐT + OTP trước khi xem group → friction quá cao, bounce
- Bill mở UI không làm rõ "check-in nghĩa là mình có trong danh sách chia" → Duy check nhầm
- QR hiện sai bank / sai số tiền → Duy sợ lừa đảo, gọi Minh verify
- Telegram forced sign-up — Duy bỏ luôn app sau bữa

## Cross-references

- **PRDs using this persona:** see frontmatter
- **UAT scripts:** `uat/nopay-freelunch/casual-guest-vn.md`
- **Design files:** `GroupFund.pen`
