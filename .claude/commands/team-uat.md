---
name: team-uat
description: Generate + run User Acceptance Test scripts từ PRD. Tự resolve persona từ PRD, đề xuất bổ sung nếu thiếu, PO chỉ confirm/sửa/xoá.
---

# /team-uat $ARGUMENTS

Input: PRD path (vd `prd/booking-app.md`) hoặc topic slug. Optional flags: `--target=<url|path>` (deployed URL hoặc prototype dir), `--mode=auto|manual` (default `auto` — generate + run; `manual` chỉ generate scripts).

> **Stage:** chạy SAU khi product đã pilot/release (deployed app, prototype runnable, hoặc design ready for usability test). UAT scripts là deliverable đứng độc lập — có thể handoff cho QA team.

## Meta-Harness 5-Phase

### Phase 1 — PLAN

0. **Input check:** Nếu `$ARGUMENTS` trống → AskUserQuestion: "Nhập PRD path hoặc topic slug" với Options: `Nhập input` / `Browse prd/` / `Cancel`. Browse → list `prd/*.md`.
1. **Activate** `karpathy-guidelines` skill (natural mention).
2. **Resolve PRD:** Parse `$ARGUMENTS` →
   - Nếu kết thúc `.md` và file exists → use as PRD path.
   - Else treat as slug → check `prd/<slug>.md`. Missing → AskUserQuestion: `Run /team-prd first (Recommended)` / `Skip PRD, ad-hoc UAT` / `Cancel`.
3. **Slug** = basename PRD without `.md`.
4. **Check existing UAT:** `uat/<slug>/` exists → AskUserQuestion: `Refine` / `Overwrite` / `Add new scenarios` / `Cancel (Recommended)`.

### Phase 2 — IMPLEMENT

**Step A: Persona Resolution (CORE — proactive proposal)**

5. **Parse PRD section 3.1** → extract persona file links (`personas/<slug>.md`). For each link:
   - Read frontmatter (`name`, `display_name`, `type`, `used_by_uat`).
   - Read UAT Hooks section (Trigger / Success / Failure).
6. **Classify state:**
   - **State A — Sufficient (≥1 primary + ≤2 secondary):** PO confirm-only flow.
   - **State B — Partial (primary OK, missing secondary the PRD epics implied):** Propose secondary candidates.
   - **State C — Empty (no persona links in PRD):** Full proposal flow.
7. **Proactive proposal (always-on, not opt-in):**
   - Scan `personas/*.md`. Score each by:
     - Role keyword overlap với PRD section 3.1 + 4.4 epics (weight 0.5)
     - Domain/product-type match (weight 0.3) — vd PRD về "fitness app" + persona Đạt (gym beginner) → high
     - Existing `used_by_prds` không trùng (avoid double-count) (weight 0.2)
   - Rank top 5. Filter score ≥ 0.4 threshold.
8. **AskUserQuestion (single call, max 3 questions, max 4 options each):**
   - **Q1 — Confirm linked personas (skip if State C):** Show personas already in PRD. Options: `Confirm all (Recommended)` / `Remove some` / `Edit one` / `Other`.
   - **Q2 — Add proposed personas:** Show top 3 proposed (display_name + 1-line reason). Options per slot: `Add <name1>` / `Add <name2>` / `Add <name3>` / `None — sufficient (Recommended if State A)`.
   - **Q3 — Create new persona:** Only if PO chose "Other" or proposed list empty. Options: `Create new (delegate to brainstormer)` / `Skip — UAT with current set` / `Cancel`.
9. **Apply choices:**
   - Add: update PRD section 3.1 (append link), update persona's frontmatter `used_by_prds` + `used_by_uat`.
   - Remove: PO confirms via inline question (KHÔNG silent remove).
   - Edit: open persona file, AskUserQuestion which field (Profile/Goals/Pains/UAT Hooks).
   - Create new: delegate `brainstormer` agent với mission "draft persona for <PRD slug>", reuse `templates/persona.md`. Output → `personas/<new-slug>.md`. Loop back to Step A8.
10. **Hard limits:** primary ≥1 (block if 0), total ≤5 (warn if >5 — UAT scope explosion). Iteration cap: 3 rounds. Round 4 → AskUserQuestion: `Proceed with current set` / `Abandon`.

**Step B: UAT Script Generation**

11. **Per persona, generate UAT script** at `uat/<slug>/<persona-slug>.md`:
    - **Source:** persona's UAT Hooks (Trigger / Success / Failure) + PRD acceptance criteria mentioning this persona.
    - **Format per scenario:**
      ```
      ## Scenario <N>: <Trigger condition title>
      **Persona:** <display_name>
      **Given:** <persona context — pull từ Profile + Day-in-life>
      **When:** <action mapping to Trigger condition>
      **Then:** <success indicators — testable assertions>
      **Regression watch:** <failure modes — must NOT happen>
      **Evidence:** screenshot | log | metric | user-quote
      **Pass criteria:** <specific number, regex, or visual match>
      ```
    - Min scenarios: primary ≥3, secondary ≥1. Cap: primary ≤6, secondary ≤2.
12. **Generate `uat/<slug>/index.md`** — table of contents + persona coverage matrix + run instructions.
13. **Update persona files:** frontmatter `used_by_uat` append `uat/<slug>/<persona-slug>.md`.

**Step C: Execution (Playwright MANDATORY for executable targets)**

14. **Determine target:**
    - `--target=<url>` flag → deployed app → **Playwright required**.
    - `--target=<path>` flag → prototype dir → **start dev server + Playwright required**.
    - `--target=<file>.pen` → design file → manual-only checklist (Playwright N/A — Pencil không có DOM).
    - No flag → AskUserQuestion: `Deployed URL (paste)` / `Local prototype path` / `.pen design file` / `Cancel`.
15. **Playwright run (URL or prototype):**
    - Delegate `delivery-evaluator` agent với `playwright` tool (reuse pattern từ `team-prototype` Phase 3 + `team-vibe` Phase 3).
    - For prototype path: spawn `pnpm dev` background, wait for ready signal (port detect), then drive browser. Tear down server sau khi xong.
    - Per scenario: navigate → action sequence (When step) → assertion (Then step) → capture screenshot + console log + network HAR.
    - Evidence paths: `uat/<slug>/evidence/<scenario-id>/{screenshot.png, console.log, network.har}`.
    - Failure modes (`Regression watch`) → assert NOT-present (negative assertions).
16. **Design-only fallback (`.pen` target):** Output `uat/<slug>/run-checklist.md` — printable, PO/QA tick manual. Marked `target_type: design-manual` trong results JSON. KHÔNG SHIP qua evaluator nếu target executable bị skip.
17. **Capture results:** `uat/<slug>/results-<date>.json` — pass/fail per scenario + evidence paths + Playwright trace URL (`npx playwright show-trace`).
18. **Re-run support:** `--rerun-failed` flag → load latest results JSON, chỉ chạy lại scenarios fail. Append to results, không overwrite.

### Phase 3 — EVALUATOR

19. **Load profile** `.claude/evaluator-profiles/uat.json`.
20. **Delegate** `delivery-evaluator` agent.
21. **Run** checklist (11 items) + score 4 criteria (Persona coverage:10, Scenario quality:10, Evidence capture:8, Playwright execution:9).
22. **Verdict:** ALL ≥7 → SHIP / any <7 → REFINE (loop back Step B hoặc Step C nếu Playwright fail). Max 2 refine rounds. Round 3 → AskUserQuestion: `Ship anyway` / `One more` / `Abandon`.

### Phase 4 — TRACE

23. **Write trace** `.claude/traces/runs/{date}-uat-{slug}.json`. Same-day reruns: append `-HHMM`. Schema: `templates/trace-schema.json`.

> **PO-facing surface:** SHIP first-try → `✅ UAT ready: uat/<slug>/index.md (N scenarios across M personas, P passed / F failed Playwright)`. Refined → add `(refined N times)`. Trace error → `⚠️ Trace write failed: <reason>. UAT still saved.`

### Phase 5 — EVOLVE (only if retries > 0)

24. **Friction check:** retries == 0 → silent skip. retries > 0 → invoke `meta-harness` skill in `--evolve` mode, pass trace path `.claude/traces/runs/{date}-uat-{slug}.json`. Skill auto-picks highest-friction từ `friction_summary.highest_retry_skill` (candidates: persona-scoring logic, `team-uat` command itself, or downstream skill), runs `program.md` loop, enforces AskUserQuestion confirm before mutating. Workflow KHÔNG inline-execute evolve logic — delegate hết cho meta-harness.

## Guardrails

### Persona handling (MANDATORY)
- KHÔNG silent-add persona vào PRD. Always AskUserQuestion confirm.
- KHÔNG silent-remove persona. PO must explicitly approve.
- Existing personas with role+goals overlap >60% MUST be reused (no duplicate creation).
- New persona creation triggers `brainstormer` — KHÔNG inline draft trong command.

### Scenario quality
- Acceptance criteria từ PRD có persona-tag → MUST appear trong scenario của persona đó.
- Failure modes từ persona file → MUST appear as `Regression watch` line.
- Evidence type required per scenario — `none` không hợp lệ.

### General
- Content tiếng Việt cho prose; headers + technical (Given/When/Then, JSON keys) tiếng Anh.
- KHÔNG đổi `templates/persona.md` schema từ command này (chỉ persona-writer agent có quyền).
- Output `uat/<slug>/` đứng độc lập — handoff được cho QA team không cần context khác.

## Success
- `uat/<slug>/index.md` exists, list đủ persona + scenarios.
- Mỗi persona file `used_by_uat` đã update.
- Pass evaluator SHIP.
- PO chỉ trả lời câu hỏi cần PO decision (persona pick/edit), không bị hỏi boilerplate.
- Output feed được vào QA workflow (manual checklist) hoặc CI (Playwright runner).
