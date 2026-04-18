---
name: bill-skeptic-vn
display_name: Tú — Thành viên soi số liệu kỹ
type: secondary
created_for_prd: nopay-freelunch
last_updated: 2026-04-18
used_by_prds:
  - nopay-freelunch
used_by_uat:
  - uat/nopay-freelunch/bill-skeptic-vn.md
---

# Tú — Thành viên soi số liệu kỹ

> Persona phụ. Người luôn tính lại số tiền chia, nghi ngờ AI parse sai, hay challenge payer về breakdown. Đại diện cho "trust verifier" của nhóm.

## Profile

| Field | Value |
| --- | --- |
| **Role:** | Kế toán / engineer 28-40 tuổi, quen làm việc với số, khắt khe về accuracy |
| **Demographics:** | HN/TP.HCM, thu nhập 20-50tr, thành viên thường trực của 2-3 nhóm chia bill |
| **Tech savviness:** | Advanced — comfortable với Excel formulas, dùng nhiều fintech app |
| **Tools currently used:** | App ngân hàng, Google Sheets, Notion để track spending cá nhân |

## Goals

- Verify được số tiền chia chính xác trước khi chuyển — không trust blindly
- Xem breakdown chi tiết của bill (ai ăn gì, ai ứng bao nhiêu)
- Reject/edit bill nếu thấy chia sai
- Audit lịch sử bills — ai ứng cho mình bao nhiêu lần rồi

## Frustrations / Pain Points

- **AI parse số thập phân sai** — "1.2tr" có khi hiểu thành 1.200đ thay vì 1.200.000đ
- **Chia đều không fair** — người ăn chay + người gọi steak cùng đóng như nhau
- **Không có breakdown per-item** — chỉ thấy tổng, không biết phần mình đáng nợ bao nhiêu
- **Không rollback được** — lỡ check-in "có ăn" vào bill mở, không hủy được
- **Thiếu transparency** — payer (Minh) claim "1tr2" nhưng hóa đơn thực 980k — không verify được

## Day-in-the-life Scenario

Tối Chủ nhật, Tú nhận Telegram "Bạn nợ An 340.000đ — Lẩu Nhật Hà Nội". Tú mở NoPay, tap bill → thấy tổng 2.040.000đ, chia đều 6 người = 340k/người. Tú nhíu mày: "Hôm đó mình không uống bia, An + 2 đứa kia uống 4 chai Sapporo". Tú tap "⋯" → "Edit chia" → chọn "Chia theo người" → giảm phần mình xuống 280k, đẩy 60k sang 3 người uống bia. Tú tap Save → app recompute, hỏi 3 người kia approve. Tú chỉ chuyển 280k qua QR — notify Minh/An thấy breakdown mới. Tuần sau Tú vào app, vào Account → "Lịch sử" → thấy 3 tháng qua đã chuyển An tổng 1.8tr, ứng bạn Minh 650k → cảm giác control.

## UAT Hooks

### Trigger conditions

- Bill vừa được tạo với AI parse — Tú xem lại số liệu có đúng không
- Chia bill không đồng đều — Tú cần edit tỷ lệ phần mình
- Dispute bill đã tạo — Tú không đồng ý phần chia, reject hoặc edit
- Audit lịch sử 30 ngày — Tú muốn verify tổng đã chuyển cho ai bao nhiêu

### Success indicators (delight signals)

- Tú verify được AI parse output trong < 10 giây (số + breakdown rõ ràng)
- Edit split ratio thành công, không phải tính tay ở Excel riêng
- Lịch sử transactions searchable + filterable (theo person, theo date, theo group)
- "Nợ ròng" khớp với Excel riêng của Tú 100%

### Failure modes (regression watch)

- AI parse số sai, không flag "low confidence" → Tú phải tự phát hiện
- "Chia theo người" UI rườm rà, cần > 10 tap để edit 1 người
- Không có audit log — không biết ai đã edit bill khi nào
- Reject bill nhưng Telegram vẫn ping "Bạn nợ" → confusing
- Per-person breakdown ẩn sau 3 layers menu → Tú bỏ cuộc

## Cross-references

- **PRDs using this persona:** see frontmatter
- **UAT scripts:** `uat/nopay-freelunch/bill-skeptic-vn.md`
- **Design files:** `GroupFund.pen`
