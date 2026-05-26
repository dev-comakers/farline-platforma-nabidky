# Farline Nabídky — Trial Deploy Guide

> **For AI readers:** This document describes a production-ready web application built for Filip Kott (Farline Living, Prague). It is a quote/proposal management platform replacing Google Sheets workflows. The app is fully implemented and ready for staging deployment on Vercel. This guide covers architecture, completed work, deployment steps, and a complete manual QA checklist.

---

## Project Summary

**What it is:** An internal B2B platform for creating, managing, and sharing product quote proposals (nabídky) with architects. Filip (admin) builds quotes from a product catalog, shares them via a unique public link, architects leave comments, Filip exports PDF/Excel and confirms orders.

**Current state:** Fully implemented. All core features working. Ready for trial deployment on Vercel for client approval testing.

**Tech stack:**
- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4 (brass `#8B7355` accent, Satoshi + Geist fonts)
- PostgreSQL + Prisma ORM
- JWT auth (httpOnly cookies)
- Resend (email notifications)
- jsPDF + ExcelJS (exports)
- xlsx (CSV/XLSX import)

---

## Completed Blocks

| Block | Branch | What was built |
|---|---|---|
| 0 | `chore/project-baseline` | ESLint, Prettier, Vitest, CI workflow, `.env.example`, Satoshi self-hosted font |
| 1 | `feat/db-prisma-setup` | Prisma schema (User, ProductCategory, CategoryField, Product, Offer, OfferItem, Comment), migrations, seed with 25 demo products + 3 demo offers |
| 2 | `feat/auth-jwt` | Login page `/login`, JWT in httpOnly cookie, `proxy.ts` protecting `(internal)` routes, role-based access (admin/manager), login rate-limiting |
| 3 | `feat/replace-store-with-db` | All screens migrated from in-memory store to PostgreSQL. Dashboard, offer list, catalog, offer builder, public share page — all read from DB. `lib/store.tsx` deleted. |
| 4 | `feat/catalog-product-crud` | Product CRUD (create/edit/delete), photo upload to `/data/uploads`, tech sheet PDF upload, `ProductIconBox` placeholder, magic-byte MIME validation |
| 5 | `feat/category-fields-and-product-detail` | Admin screen for category field definitions (key/label/type/options/order), product form renders dynamic parameter fields, `ProductDetailModal` with photo + parameters + tech sheet download |
| 6 | `feat/offer-builder-statuses-vat` | Item status checkboxes (Potvrzeno/Objednáno/Získáno), VAT 21% toggle (`showVat`), hide product code toggle (`hideCode`), EUR currency support |
| 7 | `feat/share-public-offer` | Share button generates public link `/nabidka/{shareId}`, offer status → `odeslana`, `shareEnabled` flag, public page shows read-only offer without internal data |
| 8 | `feat/comments-resend-notifications` | Architect comment form on public page, rate-limit 5/min per IP, offer status → `okomentovana`, Resend email to Filip, comment badge in sidebar |
| 9 | `feat/export-vat-hidecode` | PDF and Excel exports respect `showVat` (adds VAT row + total with VAT) and `hideCode` (removes product code column) |
| 10 | `feat/product-import` | Two-step CSV/XLSX import: `/preview` (parse + validate, no DB write) → `/commit` (upsert by code). Max 10 MB / 2000 rows. Admin only. |
| 11 | `feat/user-management` | Admin screen `/nastaveni/uzivatele`: list users, create (email/name/role/password), reset password, delete. Self-delete blocked. |
| fix | `fix/pagination-and-public-select` | Added pagination (`page`, `limit`) to `GET /api/products` and `GET /api/offers`. Added `offerPublicSelect` — `internalNote` structurally excluded from public page. |

---

## Deployment on Vercel

### Prerequisites

You need a PostgreSQL database. Options:
- **Vercel Postgres** (easiest — create in Vercel dashboard under Storage)
- **Neon** (neon.tech — free tier, copy connection string)
- **Supabase** (supabase.com — free tier, use the "Direct connection" string, not pooler)

### Step 1 — Import repository

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import from GitHub: `rontoday/farline-platforma-nabidky`
3. Select branch: `develop`
4. Framework: **Next.js** (auto-detected)

### Step 2 — Set environment variables

In Vercel → Project → Settings → Environment Variables, add all of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `JWT_SECRET` | Random string, min 32 chars (e.g. run `openssl rand -base64 48` locally) |
| `SEED_ADMIN_EMAIL` | `filip@farlineliving.cz` (or whatever email Filip will use to log in) |
| `SEED_ADMIN_PASSWORD` | Choose a strong password (min 8 chars) |
| `RESEND_API_KEY` | Your Resend API key (or `re_xxx` to skip emails for now) |
| `RESEND_FROM` | `nabidky@farlineliving.cz` (must be a verified Resend domain) |
| `NOTIFY_TO` | `filip@farlineliving.cz` |
| `APP_URL` | `https://your-vercel-url.vercel.app` |
| `UPLOADS_DIR` | `/tmp/uploads` (Vercel ephemeral — photos won't persist between deployments, this is expected for trial) |
| `NODE_ENV` | `production` |

> **Note on file uploads:** Vercel has an ephemeral filesystem — uploaded photos and tech sheets will be lost on each redeployment. This is fine for the trial/approval phase. The permanent solution is Hetzner (Block 12) with a persistent volume.

### Step 3 — Deploy

Click **Deploy**. Vercel runs `npm run build` automatically.

### Step 4 — Run database migrations and seed

After the first deploy, run migrations and seed from your local machine:

```bash
# In your local project directory
DATABASE_URL="your-vercel-postgres-connection-string" npx prisma migrate deploy
DATABASE_URL="your-vercel-postgres-connection-string" SEED_ADMIN_EMAIL="filip@farlineliving.cz" SEED_ADMIN_PASSWORD="yourpassword" npx prisma db seed
```

Or use Vercel CLI:
```bash
npx vercel env pull .env.vercel.local
DATABASE_URL=$(grep DATABASE_URL .env.vercel.local | cut -d= -f2) npx prisma migrate deploy
```

---

## Manual QA Checklist

Test the following flows after deployment. Perform them in order.

### Credentials

| Account | Email | Password | Role |
|---|---|---|---|
| Admin (Filip) | Set via `SEED_ADMIN_EMAIL` env var | Set via `SEED_ADMIN_PASSWORD` env var | admin |
| Demo manager | Create manually during test (step 7) | You set it | manager |

If you used the seed defaults: `admin@farline.cz` / `admin123`

---

### 1. Login

1. Go to `https://your-app.vercel.app/login`
2. Enter admin email and password → click **Přihlásit se**
3. **Expected:** Redirected to dashboard (`/`), sidebar shows navigation
4. Try wrong password → **Expected:** Error message "Nesprávný e-mail nebo heslo"
5. Try 5 wrong passwords quickly → **Expected:** Rate-limit error (429)

---

### 2. Dashboard

1. After login, verify the dashboard shows:
   - 4 metric cards: CELKEM NABÍDEK, ROZPRACOVANÉ, ODESLANÉ, NOVÉ KOMENTÁŘE
   - Table "Poslední nabídky" with demo offers (RD Nebušice, etc.)
   - Activity timeline on the right
2. Click **Otevřít katalog** button → should navigate to `/katalog`
3. Go back to dashboard, click **+ Nová nabídka** → dialog appears

---

### 3. Product Catalog

1. Navigate to **Katalog produktů** in the sidebar
2. Verify demo products are shown (25 products from seed)
3. Use the search bar — type "Hansgrohe" → filters results
4. Use the category dropdown filter
5. Click on any product card → **ProductDetailModal** opens with photo placeholder, name, price, parameters
6. Close modal (× button or click outside)

**Add a product:**
1. Click **+ Přidat** (top right)
2. Fill in: Kód `TEST-001`, Kategorie `Umyvadlové baterie`, Název `Test produkt`, Značka `TestBrand`, Cena `5000`
3. Click **Přidat produkt**
4. **Expected:** Product appears in catalog, toast notification shown

**Edit a product:**
1. Hover over the test product → edit icon (pencil) appears
2. Click edit → form opens with existing values
3. Change price to `5500` → click **Uložit**
4. **Expected:** Product updated

**Delete a product:**
1. Hover → trash icon
2. Click → confirm dialog appears
3. Confirm → product removed from catalog

---

### 4. Product Import (CSV)

1. In catalog, click **Import** button (upload icon)
2. **Step 1 — Upload:** Create a test CSV file with this content:
   ```
   kód,název,značka,dekor,typ,cena,měna
   IMP-001,Importovaná baterie,TestBrand,Chrom,umyvadlove_baterie,3500,CZK
   IMP-002,Importovaný set,AnotherBrand,,sprchove_sety,8900,CZK
   IMP-BAD,,,,,abc,CZK
   ```
   Save as `test-import.csv` and drag it into the modal
3. Click **Pokračovat →**
4. **Expected:** Preview table shows:
   - Row 1: green — IMP-001 valid
   - Row 2: green — IMP-002 valid
   - Row 3: amber/warning — error (invalid price, missing required fields)
   - Counter: "2 platných · 1 s chybou"
5. Click **Importovat 2 produktů**
6. **Expected:** "Import dokončen — 2 nových · 0 aktualizovaných"
7. Close modal → IMP-001 and IMP-002 appear in catalog

---

### 5. Category Fields (Admin Only)

1. In sidebar, scroll down to **Admin** section → click **Kategorie**
2. **Expected:** Page `/nastaveni/kategorie` loads with list of all 12 categories and their fields
3. Find "Umyvadlové baterie" → click **+ Přidat pole**
4. Fill in: Klíč `certifikace`, Popisek `Certifikace`, Typ `Text`
5. Click **Přidat**
6. **Expected:** New field "Certifikace" appears under the category
7. Click the edit (pencil) icon on the new field → change label to `CE Certifikace` → save
8. **Expected:** Label updated inline
9. Click the trash icon on the same field → confirm
10. **Expected:** Field removed

---

### 6. Create and Build a Quote (Nabídka)

1. Go to **Nabídky** in sidebar → click **+ Nová nabídka**
2. Fill in: Název `Testovací nabídka`, Architekt `Jana Horáková`, Měna `CZK`
3. Click **Vytvořit**
4. **Expected:** Redirected to the offer builder `/nabidky/[id]`

**Add products to the quote:**
1. In the offer builder, click **+ Přidat produkt** or the catalog panel button
2. The catalog panel slides in on the right
3. Click **+** next to any product to add it
4. Add 3-4 products
5. **Expected:** Products appear in the items table with quantity 1

**Edit items:**
1. Change quantity of a product to `2` — should auto-save (indicator "Ukládání…" → "Uloženo")
2. Set discount to `10` (10%) on one product
3. Check that the summary at the bottom updates: PŘED SLEVOU / SLEVA / CENA PO SLEVĚ

**Item statuses:**
1. Click checkbox **Potvrzeno** on one item → should save
2. Click **Objednáno** on the same item
3. Click **Získáno** on the same item

**VAT and hide code:**
1. Find toggle **Zobrazit DPH** → turn on
2. **Expected:** DPH row (21%) appears in summary
3. Find toggle **Skrýt kód produktu** → turn on
4. **Expected:** Product code column disappears from the table

**Internal note:**
1. Find the **Interní poznámka** textarea at the bottom
2. Type `Toto je interní poznámka pro Filipa` → leave the field
3. **Expected:** Auto-saved

---

### 7. Export PDF and Excel

1. In the offer builder, click **Stáhnout PDF** (right sidebar actions panel)
2. **Expected:** PDF downloads. Open it and verify:
   - Farline branding at top
   - Table with products (code hidden if toggle was on)
   - VAT row if `showVat` was on
   - Summary at bottom
3. Click **Stáhnout Excel**
4. **Expected:** `.xlsx` file downloads with same structure

---

### 8. Share Offer with Architect

1. In the offer builder, click **Sdílet nabídku** (primary brass button, top of right panel)
2. **Expected:** Modal "Sdílet odkaz" appears with a public URL like `https://your-app.vercel.app/nabidka/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. Offer status changes to **Odeslaná** (blue badge in header)
4. Copy the link and open it in an **incognito/private browser window** (no login needed)
5. **Expected:** Public offer page loads with:
   - "FARLINE / LIVING" header (no sidebar, no login)
   - Offer name and architect name
   - Product table (code hidden if set)
   - Summary totals
   - Comments section at the bottom

---

### 9. Architect Leaves a Comment

1. In the public offer page (incognito window from step 8):
2. Scroll to the **Komentáře** section
3. Fill in: Jméno `Jan Architekt`, E-mail `jan@atelierjn.cz`, Comment text `Dobrý den, chtěl bych změnit baterii v koupelně č. 2 za model s větším průtokem.`
4. Click **Odeslat komentář**
5. **Expected:**
   - Comment appears in the list
   - Toast notification shown
   - (If Resend is configured) Filip receives email notification
6. Refresh the admin view of the offer → status changes to **Okomentovaná** (amber)
7. Sidebar shows badge with comment count

**Read comments:**
1. In the offer builder, scroll to **Komentáře architekta** section
2. Click **Označit jako přečtené**
3. **Expected:** Badge disappears from sidebar

---

### 10. Offer Status Management

1. Go to offer builder
2. In the right actions panel, click **Označit jako odeslanou** (if not already sent)
3. Try clicking **Smazat nabídku** → confirmation dialog → cancel
4. Change status back manually if needed
5. Confirm offer works through full lifecycle: `rozpracovana` → `odeslana` → `okomentovana` → `potvrzena`

---

### 11. User Management (Admin Only)

1. In sidebar Admin section → click **Uživatelé**
2. **Expected:** Page `/nastaveni/uzivatele` shows current users (Filip as admin, created at seed)
3. Click **+ Přidat uživatele**
4. Fill in: E-mail `manager@farlineliving.cz`, Jméno `Tomáš Novák`, Role `Manažer`, Heslo `manager123`
5. Click **Vytvořit**
6. **Expected:** New user appears in the list

**Test manager access:**
1. Open incognito window → go to `/login`
2. Log in as `manager@farlineliving.cz` / `manager123`
3. **Expected:**
   - Dashboard and catalog visible
   - **No Admin section** in sidebar (Kategorie and Uživatelé hidden)
   - Cannot delete offers (delete button hidden or blocked)

**Reset password:**
1. Back in admin (Filip's window), go to Uživatelé
2. Click the key icon (🔑) next to Tomáš Novák
3. Enter new password `newpassword456` → click **Uložit heslo**
4. **Expected:** Success toast
5. Verify: log in as manager with new password → works

**Delete user:**
1. Click trash icon next to Tomáš Novák
2. Confirm dialog → **Expected:** User removed from list
3. Note: own account (Filip) cannot be deleted — trash icon is hidden for current user

---

### 12. Offer List Filters

1. Go to **Nabídky** in sidebar
2. Verify tabs at top: Všechny / Rozpracované / Odeslané / Okomentované / Potvrzené
3. Click each tab — list filters correctly
4. Each tab shows item count in badge

---

### Security Checks

1. **Public page has no internal data:** Open the public offer link, view page source or use DevTools Network — verify `internalNote` field is NOT present anywhere in the response
2. **Auth required:** In incognito, try to access `/nabidky` directly → should redirect to `/login`
3. **Admin routes:** Log in as manager → try to access `/nastaveni/uzivatele` directly → should show 404
4. **Share disabled:** In offer builder, if offer is not shared yet, public URL should return 404

---

## Known Limitations for Trial

| Limitation | Impact | Fix in |
|---|---|---|
| File uploads (photos, tech sheets) are lost on Vercel redeployment | Low — no photos in demo data | Block 12 (Hetzner persistent volume) |
| No Resend domain verified → emails won't send | Low — comment saving works, just no email | Configure Resend domain |
| No custom domain yet | Low — Vercel URL works fine | After approval |

---

## Project File Structure (Key Files)

```
app/
  (internal)/           ← Admin routes (auth required)
    page.tsx            ← Dashboard
    nabidky/page.tsx    ← Offer list
    nabidky/[id]/page.tsx ← Offer builder
    katalog/page.tsx    ← Product catalog
    nastaveni/
      kategorie/page.tsx ← Category fields admin
      uzivatele/page.tsx ← User management admin
  nabidka/[id]/page.tsx ← Public offer page (no auth)
  api/
    auth/               ← login, logout, me
    offers/             ← CRUD + share + status + items
    products/           ← CRUD + photo + tech-sheet + import
    categories/         ← CRUD + fields
    users/              ← CRUD (admin only)
    public/             ← Public endpoints (no auth)
    uploads/            ← File serving
components/
  Sidebar.tsx           ← Navigation with admin section
  OfferEditor.tsx       ← Main offer builder UI
  KatalogClient.tsx     ← Catalog with search/filter/import
  ProductForm.tsx       ← Add/edit product with category fields
  ProductDetailModal.tsx ← Product detail popup
  ImportModal.tsx       ← CSV/XLSX import (3-step)
  UserManager.tsx       ← User CRUD UI
  CategoryFieldsManager.tsx ← Category fields CRUD UI
  NabidkaPublic.tsx     ← Public offer page component
  SummaryBlock.tsx      ← Offer totals (with VAT support)
lib/
  calculations.ts       ← All monetary math (subtotal, discount, VAT)
  pdf-export.ts         ← PDF generation (jsPDF)
  excel-export.ts       ← Excel generation (ExcelJS)
  import-parse.ts       ← CSV/XLSX parsing (xlsx library)
  auth.ts               ← JWT sign/verify
  db/selects.ts         ← Prisma selects + mappers (incl. offerPublicSelect)
prisma/
  schema.prisma         ← Full DB schema
  seed.ts               ← Demo data seed (idempotent)
```

---

## After Approval — Next Steps

1. **Block 12:** Docker + Caddy + Hetzner deployment with persistent file storage
2. **Block 13:** Import real supplier price lists (Cielo, GEDA, CoalBrook, Radomonte, Lefroy & Brooks) using the import feature from Block 10
3. Verify Resend domain for production email delivery
4. Set production `JWT_SECRET` (min 48 chars, random)
