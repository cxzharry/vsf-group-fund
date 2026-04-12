<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# App Navigation

- The app has exactly **2 tabs**: "Nhóm" (Groups) and "Tài khoản" (Account). Do NOT add more tabs.
- Bills, debts, and transfers are accessed from within group detail — not from top-level tabs.
- This applies to both mobile bottom nav (`bottom-nav.tsx`) and desktop sidebar (`desktop-nav.tsx`).
