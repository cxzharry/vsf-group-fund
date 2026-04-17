# Design Styles Menu

Curated style options for `/team-design` AskUserQuestion picker. Designer agent must select **3-5 most relevant styles for the product type**, present them as AskUserQuestion options + Other (Other auto-added by tool), then ask PO confirm BEFORE Phase 2.

> Source extends with `ui-ux-pro-max` skill search (run `python3 $SKILL/scripts/search.py "<style>" --domain style`). Templates here = curated baseline; ui-ux-pro-max = expanded discovery.

## Style Catalog

| Style | Description | When to use | Vibes |
|---|---|---|---|
| **Minimal / Clean** | Generous whitespace, neutral palette, flat surfaces, subtle dividers | SaaS dashboards, B2B tools, productivity apps where focus matters | Calm, professional, content-first |
| **Bold / Vibrant** | Saturated colors, large type, hero accents, strong CTAs | Consumer launches, marketing landing pages, growth funnels | Energetic, conversion-driven |
| **Professional / Enterprise** | Dense info, conservative palette (grays + 1 accent), structured grids, data-heavy tables | Enterprise admin, finance, compliance, internal ops | Serious, trustworthy, data-rich |
| **Playful / Friendly** | Rounded corners, illustrations, warm tones, micro-interactions | Consumer apps, education, kids, social, community | Approachable, delightful, human |
| **Brutalist** | Raw monospace type, hard edges, no-nonsense layout, minimal color | Dev tools, indie creators, design-aware audiences | Confident, anti-trend, distinctive |
| **Glassmorphism** | Translucent surfaces, blurred backgrounds, gradient borders, depth | Modern dashboards, music/media apps, premium-feel SaaS | Premium, futuristic, layered |
| **Neumorphism / Soft UI** | Soft shadows, embossed surfaces, monochrome palette | Niche fintech, fitness, calm productivity tools | Tactile, calm, restrained |
| **Editorial / Magazine** | Strong typography hierarchy, mixed serif+sans, image-led, generous gutters | Long-form content, blogs, news, publication products | Sophisticated, content-first |
| **Cyberpunk / Neon** | Dark base, neon accents (cyan/magenta/lime), monospace + display, glow effects | Gaming, crypto, dev tools, niche tech-forward audiences | Edgy, futuristic, atmospheric |
| **Bento Grid** | Modular card layout, large stat tiles, color-blocked sections | Portfolio, dashboards, product feature showcase | Modern, structured, scan-friendly |
| **Skeuomorphic / Retro** | Real-world textures, vintage typography, nostalgic color | Niche brand products, music apps, hobbyist tools | Warm, nostalgic, distinctive |
| **Luxury / Premium** | Black/cream palette, serif headings, generous spacing, gold/copper accents | High-end e-commerce, hospitality, fashion | Refined, exclusive, slow-paced |

## Selection Rule (designer agent)

1. **Read PRD section 3.1 (persona) + 4.2 (key benefits) + 4.3 (platform).**
2. **Filter catalog** by product type fit (e.g. enterprise admin → Professional/Minimal; consumer launch → Bold/Playful; dev tool → Brutalist/Cyberpunk; fintech → Neumorphism/Minimal).
3. **Pick top 3-5 candidates.** Augment with 1 result from `ui-ux-pro-max` search if it surfaces something unexpected and relevant.
4. **AskUserQuestion** with the 3-5 candidate names as labels. Each label includes 1-line summary. **Default Recommended = top 1 candidate with rationale.** Other auto-added.
5. **Save decision** to `designs/<slug>-style.md` (1-page: chosen style + rationale + token implications + reference links). This file is read-only after save; design.md inherits.

## Custom Style ("Other" path)

If PO picks "Other" → AskUserQuestion follow-up: "Describe style in 1-2 sentences hoặc paste reference URL". Designer maps response to nearest catalog entry + adapts. Document the divergence in `designs/<slug>-style.md`.
