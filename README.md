# VSF Group Fund

Next.js app cho chia tiền nhóm — bill splitting với chat-first interface, AI intent parsing, VietQR payment.

## Getting Started

```bash
pnpm dev
# http://localhost:3000
```

Edit entry: `app/page.tsx` (auto-reload).

Stack: Next.js (App Router), TypeScript, Tailwind, Supabase (Postgres + Realtime), Claude Haiku (intent).

## `.claude/` Workflow Setup

Shared workflow assets symlinked from master repo `avengers-team`:

```
.claude/
├── commands/           → ../../avengers-team/.claude/commands/       (symlinked)
├── agents/             → ../../avengers-team/.claude/agents/         (symlinked)
├── skills/             → ../../avengers-team/.claude/skills/         (symlinked)
├── evaluator-profiles/ → ../../avengers-team/.claude/evaluator-profiles/ (symlinked)
├── hooks/              (project-local — runtime logs + minor custom tweaks)
├── settings.json       (project-local)
├── traces/             (project-local — evolution log per project)
└── agent-memory/       (project-local)
```

**Commands / agents / skills / evaluator-profiles update tự động** khi `avengers-team` thay đổi. Không edit trong vsf-group-fund — edit ở avengers-team rồi commit.

### Recreate symlinks sau khi clone

Symlinks đã tracked trong git (relative path). Chỉ cần clone cùng cấp `avengers-team`:

```bash
cd /path/to/workspace
git clone https://github.com/cxzharry/avengers-team.git
git clone <vsf-group-fund-repo>
# symlinks tự resolve — không cần recreate
```

Nếu layout khác (không sibling `avengers-team/`) → symlinks broken. Recreate tay:

```bash
cd vsf-group-fund/.claude
rm -rf commands agents skills evaluator-profiles
ln -s <path-to-avengers-team>/.claude/commands commands
ln -s <path-to-avengers-team>/.claude/agents agents
ln -s <path-to-avengers-team>/.claude/skills skills
ln -s <path-to-avengers-team>/.claude/evaluator-profiles evaluator-profiles
```

### Project-specific dirs (KHÔNG symlink)

| Dir | Lý do giữ local |
|---|---|
| `hooks/` | Runtime logs mix nếu symlink; identical scripts nhưng logs cần separate |
| `settings.json` | Project-specific config |
| `traces/` | Evolve log per project (friction data) |
| `agent-memory/` | Per-project context memory |
| `personas/` (root) | Project-specific personas (bill-skeptic, co-payer-member, ...); library chung ở `avengers-team/personas/` |

## Docs

- Project PRDs: `prd/`
- UAT scripts: `uat/<slug>/`
- Design system: `design-system/`
- Plans + reports: `plans/`
- Architecture & roadmap: `docs/`

## Deployment

Vercel. Preview: `.vercel/`.
