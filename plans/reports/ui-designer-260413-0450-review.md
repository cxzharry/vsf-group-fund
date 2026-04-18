# UI Review Cycle 5 — Simplify Debts Guidance

## Regression Checks
- `gray-\d` in src/: **0** (clean, no regression)
- Raw Tailwind colors: **9 matches** across 4 files — pre-existing, not cycle-4 regressions:
  - `screenshot-upload.tsx:141` — green badge (OCR success)
  - `chat/bill-card-bubble.tsx:22-26` — avatar palette (intentional variety)
  - `summary/page.tsx:130,136` — red/green summary cards (semantic owe/owed)
  - `debts/page.tsx:430` — blue info chip
- Recommend migrate later to tokens (`success`, `destructive`, `info`) but NOT blocking cycle 5.

## Simplify Debts UI Guidance

**Label:** Use **"Nợ ròng"** (net debt) — most accurate, matches mental model. Avoid "Đã rút gọn" (sounds like truncation) and "Tối ưu" (vague).

**Placement:**
1. **Page header** of `/debts` — small toggle: `[Chi tiết] [Nợ ròng]` segmented control, right-aligned next to title. Default = Nợ ròng (fewer rows = less scary).
2. **Per-row indicator** — when in Nợ ròng mode, append tiny chip next to amount showing original count: `gộp 3` (merged from 3 txns). Tap → expand to show originals.
3. **Empty/zero state** — when algorithm reduces to 0 debts: show celebratory empty state "Đã thanh toán xong" with checkmark.

**Chip style (reuse existing Badge):**
```
<Badge variant="secondary" className="text-xs">
  Nợ ròng · gộp {n}
</Badge>
```
- Use `bg-muted text-muted-foreground` (token-based, no raw colors)
- Height 20px, px-2, rounded-full
- Icon optional: `Sparkles` (lucide) size 12 to hint "smart"

**Info tooltip** next to toggle: "Gộp các khoản nợ chéo để giảm số lần chuyển tiền."

## Unresolved Qs
- Should toggle state persist (localStorage) or reset per session?
- Original-debt drill-down: modal or inline expand?
