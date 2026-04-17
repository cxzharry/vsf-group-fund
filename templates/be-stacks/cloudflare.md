# BE Stack: Cloudflare (Recommended)

> **Default stack for `/team-vibe`.** Best fit for: edge-first apps, low-latency global, generous free tier, Workers-native auth + DB. Pre-scaffolded in `starter/`.

## Stack components

| Layer | Tool | Notes |
|---|---|---|
| Hosting | Cloudflare Pages + Workers | Edge runtime, global CDN |
| Database | Cloudflare D1 (SQLite) | Migrations via drizzle-kit + wrangler |
| ORM | Drizzle ORM | Type-safe, edge-compatible |
| Auth | better-auth (email/password default) | OAuth providers optional |
| File storage | Cloudflare R2 (S3-compatible) | Optional — when PRD scope needs uploads |
| Secrets | `wrangler secret put` | env vars in `.env.local` for dev |

## When to choose

- Edge-first / global low-latency required
- Cost-sensitive (D1 + Workers free tiers generous for MVP)
- Want fewest external services (DB + auth + hosting all under one account)
- TypeScript-first team, comfortable with Drizzle schema-as-code

## Setup checklist (BE epic-agents follow this when stack=cloudflare)

1. Verify `wrangler whoami` shows logged-in account → if not, escalate Credential Gate (see team-vibe.md step 11).
2. Create dev D1 DB: `wrangler d1 create <slug>-dev` → paste `database_id` into `wrangler.toml` `[[d1_databases]]` block.
3. Generate migration: `pnpm db:generate` (drizzle-kit). Verify SQL output sane.
4. Apply migration locally: `pnpm db:migrate:local`.
5. Seed: `pnpm seed:local` (uses `scripts/seed.ts`).
6. Better-auth: ensure `AUTH_SECRET` set in `.env.local` (auto-generate if missing); auth wired in `src/lib/auth.ts`.
7. R2 (only if PRD requires file upload): `wrangler r2 bucket create <slug>-uploads` + add `[[r2_buckets]]` to wrangler.toml.
8. Deploy preview: `pnpm pages:deploy` (requires `wrangler login`).

## Required env vars

```
AUTH_SECRET=<generated>
LOCAL_DB_PATH=./local.db          # dev only
# Optional (R2):
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
# Optional (OAuth):
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Tradeoffs

- **Pros:** edge-fast, no separate DB host to manage, generous free tier, Drizzle types are clean, single vendor
- **Cons:** D1 is SQLite (no Postgres features like CTEs/full-text search out-of-box), Cloudflare lock-in, fewer extensions than Supabase, less mature than Supabase for some auth flows
