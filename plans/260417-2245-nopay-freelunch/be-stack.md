# BE Stack Decision

**Chosen:** Supabase (Postgres + Auth + Realtime + Storage)
**Date:** 2026-04-17
**PO decision context:** Stack đã được chọn + implemented từ trước khi có team-vibe workflow. Documented trong PRD §4.3a.

## Rationale

- **Realtime** native — cần cho chat feed + bill card update live trong group detail
- **Postgres RLS** — per-group access control (user chỉ thấy bill + debt của group mình join)
- **Mature auth** — email OTP đã có sẵn, không phải implement manual
- **Supabase Storage** — ảnh bill (post-MVP)
- **Ops dashboard** — Supabase Studio cho PO xem data không cần psql

## Template reference

`templates/be-stacks/supabase.md`

## Migration from default starter

App đã migrated xong — KHÔNG phải làm lại. Cloudflare + better-auth scaffold chưa bao giờ tồn tại trong codebase này.

## Epic-agents chú ý

- `@supabase/supabase-js` cho client auth + realtime
- `@supabase/ssr` cho Next.js App Router server components
- Drizzle ORM hiện không dùng (Supabase client + raw SQL). Schema trong `supabase/schema.sql` / migrations
- Auth: Supabase Auth (email OTP) — KHÔNG better-auth
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Tradeoffs accepted

- 2 vendors (Vercel hosting + Supabase DB) — accepted vì giảm complexity của Cloudflare Workers edge runtime
- Free tier 500MB DB — đủ cho < 500 DAU, paid ~$25/mo nếu scale
- Không có edge runtime mặc định — chấp nhận cho MVP tốc độ VN region OK
