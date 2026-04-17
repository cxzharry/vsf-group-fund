---
name: meta-harness
description: "Self-improving adversarial pipeline. Runs adversarial-dev + trace collection + skill evolution from friction data. Use when you want the agent to learn from its own mistakes."
argument-hint: "<task> [--type=prd|design|prototype|fullapp] | --evolve [skill] | --report"
---

# Meta-Harness — Adversarial Dev + Self-Improving Skills

Wraps `adversarial-dev` with trace collection and skill evolution. After building and testing code, analyzes what went wrong and improves the skills that caused friction.

Inspired by [kevinrgu/autoagent](https://github.com/kevinrgu/autoagent) — binary hill-climbing on agent harness config.

## Usage

```
# Full pipeline: build + trace + evolve
/meta-harness "a task management app with kanban boards"

# With output type — auto-loads matching evaluator profile
/meta-harness "<topic> PRD" --type=prd
/meta-harness "<topic> prototype" --type=prototype
/meta-harness "<topic> full app" --type=fullapp

# Standalone evolution from existing traces
/meta-harness --evolve cook
/meta-harness --evolve              # auto-pick highest-friction skill

# View evolution history
/meta-harness --report
```

## Pipeline

```
Phase 1: adversarial-dev (Planner → Contract → Generator → Evaluator)
    ↓ writes trace
Phase 2: Trace Collection → .claude/traces/runs/{id}.json
    ↓
Phase 3: Skill Evolution → program.md loop on highest-friction skill
    ↓
Phase 4: Log → .claude/traces/evolution-log.md
```

## Output Type & Evaluator Profile

When `--type` is specified, meta-harness auto-loads the matching evaluator profile and delegates to `delivery-evaluator` agent:

| `--type` | Profile loaded | Evaluator agent | Tools |
|----------|---------------|-----------------|-------|
| `prd` | `.claude/evaluator-profiles/prd.json` | `delivery-evaluator` | LLM content review |
| `design` | `.claude/evaluator-profiles/design.json` | `delivery-evaluator` | Pencil MCP + LLM |
| `prototype` | `.claude/evaluator-profiles/prototype.json` | `delivery-evaluator` | Playwright basic / browser |
| `fullapp` | `.claude/evaluator-profiles/full-app.json` | `delivery-evaluator` | Playwright full + API |

If `--type` is omitted, meta-harness uses default adversarial-dev evaluator (4 criteria: design_quality, originality, craft, functionality).

## Phase 1: Adversarial Dev Pipeline

Delegates to `adversarial-dev` unchanged. All adversarial-dev flags pass through:

```
/meta-harness "build X" --max-retries 5 --pass-threshold 8
```

See `adversarial-dev/SKILL.md` for full pipeline docs.

## Phase 2: Trace Collection

After Phase 1 completes (or after `delivery-evaluator` runs), write a trace file.

**Trace path:** `.claude/traces/runs/` (project-level, git tracked — team learns together).

**Trace file:** `{date}-{type}-{slug}.json`

```json
{
  "id": "{date}-{type}-{slug}",
  "pipeline": "team-{type}",
  "output_type": "{type}",
  "evaluator_profile": "{type}.json",
  "started": "{ISO-8601 timestamp}",
  "skills_invoked": ["planner", "fullstack-developer", "delivery-evaluator"],
  "evaluator_rounds": [
    {
      "round": 1,
      "scores": { "completeness": 7, "ux_accessibility": 5, "visual_quality": 7 },
      "weighted_average": 6.88,
      "verdict": "refine",
      "fixes": ["mobile responsive", "ARIA labels", "rejection modal"]
    },
    {
      "round": 2,
      "scores": { "completeness": 8, "ux_accessibility": 8, "visual_quality": 7 },
      "weighted_average": 7.71,
      "verdict": "pass"
    }
  ],
  "friction_summary": {
    "highest_retry_skill": "fullstack-developer",
    "lowest_avg_criterion": "ux_accessibility",
    "total_retries": 1
  },
  "outcome": "pass"
}
```

> **Source of truth for trace shape:** `templates/trace-schema.json` (JSON-Schema draft-07, validates the file above). Verdict enum is lowercase canonical (`pass`/`refine`/`abandon`); legacy uppercase `SHIP`/`REFINE`/`ABANDON` in some skill docs map 1:1 to these — when emitting a trace, always write lowercase. Multi-criterion scoring (`scores` + `weighted_average`) is preferred over single `score` for evaluator-profile flows.

**Data sources:**
- `{plan_dir}/feedback/sprint-*-round-*.json` → retry data, scores
- `{plan_dir}/progress.json` → sprint outcomes
- `{plan_dir}/contracts/sprint-*.json` → success criteria

## Phase 3: Skill Evolution

Read `.claude/traces/program.md` for the improvement loop. Use trace data as input.

**Process:**
1. Read latest trace from `.claude/traces/runs/` (if path passed via workflow, use it; else pick most recent file)
2. Identify highest-friction skill from `friction_summary.highest_retry_skill`.
   - **If null** (retries>0 but per-skill data missing) → fallback: AskUserQuestion với top-3 skills từ `skills_invoked[]` array, options: `<skill-A>` / `<skill-B>` / `<skill-C>` / `Skip evolve`. Recommended = first skill in array.
3. Read that skill's SKILL.md + references
4. Run program.md loop: Audit → Hypothesize → Edit → Verify → Score → Keep/Discard
5. ONE change per iteration (isolate variables)
6. **AskUserQuestion confirm gate** trước khi Write skill file: show diff summary, options `Apply (Recommended if score improved)` / `Discard` / `Cancel`.

**Keep/Discard rules (from program.md):**
- Score improved → **KEEP**
- Score same + skill simpler → **KEEP**
- Otherwise → **DISCARD** (log learning anyway)

**Skip conditions:**
- All sprints passed first try (0 retries) → nothing to learn
- User passes `--no-evolve`

## Phase 4: Log & Report

Append to `.claude/traces/evolution-log.md`:

```
| # | Date | Trace | Skill | Change | Before | After | Decision |
```

### --report mode

When called with `--report`, aggregate traces and show:

```
Skill Friction Report (last N runs)
────────────────────────────────────
fullstack-developer  ██████████  12 retries across 3 runs
tester               ████        4 retries across 2 runs
planner              █           1 retry across 1 run

Evolution History
────────────────
#1  cook         — removed duplicate info    6.8 → 7.8  KEEP
#2  fullstack-dev — added auth context       5.2 → 7.1  KEEP
```

### --evolve mode

When called with `--evolve [skill]`:
- Skip Phase 1 (no adversarial-dev pipeline)
- Read existing traces from `.claude/traces/runs/`
- If skill specified → evolve that skill using trace data
- If no skill → auto-pick skill with most accumulated friction
- Run Phase 3 + Phase 4

> **SAFETY (CRITICAL):** standalone `--evolve` mode bypasses caller skills (`/team-prd`, `/team-prototype` etc.) — meaning their Phase 5 PO confirm gate does NOT fire. The mutation gate lives inside `program.md` step 4 (mandatory AskUserQuestion before any SKILL.md write). DO NOT skip that gate. If running in headless / non-interactive context where `AskUserQuestion` is unavailable, ABORT and log "blocked: no PO channel" to `evolution-log.md`. Silent skill mutation is a hard error.

## File Structure

```
.claude/traces/
├── program.md                              # Meta-agent improvement rules
├── evolution-log.md                        # All iterations logged here
└── runs/
    ├── 260416-1137-adversarial-kanban.json  # Trace per pipeline run
    ├── 260415-0900-cook-auth.json
    └── ...
```

## Configuration

| Flag | Default | Description |
|------|---------|-------------|
| `--type` | — | Output type: prd, design, prototype, fullapp. Auto-loads evaluator profile. |
| `--no-evolve` | false | Run pipeline + trace but skip evolution |
| `--evolve [skill]` | — | Standalone evolution mode |
| `--report` | — | Show friction report + evolution history |
| All adversarial-dev flags | — | Pass through to Phase 1 |
