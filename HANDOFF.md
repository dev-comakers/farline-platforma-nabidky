# HANDOFF — Farline Nabídky

**Дата:** 2026-05-27  
**Стан:** Активна розробка. PR #8 змерджено (Блоки 0–11). Воркфлоу встановлено.

---

## Що це за проєкт

Платформа для Filip Kott (Farline Living) — замінює Google Sheets для роботи з комерційними пропозиціями (КП) для архітекторів.

**Потік:** Каталог продуктів → конструктор КП → публічне посилання архітектору → коментарі → експорт PDF/Excel

**Стек:** Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Prisma + PostgreSQL (Supabase) + Vercel

---

## Що ЗРОБЛЕНО (Блоки 0–11)

| Блок | Назва | Статус |
|------|-------|--------|
| 0 | Project baseline (ESLint, CI, .env.example, шрифти) | Частково — CI не налаштовано, але решта є |
| 1 | БД + Prisma схема + seed | Готово (мігровано на Supabase) |
| 2 | Auth JWT (login/logout, httpOnly cookie, ролі) | Готово |
| 3 | Замінили in-memory store на Prisma | Готово |
| 4 | CRUD продуктів + завантаження фото | Готово |
| 5 | Параметри категорій (admin «Nastavení → Kategorie») | Готово (крім модалки деталей продукту — Блок 5 partial) |
| 7 | Share-посилання + публічна сторінка | Готово (`offerPublicSelect` без `internalNote`) |
| 9 | Базовий PDF/Excel export | Готово (без НДС і hideCode — це Блок 9) |
| 10 | Імпорт продуктів CSV/XLSX (preview + commit) | Готово |
| 11 | Управління користувачами (admin: список, create, reset, delete) | Готово |
| — | Пагінація API + security (offerPublicSelect) | Готово |

### Ключові файли

```
app/(internal)/          — Filip: dashboard, список КП, каталог, конструктор
app/nabidka/[id]/        — публічна сторінка архітектора (без sidebar, read-only)
app/api/                 — Route Handlers (всі мутації тут)
lib/calculations.ts      — грошова математика
lib/pdf-export.ts        — PDF через jsPDF
lib/excel-export.ts      — Excel через ExcelJS
lib/import-parse.ts      — парсинг CSV/XLSX для імпорту
components/OfferEditor.tsx   — конструктор КП (головний компонент)
components/UserManager.tsx   — управління юзерами
components/ImportModal.tsx   — 3-step імпорт
prisma/schema.prisma     — схема БД
```

---

## Що НЕ ЗРОБЛЕНО

| Блок | Назва | Пріоритет |
|------|-------|-----------|
| 6 | Статуси позицій (Potvrzeno/Objednáno/Získáno), НДС 21%, toggle DPH, hideCode, EUR | Високий |
| 8 | Коментарі архітектора → збереження в БД + email через Resend | Високий |
| 9 | PDF/Excel: додати НДС рядок, hideCode (залежить від Блоку 6) | Середній |
| 5* | Модалка деталей продукту «09-produkt-detail-modal» (Figma node 1:1057) | Середній |
| 12 | Docker + Caddy + Hetzner deploy | Після функцій |
| 13 | Наповнення каталогу реальними прайсами постачальників | Залежить від клієнта |

**Примітки:**
- Блок 6 і 8 — критичні для реального використання (без них КП не можна відправити архітектору правильно і коментарі не зберігаються)
- Блок 12 — потрібен для продакшен деплою на Hetzner (зараз тільки trial на Vercel)
- Блок 13 — заблокований поки клієнт не дасть прайси постачальників

---

## Де живе код

| Репозиторій | Акаунт | Для чого |
|-------------|--------|----------|
| `github.com/rontoday/farline-platforma-nabidky` | rontoday (команда) | Основний dev репо |
| `github.com/dev-comakers/farline-platforma-nabidky` | dev-comakers | Vercel auto-deploy (дзеркало) |
| `github.com/ecl1pseee55/farline-platforma-nabidky` | ecl1pseee55 (особистий Platon) | Додатковий ремоут |

### Git-акаунти і токени

**Розробник = акаунт `ecl1pseee55`** (особистий акаунт Platon) — запрошений у `rontoday` як колаборатор, веде основну розробку.

**Vercel підключений до акаунту `dev-comakers` (`dev@comakers.cz`)** — коміти мають бути підписані саме цим git user, інакше Vercel блокує деплой. Git config для цього репо вже налаштований правильно: `user.name=dev-comakers`, `user.email=dev@comakers.cz`.

**Токени в `.env.local`:**
- `GITHUB_TOKEN` — токен акаунту `ecl1pseee55` → пуш в `rontoday` (як колаборатор) і `deploy` ремоут
- `GITHUB_TOKEN1` — токен акаунту `dev-comakers` → пуш в `dev-comakers` ремоут (Vercel)

**Git ремоути локально:**
```
origin       → rontoday/farline-platforma-nabidky      (GITHUB_TOKEN, вшитий в URL)
deploy       → ecl1pseee55/farline-platforma-nabidky   (GITHUB_TOKEN)
dev-comakers → dev-comakers/farline-platforma-nabidky  (GITHUB_TOKEN1) → Vercel auto-deploy
```

**Воркфлоу для нових змін:**
1. Комітити локально (git user: `dev-comakers / dev@comakers.cz` — вже налаштовано)
2. `git push origin main:develop` → rontoday develop (основний репо)
3. `git push dev-comakers main` → Vercel auto-deploy (для тестування)
4. Після підтвердження на Vercel → деплой на Hetzner (Блок 12)

---

## Де живе деплой

**URL:** `farline-platforma-nabidky-6s3w.vercel.app`  
**БД:** Supabase PostgreSQL (EU West, `aws-0-eu-west-1.pooler.supabase.com:5432`)  
**Env vars:** налаштовані в Vercel dashboard

### Важливо про Supabase
- Порт **5432** (session pooler) — для Prisma та міграцій
- Порт 6543 (transaction pooler) — **НЕ підходить** для Prisma, зависає

---

## На чому ЗАСТРЯГЛИ зараз

### Проблема: Vercel Hobby plan + git user

**Вирішено:** git config налаштований на `dev-comakers / dev@comakers.cz` — саме цей акаунт зареєстрований на Vercel. Коміти проходять.

**Попередня проблема (вирішена):** коміти були від `coMakers` (capital M), Vercel блокував — "Deployment Blocked, commit author did not have contributing access". Виправлено зміною git config.

### Останній задеплоєний commit
- `11d662d` — "fix: three UI bugs" — запушено в `dev-comakers main` → Vercel auto-deploy

### Варіанти вирішення

**Варіант A — Vercel CLI (рекомендований зараз):**
```bash
npm i -g vercel
vercel login   # увійти як ecl1pseee55
vercel --prod  # деплоїть з локального коду, без git author check
```

**Варіант B — змінити git config для цього репо:**
```bash
git config user.email "email-від-ecl1pseee55-акаунту"
git config user.name "ecl1pseee55"
```
Тоді нові коміти проходитимуть Vercel автоматично.

**Варіант C — довгострокове рішення (Блок 12):**
Задеплоїти на Hetzner через Docker — тоді Vercel взагалі не потрібен, і обмежень по акаунтах немає.

---

## Робочий процес (домовленість з командою)

Це актуальний воркфлоу, узгоджений між Platon і Claude. Дотримуватись у кожній сесії.

### Крок 1 — Розробка + push для перевірки на Vercel

Після кожного фіксу або фічі Claude робить:
```bash
git push origin main:develop     # rontoday/develop — для PR-history
git push dev-comakers main       # Vercel auto-deploy — щоб одразу бачити зміни
```

### Крок 2 — Перевірка на Vercel

Platon перевіряє на `farline-platforma-nabidky-6s3w.vercel.app` що нічого не впало.

### Крок 3 — PR + merge в main (тільки після підтвердження)

Якщо все ок — Claude через GitHub API:
1. Створює PR `develop → main` на rontoday з описом що зроблено
2. Мерджить PR
3. Пушить `origin main` щоб локальний main і remote були синхронізовані

### Що НЕ робити
- Не мерджити в main без перевірки на Vercel
- Не пушити напряму в `origin main` в обхід PR
- Не створювати PR вручну через GitHub UI — Claude робить це через API

---

## Credentials (не комітити!)

Всі реальні значення — в `.env.local` (gitignored) і у Vercel dashboard env vars.  
Структура змінних — в `.env.example`.

---

## Наступний крок

Продовжувати виправляти баги і доробляти відсутній функціонал (Блок 12 — Docker/Hetzner deploy).
