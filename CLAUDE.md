# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
```

No test runner is configured. Manual PDF/Excel testing: `node scripts/test-pdf.mjs` / `node scripts/test-excel.mjs`.

## Project: Farline Nabídky

A web platform replacing Filip Kott's (Farline Living) manual Google Sheets workflow for premium sanitary-tech quotes for architects. Core flow: **product catalog → build offer → share public link → architect comments → export PDF/Excel**.

- Pilot scope: 25 000 CZK, 2 weeks, **no Money S3 integration** (Phase 2).
- Demo deadline: 2026-05-15. Architecture is intentionally static/JSON-backed — no database, no auth.

## Architecture

**Route split:**

| Route group | Who sees it | Has sidebar |
|---|---|---|
| `app/(internal)/` | Filip only | Yes (`Sidebar` + `StoreProvider`) |
| `app/share/[id]/` | Public / architects | No sidebar, no auth, read-only + comment form |

Never let internal actions, sidebar, or Filip-only data leak into `/share/[id]`. That boundary is strict.

**State management** — `lib/store.tsx` is a React Context (`StoreProvider`) that boots from static JSON in `data/`. All mutations are in-memory only (no persistence between page reloads). Internal and share routes each wrap their own `StoreProvider` independently.

**Data files** (source of truth for demo): `data/products.json`, `data/offers.json`, `data/comments.json`.

**Key lib files:**
- `lib/types.ts` — all shared types (`Product`, `Offer`, `OfferItem`, `Comment`, `OfferSummary`) and Czech label maps
- `lib/calculations.ts` — all money math (`itemTotalBeforeDiscount`, `itemTotalAfterDiscount`, `offerSummary`, `formatCurrency`). Keep all arithmetic here; never compute prices inline in components
- `lib/store.tsx` — `StoreProvider`, `useStore()`, `createEmptyOffer()`, `uid(prefix)`
- `lib/pdf-export.ts` — jsPDF-based export (uses Roboto fonts from `public/fonts/`)
- `lib/excel-export.ts` — ExcelJS-based export

**Fonts:** Satoshi (display/headings, loaded from fontshare CDN via `<head>`), Geist Sans (body), Geist Mono (numbers/codes). CSS var: `--font-display`. Always use `font-mono tabular-nums` for any rendered money or numeric value.

## Design System — Non-Negotiable

- **Accent:** `#8B7355` (aged brass), exposed as `var(--accent)` in CSS
- **Background:** `#FAFAF8`, surfaces white, text `zinc-900`/`zinc-500`, borders `slate-200/50`
- **Banned:** purple, neon, gradient text, pure `#000000`, Inter font, Framer Motion, emoji in UI
- **Status colors:** `rozpracovana`=zinc-400, `odeslana`=sky-600, `okomentovana`=amber-500, `potvrzena`=emerald-600
- Icons: `@phosphor-icons/react`, always `strokeWidth: 1.5` (or `weight="duotone"` for fills)
- Product photos: `aspect-4/3 rounded-2xl object-cover`; hover lifts `-translate-y-[2px]` with shadow
- CTAs: `active:scale-[0.98] active:-translate-y-[1px]` (CSS only, no Framer Motion)

When in doubt about any visual decision, re-read `docs/DESIGN-SYSTEM.md` before improvising.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router |
| Styling | Tailwind CSS v4 |
| State | React Context (`lib/store.tsx`) — no global store library |
| Data (demo) | Static JSON in `data/` |
| PDF | jsPDF + jspdf-autotable |
| Excel | ExcelJS + SheetJS (xlsx) |
| Icons | @phosphor-icons/react |

## Language Note

PRD and all UI copy are in **Czech**. Preserve Czech in user-facing strings. Code identifiers, comments, and commit messages in English.

## Out of Scope (Do Not Build)

Money S3 integration, architect login/portal, AI assistant, newsletter generator, AR wallpaper viz, project portal. Flag any drift into these before implementing.
