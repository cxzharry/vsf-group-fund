# US ID Migration Report

**Date:** 2026-04-17  
**Task:** Rename `US-X.Y` → `US-EX-Y` across src, tests, plans

---

## 1. Files Touched (16 files)

**src/ (5 files)**
- `src/app/(app)/groups/[id]/page.tsx`
- `src/app/(app)/page.tsx`
- `src/components/chat/chat-input-bar.tsx`
- `src/components/chat/bill-confirm-sheet.tsx`
- `src/components/chat/split-sheet.tsx`

**tests/ (0 files)** — no test files contained legacy IDs

**plans/reports/ (11 files)**
- `gap-analysis-260412.md`
- `progress-260412-1903-us21-completion.md`
- `tester-260412-1848-us21-qc-report.md`
- `tester-260412-2336-qc-comprehensive.md`
- `prd-260413-0023-review.md`
- `prd-260413-0123-review.md`
- `prd-260413-0350-review.md`
- `prd-260413-0450-review.md`
- `orchestrator-260413-0023-summary.md`
- `orchestrator-260413-0123-summary.md`
- `orchestrator-260413-0250-summary.md`

---

## 2. Total Occurrences Renamed

- Before: 64 (8 in src, 56 in plans/reports, 0 in tests)
- After: 64 new-format IDs confirmed, 0 legacy IDs remain

---

## 3. tsc / lint Status

- **tsc:** Cannot run — `node_modules/typescript/lib/tsc.js` missing (pre-existing broken install, Node v25 incompatibility). Unrelated to rename.
- **lint:** Cannot run — eslint binary broken same reason.
- **Impact:** None — all changes are comments/JSDoc/string literals only. Zero runtime or type logic changed.

---

## 4. Skipped + Why

- `docs/epic-*.md` — task spec: already rewritten by docs agents
- `docs/product-requirements.md` — task spec: already updated
- `GroupFund.pen` — encrypted, not text-searchable
- Root `.mjs` scripts — task spec excluded
- `node_modules/`, `.next/`, `coverage/` — excluded by task spec

---

## 5. Unresolved Questions

- tsc/lint binaries broken in this repo (Node v25 + old lockfile mismatch). Needs `npm install` or Node downgrade to verify — outside scope of this rename task.
