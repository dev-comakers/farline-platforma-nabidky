# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This repo currently contains **only the product spec** (`farline-nabidky-prd.md`) — no code, no `package.json`, no build/test commands yet. The PRD is the source of truth for scope, data model, UX, and tech choices until implementation starts. When asked to implement, scaffold the Next.js app at the repo root per §8 of the PRD.

## Project: Farline Nabídky

A web platform replacing Filip Kott's (Farline Living) manual Google Sheets workflow for creating premium sanitary-tech quotes for architects. Core flow: **product catalog → build offer → share public link → architect comments → export PDF/Excel**.

- Pilot scope: 25 000 CZK, 2 weeks, **no Money S3 integration** (Phase 2).
- Demo deadline referenced in PRD: 2026-05-15 (architecture is intentionally static/JSON-backed for demo).

## Planned Stack (PRD §8)

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ App Router |
| Styling | Tailwind CSS v4 |
| State | React `useState`/`useReducer` (no global store) |
| Data (demo) | Static JSON in `app/data/` |
| PDF | `@react-pdf/renderer` or `jsPDF` (client-side) |
| Excel | SheetJS (`xlsx`) |
| Icons | `@phosphor-icons/react`, `strokeWidth: 1.5` everywhere |
| Fonts | Satoshi (headings), Geist (body), Geist Mono (numbers/codes) |
| Animation | CSS transitions + keyframes only — **no Framer Motion** (MOTION_INTENSITY 6) |

Demo uses static JSON + React state. Production (Phase 2) adds Postgres/Supabase, API routes, object storage (S3/R2), Resend/Postmark, NextAuth.

## Architecture (PRD §8.2)

Planned layout at the repo root:

```
app/
├── page.tsx              # Dashboard (Prehled)
├── nabidky/[id]/page.tsx # Offer detail/builder (internal)
├── katalog/page.tsx      # Product catalog
├── share/[id]/page.tsx   # Architect public view — NO sidebar, NO auth
├── data/{products,offers,comments}.json
├── components/           # Sidebar, OfferTable, ProductCatalogPanel, PDFGenerator, ...
└── lib/{types,calculations,pdf-export,excel-export}.ts
```

Routes `/`, `/nabidky*`, `/katalog` are internal (Filip). `/share/[id]` is **public, unauthenticated, read-only** with a comment form — keep this boundary strict; never leak internal actions or sidebar into the share view.

Data model (PRD §6): `Product`, `Offer` (contains `OfferItem[]`), `Comment`, `OfferSummary` (computed). Calculations (subtotal, discount, VAT, total) live in `lib/calculations.ts` — keep all money math there and use Geist Mono with `tabular-nums` for any rendered number.

## Design System (PRD §5) — Non-Negotiable

The product must feel like Lefroy & Brooks / Victoria Albert quality. Hard rules:

- **Single accent color:** aged brass `#8B7355`. Background `#FAFAF8`, surfaces white, text `zinc-900`/`zinc-500`, borders `slate-200/50`.
- **Banned:** purple, neon, gradient text, pure `#000000`, Inter font, serif on dashboard, emoji in UI.
- **Status colors are fixed:** rozpracovana=zinc-400, odeslana=sky-600, okomentovana=amber-500, potvrzena=emerald-600.
- Parameters: `DESIGN_VARIANCE=8` (asymmetric CSS Grid with `fr` units, generous whitespace), `MOTION_INTENSITY=6` (spring-ish CSS, staggered fades, `active:scale-[0.98] active:-translate-y-[1px]` on CTAs), `VISUAL_DENSITY=4` (airy, luxury feel).
- Product photos: `aspect-4/3 rounded-2xl object-cover`. Hover lifts `-translate-y-[2px]` with shadow.

When in doubt about a visual decision, re-read PRD §5 before improvising — the design language is part of the spec, not decoration.

## Language Note

PRD and most UI copy are in **Czech** (Nabídky, Katalog, Prehled, etc.). Preserve Czech in user-facing strings; code identifiers, comments, and commit messages in English.

## Out of Scope (PRD §2.2) — Do Not Build

Money S3 integration, architect login/portal, AI assistant, newsletter generator, AR wallpaper viz, project portal. If a request seems to drift into these, flag it before implementing.
