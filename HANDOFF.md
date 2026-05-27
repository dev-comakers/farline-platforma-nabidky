# HANDOFF — Farline Nabídky

**Дата оновлення:** 2026-05-27  
**Стан:** Готово до здачі клієнту. Всі функції реалізовані, мобільна адаптація завершена, баги виправлені.

---

## Що це за проєкт

Платформа для Filip Kott (Farline Living) — замінює Google Sheets для роботи з комерційними пропозиціями (КП) для архітекторів.

**Потік:** Каталог продуктів → конструктор КП → публічне посилання архітектору → коментарі → експорт PDF/Excel

**Стек:** Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Prisma + PostgreSQL (Supabase) + Vercel

---

## Що ЗРОБЛЕНО

### Блоки 0–13 (всі реалізовані)

| Блок | Назва | Статус |
|------|-------|--------|
| 0 | Project baseline (ESLint, CI, шрифти, .env.example) | Готово |
| 1 | БД + Prisma схема + seed | Готово (Supabase PostgreSQL) |
| 2 | Auth JWT (login/logout, httpOnly cookie, ролі admin/manager) | Готово |
| 3 | Замінили in-memory store на Prisma | Готово |
| 4 | CRUD продуктів + завантаження фото | Готово |
| 5 | Параметри категорій + модалка деталей продукту | Готово |
| 6 | Статуси позицій (P/O/Z), DPH 21%, toggle DPH/hideCode, мульти-валюта | Готово |
| 7 | Share-посилання + публічна сторінка `/nabidka/[shareId]` | Готово |
| 8 | Коментарі архітектора → БД + email через Resend | Готово |
| 9 | PDF/Excel export (з DPH і hideCode) | Готово |
| 10 | Імпорт продуктів CSV/XLSX (preview → commit) | Готово |
| 11 | Управління користувачами (admin: список, create, reset, delete) | Готово |
| — | Мобільна адаптація 375px–1440px | Готово (PR #9–11) |
| — | Pre-release QA (Playwright аудит + bug fixes) | Готово (PR #12–13) |

### Баги виправлені в останній сесії (PR #12–13)

- **Rate limit:** рахував усі спроби логіну → тепер тільки невдалі (5 невдалих = блок 15 хв)
- **Autosave:** не показував помилку при збої → заголовок показує «Chyba uložení» + toast
- **Optimistic update rollback:** при помилці API — позиції КП відновлюються до попереднього стану
- **Share modal:** відкривався навіть при помилці мережі → тепер тільки при успіху
- **CurrencyToggle overflow:** кнопка EUR виходила за межі на mobile 375px
- **Offer editor padding:** `px-6` на mobile замість `px-4` (як на інших сторінках)

---

## Що НЕ ЗРОБЛЕНО / Залишається

| Задача | Пріоритет | Примітка |
|--------|-----------|---------|
| Docker + Caddy + Hetzner deploy | Після здачі клієнту | Зараз на Vercel (trial) |
| Наповнення каталогу реальними прайсами | Залежить від клієнта | Імпорт CSV/XLSX вже готовий |

---

## Де живе код

| Репозиторій | Акаунт | Для чого |
|-------------|--------|----------|
| `github.com/rontoday/farline-platforma-nabidky` | rontoday | Основний dev репо |
| `github.com/dev-comakers/farline-platforma-nabidky` | dev-comakers | Vercel auto-deploy (дзеркало) |

---

## Git + Vercel — Правила роботи з двома токенами

### Токени

| Змінна в `.env.local` | Акаунт | Для чого |
|-----------------------|--------|----------|
| `GITHUB_TOKEN` | `ecl1pseee55` (Platon, колаборант у rontoday) | Push в `origin`, GitHub API для PR/merge |
| `GITHUB_TOKEN1` | `dev-comakers` | Push в `dev-comakers` remote → Vercel |

### Git ремоути локально

```
origin       → rontoday/farline-platforma-nabidky      (GITHUB_TOKEN)
dev-comakers → dev-comakers/farline-platforma-nabidky  (GITHUB_TOKEN1) → Vercel
deploy       → ecl1pseee55/farline-platforma-nabidky   (GITHUB_TOKEN)
```

### Git config (вже налаштований для цього репо)

```bash
git config user.name   # dev-comakers
git config user.email  # dev@comakers.cz
```

### КРИТИЧНО: чому Vercel показує «ecl1pse» замість «dev-comakers»

Vercel показує **автора git коміту**. Коли GitHub робить squash merge через PR — він підписує коміт від імені власника токена (`ecl1pseee55`). Тому squash-merged коміти не можна пушити напряму на Vercel.

**Рішення:** на `dev-comakers/main` завжди пушити **локально створені** коміти (не GitHub squash merge).

### Правильний воркфлоу для кожної зміни

```
1. Зробити зміни + commit локально (git user = dev-comakers)
   git add <files>
   git commit -m "feat/fix: опис"

2. Cherry-pick на develop + push → origin
   git checkout develop
   git cherry-pick <hash>
   git push origin develop

3. Створити PR + змерджити через GitHub API (GITHUB_TOKEN)
   curl -X POST → /pulls  (develop → main)
   curl -X PUT  → /merge

4. Підтягнути origin/main локально
   git checkout main
   git fetch origin && git reset --hard origin/main
   # (не береш squash-merged коміт — ти вже маєш свій локальний)

5. Push локального main на dev-comakers/main (GITHUB_TOKEN1)
   git push "https://${GITHUB_TOKEN1}@github.com/dev-comakers/farline-platforma-nabidky.git" main --force
```

### Що НЕ робити

- Не пушити GitHub squash-merge коміти на `dev-comakers` — будуть підписані ecl1pse
- Не мерджити напряму в `origin/main` без PR
- Не комітити в гілку `main` напряму — тільки через `develop` + PR

---

## Де живе деплой

**Production URL:** `https://farline-platforma-nabidky.vercel.app`  
**БД:** Supabase PostgreSQL (EU West, `aws-0-eu-west-1.pooler.supabase.com:5432`)  
**Env vars:** налаштовані в Vercel dashboard

### Важливо про Supabase

- Порт **5432** (session pooler) — для Prisma та міграцій ✓
- Порт 6543 (transaction pooler) — **НЕ підходить** для Prisma, зависає

### Credentials

Всі реальні значення — в `.env.local` (gitignored) і у Vercel dashboard.  
Структура змінних — в `.env.example`.

---

## Ключові файли

```
app/(internal)/              — Filip: dashboard, список КП, каталог, конструктор
app/nabidka/[id]/            — публічна сторінка архітектора (без sidebar, read-only)
app/api/                     — Route Handlers (всі мутації)
app/api/public/              — публічні ендпоінти (без auth, без internalNote)
proxy.ts                     — Next.js 16 auth middleware (захист internal маршрутів)
lib/calculations.ts          — грошова математика + VAT
lib/pdf-export.ts            — PDF через jsPDF
lib/excel-export.ts          — Excel через ExcelJS
lib/rate-limit.ts            — rate limit (checkRateLimit = spam, checkOnly+recordFailure = login)
components/OfferEditor.tsx   — конструктор КП (головний компонент, autosave, items)
components/NabidkaPublic.tsx — публічна сторінка КП
components/MobileLayout.tsx  — mobile sidebar drawer
prisma/schema.prisma         — схема БД
audit.cjs                    — Playwright скрипт для pre-release QA
```

---

## Наступні кроки

1. **Здача клієнту** — демо на `https://farline-platforma-nabidky.vercel.app`
2. **Наповнення каталогу** — Filip завантажує реальні прайси через імпорт CSV/XLSX
3. **Hetzner deploy** — Docker + Caddy + перенос БД після затвердження клієнтом
