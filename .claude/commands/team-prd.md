---
name: team-prd
description: Brainstorm + smart interview + write PRD. Self-reasons từ idea + research, chỉ hỏi PO những gì thật sự chưa chắc.
---

# /team-prd $ARGUMENTS

Topic / idea: **$ARGUMENTS**

> **PRD-only persona (PM handoff scenario):** Bạn có thể STOP sau Phase 3 nếu chỉ cần PRD để bàn giao Designer/Dev. KHÔNG bắt buộc chạy `/team-design`, `/team-prototype`, hoặc `/team-vibe` sau. PRD output là deliverable đứng độc lập.

## Meta-Harness 5-Phase

### Phase 1 — PLAN
0. **Input check:** Nếu `$ARGUMENTS` trống → AskUserQuestion: "Nhập topic PRD" với Options: `Nhập topic` / `Cancel`. Nếu Cancel → exit.
1. **Activate** `karpathy-guidelines` skill (natural-language mention, không dùng Skill tool syntax).
2. **Slug** từ topic — apply slug rule từ `templates/slug-rule.md` (lowercase → strip diacritics → whitelist `[a-z0-9-]` → collapse/trim → truncate 50 chars → validate non-empty/non-all-digits hoặc AskUserQuestion fallback). Ví dụ: "theo dõi thói quen" → `theo-doi-thoi-quen`. Raw `$ARGUMENTS` KHÔNG được đưa trực tiếp vào shell commands.
3. **Check existing:** Nếu `prd/<slug>.md` đã có → hỏi PO qua `AskUserQuestion`:
   - Options: `Refine` / `Overwrite` / `Cancel (Recommended)`
4. **Detect input richness:**
   - `$ARGUMENTS` < 30 ký tự → coi là topic name → cần brainstorm + research đầy đủ
   - `$ARGUMENTS` ≥ 30 ký tự **AND** chứa ≥2 structural markers (bullets `-`, newlines `\n`, keywords "persona|user|metric|scope|AC") → coi là brief / context block → skip Discovery, fill trực tiếp
   - Mid-range (≥30 ký tự nhưng không có structural markers) → treat as topic, xác nhận với PO qua `AskUserQuestion`: "Input này là topic hay brief?"

### Phase 2 — IMPLEMENT

**Step A: Brainstorm (self-reason first)**
5. **Delegate** `brainstormer` agent. Brief rõ:
   - Mission: produce PRD draft inputs (problem, persona, **epic candidates** — KHÔNG expand user stories, `prd-writer` sẽ làm sau), **platform (web/mobile/app/PWA)**, metrics, scope, acceptance criteria
   - **Self-reason MAX trước khi hỏi PO.** Dùng:
     - `researcher` agent: ≥3 sources market+user+technical (researcher owns external search — KHÔNG dùng WebSearch trực tiếp)
     - Domain knowledge sẵn có: pattern analogies, similar products
     - Constraint inference: stack default (Next.js + D1 + better-auth), team size, MVP scope
   - Output draft cho **mọi mục PRD** với confidence level schema từ brainstormer's output: `{epics[], persona, platform, metrics, scope}` kèm `confidence: high | medium | low` + reasoning per field
   - **Dùng `AskUserQuestion` tool** (NOT free-form), max 4 option labels per question; `'Other'` tự động thêm bởi tool, mark `(Recommended)` với rationale, max 4 questions/call, group related.
   - **Chỉ hỏi** items confidence=low HOẶC business-decision-required (vd: target user segment, success metric numbers, scope priority).
   - KHÔNG hỏi boilerplate. KHÔNG hỏi cái có thể infer từ context.

**Step B: Verification Gate (MANDATORY — không skip)**

Sau brainstorm, **MUST verify với PO** trước khi write PRD final. Dùng **1 lần `AskUserQuestion`** với tối đa 3 questions:

6. **Q1 — Epics list (with consolidation review):** Show **3-5 proposed epics MAX** (đã apply consolidation rule). Mỗi epic 1 line tên + mô tả ngắn + persona owner. Nếu brainstormer produced >5 candidates → consolidation review fired BEFORE this question:
   - Merge rule: 2 epics share same primary persona AND user-story overlap >40% → merge.
   - Each merge logged for PRD section 4.4 "Consolidation log".
   - Hard cap: 5. Hard floor: 3. Less = scope quá narrow; more = split PRD or move backlog.
   - Options: `Review each epic` / `Confirm all (Recommended)` / `Add/Remove epics` / `Other`.
7. **Q2 — Platform:** Show recommended platform với rationale. Options: `Web responsive (Recommended)` / `Mobile-first PWA` / `Native iOS/Android` / `Other`.
8. **Q3 — Other low-confidence items:** Group remaining confidence=low items (auth provider lựa chọn alt, data persistence model, integration thứ N...). **Skip Q3 nếu không có low-confidence item nào còn lại.**
9. **Iterate:** Nếu PO chọn "Add/Remove" hoặc "Other" → loop lại Step A với feedback, re-verify. **Max 3 iterations.** Round 4 → AskUserQuestion: "Abandon (Recommended)" / "Manual PRD write" / "Continue anyway".

**Step C: PRD writer**
10. **Delegate** `prd-writer` agent với:
    - Brainstorm output dạng JSON `{epics[], persona, platform, metrics, scope}` (handoff schema)
    - Verified inputs từ Step B (epics already consolidated to 3-5)
    - **`mode: brainstormed`** — prd-writer SKIP Discovery phase, không duplicate công việc của brainstormer
11. **Read templates:** `templates/prd-full.md` + `templates/persona.md`.
12. **prd-writer creates/reuses `personas/<slug>.md`** (one per persona, primary + secondary). Existing personas with role+goals overlap >60% MUST be reused (frontmatter `used_by_prds` updated, no duplication).
13. **Fill PRD sections** bao gồm: section 3.1 = persona LINKS (`personas/<slug>.md`), section 4.4 = 3-5 epics + consolidation log, section 5 = user stories with **INLINE Acceptance Criteria nested per US** (no separate AC section). ID convention: `US-<EpicID>-<n>`, `AC-<EpicID>-<n>.<m>`. **Content tiếng Việt, headers + technical jargon tiếng Anh** (xem Guardrails → Language rule).
14. **Output** `prd/<slug>.md` + `personas/<persona-slug>.md` files.

### Phase 3 — EVALUATOR
14. **Load profile** `.claude/evaluator-profiles/prd.json`.
15. **Delegate** `delivery-evaluator` agent.
16. **Run** checklist (see `prd.json` — currently 10 items) + score 3 weighted criteria (Completeness:10, Clarity:10, Testability:8).
17. **Verdict:** ALL scores ≥7 → SHIP / any <7 → REFINE.
    - REFINE loop tối đa **2 rounds**. REFINE có thể loop lại Step A (nếu research gap) HOẶC Step C (nếu PRD drafting gap) — Evaluator chọn.
    - Round 3 = escalate qua `AskUserQuestion` với options: `Ship anyway` / `One more round` / `Abandon`.

### Phase 4 — TRACE (internal — không surface cho PM)
18. **Write trace** `.claude/traces/runs/{date}-prd-{slug}.json`. Schema: xem `templates/trace-schema.json`. Same-day reruns: append `-HHMM` (e.g., `260417-prd-myapp-1430.json`).

> **PM-facing surface (CLARIFIED):**
> - Trace ALWAYS written silently — observability is non-negotiable, even on first-try SHIP. KHÔNG skip writing trace.
> - PM-facing message khi SHIP first-try: chỉ confirm `✅ PRD ready: prd/<slug>.md`. KHÔNG mention "trace written".
> - PM-facing message khi REFINE rounds occurred: include 1-line `(refined N times — Phase 5 may surface improvement question)` để PM expect Phase 5 prompt.
> - PM-facing message khi error writing trace: surface immediately (`⚠️ Trace write failed: <reason>. PRD still saved.`) — never silently lose observability data.

### Phase 5 — EVOLVE (only if retries > 0)
19. **Friction check:** retries == 0 → silent skip. retries > 0 → invoke `meta-harness` skill in `--evolve` mode, pass trace path `.claude/traces/runs/{date}-prd-{slug}.json`. Skill auto-picks highest-friction từ `friction_summary.highest_retry_skill`, runs `program.md` loop, enforces AskUserQuestion confirm before mutating skill file. Workflow này KHÔNG inline-execute evolve logic — delegate hết cho meta-harness.

> **PM-facing surface:** Phase 5 chỉ active khi REFINE happened. Skip silent nếu Phase 3 SHIP first try. KHÔNG mention "evolve skill" trong PM messages — chỉ ask confirm khi thực sự sắp mutate.

## Guardrails

### Language Rule
Single source of truth: `.claude/agents/prd-writer.md` → "Language (MANDATORY)" section. prd-writer agent enforce rule này cho toàn bộ PRD output.

### General
- KHÔNG hỏi PO câu có thể tự infer từ idea + research
- KHÔNG generate persona/metric "phòng hờ" — phải có evidence
- Acceptance criteria MUST testable (Playwright-ready)
- KHÔNG đổi template format
- Nếu thiếu research → evaluator trigger REFINE loop về Step A, KHÔNG đẩy PO "tự research thêm"

## Success
- File `prd/<slug>.md` exists, follows template
- Pass evaluator SHIP
- Feed được vào `/team-design`, `/team-prototype`, `/team-vibe`
- PO chỉ phải trả lời câu hỏi thực sự cần PO decision
