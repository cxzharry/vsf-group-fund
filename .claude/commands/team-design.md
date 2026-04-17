---
name: team-design
description: Brainstorm + PRD + Design (.pen). Tự khởi PRD nếu chưa có. Output qua Pencil MCP.
---

# /team-design $ARGUMENTS

Input: **$ARGUMENTS** — chấp nhận `<topic-name>` HOẶC `<prd-path>` HOẶC `<prototype-path>`.

**Optional flag:** `--scope=skeleton|full` (default depends on caller). Caller (`/team-prototype`, `/team-vibe`) pass dựa trên design mode:
- `skeleton` (basic-first caller) → tokens + **min 1 màn/epic, max 3 màn chính** (cherry-pick highest-value screens cross-epic). FE BLOCKING gate — code không start trước khi skeleton xong.
- `full` (strict-match / standalone caller) → tokens + **all screens** từ plan, polished pixel-perfect. FE BLOCKING gate.

**Standalone Designer caller (no `--scope` passed):**
- AskUserQuestion ngay sau Step 2: "Scope: skeleton (3 màn chính, nhanh) hay full (mọi screen, polished handoff)?"
- Options: `Skeleton (3 screens, ~10 min)` / `Full (all screens, ~30 min)` / `Cancel`.
- Default Recommended = `Full` cho Designer (handoff scenario).

## Pre-flight — Auto-initiate

1. **Detect input:**
   - Path chứa `prototypes/` hoặc is directory → **prototype input** (visual reference)
   - Path chứa `prd/` hoặc ends `.md` → **PRD input**
   - Otherwise → **Topic input** → apply slug rule từ `templates/slug-rule.md` (lowercase → strip diacritics → whitelist `[a-z0-9-]` → collapse/trim → truncate 50 → validate hoặc AskUserQuestion fallback) → `<slug>`. Raw `$ARGUMENTS` KHÔNG được đưa trực tiếp vào shell commands.

   **Pencil MCP pre-flight check (MANDATORY — runs FIRST trước cả Step 2):**
   - Probe `mcp__pencil__get_editor_state` với **5s timeout cap** (KHÔNG đợi default 60s — Pencil dead = pencil-off scenario phải surface ngay).
   - Implementation hint: spawn probe in background; if no response within 5s, treat as fail. Tools không support timeout flag → use `Bash` wrapper hoặc race với sleep.
   - **Pencil OK:** continue normally to Step 2.
   - **Pencil fail (timeout / error):** AskUserQuestion ngay với 3 Options:
     - `(A) Mở Pencil rồi retry` — chờ PO open desktop app, re-probe.
     - `(B) Plan-only mode (Recommended cho handoff Dev)` — generate `designs/<slug>-plan.md` + `design-system/tokens.json` nhưng KHÔNG `.pen` file. Skip Phase 2 hoàn toàn.
     - `(C) Cancel` — exit, không partial output.

2. **Auto-PRD gate (NEW — explicit cost preview):**
   - Topic input HOẶC prototype input thiếu PRD → check `prd/<slug>.md`
   - Chưa có → **AskUserQuestion ngay (KHÔNG silent auto-trigger):**
     - Question: "Chưa có PRD cho `<slug>`. Cần `/team-prd` chạy trước (~10 phút, sẽ hỏi PO 2-4 questions). Continue?"
     - Options: `Run /team-prd full cycle (Recommended)` / `Use minimal PRD stub (skip discovery, ask 1 quick scope question)` / `Cancel — viết PRD manual trước`.
     - **Recommended phụ thuộc context:** Designer standalone caller → `Use minimal PRD stub` (Designer thường chỉ cần scope rough). `/team-prototype` hoặc `/team-vibe` caller → full cycle.
   - User chọn full → chạy `/team-prd <topic>` inline, chờ SHIP, continue.
   - User chọn minimal stub → spawn 1 AskUserQuestion ("Scope 1 dòng cho design") → write 10-line `prd/<slug>.md` stub → continue.
3. ~~Pencil MCP check moved to Step 1.~~ (Đã merge vào Step 1 pre-flight để fail fast.)

## Meta-Harness 5-Phase

### Phase 1 — PLAN
4. **Activate** `karpathy-guidelines` + `shadcn-ui-design` skill.
5. **Create dirs** nếu chưa có: `designs/`, `designs/screens/`, `design-system/`.
6. **Read input:**
   - PRD: extract scope, persona, acceptance criteria, **platform (4.3)**, **epics (4.4)**
   - Prototype: take screenshots (chrome-devtools / Playwright), analyze layout/components
7. **Ask PO style choice (MANDATORY — from curated menu, NOT hardcoded)**:
   - **Source:** `templates/design-styles.md` (12 curated styles) + `ui-ux-pro-max` skill database (`python3 $SKILL/scripts/search.py "<style>" --domain style` for unexpected matches).
   - **Selection logic:** designer agent reads PRD §3.1 (persona) + §4.2 (key benefits) + §4.3 (platform) → filter the 12 catalog entries by product-type fit → pick **top 3-5 candidates**. Augment with 1 ui-ux-pro-max search result if surfaces something unexpected.
   - **AskUserQuestion** with the 3-5 picked style names as labels. Each label = `<style name> — <1-line summary>`. Mark **top 1 as Recommended** with rationale (1-2 sentences referencing persona + product type). Other auto-added by tool.
   - **PO picks Other** → follow-up AskUserQuestion: "Describe style in 1-2 sentences hoặc paste reference URL". Designer maps to nearest catalog entry + adapts.
   - Save decision to `designs/<slug>-style.md` (1-page: chosen style + rationale + token implications + reference links). This file is read-only after save; design.md inherits.
   - Designer agent MUST apply chosen style across ALL screens + tokens consistently.
8. **Delegate** `ui-ux-designer` → design plan:
   - Screen list (≤7 screens MVP, hoặc 1 screen/epic nếu `--scope=skeleton`)
   - Mỗi screen: purpose, components, states (default/loading/empty/error)
   - User flow numbered steps
   - Tokens: color, typography, spacing, radius — derived from chosen style
9. **Save plan** `designs/<slug>-plan.md`.

### Phase 2 — IMPLEMENT (Pencil MCP)
10. **Verify** `mcp__pencil__get_editor_state({include_schema: true})`.
11. **Load guidelines** `mcp__pencil__get_guidelines({category: "guide"})`.
12. **Open document** `mcp__pencil__open_document("new")`.
13. **Set tokens** qua `mcp__pencil__set_variables` từ plan (apply chosen style).
14. **Determine screens to draw:**
    - **`--scope=skeleton`:** từ PRD section 4.4 Epics, pick **min 1 màn/epic, MAX 3 màn chính total** (highest-value cross-epic). Nếu >3 epics → cherry-pick 3 epics quan trọng nhất, các epic còn lại chỉ tokens (no screen).
    - **`--scope=full`:** all screens từ plan, polished.
15. **Build screens** qua `mcp__pencil__batch_design`:
    - Mỗi screen = 1 frame, insert shadcn/ui components matching style
    - States (empty/loading/error) — **skeleton: chỉ default state**, **full: all states**
16. **Prototype input:** match prototype layout — refine, polish, add missing states (full only).
17. **Snapshot** `mcp__pencil__snapshot_layout` verify structure.
18. **Save** `designs/<slug>.pen`.
19. **Write design spec `designs/<slug>-design.md`** (PRIMARY OUTPUT — markdown source of truth). Use template `templates/design-spec.md`. Sections required:
    - §1 Style Decision (chosen style + rationale + PO confirmation date + link to `<slug>-style.md`)
    - §2 Design Tokens (color, typography, spacing, radius/shadow, motion — human-readable)
    - §3 Screen Inventory (≤7 MVP)
    - §4 Component Inventory (map to shadcn/ui)
    - §5 Per-Screen Specs (purpose, persona target, layout, components, states, interactions, AC mapping)
    - §6 User Flow (numbered persona journey)
    - §7 Dev Handoff Notes (Tailwind config, shadcn deps, custom components, assets, a11y)
    - §8 Implementation Reference (.pen path, tokens.json path, prototype/app paths)
    - §9 Revision Log

    `<slug>-design.md` is read by `/team-prototype` Phase 1 step 7 and `/team-vibe` design gate to drive code generation. **`<slug>-design.md` >>> `tokens.json`** in priority — tokens.json is the auto-derived machine-readable subset.

20. **Export tokens** → `design-system/tokens.json` — auto-derived from §2 of design.md.

    **Merge vs overwrite policy (NEW — fixes Cara friction):**
    - Starter pre-seeds `design-system/tokens.json` với placeholder tokens.
    - Skill MUST detect existing file:
      - File contains placeholder marker (`"_placeholder": true` hoặc empty `{}`) → safe overwrite.
      - File has real tokens → AskUserQuestion: `Overwrite (replace all)` / `Merge (preserve user customizations)` / `Skip export (keep current)`.
      - Default Recommended = `Merge` (skill writes new top-level keys, preserves any keys user added).
    - Always backup `tokens.json` → `tokens.json.bak` before overwrite/merge.

### Phase 3 — EVALUATOR
20. **Load profile** `.claude/evaluator-profiles/design.json`.
21. **Take screenshots:**
    - Pencil available: `mcp__pencil__get_screenshot` từng frame
    - Plan-only mode: skip visual eval, check plan completeness
22. **Delegate** `delivery-evaluator`. Check:
    - [ ] **skeleton:** mỗi epic có ít nhất 1 screen đại diện? **full:** mọi feature trong PRD scope có screen?
    - [ ] Acceptance criteria map tới UI element?
    - [ ] Style chosen áp dụng consistent (palette, typography, components)?
    - [ ] **full:** states đầy đủ cho data-heavy screens?
    - [ ] ≤7 screens?
    - [ ] Tokens consistent với shadcn?
    - [ ] User flow navigable start-to-finish?
23. **Score** weighted: Visual Quality(10), UX(10), Completeness(5), Clarity(3).
24. **Verdict:** SHIP / REFINE (loop Phase 2 fix specific screens) / REJECT.

### Phase 4 — TRACE
25. **Write trace** `.claude/traces/runs/{date}-design-{slug}.json`. Schema: `templates/trace-schema.json`. Same-day reruns: append `-HHMM` (e.g., `260417-design-myapp-1430.json`).

### Phase 5 — EVOLVE (only if retries > 0)
26. **Friction check:** retries == 0 → silent skip. retries > 0 → invoke `meta-harness` skill in `--evolve` mode, pass trace path `.claude/traces/runs/{date}-design-{slug}.json`. Skill auto-picks highest-friction từ `friction_summary.highest_retry_skill`, runs `program.md` loop, enforces AskUserQuestion confirm before mutating. Workflow KHÔNG inline-execute — delegate hết cho meta-harness.

## Prototype → Design Sync

Khi input là prototype path:
1. Screenshot mỗi screen bằng **browser tool** (chrome-devtools / Playwright), KHÔNG dùng Pencil cho bước này
2. Designer recreate layout trong `.pen`
3. Polish: spacing, tokens, states
4. Export `design-system/tokens.json`

## Guardrails
- KHÔNG block khi thiếu PRD — auto-initiate
- KHÔNG design >7 screens MVP
- KHÔNG skip Pencil MCP check trước Phase 2
- KHÔNG generate screens ngoài PRD scope
- Plan-only mode: phải document rõ "no .pen file generated"

## Success
- `designs/<slug>-design.md` exists (PRIMARY — markdown source of truth, all 9 sections filled)
- `designs/<slug>-style.md` exists (style decision + rationale)
- `designs/<slug>.pen` exists (visual file, when Pencil mode used; skipped in plan-only mode)
- `design-system/tokens.json` exported (auto-derived from design.md §2)
- Evaluator SHIP, ALL scores ≥7
- Feed được vào `/team-prototype` / `/team-vibe` mode `basic-first` hoặc `strict-match`
