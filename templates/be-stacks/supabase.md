# BE Stack: Supabase

> **Alternative to Cloudflare default.** Best fit for: Postgres-native features, mature auth (incl. social, magic-link, RLS), realtime subscriptions, dashboard for ops. Requires migrating away from D1+better-auth scaffold.

## Stack components

| Layer | Tool | Notes |
|---|---|---|
| Hosting | Vercel / Netlify / self-hosted Next.js | Supabase is BaaS, hosting is independent |
| Database | Supabase Postgres | Full Postgres + extensions (pgvector, postgis...) |
| ORM | Drizzle ORM (postgres-js driver) OR `@supabase/supabase-js` client | Drizzle for type-safe queries; supabase-js for auth + realtime |
| Auth | Supabase Auth | Email/password, magic-link, OAuth (Google/GitHub/Apple/...), RLS policies |
| File storage | Supabase Storage | S3-compatible, RLS-aware |
| Realtime | Supabase Realtime | Postgres changes → WebSocket subscriptions |
| Secrets | Vercel/Netlify env vars OR `.env.local` | `SUPABASE_SERVICE_ROLE_KEY` server-only |

## When to choose

- PRD requires realtime features (presence, live cursors, chat) — Supabase Realtime is first-class
- PRD requires Postgres extensions (pgvector for embeddings, postgis for geo, full-text search)
- Team already familiar with Supabase Studio (DB GUI, RLS editor, auth UI)
- Auth needs row-level security policies (Supabase RLS is mature; better-auth doesn't ship RLS)
- Want Postgres connection pooling out-of-box (PgBouncer included)
- Cloudflare lock-in is a concern

## Migration from default starter (when stack=supabase)

> BE epic-agents follow this checklist instead of cloudflare.md.

1. **Remove Cloudflare-specific deps** from `package.json`:
   - `wrangler`, `@cloudflare/next-on-pages`, `@cloudflare/workers-types`, `better-sqlite3`
2. **Add Supabase deps:**
   - `@supabase/supabase-js`, `postgres` (drizzle driver), `@supabase/ssr` (Next.js helpers)
3. **Replace `src/lib/auth.ts`:** swap better-auth for Supabase Auth helpers (`createServerClient` from `@supabase/ssr`).
4. **Replace `src/db/schema.ts` driver import:** `drizzle-orm/postgres-js` instead of `drizzle-orm/better-sqlite3`. Schema syntax unchanged (drizzle abstracts dialect; just verify Postgres-specific column types where used).
5. **Update `drizzle.config.ts`:** `dialect: "postgresql"`, `dbCredentials: { url: process.env.DATABASE_URL }`.
6. **Replace `wrangler.toml`** with hosting config (`vercel.json` or just env vars in Vercel dashboard).
7. **Migrations:** `pnpm db:generate` (drizzle-kit) → `psql $DATABASE_URL -f migrations/0000_*.sql` (or use Supabase migrations CLI: `supabase migration up`).
8. **Seed:** update `scripts/seed.ts` to use postgres driver.
9. **Smoke:** `scripts/smoke.sh` unchanged (curls `/api/health`).
10. **Deploy:** Vercel `vercel --prod` (push branch + auto-deploy via Git integration recommended).

## Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-key>     # server-only, NEVER expose
DATABASE_URL=postgresql://...                # for drizzle direct queries
# Optional (OAuth providers configured in Supabase dashboard):
NEXT_PUBLIC_SITE_URL=https://...
```

## Tradeoffs

- **Pros:** Postgres power (extensions, RLS, joins), realtime built-in, mature dashboard, broader auth provider list, easier migration off if you outgrow it
- **Cons:** 2 vendors (DB + hosting separate), free tier smaller (500MB DB / 1GB storage), no edge runtime by default (functions run in single region unless you add CF Workers in front), more setup than Cloudflare path

## Hybrid option (call out in team-vibe)

For teams wanting Supabase Postgres + Cloudflare edge: deploy Next.js to Cloudflare Pages, point DB at Supabase Postgres via connection pooler (`postgres://...pooler.supabase.com`). Best of both but adds latency between edge and DB region — only viable if DB queries are minimal per request. Not recommended for MVP — pick one stack first.
