# UI Review Cycle 7

## Gray tokens
- `gray-\d` in src/: **0 occurrences**. 100% compliance maintained.

## Feature note
- Graph-based multi-hop debt simplification is pure algorithm — no UI guidance needed.

## Lingering P2/P3 (raw Tailwind color tokens from cycle 4)
Remaining non-tokenized colors (opportunistic cleanup):
- `src/app/(app)/summary/page.tsx:130,136` — `border-red-100 bg-red-50/50`, `border-green-100 bg-green-50/50` (should use semantic danger/success tokens).
- `src/components/screenshot-upload.tsx:141` — `bg-green-100 text-green-700` badge (tokenize to success variant).
- `src/app/(app)/debts/page.tsx:629` — `border-blue-200 bg-blue-50 text-blue-700` (tokenize to info/primary variant).
- `src/components/chat/bill-card-bubble.tsx:23-28` — avatar palette array (`bg-blue-400`…`bg-teal-400`). Acceptable as decorative palette, but consider moving to a named `avatarPalette` constant for DRY.

## Priority
All P3 — cosmetic/consistency. No blockers.

## Unresolved
- None.
