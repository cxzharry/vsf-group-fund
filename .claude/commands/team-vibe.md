---
name: team-vibe
description: Brainstorm + PRD + Design + Full FE+BE (Fork-Join). Tự khởi mọi prereq. Hỏi design mode.
---

# /team-vibe $ARGUMENTS

Input: **$ARGUMENTS** — chấp nhận `<topic-name>` HOẶC `<prd-path>`.

## Pre-flight — Auto-initiate

1. **Detect input:**
   - Path exists + ends `.md` (vd `prd/foo.md`) → **PRD input**, skip Step 2
   - Otherwise → **Topic input** → apply slug rule từ `templates/slug-rule.md` (lowercase → strip diacritics → whitelist `[a-z0-9-]` → collapse/trim → truncate 50 → validate hoặc AskUserQuestion fallback) → `<slug>`. Raw `$ARGUMENTS` KHÔNG được đưa trực tiếp vào shell commands.
2. **Auto-PRD nếu chưa có:**
   - Check `prd/<slug>.md`. Chưa có → **chạy `/team-prd <topic>` inline**, chờ SHIP, continue. KHÔNG block.
3. **Hỏi design mode** (default: `basic-first`):

| Mode | Flow | Khi nào |
|---|---|---|
| **no-design** | PRD → code trực tiếp | MVP nhanh |
| **basic-first** (default) | Design basic → code follows tokens | Cần visual direction |
| **strict-match** | Design full → code pixel-match | Cần design chất lượng |

> **Backward-compat:** legacy value `skip` is accepted as alias of `no-design` (see team-prototype.md for deprecation timeline).

4. **Auto-Design nếu mode != no-design + chưa có:**
   - Check `designs/<slug>-design.md` (PRIMARY) OR fallback to `designs/<slug>.pen` / `design-system/tokens.json` (backward compat). Chưa có → **chạy `/team-design prd/<slug>.md --scope=skeleton` inline** (default `skeleton` cho team-vibe để tránh block lâu; chỉ dùng `--scope=full` nếu caller đã pass `--scope=full` hoặc mode = strict-match), continue. KHÔNG block. Designer outputs `<slug>-design.md` per `templates/design-spec.md`.
5. **BE stack choice (MANDATORY — NEW in v0.1.6)** — AskUserQuestion with options:
   - `Cloudflare Workers + D1 + better-auth (Recommended)` — edge-first, generous free tier, single vendor; pre-scaffolded in starter. See `templates/be-stacks/cloudflare.md`.
   - `Supabase (Postgres + Auth + Storage + Realtime)` — Postgres power, mature auth + RLS, realtime built-in, ops dashboard. Requires migrating starter (deps swap + auth rewrite). See `templates/be-stacks/supabase.md`.
   - `Other` — describe in follow-up; agent escalates to PO for stack decision before continuing.

   **Read chosen stack template** (cloudflare.md or supabase.md) and follow its setup checklist throughout Phase 1 + Phase 2. Stack choice gates which Credential Gate questions fire (step 11 below).

   Save decision to `plans/{slug}/be-stack.md` (1-line: chosen stack + rationale) — read-only after save, all BE epic-agents reference it.

6. **Validate BE info từ PRD** (auto-infer trước khi hỏi):
   - Auth provider? → **stack=cloudflare**: default email/password via better-auth. **stack=supabase**: default Supabase Auth (email/password + magic-link option).
   - User roles + permissions? → infer từ PRD persona section
   - Database tables + relationships? → infer từ data entities trong PRD
   - File uploads? → check PRD scope, nếu có → **stack=cloudflare**: Cloudflare R2. **stack=supabase**: Supabase Storage.
   - API endpoints? → derive từ user stories
   - External services? → check PRD integrations section
   - **Chỉ hỏi PO** mục thực sự không infer được. Không hỏi boilerplate.

## Meta-Harness 5-Phase

### Phase 1 — PLAN (Rolling Wave)

> **Pipelining principle:** Plan và Implement KHÔNG sequential. Sprint 1 plan xong → dev sprint 1 ngay; planner song song refine sprint 2+. Goal: ZERO idle time của dev.

6. **Activate** `karpathy-guidelines` + `meta-harness` + `web-frameworks` + `devops` + `better-auth` + `shadcn-ui-design`.
7. **Read PRD** `prd/<slug>.md`. Extract scope, acceptance criteria, auth, data schema, **epics (4.4)**, **platform (4.3)**.
8. **Mode != no-design:** read tokens (nếu có).
9. **Delegate** `planner` → build plan (epic-level Dependency Graph + sprint breakdown):
   - Output `plans/{slug}/dep-graph.md` — DAG ai depends ai (vd: E1 Auth blocks E2/E3/E4)
   - **Sprint 1:** detail FULL (file list, contracts, tests). Mark `ready_to_implement: true`.
   - **Sprint 2+:** outline only (`ready_to_implement: false`). Refine sau khi sprint 1 done.
   - File ownership per **epic**, không per layer (vd: `src/app/(auth)/**` cho E1 FE, `src/api/auth/**` cho E1 BE).
10. **Generate API contract** `plans/{slug}/api-contract.md` — MANDATORY trước fork (full contract upfront, để các epic không conflict):
    ```markdown
    # API Contract: <product>

    ## Auth (Provider: better-auth (email/password) | Roles | Session)

    ## Endpoints (group by Epic)
    ### E1 Auth
    | Method | Path | ... |
    ### E2 ...

    ## DB Schema (group by Epic)

    ## File Storage (Cloudflare R2 nếu PRD cần)
    ```

11. **Credential Gate (MANDATORY — parallel với planner, KHÔNG block BE code):**

    BE code dùng `process.env.*` (KHÔNG hardcode). Nhưng **deploy + DB setup cần credentials** — hỏi PO EARLY để setup chạy parallel với code, không chặn SHIP.

    a. **Detect infra needs** từ PRD + stack:
       - Always: Cloudflare account (Workers + D1) → `wrangler whoami`
       - File uploads (PRD section X): Cloudflare R2 → bucket name + API token
       - OAuth (PRD auth): provider IDs + secrets (Google/GitHub/...)
       - External APIs (PRD integrations): API keys
       - Better-auth: session secret (agent tự generate, không hỏi)

    b. **Generate `.env.example`** tại root với mọi key cần thiết (empty values + inline comments).

    c. **AskUserQuestion per infra** — questions branch on **chosen BE stack** (step 5):

       **stack=cloudflare:**
       - Cloudflare Workers/Pages: `Đã login wrangler (Recommended)` / `Guide me qua wrangler login` / `Skip — setup sau` / Other
       - D1: auto-detected from wrangler login (no separate question unless skipped above)
       - R2 (nếu PRD cần upload): `Có account ID + API token` / `Tạo mới qua dashboard` / `Skip — upload sau` / Other
       - OAuth (nếu PRD require): `Có client ID + secret` / `Dùng email/password thôi (better-auth)` / Other

       **stack=supabase:**
       - Supabase project: `Có project URL + anon key + service role key (Recommended)` / `Tạo mới qua dashboard.supabase.com` / `Skip — setup sau` / Other
       - Database URL (cho drizzle direct queries): `Có DATABASE_URL connection string` / `Lấy từ Supabase dashboard → Project Settings → Database` / `Skip` / Other
       - Hosting (Vercel/Netlify): `Đã link repo với Vercel (Recommended)` / `Setup sau khi BE code xong` / Other
       - Storage (nếu PRD cần upload): `Tạo bucket qua Supabase dashboard` / `Skip — upload sau` / Other
       - OAuth providers (nếu PRD require): `Configured trong Supabase Auth` / `Email/password thôi` / Other

       **All stacks:** External APIs (nếu có): `Có keys sẵn` / `Mock cho MVP` / Other

    d. **Per infra response:**
       - `Đã có` → PO paste vào `.env.local` (agent KHÔNG echo/log secret, chỉ verify key exists via `[ -n "$VAR" ]`)
       - `Guide` → agent output step-by-step instructions + wait PO confirm
       - `Skip` → mark trong `plans/{slug}/credential-status.md`, BE code phần deploy-dependent được SKIP cho đến khi PO fill .env

    **Defense in depth:** `.claude/hooks/privacy-block.cjs` (registered at PreToolUse) tự động gate Read/Bash access vào `.env`, `.env.local`, `.env.*` — yêu cầu user approval trước khi agent đọc. Đây là safety net nếu agent vô tình thử read secrets.

    e. **Output** `plans/{slug}/credential-status.md` — schema branches by chosen stack:

       **stack=cloudflare:**
       | Service | Status | Blocking what? |
       |---|---|---|
       | Cloudflare Workers/Pages | ✅ / ⏳ / ❌ | deploy, `wrangler dev` |
       | D1 | ✅ / ⏳ / ❌ | migrations, seed |
       | R2 | ✅ / ⏳ / ❌ | file upload epic |
       | OAuth (provider) | ✅ / ⏳ / ❌ | login epic |

       **stack=supabase:**
       | Service | Status | Blocking what? |
       |---|---|---|
       | Supabase project | ✅ / ⏳ / ❌ | DB queries, auth, RLS |
       | DATABASE_URL | ✅ / ⏳ / ❌ | drizzle migrations, seed |
       | Hosting (Vercel/...) | ✅ / ⏳ / ❌ | preview/prod deploy |
       | Supabase Storage | ✅ / ⏳ / ❌ | file upload epic |
       | OAuth (provider) | ✅ / ⏳ / ❌ | social login epic |

    **Guardrail (stack-specific commands):** Nếu ALL credentials pending/skipped → BE chỉ code logic (endpoints, schema types, middlewares). KHÔNG run infra commands:
    - **stack=cloudflare:** skip `wrangler d1 create`, `wrangler d1 migrations apply`, `npx tsx scripts/seed.ts`, `wrangler deploy`
    - **stack=supabase:** skip `supabase migration up`, `psql $DATABASE_URL`, `vercel --prod`, `npx tsx scripts/seed.ts`

    Mark sprint eval = "code-only, needs infra setup".

### Phase 2 — IMPLEMENT (Pipelined Fork-Join + Sub-agent fan-out)

```
Sprint 1 plan ready ──┐
                      ├──→ Spawn dev (FE+BE+Design parallel) for sprint 1
Planner refine S2    │       │
                      │       ├─→ FE agent → spawn N sub-agents (1 per independent epic)
                      │       └─→ BE agent → spawn N sub-agents (1 per independent epic)
Sprint 2 ready  ─────┴──→ Spawn dev sprint 2  ...etc
```

**SPRINT SIZING HEURISTIC (NEW — fixes Dat friction):**
Planner classifies epics → group into sprints theo rule:
- **1 sprint** khi: ≤3 epics AND no FK chain (E2 không depend E1's schema) AND total ≤2 weeks effort.
- **2 sprints** khi: 4-6 epics OR có FK chain (group dependency-source epics vào sprint 1, dependents vào sprint 2) OR auth/permission epic exists (always sprint 1).
- **3+ sprints** khi: ≥7 epics OR multi-stage migration. Rare cho MVP scope.
- **Default cho Dat's case** (3 epics: Auth → Rooms → Bookings, FK chain E3→E2→E1): **2 sprints**, sprint 1 = Auth+Rooms (independent), sprint 2 = Bookings (depends both).

**INTRA-SPRINT ORDERING (NEW — fixes schema race):**

Khi có 2+ BE epic-agents trong CÙNG sprint với schema dependency, "fire all in 1 message" KHÔNG đủ. Use ONE of these patterns:

- **Pattern A (Schema-owner first, recommended cho 2-3 BE epics):**
  - Identify schema-owner agent (epic owns `src/db/<entity>/`).
  - Spawn schema-owner SOLO trong message 1; wait for SHIP (Task tool blocks anyway).
  - Spawn dependent BE agents trong message 2, parallel với FE agents.
  - Cost: 1 extra round-trip (~30s). Eliminates race.
  - **HARD ENFORCEMENT (NEW):** orchestrator MUST verify before message 2:
    1. `git status src/db/` → schema files committed (or staged).
    2. `grep -l "export.*schema" src/db/*.ts` → at least 1 export visible.
    3. If either check fails → abort message 2 spawn, escalate PO via AskUserQuestion: `Schema-owner did not commit schema. (a) Wait + retry / (b) Drop to Pattern B / (c) Abort`. KHÔNG silent batch — Pattern A's correctness depends on schema being readable when dependent agents spawn.
- **Pattern B (Contract-stub, recommended cho ≥4 BE epics):**
  - Lead writes ALL `src/db/schema.ts` stubs (empty types matching api-contract.md) BEFORE any BE spawn.
  - Stubs committed to `src/db/` PRE-FORK as read-only shared types.
  - All BE epic-agents spawn parallel trong 1 message. Each agent fills implementation cho schema mình owns.
  - Cost: 5-10 min lead pre-work. Better cho many parallel epics.

Planner MUST output `sprint-{N}-strategy: A|B` field cho mỗi sprint trong dep-graph.md. team-vibe orchestrator reads this before spawning Phase 2.

**PARALLEL EXECUTION RULES (CRITICAL — these are the speed levers):**

1. **Fire ALL Task() calls trong CÙNG 1 message (tool_use block duy nhất).** Nếu gọi Task lần 1 rồi chờ response mới gọi lần 2 → ông đang serialize, defeats purpose. Correct: `[Task-FE-epic-A, Task-FE-epic-B, Task-BE-epic-A, Task-BE-epic-B]` — 4 cuộc gọi 1 message.

2. **Model tier per epic** (đừng mặc định Sonnet cho mọi thứ):
   | Epic complexity | Model | Khi nào |
   |---|---|---|
   | Simple | `model: "haiku"` | CRUD form, static page, settings screen, single-table API |
   | Medium | `model: "sonnet"` (default) | Auth flow, dashboard logic, multi-entity CRUD |
   | Complex | `model: "opus"` | Permission matrix, real-time sync, complex migrations, critical-path business logic |

   Planner phải classify mỗi epic trong dep graph → mark `complexity: simple|medium|complex` (xem planner.md rolling-wave schema cho field này) → team-vibe pass model arg tương ứng khi spawn. **team-vibe expects planner output to include `complexity` field at epic level** — nếu field thiếu, default `medium`.

   **Concrete spawn example** (1 message, 4 parallel Task calls, mixed tiers):
   ```
   Task(subagent_type: "fullstack-developer", model: "haiku",
        description: "FE: settings page",
        prompt: "Epic E5 (simple). Own src/app/(settings)/**. Contract: plans/260417-kanban/api-contract.md §E5. ...")
   Task(subagent_type: "fullstack-developer", model: "sonnet",
        description: "FE: dashboard",
        prompt: "Epic E3 (medium). Own src/app/(dashboard)/**. ...")
   Task(subagent_type: "fullstack-developer", model: "sonnet",
        description: "BE: dashboard API",
        prompt: "Epic E3-BE (medium). Own src/api/dashboard/**. ...")
   Task(subagent_type: "fullstack-developer", model: "opus",
        description: "BE: permission matrix",
        prompt: "Epic E1-BE (complex). Own src/api/auth/**, src/lib/permissions/**. ...")
   ```
   All 4 fired in the SAME tool_use block → true parallel. Not: `Task(...)` → wait → `Task(...)`.

3. **`run_in_background: true`** cho long-running commands (>30s): `npm install`, `pnpm install`, `wrangler deploy`, `pnpm build`, `playwright test` full suite. Agent không block chờ output → parallel với công việc khác. Monitor qua `BashOutput` khi cần.

**FE Fork (per sprint, sprint-level parallel với BE):**
11. **Delegate** `fullstack-developer` (FE mode) cho mỗi sprint ready:
    - Read dep graph. **Identify epics trong sprint không depend nhau.**
    - **Nếu 2+ independent epics → spawn N sub-agents song song** (Task tool, mỗi sub-agent = 1 epic).
    - File ownership PER EPIC (vd: agent-A owns `src/app/(snacks)/**`, agent-B owns `src/app/(admin)/**`). KHÔNG overlap.
    - Mock API: **shared orchestrator** `src/mocks/index.ts` (read-only reference, không tạo mới) + per-epic handler `src/mocks/<epic>/handlers.ts` — static JSON matching contract. FE agent owns `src/mocks/<epic>/` chỉ cho epic của mình, KHÔNG viết vào `src/mocks/index.ts` (lead wires root index sau khi tất cả epics done).
    - Apply design tokens.
    - **Single epic per sprint:** chạy 1 agent, không fan-out.

**BE Fork (per sprint, sprint-level parallel với FE):**
12. **Delegate** `fullstack-developer` (BE mode) cho mỗi sprint ready:
    - **Read `credential-status.md` trước.** Code dùng `process.env.*` (KHÔNG hardcode bất kỳ key/URL).
    - Same fan-out logic: independent epics → sub-agents song song.
    - File ownership PER EPIC: `src/api/<epic>/**`, `src/db/<epic>/**`, migrations đặc trưng.
    - **Cloudflare configured:** Setup D1 `wrangler d1 create <slug>-db` + migrations (sprint 1 only). **Pending/skipped:** chỉ generate migration files, KHÔNG run `wrangler` commands.
    - Setup better-auth: email/password (sprint chứa E_auth). Session secret tự generate vào `.env.example`.
    - File uploads R2 (epic cần) — **R2 configured:** setup bucket + signed URL endpoint. **Skipped:** code endpoint dùng env vars, mark TODO trong README.
    - Seed: `scripts/seed.ts` (sprint cuối) — **D1 configured:** chạy. **Skipped:** generate file, document trong README.

**Design Gate (BLOCKING cho FE, PARALLEL với BE):**
13. **Mode = `basic-first`:** delegate `/team-design --scope=skeleton` — **BLOCK FE start** đến khi design done (min 1 màn/epic, max 3 màn). BE start ngay parallel.
14. **Mode = `strict-match`:** delegate `/team-design --scope=full` — **BLOCK FE start** đến khi design done (all screens polished). BE start ngay parallel.
15. **Mode = `no-design`:** không design gate, FE+BE start ngay parallel.

**Execution order:**
- t=0: BE sprint 1 fork start, Design gate start (mode != no-design)
- t=design_done: FE sprint 1 fork start
- BE và FE chạy parallel sau design done

**Sprint join + sprint roll-forward:**
16. Khi FE epic-agents + BE epic-agents của sprint N done:
    a. **Lead wires `src/mocks/index.ts`** (NEW — explicit step): aggregate per-epic mock handlers từ `src/mocks/<epic>/handlers.ts` files. Lead = team-vibe orchestrator (the agent running this command), KHÔNG fan-out — single Edit operation. Step happens BEFORE integration test.
    b. **Per-sprint contract check (NEW — drift detection EARLY):** spawn 1 sub-agent với prompt "Read api-contract.md §<sprint-N-epics> + scan src/api/<epic>/route.ts + src/mocks/<epic>/handlers.ts JUST cho sprint N. Report drifts. JSON `{drifts: []}`. No fixes." Catches FE↔BE shape divergence per-sprint instead of waiting until step 17a (final merge). Drift found → REFINE sprint N agents BEFORE rolling forward → cheaper than catching at end. >3 drifts → escalate PO.
    c. **Sprint integration test:** verify epics trong sprint hoạt động (không cross-sprint yet).
    d. **Update dep graph:** mark epic blocks resolved.
    e. **Trigger sprint N+1** (planner đã refine xong sprint N+1 song song).
17. **Final auto-merge** (sau sprint cuối):
    a. **Contract conformance final check (cross-sprint validator):** complement to per-sprint 16b (which runs earlier per sprint). Final pass scans ALL sprints + cross-sprint integration points (e.g. shared types, FK references across epic-owned schemas):
       - For each `src/api/**/route.ts`: extract export signature (HTTP methods, request body type, response type).
       - For each `src/mocks/**/handlers.ts`: compare mock shape vs api-contract.md spec.
       - Cross-sprint check: shared types in `src/types/` consistent across consumer epics? FK refs in `src/db/` resolve?
       - Fail if any FE consumer expects field that BE response doesn't provide, OR if any cross-sprint reference broken.
       - Implementation: lead spawns 1 sub-agent với prompt "Read api-contract.md + scan src/api/**/route.ts + src/mocks/**/handlers.ts + src/types/**. Report any drift (FE/BE shape, cross-sprint refs). Output JSON `{drifts: []}`. No fixes — just report."
       - Drift found → REFINE loop. Most drifts already caught by 16b — finding new ones at 17a usually means cross-sprint integration issue, escalate to PO if >2. KHÔNG silent merge.
    b. Remove mocks: delete `src/mocks/`, update imports → real API.
    c. Wire FE → BE: fetch calls → real `/api/*`.
    d. Shared types: `src/types/` consistent.
    e. Run `pnpm dev` + `wrangler dev` — verify start.
    f. Smoke test: 3 flows (login, CRUD, permission).
    g. Apply design tokens → `tailwind.config.ts`.

### Phase 3 — EVALUATOR

**Setup:**
18. D1 test DB: `wrangler d1 create <slug>-test-db --local`
19. Migrations: `wrangler d1 migrations apply <slug>-test-db --local`
20. Seed: `npx tsx scripts/seed.ts`
21. Start: `pnpm dev`

**Evaluate:**
22. **Load profile** `.claude/evaluator-profiles/full-app.json`.
23. **Run Playwright** (fallback: manual browser):
    - Auth: login → dashboard → logout → unauthorized redirect
    - Permission: từng role pair (employee vs manager, etc.)
    - CRUD: create → list → update → delete
    - File upload nếu PRD require
    - API status codes (200, 401, 403, 404, 422)
    - Form validation, error states
    - Responsive: mobile + desktop
24. **Score** 9 criteria (Functionality:10, Security:10, Completeness:8, Performance:8, ...).
25. **Verdict:** SHIP / REFINE (loop Phase 2 sprint failed) / REJECT.

### Phase 4 — TRACE
26. **Write trace** `.claude/traces/runs/{date}-fullapp-{slug}.json`. Include sprint timing + sub-agent count. Schema: `templates/trace-schema.json`. Same-day reruns: append `-HHMM` (e.g., `260417-fullapp-myapp-1430.json`).

### Phase 5 — EVOLVE (only if retries > 0)
27. **Friction check:** retries == 0 → silent skip. retries > 0 → invoke `meta-harness` skill in `--evolve` mode, pass trace path `.claude/traces/runs/{date}-fullapp-{slug}.json`. Skill auto-picks highest-friction từ `friction_summary.highest_retry_skill`, runs `program.md` loop, enforces AskUserQuestion confirm before mutating. Workflow KHÔNG inline-execute — delegate hết cho meta-harness.

## File Ownership (per Epic, not per Layer)

```
FE epic-agents → src/app/(<epic>)/**, src/components/<epic>/**, src/mocks/<epic>/** (per-epic subdir only; src/mocks/index.ts = lead-owned, read-only for agents)
BE epic-agents → src/api/<epic>/**, src/lib/<epic>/**, src/db/<epic>/**, migrations/<epic>/**
Design        → designs/**, design-system/**
Shared        → src/types/** (read-only sau plan), api-contract.md (read-only sau plan)
Scripts       → scripts/seed.ts (BE main agent, sprint cuối)
```

## Guardrails
- KHÔNG block khi thiếu PRD / design — auto-initiate
- KHÔNG skip API contract trước fork (full upfront để epic-agents không conflict)
- KHÔNG skip Credential Gate — hỏi PO EARLY, không đợi BE code xong rồi mới phát hiện thiếu key
- KHÔNG hardcode credentials — luôn `process.env.*` + `.env.example`
- KHÔNG echo/log secret values khi PO paste vào .env
- KHÔNG sub-agent edit file ngoài epic ownership
- KHÔNG wait full plan trước implement — sprint 1 ready là dev sprint 1
- KHÔNG mock DB trong final build — D1 thật (trừ khi credential skipped)
- KHÔNG ship thiếu auth flow
- KHÔNG generate features ngoài PRD scope
- Auth default: email/password via better-auth. OAuth chỉ khi PRD specify.

## Success
- App chạy local (`pnpm dev` + `wrangler dev --local`)
- Playwright full pass, ALL scores ≥7
- Auth flow verified per role
- CRUD persistence → D1 verified
- File upload → R2 verified (nếu cần)
- Seed script tạo test data
- `src/` có README deploy Cloudflare
