# UI Review Cycle 4

## Remaining Tokens
| File | Count | Types |
|---|---|---|
| src/app/(app)/debts/page.tsx | 5 | text-gray-900, text-gray-500, text-gray-700, border-gray-200 (confirm modal) |
| src/components/chat/ai-response-card.tsx | 6 | bg-gray-100/200, text-gray-500/700/900, border-gray-200, bg-gray-50 |
| src/components/chat/date-divider.tsx | 1 | bg-gray-200/70, text-gray-500 |
| src/components/chat/bill-card-bubble.tsx | 1 | bg-yellow-400 (avatar fallback palette) |

Total: 13 (down from 16; matches grep count)

Notes: bill-card-bubble yellow is part of an avatar color array — keep as-is or move to token array `avatarPalette`. Other 12 are in chat/debts confirm — replace with `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`.

## Guidance for Expense Categories Feature

**Category chip style (on bill card):**
- Shape: `rounded-full` pill, `px-2 py-0.5`, `text-[11px] font-medium`
- Layout: emoji + label inline, `gap-1`, single line, `truncate max-w-[120px]`
- Background: `bg-muted text-muted-foreground` (neutral, doesn't compete with amount)
- Border: none — keep flat to match existing bill card minimalism
- Position on bill card: top-right of title row, or inline after title with `ml-2`

**Colors per category:**
- Use NEUTRAL chip background (`bg-muted`) for ALL categories — emoji carries the semantic color
- Avoid per-category background colors — would clutter list view and fight with amount color (red/green debt indicators)
- If category filter pills needed in picker: use `bg-primary/10 text-primary` for selected, `bg-muted` for unselected

**Emoji rendering:**
- Font-size: match label (`text-[11px]` on chip, `text-base` in picker grid)
- Use system emoji (no custom font) — render via `<span aria-hidden>` + sr-only label for a11y
- Picker grid: 4 cols mobile / 6 cols desktop, `aspect-square`, emoji `text-2xl` centered, label below `text-xs`
- Fallback when no category: hide chip entirely (don't show "Khác" placeholder)

**Picker component:**
- Bottom sheet on mobile, popover on desktop (reuse existing sheet pattern)
- Search input at top if >12 categories
- Selected state: `ring-2 ring-primary` on grid cell

## Unresolved
- Should categories be group-scoped or global? Affects picker data fetching.
- Default category list — predefined seed or user-created only?
