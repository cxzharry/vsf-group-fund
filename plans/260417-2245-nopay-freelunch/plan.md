# Plan: NoPay FreeLunch — strict-match refactor via /team-vibe

**Created:** 2026-04-17 22:45 · **Slug:** `nopay-freelunch` · **Mode:** strict-match (design-first → code-pixel-match)
**Workflow:** adapted `/team-vibe` for brownfield (app already deployed at https://nopay-freelunch.vercel.app)

## Context

App đã chạy production. Scope task: **refactor per-US** theo PRD + design mới.

**Per-US pipeline (PO request):** xong design 1 US → code 1 US → deploy 1 US → next US.

## Inputs (source of truth)

- **PRD:** `docs/product-requirements.md` + `docs/epic-01-*.md` → `docs/epic-05-*.md` (28 stories, 151 ACs)
- **Personas:** `personas/group-organizer-vn.md` + `personas/group-member-vn.md`
- **Design:** `GroupFund.pen` (existing, 72 frames — needs audit + migration)
- **Design spec:** `designs/nopay-freelunch-design.md` (generating in this run)
- **Design tokens:** `design-system/tokens.json` ✅ generated
- **Stack:** `plans/260417-2245-nopay-freelunch/be-stack.md`

## Outputs

| File | Status | Owner |
|---|---|---|
| `plans/260417-2245-nopay-freelunch/plan.md` | ✅ writing | lead |
| `plans/260417-2245-nopay-freelunch/be-stack.md` | ⏳ | lead |
| `plans/260417-2245-nopay-freelunch/dep-graph.md` | ⏳ | planner |
| `plans/260417-2245-nopay-freelunch/api-contract.md` | ⏳ | lead (reverse-engineer from existing src/ + PRD) |
| `plans/260417-2245-nopay-freelunch/credential-status.md` | ⏳ | lead |
| `plans/reports/pen-audit-260417-2245-groupfund.md` | 🟡 in progress | subagent |
| `designs/nopay-freelunch-design.md` | ⏳ | lead |
| `design-system/tokens.json` | ✅ | lead |

## Per-US pipeline (execution loop)

For each US in priority order:

1. **Design verify** — kiểm tra frame trong `.pen` khớp spec trong `docs/epic-XX.md`. Update qua Pencil MCP nếu cần.
2. **Code audit** — grep `src/` tìm component handle US đó → compare với design + AC list
3. **Gap fix** — update component để match design tokens + AC
4. **Test** — manual/playwright smoke test (dev server)
5. **Commit** — conventional commit: `feat(US-EX-N): <short>`
6. **Deploy** — git push → Vercel auto-deploy → verify live
7. **Next US**

## Priority order (proposed — dep-graph)

Dependency chain: Auth (E1) → Account (E5) → Groups (E2) → Transactions (E3) → Debts (E4)

**Sprint 1 (P0, blockers):** E1 Auth (5 US) — blocks everything
**Sprint 2 (P0, core):** E5 Account (5 US) — needed for bank + Telegram link → enables E3-6 transfer
**Sprint 3 (P0, core):** E2 Groups (5 US) — prerequisite for transactions
**Sprint 4 (P0, core):** E3 Transactions (9 US) — main value prop
**Sprint 5 (P0, core):** E4 Debts (4 US) — derived from E3 data

Total 28 US. Per-US estimated: 30-90 phút (audit + fix + test + deploy).

## Guardrails (per CLAUDE.md)

- KHÔNG thêm tab vào bottom nav (2 tabs only: Nhóm + Tài khoản)
- KHÔNG đổi stack (Supabase)
- KHÔNG generate features ngoài PRD scope
- KHÔNG skip AC — mỗi fix phải kick test đúng AC ID
- Karpathy: surgical changes, verify per-US before moving on

## Skills activated

- `karpathy-guidelines` (always)
- `meta-harness` (feature work)
- `web-frameworks` (Next.js)
- `shadcn-ui-design` (UI components)
- Pencil MCP (design file)

## Next step (this session)

1. Wait for pen audit subagent → get frame inventory
2. Write `designs/nopay-freelunch-design.md` (design spec per template)
3. Write `be-stack.md` + `credential-status.md`
4. AskUserQuestion PO: which US to start with (recommended: US-E1-1 OTP login as sprint 1 starter)
5. Begin per-US pipeline

## Unresolved questions

1. `.pen` frame migration strategy — audit output will inform: rename in-place vs create fresh alongside
2. Credential status — app is live so creds exist; just verify `.env.local` has keys (without exposing)
3. Playwright coverage — existing tests/ có bao nhiêu %, có cần expand không?
4. Deploy cadence — auto-deploy per push, hay gate qua PR review?
