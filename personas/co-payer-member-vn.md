---
name: co-payer-member-vn
display_name: An — Thành viên kiêm payer vãng lai
type: primary
created_for_prd: nopay-freelunch
last_updated: 2026-04-18
used_by_prds:
  - nopay-freelunch
used_by_uat:
  - uat/nopay-freelunch/co-payer-member-vn.md
---

# An — Thành viên kiêm payer vãng lai

> Persona chính phụ. Không phải organizer nhưng hay ứng tiền nhỏ lẻ cho nhóm (cafe, ship đồ ăn, tip, xe). Vừa là debtor vừa là creditor trong cùng 1 nhóm → "nợ ròng" phức tạp.

## Profile

| Field | Value |
| --- | --- |
| **Role:** | Nhân viên 26-34 tuổi, thành viên "active" — hay chủ động trả cafe/ship/taxi cho cả nhóm |
| **Demographics:** | TP.HCM/HN, thu nhập 15-35tr, social — đi chơi 2-3 lần/tuần |
| **Tech savviness:** | Intermediate — dùng nhiều QR payment, app ngân hàng, chat app |
| **Tools currently used:** | Momo, ZaloPay, VietQR, app ngân hàng (TCB/MB), Zalo, Telegram |

## Goals

- Ứng tiền nhỏ (50k-300k) nhanh mà không quên track
- "Nợ ròng" tính gộp cả 2 chiều — mình nợ Minh 400k, Minh nợ mình 150k → final 250k thôi
- 1-tap settle nhiều bill cùng lúc với cùng 1 người
- Không phải tự tính "ai nợ ai ròng" — app tự simplify

## Frustrations / Pain Points

- **Ứng 30-50k linh tinh** — ship Grab, cafe, tip — ghi sổ thì ngại, không ghi thì quên
- **Bill 2 chiều confusing** — Minh ứng ăn trưa cho An, An ứng cafe cho Minh → không biết cuối cùng ai nợ ai bao nhiêu
- **Chuyển khoản nhiều lần vụn vặt** — 80k cafe, 120k taxi, 250k ăn trưa → 3 transactions, thay vì gộp 1
- **Không có "mini bill" mode** — tạo bill 60k cafe đi qua full flow quá rườm rà
- **Trùng group** — cùng 1 nhóm bạn, vừa ứng vừa nợ, app hiện riêng 2 list thay vì net

## Day-in-the-life Scenario

Sáng thứ 3, An order Grab cafe 4 ly cho team, total 180k. An mở NoPay, gõ "180k cafe 4 đứa" trong group chat → AI parse → confirm → Telegram ping 3 đứa kia nợ An 45k. Trưa cùng ngày, Minh trả 800k ăn trưa cho 5 đứa (có An) → An nợ Minh 160k. An mở Debts tab → thấy "Nợ ròng với Minh: 115k" (160k - 45k). An tap "Trả nợ ròng" → QR 115k cho Minh → 1 transaction clean. An cảm thấy: "app tính hộ mình được việc này, đỡ phải mở máy tính."

## UAT Hooks

### Trigger conditions

- Tạo bill < 200k nhỏ lẻ (cafe, ship, taxi) — không muốn flow dài
- Nợ ròng 2 chiều với cùng 1 người — muốn gộp 1 transaction
- Ngày có nhiều bill nhỏ (3+ trong cùng buổi) — muốn quick-add từ chat
- Settle all với 1 người — sau event, chốt sạch

### Success indicators (delight signals)

- Tạo bill 180k từ "180k cafe 4 đứa" < 15 giây (faster than Minh's case vì đã familiar)
- "Nợ ròng" hiện đúng + cho phép 1-tap settle
- Debts view toggleable: "Chi tiết" vs "Nợ ròng" — An chọn "Nợ ròng" mặc định
- History filterable theo counterparty → An audit dễ
- Quick-add shortcut (swipe chat / voice) cho small bills

### Failure modes (regression watch)

- Bill 2 chiều không tự net — hiện 2 rows "bạn nợ Minh 160k" + "Minh nợ bạn 45k" → An phải tự tính
- Trả 115k rồi nhưng 2 bills cũ vẫn "chưa thanh toán" → confuse
- Tạo bill nhỏ phải qua 4 màn hình (chọn members, chọn split mode, v.v.) — overkill
- Simplify debts graph sai → An chuyển quá hoặc thiếu
- Không thấy mình vừa là creditor vừa debtor — UX dẫn tới nhầm role

## Cross-references

- **PRDs using this persona:** see frontmatter
- **UAT scripts:** `uat/nopay-freelunch/co-payer-member-vn.md`
- **Design files:** `GroupFund.pen`
