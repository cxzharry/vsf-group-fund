@AGENTS.md

# NoPay FreeLunch — CLAUDE.md

> Source of truth cho workflow cho project này. Auto-load mọi session.
> **Human docs:** `README.md`, `docs/product-requirements.md`. CLAUDE.md này là instruction cho Claude Code agent.
> **Upstream workflow:** `avengers-team` super-repo (https://github.com/cxzharry/avengers-team). Thay đổi workflow root → PR vào upstream trước.

## 1. Context

- **Product:** NoPay FreeLunch — app chia bill cho nhóm bạn người Việt.
- **Team:** PO (cxzharry) + Designer (Pencil.dev) + Dev.
- **Delivery:** Full product E2E (Next.js + Supabase). Live URL: https://nopay-freelunch.vercel.app
- **Project-specific rules:** Xem `AGENTS.md` (đã include ở top) — app có đúng 2 tabs ("Nhóm" + "Tài khoản"), không thêm tab.

## 2. Principles (MANDATORY)

- **Karpathy guidelines** — auto-activate every session. Surgical changes, surface assumptions, no overcomplication, verifiable success.
- **YAGNI / KISS / DRY** — không build trước khi cần, đơn giản hơn clever, không lặp logic.
- **Deliverable-driven** — mọi session hướng tới 1 artifact cụ thể.
- **Meta-Harness 5-phase** cho MỌI deliverable: PLAN → IMPLEMENT → EVALUATOR → TRACE (`.claude/traces/runs/`) → EVOLVE (`.claude/traces/program.md`). Không skip phase.
- **AskUserQuestion pattern (MANDATORY khi cần PO input):**
  - Dùng tool `AskUserQuestion` (KHÔNG hỏi free-form).
  - 2-4 options/question. Tool tự thêm "Other" cho PO gõ free text.
  - Mark recommended option với suffix `(Recommended)`.
  - Max 4 questions/call. Group related questions.
  - Self-reason MAX trước khi hỏi — chỉ hỏi item confidence=low hoặc business decision.
- **Language (MANDATORY):**
  - **Content (PRD prose, design plan, user stories, AC, rationale, user-facing copy)** → **tiếng Việt**.
  - **Section headers + template structure + technical jargon** (API, endpoint, schema, OAuth, middleware, webhook, role, session, token, payload, debounce, ...) → **giữ tiếng Anh**.
  - **Code, config, identifiers, file paths** → tiếng Anh.
  - Tránh trộn dịch ngược ("deliver hàng") — chọn 1 ngôn ngữ per concept.

## 3. Workflows

| Command | Output | Design mode? |
|---|---|---|
| `/team-prd` | `docs/product-requirements.md` + `docs/epic-*.md` + `personas/<slug>.md` | N/A |
| `/team-prototype` | `prototypes/<slug>/` | Hỏi: skip / basic-first / strict-match |
| `/team-vibe` | `src/` (full FE+BE) | Hỏi: skip / basic-first / strict-match |
| `/team-design` | `GroupFund.pen` (via Pencil MCP) | N/A |
| `/team-uat` | `uat/<slug>/` | N/A — proactive persona resolution |

**Project paths (project-specific):**
- PRD: `docs/product-requirements.md` (top-level) + `docs/epic-01-*.md` → `docs/epic-05-*.md` (per-epic detail)
- Personas: `personas/group-organizer-vn.md` (primary), `personas/group-member-vn.md` (secondary)
- Design: `GroupFund.pen` (encrypted, chỉ edit qua Pencil MCP `batch_design` / `batch_get`)
- Code: `src/app/` (Next.js App Router) + `src/components/` + `src/lib/` + Supabase schema ở `supabase/`
- Tests: `tests/` (unit + integration)
- Plans: `plans/{date}-{slug}/` + `plans/reports/`
- Templates: `templates/` (prd-full, persona, design-spec, design-styles, be-stacks)

**Argument convention:** Sau slash command, viết tự nhiên — agent tự parse intent + detect input type (topic name / PRD path / prototype path).

**Design modes:** `skip` (no design), `basic-first` (default, design tokens → code), `strict-match` (pixel-match).

**Rolling Wave Plan-Implement (MANDATORY cho team-vibe / team-prototype):** Sprint 1 plan ready → dev sprint 1 ngay; planner refine sprint 2+ song song. KHÔNG wait full plan.

**Sub-agent fan-out per epic (MANDATORY):** FE và BE agents — nếu sprint có 2+ epics independent → spawn N sub-agents song song (Task tool, file ownership PER EPIC, không overlap).

**Design scope (passed to /team-design):** `basic-first` → `--scope=skeleton` (tokens + min 1 màn/epic, **max 3 màn chính**). `strict-match` → `--scope=full` (all screens polished).

**Design Gate:** Cả `basic-first` và `strict-match` đều BLOCK FE start đến khi design done. BE chạy parallel ngay từ t=0. FE chỉ start sau design gate.

**Credential Gate (team-vibe MANDATORY):** Trước Fork-Join, hỏi PO infra credentials EARLY (Supabase URL/keys, Telegram bot token, VietQR) qua AskUserQuestion. BE code dùng `process.env.*` + `.env.example`. Skipped credential → BE chỉ generate code, không run seed. Tránh BE code xong mới phát hiện thiếu key.

Chi tiết từng workflow: đọc `.claude/commands/team-*.md`.

## 4. Evaluators

| Output | Generator | Evaluator Agent | Method | Pass |
|---|---|---|---|---|
| PRD | `prd-writer` | `delivery-evaluator` | LLM checklist + scoring | ALL ≥7 |
| Design | `ui-ux-designer` + Pencil MCP | `delivery-evaluator` | Screenshots + LLM | ALL ≥7 |
| Prototype | `fullstack-developer` (FE) | `delivery-evaluator` | Playwright basic / browser | ALL ≥7 |
| Full App | `fullstack-developer` | `delivery-evaluator` | Playwright full + auth + DB | ALL ≥7 |
| UAT | `team-uat` command + `brainstormer` (new persona) | `delivery-evaluator` | Persona-driven scenarios + Playwright optional | ALL ≥7 |

Profiles: `.claude/evaluator-profiles/{type}.json`. Evaluator agent: `.claude/agents/delivery-evaluator.md`.

## 5. Project Structure

```
vsf-group-fund/
├── CLAUDE.md                # This file (auto-load per session)
├── AGENTS.md                # Project-specific rules (Next.js variant, nav tabs)
├── README.md                # Human docs
├── GroupFund.pen            # Design (encrypted, Pencil MCP only)
├── .claude/
│   ├── agents/              # 10 agents (brainstormer, delivery-evaluator, docs-manager, fullstack-developer, planner, prd-writer, researcher, tester, ui-ux-designer, code-reviewer)
│   ├── commands/            # 5 workflows (team-prd, team-design, team-prototype, team-vibe, team-uat)
│   ├── evaluator-profiles/  # 5 JSON (prd, design, prototype, full-app, uat)
│   ├── hooks/               # privacy-block, scout-block, eval-reminder, trace-collector, ...
│   ├── skills/              # meta-harness, karpathy-guidelines, better-auth, shadcn-ui-design, ...
│   ├── traces/              # program.md, evolution-log, runs/
│   ├── agent-memory/        # Project-specific agent memory (preserve)
│   ├── settings.json        # Hook + permission config
│   └── settings.local.json  # User local overrides
├── docs/                    # PRD + epic files
│   ├── product-requirements.md
│   ├── epic-01-auth.md → epic-05-account.md
│   └── ...
├── personas/                # Shared between PRD + UAT
│   ├── group-organizer-vn.md
│   └── group-member-vn.md
├── templates/               # Pulled from avengers-team
│   ├── prd-full.md
│   ├── persona.md
│   ├── design-spec.md
│   ├── design-styles.md
│   ├── be-stacks/{cloudflare.md, supabase.md}
│   ├── research-report.md
│   └── slug-rule.md
├── src/                     # Next.js App Router
│   ├── app/
│   ├── components/
│   └── lib/
├── supabase/                # Postgres schema + migrations + functions
├── tests/                   # Unit + integration
├── public/                  # Static assets
├── plans/                   # Implementation plans + reports
│   ├── {date}-{slug}/
│   └── reports/
└── node_modules/            # (gitignored)
```

## 6. Stack (current)

Next.js (App Router) + **Supabase (Postgres + Auth + Realtime + Storage)** + shadcn/ui + Tailwind + Tailwind v4 + Lucide icons + Inter font. Đổi stack → justification trong PRD.

**Lưu ý:** Project này đã migrate sang Supabase (không dùng default Cloudflare + better-auth). Xem `templates/be-stacks/supabase.md` cho rationale.

## 7. Skills

- **Always:** `karpathy-guidelines`
- **Prototype/Allin:** `meta-harness`
- **Delivery 1:** `web-frameworks` + `devops` + `shadcn-ui-design`
- **Design:** `shadcn-ui-design` + Pencil MCP
- **Project-specific:** Xem `AGENTS.md` để biết Next.js breaking changes mà training data có thể thiếu.

## 8. Debugging Flow

Khi PO report bug trên deployed app hoặc prototype:
1. PO mô tả bug (screenshot, URL, steps to reproduce)
2. Dùng Playwright MCP reproduce: `browser_navigate` → `browser_click` → verify
3. Đọc code liên quan, xác định root cause
4. Fix → re-run evaluator (delivery-evaluator + cùng profile) → verify fix
5. Ghi trace với `friction_summary` để evolve skill gây bug

## 9. Visual Explanations

Khi cần giải thích architecture, workflow, hoặc data flow:
- `/preview --explain <topic>` — visual explanation ASCII + Mermaid
- `/preview --diagram <topic>` — architecture diagrams
- `/preview --ascii <topic>` — terminal-friendly output

## 10. Hooks (auto-enforcement)

### 10.1 Active Hooks

Tất cả hook nằm tại `.claude/hooks/` (shared deps: `lib/`). Config: `.claude/settings.json`.

| Event | Matcher | Hook | Effect |
|---|---|---|---|
| SessionStart | startup/resume/clear/compact | `session-init` | Detect project type/framework/pkg-manager → ghi env vars cho session |
| SubagentStart | `*` | `subagent-init` | Inject ~200 tokens minimal context per Task() spawn (giảm bootstrap cost cho team-vibe fork-join) |
| PreToolUse | `Write` | `descriptive-name` | Inject naming guidance (kebab-case cho JS/Python/shell, language conventions) |
| PreToolUse | `Bash\|Glob\|Grep\|Read\|Edit\|Write` | `scout-block` | Chặn truy cập heavy paths (node_modules, dist, .git, .venv, __pycache__) theo `.ckignore`. Build commands (npm/wrangler/pnpm) vẫn allowed. |
| PreToolUse | `Bash\|Glob\|Grep\|Read\|Edit\|Write` | `privacy-block` | Gate Read/Bash vào `.env*`, `.aws/`, ssh keys → yêu cầu user approval trước |
| PostToolUse | `Write\|Edit\|MultiEdit` | `eval-reminder` | Sau 3+ writes vào output dirs → remind chạy evaluator |
| PostToolUse | `Write\|Edit\|MultiEdit` | `trace-collector` | Khi eval-report được viết → remind ghi trace JSON |
| PostToolUse | `Write\|Edit\|MultiEdit` | `post-edit-simplify-reminder` | Sau 5+ edits trong session → remind chạy `code-simplifier` (chống bloat) |
| TaskCompleted | `*` | `task-completed-handler` | Inject progress summary cho lead visibility |

### 10.2 Hook Response Protocol

**CRITICAL:** Khi tool call bị hook block, output của hook chứa signal mà agent PHẢI xử lý đúng. KHÔNG bypass.

#### Privacy Block (`privacy-block.cjs`)

Khi hook fire (Read/Bash vào `.env`, `.env.local`, `.aws/credentials`, ...), output chứa JSON giữa `@@PRIVACY_PROMPT_START@@` và `@@PRIVACY_PROMPT_END@@`. Agent MUST:

1. Parse JSON từ hook output.
2. Dùng tool `AskUserQuestion` với data từ JSON (question text + 2 options: approve / skip).
3. Theo response user:
   - **"Yes, approve access"** → re-run tool call ban đầu (bash `cat "filepath"` auto-approved sau khi user consent).
   - **"No, skip this file"** → tiếp tục workflow mà không đọc file đó.

**KHÔNG** bypass privacy-block bằng workaround (đổi `Read` → `Bash cat`, mask path, encode base64, ...). Luôn hỏi user qua `AskUserQuestion` trước.

#### Scout Block (`scout-block.cjs`)

Khi hook block path (node_modules, dist, ...) → stderr có `BLOCKED: Access to '...' denied` + pattern matched. Agent MUST:

1. **KHÔNG** retry cùng path.
2. Nếu thực sự cần access (case hiếm: debugging vendored code) → edit `.ckignore` thêm pattern `!<path>` (negation) → inform user.
3. Default: bypass bằng cách tìm file khác hoặc dùng tool khác (grep trong src/ thay vì toàn repo).

#### Descriptive Name (`descriptive-name.cjs`)

Injection-only (không block). Reminder về naming convention. Tuân theo guidance.

### 10.3 Hook Lifecycle

```
Session start → session-init (env vars set)
            ↓
User prompt → agent thinks
            ↓
Task() spawn → subagent-init (context injected)
            ↓
Tool call → scout-block + privacy-block (may block)
         → descriptive-name (on Write)
         → tool executes
         → eval-reminder + trace-collector + post-edit-simplify (on Edit/Write)
            ↓
Task done → task-completed-handler
```

## 11. Code Quality

- Code file >200 lines → modularize (kebab-case, self-documenting names)
- Check existing modules trước khi tạo mới
- Try/catch + security standards. Code must compile.
- Follow `docs/code-standards.md` khi có
- KHÔNG modularize: markdown, config, env files

## 12. Guardrails

- KHÔNG generate code/doc "for future"
- KHÔNG skip meta-harness phases
- KHÔNG design >7 screens MVP
- KHÔNG đổi stack không justification
- KHÔNG thêm agent/skill mới vào project — update `avengers-team` master trước
- KHÔNG tự chỉnh hooks — update `avengers-team` trước rồi pull về
- KHÔNG thêm tab vào bottom nav — app chỉ có 2 tabs (xem `AGENTS.md`)

---

**Maintainer:** @cxzharry. **Workflow upstream:** [cxzharry/avengers-team](https://github.com/cxzharry/avengers-team) (PR vào master, 1 approval).
