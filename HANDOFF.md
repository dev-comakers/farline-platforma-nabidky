# HANDOFF — Farline Nabídky

**Дата оновлення:** 2026-05-28  
**Стан:** Готово до здачі клієнту. Всі функції реалізовані, мобільна адаптація завершена, баги виправлені.

---

## Що це за проєкт

Платформа для Filip Kott (Farline Living) — замінює Google Sheets для роботи з комерційними пропозиціями (КП).

**Потік:** Каталог продуктів → конструктор КП → публічне посилання клієнту → коментарі → експорт PDF/Excel

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
| 6 | Статуси позицій (P/O/D), DPH 21%, toggle DPH/hideCode, мульти-валюта | Готово |
| 7 | Share-посилання + публічна сторінка `/nabidka/[shareId]` | Готово |
| 8 | Коментарі клієнта → БД + email через Resend | Готово |
| 9 | PDF/Excel export (з DPH і hideCode) | Готово |
| 10 | Імпорт продуктів CSV/XLSX (preview → commit) | Готово |
| 11 | Управління користувачами (admin: список, create, reset, delete) | Готово |
| — | Мобільна адаптація 375px–1440px | Готово (PR #9–11) |
| — | Pre-release QA (Playwright аудит + bug fixes) | Готово (PR #12–13) |
| — | UI fixes: sidebar, catalog UX, Doručeno, Klient | Готово (PR #19) |

---

## Що НЕ ЗРОБЛЕНО / Залишається

| Задача | Пріоритет | Примітка |
|--------|-----------|---------|
| Docker + Caddy + Hetzner deploy | Після здачі клієнту | Зараз на Vercel (trial) |
| Наповнення каталогу реальними прайсами | Залежить від клієнта | Імпорт CSV/XLSX вже готовий |

---

## Де живе код

| Репозиторій | Гілка | Акаунт | Призначення |
|-------------|-------|--------|-------------|
| `github.com/rontoday/farline-platforma-nabidky` | `develop` | ecl1pseee55 (колаборант) | Основний dev репо. Код, PR, code review. `main` = production-ready для Hetzner |
| `github.com/dev-comakers/farline-platforma-nabidky` | `main` | dev-comakers | Тільки для Vercel. Єдина гілка — `main`. |

---

## Git + Vercel — Правила роботи з двома репозиторіями

### Два репозиторії, два призначення

| Репозиторій | Гілка | Акаунт | Призначення |
|-------------|-------|--------|-------------|
| `rontoday/farline-platforma-nabidky` | `develop` | ecl1pseee55 (колаборант) | Основний dev репо. Тут зберігається робочий код, PR-и, code review. Гілка `main` — production-ready код для деплою на сервер (Hetzner). |
| `dev-comakers/farline-platforma-nabidky` | `main` | dev-comakers | Тільки для Vercel. Єдина гілка — `main`. Vercel деплоїть автоматично при кожному push. |

### Токени

| Змінна в `.env.local` | Акаунт | Для чого |
|-----------------------|--------|----------|
| `GITHUB_TOKEN` | `ecl1pseee55` | Push в `origin/develop`, GitHub API для PR/merge в rontoday |
| `GITHUB_TOKEN1` | `dev-comakers` | Push в `dev-comakers/main` → тригерить Vercel deploy |

### Git ремоути локально

```
origin       → rontoday/farline-platforma-nabidky      (GITHUB_TOKEN)
dev-comakers → dev-comakers/farline-platforma-nabidky  (GITHUB_TOKEN1) → Vercel
```

### Git config (вже налаштований для цього репо)

```bash
git config user.name   # dev-comakers
git config user.email  # dev@comakers.cz
```

> Всі коміти мають бути підписані від `dev-comakers`. Vercel перевіряє автора коміту — якщо це `ecl1pseee55`, деплой іде не від того акаунту.

---

### ПРАВИЛЬНИЙ ВОРКФЛОУ (строго дотримуватись)

```
1. Зробити зміни + commit локально (автор = dev-comakers)
   git add <files>
   git commit -m "feat/fix: опис"

2. ПАРАЛЕЛЬНО пушимо в обидва репо:

   A) Push в rontoday/develop (для code history та майбутнього PR):
      git checkout develop
      git cherry-pick <hash>
      git push origin develop
      git checkout main

   B) Push в dev-comakers/main (тригерить Vercel deploy):
      git push "https://${GITHUB_TOKEN1}@github.com/dev-comakers/farline-platforma-nabidky.git" main

3. Перевіряємо деплой на Vercel (https://farline-platforma-nabidky.vercel.app).
   ДО перевірки — PR не робимо.

4. ПІСЛЯ підтвердження що на Vercel все працює — робимо PR:
   curl -X POST → /pulls  (develop → main у rontoday)
   curl -X PUT  → /merge  (squash merge)

5. Підтягуємо origin/main локально (для синхронізації):
   git fetch origin && git reset --hard origin/main
   (НЕ пушимо цей squash-коміт на dev-comakers — там вже є правильний локальний коміт)
```

### КРИТИЧНО: чому не можна пушити squash-merge на dev-comakers

GitHub squash merge підписує коміт від імені власника токена (`ecl1pseee55`), а не `dev-comakers`. Якщо запушити такий коміт на `dev-comakers/main` — Vercel деплоїть від неправильного акаунту.

**Правило:** на `dev-comakers/main` завжди пушити тільки **локально створені** коміти.

### Що НЕ робити

- ❌ Не робити PR і merge одразу — спочатку перевірити деплой на Vercel
- ❌ Не пушити GitHub squash-merge коміти на `dev-comakers`
- ❌ Не комітити напряму в `rontoday/main` — тільки через `develop` + PR
- ❌ Не пушити від `ecl1pseee55` на `dev-comakers` — тільки `GITHUB_TOKEN1`

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
app/nabidka/[id]/            — публічна сторінка клієнта (без sidebar, read-only)
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
