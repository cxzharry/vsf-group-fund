# Epic 3 Strip UX/UI Report

## Task Complete
Stripped all UX/UI sections from `docs/epic-03-transactions.md` (9 user stories, E3-1 through E3-9).

## Changes Made

### Sections Removed
1. **All UX/UI blocks** - Layout, components, colors, typography, spacing, frames (Pencil references)
2. **Visual-only ACs** - Pinning, rounded corners, font sizes, colors, pixel dimensions
3. **AI Follow-up Card visual spec** (US-E3-3) - design details removed, logic flow preserved
4. **Bill mở card styling** (US-E3-5) - avatar colors, background colors, badges removed
5. **Transfer page layout** (US-E3-6) - navigation, QR card layout, button styling removed
6. **Menu & dialog visual specs** (US-E3-7) - popover styling, dialog overlay specs removed
7. **Edit sheet UI references** (US-E3-8) - design mode differences removed
8. **Category badge styling** (US-E3-9) - pill styling, opacity specs removed

### Sections Retained (Logic Preserved)
- **US-E3-1**: Fields table (Required/Default/Ghi chú columns) - LOGIC
- **US-E3-1**: Button enable conditions - LOGIC  
- **US-E3-2**: Case matrix (A-G scenarios) - LOGIC
- **US-E3-2**: Validation table - LOGIC
- **US-E3-2**: Split formula & modes - LOGIC
- **US-E3-9**: 6 categories + keywords table - LOGIC

### AC Filtering (70 → 48)
Removed pure visual ACs; rewrote mixed functional-visual ones:
- REMOVED: "CTA pinned đáy", "rounded 14px", "cao 48px", visual state variations
- REWROTE: "Toast 'Đã tạo bill' màu xanh" → "Toast 'Đã tạo bill' hiện sau khi tạo thành công"
- KEPT: "Nút ➕ mở Create Bill Sheet blank", "Điền đủ required → nút 'Tạo' enabled", flow redirects, validation

## Metrics
- **File size**: 631 lines → 489 lines (22% reduction)
- **All 9 user stories**: Preserved with complete functional specs
- **Logic tables**: 3/3 retained (Fields, Case Matrix, 6 Categories)
- **ACs**: 70 → 48 functional (design specs segregated)

## Status
✓ File overwritten, ready for implementation teams
✓ Design concerns now isolated to `design-system/tokens.json` + pattern library
✓ PRD contains ONLY: User Story, Rules/Function, Edge cases, Functional ACs

## Next Steps
- Design team: implement visual specs from design-system per AC-E3-4.2 (category badges) and similar badge/styling references
- Implementation team: follow functional ACs without design assumptions
