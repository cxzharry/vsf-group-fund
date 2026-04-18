# US-E3-5 Bill mở — Final design (Option A only)

Date: 2026-04-17 23:35 (updated 2026-04-18)
File: `/Users/haido/claude-code-macmini/vsf-group-fund/GroupFund.pen`

## Decision: Option A chosen

Option B (avatar grid 4×2) deleted. Frames removed: `SxhfM`, `wzuhm`, `zbns7`.

## Frame IDs (Option A — 3 states)

| State | Frame ID | Name |
|-------|----------|------|
| A — 0 check-in | `i0Jex` | `US-E3-5 Option A — State A (0 check-in)` |
| B — 3 check-in | `TRcvd` | `US-E3-5 Option A — State B (3 check-in)` |
| C — 8/8 full | `nmK7P` | `US-E3-5 Option A — State C (đủ 8 người)` |

## PO feedback applied (2026-04-18)

1. **Amount per person cố định** — 8 người × 150k = 1.200k. State B fix: `~400.000đ/người` → `~150.000đ/người`. Per-person là function của tổng bill ÷ số người tham gia đã cố định khi tạo, không đổi theo check-in count.
2. **Bỏ "Đóng bill" button** — bill sau tạo dùng standard edit/delete (qua `⋯` menu), không có explicit close action.
   - State B CTA: `Thêm khách | Đóng bill` → single primary `Tôi có ăn` (match State A).
   - State C CTA: `Đóng bill ngay` → removed entirely. Status text thành `Đủ 8 người — mỗi người ~150.000đ`.
3. **⋯ menu thêm vào State A** — consistency: bill đã tạo thì luôn có edit/delete menu.
4. **clip:true** trên cả 3 card → accent strip không overflow xuống dưới.

## CTA per state (final)

| State | CTA | Rationale |
|-------|-----|-----------|
| A (0/8) | `Tôi có ăn` (primary blue) | Viewer chưa check-in |
| B (3/8) | `Tôi có ăn` (primary blue) | Viewer chưa check-in |
| C (8/8) | (none — status text only) | Đủ người, không cần action |

Edit/delete cho mọi state qua `⋯` ở header.

## Design tokens (unchanged)

- Warning tint bg `#FFF8EC`, warning fill `#FF9500`, progress track `#FFE9C2`
- Success `#34C759`, Primary `#3A5CCC`
- Text primary `#1C1C1E`, secondary `#8E8E93`, tertiary `#AEAEB2`
- Shadow outer 0/4/12 `#00000014`
- Accent strip left 3px (orange A/B, green C)
- Inter 400/600/700

## Next steps

- Implement Bill mở card trong code để match design này (bỏ "Đóng bill" button nếu có).
- Per-person tính = `total_amount ÷ fixed_participant_count`.
- Check-in toggle state + avatar stack logic từ DB.
