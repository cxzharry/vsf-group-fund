---
name: group-member-vn
display_name: Linh — Thành viên nhóm mắc nợ
type: secondary
created_for_prd: nopay-freelunch
last_updated: 2026-04-17
used_by_prds:
  - nopay-freelunch
used_by_uat: []
---

# Linh — Thành viên nhóm mắc nợ

> Persona phụ. Người được rủ đi ăn/du lịch nhưng thường không ứng tiền; cần thanh toán lại cho bạn nhanh + gọn.

## Profile

| Field | Value |
| --- | --- |
| **Role:** | Sinh viên / nhân viên mới đi làm, 22-28 tuổi, tham gia nhóm bạn/team nhưng ít khi là người trả |
| **Demographics:** | Thu nhập 8-15 triệu/tháng, sống với roommate hoặc gia đình, team 5-10 người |
| **Tech savviness:** | Intermediate — dùng Momo + app ngân hàng, chụp QR tốt, Zalo/Telegram daily |
| **Tools currently used:** | App ngân hàng (TCB/MB/VCB mobile), Momo QR scan, Zalo chat, Telegram |

## Goals

- Biết chính xác mình đang nợ ai bao nhiêu (không cần hỏi)
- Thanh toán nhanh — scan QR 1 lần là xong
- Không phải nhớ/ghi chú nợ thủ công
- Cảm thấy "fair" — không bị overcharge do chia sai

## Frustrations / Pain Points

- **Bị tag vào Zalo chat "Linh nợ 250k"** — ngại, không thanh toán ngay
- **Quên nợ** — 2-3 tuần sau mới nhớ, bạn ứng tiền phải nhắc
- **Chuyển khoản sai tên/bank** — không chắc số TK đúng, gọi điện hỏi
- **Chia bill không đều bị tính nhầm** — sinh viên ăn ít hơn nhưng vẫn bị chia đều
- **Không biết bill gồm gì** — chỉ nhận số, không rõ mình nợ vì món gì

## Day-in-the-life Scenario

Chủ nhật tối, Linh nhận Telegram: "Bạn nợ Minh 300.000đ — ăn trưa team 15/04". Linh mở NoPay app, tap vào bill → thấy breakdown (tổng 2.4tr, 8 người, chia đều), tap "Trả nợ" → QR hiện ra với bank + số TK + tên Minh. Linh mở app MB Bank, scan QR → tự động điền hết, Linh xác nhận chuyển. Về NoPay, tap "Đã chuyển tiền". 5 phút sau Minh confirm → Linh nhận Telegram "Minh đã xác nhận nhận 300.000đ". Done.

## UAT Hooks

### Trigger conditions

- Nhận Telegram notify "Bạn nợ X Y đồng" → flow Linh tap vào
- Tự vào app xem tổng nợ sau cuối tuần chơi chung
- Check-in Bill mở khi được bạn share link "Ai có ăn thì check-in"
- Thanh toán nhiều nợ cùng lúc (sau chuyến du lịch) — mong muốn "Nợ ròng" gộp 1 payment

### Success indicators (delight signals)

- Thanh toán 1 bill < 60 giây từ lúc nhận notify (mở app → QR → chuyển → confirm)
- Linh tin QR đúng, không verify lại với Minh
- Linh chủ động check app để xem nợ (không cần Minh nhắc)
- "Đã xác nhận" feedback loop tạo cảm giác "đã đóng" — giảm anxiety
- Linh recommend app cho bạn khác sau 2-3 lần thanh toán thành công

### Failure modes (regression watch)

- QR sinh ra không có số tiền pre-filled → Linh gõ lại số, dễ sai
- "Trả nợ" button không gộp khi có nhiều debt với cùng 1 người → Linh chuyển 3 lần thay vì 1
- Bill details thiếu breakdown "ai, bao nhiêu" → Linh không verify được
- "Đã chuyển tiền" không update UI của Minh → Linh bị nhắc nợ lại
- Bill mở check-in 2 lần trùng → Linh bị chia gấp đôi

## Cross-references

- **PRDs using this persona:** see frontmatter
- **UAT scripts:** TBD
- **Design files:** `GroupFund.pen`
