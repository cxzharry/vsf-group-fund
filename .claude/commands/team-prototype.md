---
name: team-prototype
description: Brainstorm + PRD + FE prototype. Tự khởi PRD nếu chưa có. Hỏi design mode (no-design/basic-first/strict-match). Flags: --no-prd (skip PRD), --bare (single-file HTML, no Next.js).
---

# /team-prototype $ARGUMENTS

Input: **$ARGUMENTS** — chấp nhận `<topic-name>` HOẶC `<prd-path>`. Optional flags: `--no-prd`, `--bare`.

**Flags (power-user escape hatches):**
- `--no-prd` — skip prd-writer delegation. Skill uses remaining `$ARGUMENTS` as inline scope. Để bypass full PRD cycle khi user có scope rõ trong đầu (vd Tech Lead spike).
- `--bare` — single-file prototype (HTML+JS+CSS), KHÔNG Next.js scaffold, KHÔNG `prototypes/<slug>/` Next.js layout. Maps to "spike" mental model. Implies `--no-design` mode.

## Pre-flight — Auto-initiate

1. **Parse flags + Detect input:**
   - Strip `--no-prd` and `--bare` from `$ARGUMENTS` first; remember as boolean flags.
   - Path exists + ends `.md` (vd `prd/foo.md`) → **PRD input**, skip Step 2
   - Otherwise → **Topic input** → apply slug rule từ `templates/slug-rule.md` (lowercase → strip diacritics → whitelist `[a-z0-9-]` → collapse/trim → truncate 50 → validate hoặc AskUserQuestion fallback) → `<slug>`. Raw `$ARGUMENTS` KHÔNG được đưa trực tiếp vào shell commands.
   - **Slug confirmation gate** — fires in BOTH directions (verbose AND ambiguous-short):
     - **Verbose case (>5 tokens OR >40 chars):** input wraps lots of context, slug auto-trimming may drop intent → confirm.
     - **Ambiguous-short case (≤2 alphanumeric tokens AND <12 chars AND no clear domain noun):** input too generic to disambiguate (vd `"feature x"`, `"app moi"`, `"thing 1"`). Skill cannot reliably pick slug.
     - **Skip gate only when:** input is a PRD/prototype path, OR is 3-5 tokens with a clear domain noun (vd `track-okrs`, `kanban-board`, `feature-request-tracker`).
     - AskUserQuestion shape: `Use slug "<slug>" (Recommended)` / `Edit slug` / `Cancel`. Skill KHÔNG silent guess slug.
2. **Check PRD tồn tại:**
   - **Nếu `--no-prd` flag set:** skip toàn bộ Step 2. Use remaining `$ARGUMENTS` (sau khi strip flag) as inline scope description, pass directly tới Phase 1 planner. KHÔNG delegate prd-writer.

     **Inline scope min-fields hint (planner fallback):** when no PRD exists, planner derives epics from inline scope. Skill MUST surface a 1-shot AskUserQuestion to PO if scope < 20 chars OR contains 0 of {persona, AC, screen-list keywords}: `Inline scope quá thin — add persona/AC?` Options: `Yes — add 2 lines` / `No — planner infers` / `Cancel`. Default Recommended = `No — planner infers` for spike workflows. Min-fields hint passed to planner: `{persona?: string, screens?: string[], ac?: string[]}` — empty fields tolerated, planner uses defaults.
   - Nếu `prd/<slug>.md` chưa có → **delegate to prd-writer agent với topic `<slug>`**, chờ SHIP, rồi continue.
   - Nếu `prd/<slug>.md` đã có → **silent use existing**, log message `📄 Using existing PRD: prd/<slug>.md`. KHÔNG hỏi confirm. Friction-free cho back-to-back flow (`/team-prd` → `/team-prototype`). Power user muốn refresh PRD: re-run `/team-prd <slug>` trực tiếp (đã có sẵn `Refine/Overwrite/Cancel` question trong team-prd).
3. **Hỏi design mode** — dùng `AskUserQuestion` với 3 options:
   - **no-design** (formerly `skip`) — PRD → code trực tiếp, NO design tokens (MVP nhanh, stakeholder demo). Vẫn dùng Tailwind CDN cho `--bare=false` mode; `--bare=true` skip Tailwind CDN.
   - **basic-first** (Recommended cho non-demo) — Design basic → code follows tokens (cần visual direction trước)
   - **strict-match** — Design full → code pixel-match (cần design chất lượng handoff)

   > **Backward-compat:** legacy value `skip` is accepted as alias of `no-design`. Future skill mutations should emit `no-design`. **Deprecation timeline:** `skip` alias slated for removal in v0.2.0 — once round-3 dogfood confirms zero callers using `skip` literal in saved fork-plans / traces (audit via `grep -r '"design_mode": *"skip"' .claude/traces/runs/`).
   > **Context-aware default:** nếu PRD scope chứa keyword "stakeholder demo" / "MVP" / "internal tool" → default = `no-design`. Else default = `basic-first`.
   > Decision tree: Có design reference sẵn? → **strict-match**. Chưa có vision rõ? → **basic-first**. Demo nhanh? → **no-design**.

   **Skip Step 3 khi `--bare` set** — bare mode forces `no-design`.

4. **Nếu mode != no-design:**
   - Check `designs/<slug>.pen` hoặc `design-system/tokens.json`. Nếu chưa có → **delegate to ui-ux-designer agent với PRD path `prd/<slug>.md`**, rồi continue. KHÔNG block.

## Meta-Harness 5-Phase

### Phase 1 — PLAN (Rolling Wave)

> Plan-Implement KHÔNG sequential. Sprint 1 plan ready → dev sprint 1 ngay; planner refine sprint 2+ song song.

> **Screen cap:** prototype giới hạn tối đa 7 screens. Formula: `N epics × (1-2 screens/epic) ≤ 7`. Nếu tính ra >7 → Phase 1 surface cho PO ngay: cắt epics hoặc merge screens trước khi commit scope.

5. **Activate** karpathy-guidelines và meta-harness (reference via SKILL.md). Thêm shadcn-ui-design nếu mode != no-design.
6. **Read PRD** `prd/<slug>.md`. Extract scope, acceptance criteria, persona, **epics (4.4)**, **platform (4.3)**.
7. **Nếu mode != no-design:** read design spec từ `designs/<slug>-design.md` (PRIMARY — markdown source of truth, all 9 sections). Fallback to `design-system/tokens.json` if design.md missing (backward compat for legacy projects).
   - Mode `basic-first` → delegate to ui-ux-designer agent với explicit parameter `scope: skeleton` (1 màn/epic). Designer outputs `<slug>-design.md` per `templates/design-spec.md`.
   - Mode `strict-match` → delegate to ui-ux-designer agent với explicit parameter `scope: full`. Same output spec.
8. **Delegate** `planner` → prototype plan với epic-level dep graph, sử dụng rolling-wave mode:
   - Output `plans/{slug}/dep-graph.md` (epics + dependencies)
   - **Sprint 1:** detail FULL (file list, components). `ready_to_implement: true`.
   - **Sprint 2+:** outline only WITH required `dep_files: [path1, path2]` field (see planner.md rolling-wave schema). Fan-out pre-check sẽ assert these files exist trước khi spawn sub-agents.
   - File ownership PER EPIC.

### Phase 2 — IMPLEMENT (Pipelined + Sub-agent fan-out)

**Design Gate (BLOCKING cho FE):**

> Task() tool synchronous — caller blocks cho tới khi agent return. KHÔNG cần poll giữa lúc.

- **Mode = `basic-first`:** sau khi ui-ux-designer agent (scope: skeleton) return → `Read designs/<slug>.pen`. Nếu file missing hoặc empty → escalate PO via AskUserQuestion: "Retry designer / Fallback skip mode / Abort".
- **Mode = `strict-match`:** sau khi ui-ux-designer agent (scope: full) return → `Read designs/<slug>.pen`. Cùng fallback logic.
- **Mode = `no-design`:** FE start ngay.

9. **Delegate** `fullstack-developer` cho mỗi sprint ready (sau design gate nếu mode != no-design), với explicit parameter `mode: frontend`:
   - Read dep graph. **Independent epics → spawn tối đa N=3 sub-agents song song** (Task tool, 1 epic/agent). Nếu epics >3 → queue FIFO, xử lý 3 trước, rồi batch tiếp.
   - File ownership per epic (vd: `prototypes/<slug>/screens/(auth)/**`, `screens/(snacks)/**`).
   - Single epic per sprint → 1 agent, không fan-out.

   **CRITICAL — `prototypes/<slug>/` is SEPARATE from starter `src/`:**
   - Starter `src/` ships Next.js + drizzle + wrangler (full app scaffold). Prototype scope is FE-only — KHÔNG reuse starter `src/`.
   - All prototype work goes inside `prototypes/<slug>/`. Self-contained. Có riêng `package.json` nếu mode = basic-first/strict-match (Next.js scaffold).
   - `--bare` mode: KHÔNG `package.json`, KHÔNG `node_modules`. Just `prototypes/<slug>/{index.html,app.js,styles.css}`.

   ```
   # no-design + non-bare (default Tailwind CDN):
   prototypes/<slug>/
   ├── index.html
   ├── screens/<epic>.html
   └── README.md

   # --bare:
   prototypes/<slug>/
   ├── index.html        # entry
   ├── app.js            # zero-dep JS
   ├── styles.css        # plain CSS, no Tailwind
   └── README.md

   # basic-first / strict-match:
   prototypes/<slug>/
   ├── package.json      # local Next.js scaffold (separate from starter)
   ├── src/
   │   ├── app/
   │   └── screens/<epic>/
   ├── assets/
   └── README.md
   ```
10. **FE-only rules (mode: frontend):**
    - **`--bare`:** plain HTML + plain JS + plain CSS (no Tailwind, no framework, no npm). Single-file or 3-file (index.html/app.js/styles.css). Zero deps. Open via `file://`.
    - **no-design (non-bare):** HTML + Tailwind CDN (no build step, no shadcn, no npm)
    - **basic-first / strict-match:** Next.js + Tailwind + shadcn/ui (full build), scaffolded INSIDE `prototypes/<slug>/`, KHÔNG dùng root `src/`
    - NO backend, NO API, NO DB. Static / mock data OK.
    - Responsive (mobile + desktop). States: default, empty, loading, error.
11. **basic-first:** apply tokens từ `.pen` (skeleton: 1 màn/epic available) vào CSS/Tailwind config.
12. **strict-match:** pixel-match từng screen với design (full).
13. **Sprint roll-forward:** Sprint N done → trigger sprint N+1 (planner đã refine xong song song).

> **AC scope:** Prototype chỉ cover **visual + navigation AC**. Auth/DB AC (vd "signup <5s") deferred to `/team-vibe`.

### Phase 3 — EVALUATOR

14. **Load profile** `.claude/evaluator-profiles/prototype.json`.
15. **Check Playwright:** probe `npx playwright --version` (exit code $? = 0 → available).
    - **Available:** chạy browser tests (navigation, responsive, states, interactions).
    - **Unavailable (default cho non-bare):** fallback = manual LLM visual review: so sánh 3 screenshot files với `designs/<slug>-design.md` (PRIMARY, v0.1.6+) — fallback to `design-system/tokens.json` if design.md missing. Checklist từ prototype.json. Document findings theo từng criterion.
    - **`--bare` mode (NEW — explicit branch):** prototype có 0 npm deps → KHÔNG có Playwright và KHÔNG sẽ install. Skip Playwright probe entirely. Force LLM-review path:
      1. `Bash` open prototype: `open prototypes/<slug>/index.html` (macOS) or document manual open instruction.
      2. Use chrome-devtools MCP nếu available để screenshot 1-3 viewports (default + mobile).
      3. LLM compares screenshots against PRD acceptance criteria + bare-mode checklist (visual quality, navigation, no-framework-leak).
      4. Document findings + score each criterion. Same scoring rubric as Playwright path.
    - Cả 3 paths check acceptance criteria từ PRD (visual + navigation scope only).
16. **Score** theo tất cả criteria trong `prototype.json` (reference profile cho full list — vd: Visual Quality:8, Design Fidelity:10, UX:7, Functionality:5, Responsiveness:7, State Coverage:6, Code Quality:5).
17. **FE-only guard (MANDATORY):** Scan **ONLY `prototypes/<slug>/`** (do NOT scan root `src/` — starter ships Next.js full scaffold which is legitimate, guard chỉ apply trong prototype scope) **excluding `node_modules/`, `.next/`, `dist/`, `build/`, `.turbo/`**. Assert KHÔNG có files match các pattern sau:
    - Backend/API (App Router): `src/app/api/**/route.ts`, `**/route.ts`
    - Backend/API (Pages Router): `pages/api/`, `src/pages/api/`, `pages/api/**/*.ts`
    - Backend servers: `api/`, `server/`, `lib/server/**`
    - Database: `drizzle/`, `migrations/`, `*.sql`, `prisma/schema.prisma`
    - Next.js server primitives: `middleware.ts`, `src/middleware.ts`, `**/actions.ts` (server actions), `trpc/`
    - Next.js data-fetching with side effects: files containing `getServerSideProps` or `getStaticProps` + `fetch(` (heuristic — bare existence of TS file is NOT indicator; must contain server fetch)
    - Server directive: grep `"use server"` in prototype files → flag any match (heuristic — not all TS files with this directive are backend, but in FE-only prototype context any occurrence is suspect)
    - Secrets: `.env`, `.env.local`, `.env.production`

    Scan command hint: `find prototypes/<slug> -type f -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*"`. Nếu match any → FAIL evaluator → REFINE force mode=frontend.
18. **Verdict:** SHIP / REFINE (loop Phase 2 sprint failed, tối đa 2 rounds; nếu vẫn fail sau round 2 → escalate PO với summary) / REJECT.

### Phase 4 — TRACE
19. **Write trace** `.claude/traces/runs/{date}-prototype-{slug}.json`. Include sprint timing + sub-agent count. Schema: `templates/trace-schema.json`. Same-day reruns: append `-HHMM` (e.g., `260417-prototype-myapp-1430.json`).

### Phase 5 — EVOLVE (only if retries > 0)
20. **Friction check:** retries == 0 → silent skip. retries > 0 → invoke `meta-harness` skill in `--evolve` mode, pass trace path `.claude/traces/runs/{date}-prototype-{slug}.json`. Skill auto-picks highest-friction từ `friction_summary.highest_retry_skill`, runs `program.md` loop, enforces AskUserQuestion confirm before mutating. Workflow KHÔNG inline-execute — delegate hết cho meta-harness.

## Guardrails
- KHÔNG block khi thiếu PRD hoặc design — auto-initiate (agent delegation), TRỪ KHI `--no-prd` flag set (then skip prd-writer entirely)
- KHÔNG build backend / API — FE-only (mode: frontend)
- KHÔNG design >7 screens — surface constraint sớm trong Phase 1
- KHÔNG skip evaluator phase
- KHÔNG sub-agent edit file ngoài epic ownership
- KHÔNG wait full plan trước implement — sprint 1 ready là dev sprint 1
- KHÔNG generate features ngoài PRD scope
- KHÔNG silent slug guess từ verbose input — slug confirmation gate MANDATORY khi >5 tokens
- KHÔNG mix prototype scope vào starter `src/` — luôn isolated trong `prototypes/<slug>/`

## Success
- `prototypes/<slug>/` mở được trong browser
- Playwright basic tests pass (hoặc LLM visual review passed), ALL scores ≥7
- Mode != no-design: design fidelity ≥7
