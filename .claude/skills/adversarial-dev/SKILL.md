---
name: adversarial-dev
description: "GAN-inspired Generator→Evaluator pipeline. Builds sprint-by-sprint then adversarially tests the running app with Playwright like a real user. Works standalone OR after /plan."
argument-hint: "<product idea> OR <path-to-plan>"
---

# Adversarial Dev - Generator → Evaluator (with optional Planner)

GAN-inspired harness. Evaluator's job is to **break** the generator's code, creating adversarial tension that eliminates self-evaluation bias.

Based on: [coleam00/adversarial-dev](https://github.com/coleam00/adversarial-dev) + [Anthropic harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)

## Usage

```
# Standalone (includes Planner phase)
/adversarial-dev "a task management app with kanban boards"

# After /plan (skips Planner, uses existing plan)
/plan "a task management app with kanban boards"
/adversarial-dev path/to/plans/260411-1050-task-management/plan.md

# Or auto-detect from Plan Context (active plan from hooks)
/adversarial-dev --continue
```

## Integration with /plan

**When existing plan detected (any of these):**
- Argument is a path to `plan.md` or `phase-*.md`
- `## Plan Context` shows `Plan: {path}` (active plan from hooks)
- `--continue` flag used

→ **Skip Phase 0 (Planner)**. Convert plan phases into sprints automatically:
- Each `phase-*.md` file → 1 sprint
- Extract requirements, success criteria, related files from phase files
- Respect task dependencies from `addBlockedBy` chains

**When no plan exists:**
- Run built-in Planner to generate `spec.md` (standalone mode)

## Pipeline

```
[/plan exists?]
   YES → convert phases to sprints
   NO  → [Planner] → spec.md → extract sprints
         ↓
[Contract Negotiation] → sprint contracts (JSON)
         ↓
[Generator] → builds sprint N
         ↓
[Evaluator] → Playwright tests running app → scores 4 criteria
         ↓
  score ≥7 all? ──YES──→ next sprint
       │
       NO (retry ≤3)
       ↓
  [Generator] ← feedback.json
```

## Phase 0: Planner (Spec Generation)

**SKIP IF:** Existing plan detected (see "Integration with /plan" above)

**Agent:** `planner` subagent (Opus)
**Input:** User's 1-4 sentence prompt
**Output:** `{plan_dir}/spec.md`

**Instructions for Planner:**
- Be AMBITIOUS about scope — expand a simple idea into a feature-rich product
- Focus on PRODUCT context: features, user stories, design language, UX flow
- Do NOT prescribe technical implementation details (prevents error cascade)
- Organize features into numbered sprints (aim for 5-10 sprints)
- Each sprint must define specific, testable behaviors
- Include design language/visual identity for frontend
- Tech stack: React + Vite (frontend) + FastAPI + SQLite (backend) — unless user specifies otherwise

**Spec format:**
```markdown
# Product: {name}
## Vision
## Design Language
## Tech Stack
## Features
## Sprint Breakdown
### Sprint 1: {name}
- Features: [list]
- Testable behaviors: [list]
- Acceptance criteria: [list]
### Sprint 2: ...
```

## Phase 1: Contract Negotiation

For each sprint, before implementation:

1. **Generator proposes** success criteria for the sprint → `{plan_dir}/contracts/sprint-{n}.json`
2. **Evaluator reviews** and tightens: adds edge cases, specificity, measurable thresholds
3. Both lock in the JSON contract

**Contract format:**
```json
{
  "sprint": 1,
  "name": "Sprint name",
  "features": ["feature1", "feature2"],
  "success_criteria": [
    { "id": "SC-1", "description": "...", "testable": true },
    { "id": "SC-2", "description": "...", "testable": true }
  ],
  "edge_cases": ["..."],
  "constraints": ["..."]
}
```

**Why JSON:** Models are less likely to tamper with structured JSON than markdown.

## Phase 2: Generator (Implementation)

**Agent:** `fullstack-developer` subagent
**Input:** `spec.md` + `contracts/sprint-{n}.json` + any prior `feedback/sprint-{n}-round-{m}.json`
**Output:** Working code committed to the project

**Instructions for Generator:**
- Read spec and contract for current sprint ONLY — narrow focus
- Implement features one sprint at a time
- Install dependencies as needed
- Start dev server and verify it runs
- Git commit after each logical component
- Do NOT self-evaluate — trust the evaluator entirely
- On retry: read evaluator feedback, decide whether to REFINE or PIVOT approach

**Tech stack (default):**
- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLite
- Styling: Tailwind CSS

## Phase 3: Evaluator (Adversarial Testing)

**Agent:** `tester` subagent with Playwright/browser tools
**Input:** Running application URL + `contracts/sprint-{n}.json`
**Output:** `{plan_dir}/feedback/sprint-{n}-round-{m}.json`

**Instructions for Evaluator:**
- Your job is to BREAK the code, not confirm it works
- Run the application and interact like a REAL USER via browser
- Test every success criterion in the contract
- Probe for failures, edge cases, broken UI, dead links
- Take screenshots as evidence

**Four Scoring Criteria (each 1-10):**

| Criterion | What to evaluate |
|-----------|-----------------|
| **Design Quality** | Visual coherence, consistent identity, mood, layout quality |
| **Originality** | Custom creative choices vs template/generic look |
| **Craft** | Typography, spacing, color usage, technical polish |
| **Functionality** | Features work correctly, usability, error handling |

**Scoring rules:**
- Pass threshold: **≥7 on ALL four criteria**
- Be harsh but fair — 7 means "good enough to ship"
- Provide specific, actionable feedback for any score <7
- Include evidence (screenshots, error messages, specific UI elements)

**Feedback format:**
```json
{
  "sprint": 1,
  "round": 1,
  "scores": {
    "design_quality": 8,
    "originality": 6,
    "craft": 7,
    "functionality": 5
  },
  "passed": false,
  "failures": [
    { "criterion": "originality", "score": 6, "issue": "...", "suggestion": "..." },
    { "criterion": "functionality", "score": 5, "issue": "...", "suggestion": "..." }
  ],
  "evidence": ["screenshot paths or descriptions"],
  "summary": "Brief overall assessment"
}
```

## Retry Logic

- **Max retries per sprint:** 3
- **On failure:** Evaluator feedback JSON → Generator reads and retries
- **On 3 failures:** STOP sprint, report to user, ask whether to skip or intervene
- **On pass:** Move to next sprint, carry momentum

## File Structure

All artifacts stored in plan directory:

```
{plan_dir}/
├── spec.md                          # Planner output
├── contracts/
│   ├── sprint-1.json                # Negotiated contracts
│   ├── sprint-2.json
│   └── ...
├── feedback/
│   ├── sprint-1-round-1.json        # Evaluator feedback
│   ├── sprint-1-round-2.json
│   └── ...
├── progress.json                    # Overall state tracking
└── reports/
    └── adversarial-dev-report.md    # Final summary
```

**`progress.json` format:**
```json
{
  "total_sprints": 8,
  "current_sprint": 3,
  "completed_sprints": [1, 2],
  "failed_sprints": [],
  "status": "in_progress"
}
```

## Orchestration Flow (Step by Step)

1. **Parse input** — extract product idea
2. **Create plan directory** with naming convention from hooks
3. **Run Planner** → generate `spec.md`
4. **Show spec to user** → ask for approval before proceeding
5. **For each sprint N:**
   a. **Contract Negotiation** — Generator proposes, Evaluator tightens
   b. **Save contract** → `contracts/sprint-{n}.json`
   c. **Generator implements** sprint N
   d. **Start dev server** if not running
   e. **Evaluator tests** running app against contract
   f. **If all scores ≥7:** mark sprint complete, continue to N+1
   g. **If any score <7 and retries < 3:** save feedback, Generator retries
   h. **If retries exhausted:** stop and report to user
6. **All sprints complete** → generate final report
7. **Cleanup** — stop dev servers, summarize results

## Configuration

Override defaults via arguments:

| Flag | Default | Description |
|------|---------|-------------|
| `--max-retries` | 3 | Max retries per sprint |
| `--pass-threshold` | 7 | Min score to pass (1-10) |
| `--skip-negotiation` | false | Skip contract negotiation phase |
| `--stack` | react-fastapi | Tech stack preset |
| `--auto` | false | Skip user approval gates |

## Key Principles

1. **Separation of concerns** — Generator NEVER self-evaluates; Evaluator NEVER generates code
2. **Adversarial tension** — Evaluator's explicit job is to find flaws, not confirm success
3. **File-based communication** — Agents communicate via structured files, not conversation history
4. **Narrow focus** — Each agent sees only what it needs for its current task
5. **Fail fast** — Hard cap on retries prevents infinite loops and cost explosion

## Stop Conditions

- User says "stop", "cancel", "abort"
- Same sprint fails 3 consecutive times
- Dev server won't start after 3 attempts
- Total cost exceeds reasonable bounds (report to user)
- All sprints complete (success)
