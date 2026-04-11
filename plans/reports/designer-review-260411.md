# Design System Review - Pencil Consistency Audit

**Date:** 2026-04-11
**Reviewer:** code-reviewer
**Scope:** All .tsx files under src/

## Summary

Found **35+ design inconsistencies** across 15 files. All fixed. Primary issue: legacy orange-600/700 color scheme not replaced with Pencil design system blue (#3A5CCC).

## Issues Found & Fixed

### 1. Wrong Primary Color (CRITICAL - 15 files)
**Problem:** `bg-orange-600`, `hover:bg-orange-700`, `border-orange-600`, `text-orange-600/700` used as primary action color instead of `#3A5CCC`.
**Files fixed:**
- `src/app/(app)/bills/page.tsx` - button, spinner
- `src/app/(app)/bills/new/page.tsx` - 6 occurrences (buttons, selection states, text links)
- `src/app/(app)/bills/[id]/page.tsx` - spinner
- `src/app/(app)/debts/page.tsx` - spinner, confirm button
- `src/app/(app)/debts/[id]/confirm/page.tsx` - spinner, submit button
- `src/app/(app)/groups/page.tsx` - 3 buttons, spinner
- `src/app/(app)/summary/page.tsx` - spinner, pay button
- `src/app/(app)/activity/page.tsx` - spinner
- `src/components/screenshot-upload.tsx` - progress bar

### 2. Wrong Warning Color (HIGH - 1 file)
**Problem:** `open-bill-card.tsx` used generic orange Tailwind classes instead of design system warning color `#FF9500`.
**Fixed:** All orange-100/200/300/400/500/600/700 replaced with hex equivalents (#FF9500, #FFB74D, #FFE0B2, #E65100).

### 3. MobileHeader Mismatch (HIGH - 1 file)
**Problem:** Used `border-b`, `bg-background/95` with backdrop-blur, `h-14` instead of design system spec.
**Fixed to:** `bg-white`, `shadow-sm`, `h-[52px]`, `text-[17px] font-semibold text-[#1C1C1E]`

### 4. Body Background Color (MEDIUM - 1 file)
**Problem:** `src/app/layout.tsx` used `bg-[#E5E5EA]` instead of `#F2F2F7`.
**Fixed.**

### 5. Font Reference (LOW - 1 file)
**Problem:** `src/app/globals.css` referenced `--font-geist-mono` (Geist font family).
**Fixed to:** `--font-inter`

### 6. Avatar Color in bill-card-bubble (LOW - 1 file)
**Problem:** `bg-orange-400` in avatar color array.
**Fixed to:** `bg-[#FF9500]`

## Pre-existing Build Issues (NOT introduced by this review)
- `src/app/(app)/groups/[id]/settings/page.tsx:84` - setState in useEffect
- `src/lib/__tests__/ai-intent-types.test.ts:139` - `@typescript-eslint/no-explicit-any`
- Test file warnings (unused vars)

## Files Already Compliant
- `src/app/(app)/page.tsx` - Uses correct hex colors throughout
- `src/app/(app)/account/page.tsx` - Correct design system colors
- `src/app/(app)/groups/[id]/page.tsx` - Correct design system colors
- `src/app/login/page.tsx` - Correct design system colors
- `src/components/bottom-nav.tsx` - Correct colors, SVG icons
- `src/components/chat/bill-confirm-sheet.tsx` - Uses #3A5CCC
- `src/components/chat/ai-response-card.tsx` - Uses #3A5CCC
- `src/components/chat/ai-followup-card.tsx` - Uses #3A5CCC
- `src/components/chat/chat-input-bar.tsx` - Neutral styling
- `src/components/chat/add-people-sheet.tsx` - Uses #3A5CCC

## Design System Color Map Applied
| Element | Old | New |
|---------|-----|-----|
| Primary buttons | orange-600/700 | #3A5CCC/#2d4aaa |
| Spinners | border-orange-600 | border-[#3A5CCC] |
| Selection states | orange-600/orange-50 | #3A5CCC/#EEF2FF |
| Open bill theme | orange-100..700 | #FF9500 variants |
| Progress bar | bg-orange-600 | bg-[#3A5CCC] |
| Body background | #E5E5EA | #F2F2F7 |
| Nav bar | border-b, backdrop-blur | white, shadow-sm, h-[52px] |
