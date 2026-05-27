# HANDOFF — Farline Nabídky

**Дата:** 2026-05-26  
**Стан:** Trial deploy на Vercel, застрягли на Vercel Hobby plan обмеженнях

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
| `github.com/ecl1pseee55/farline-platforma-nabidky` | ecl1pseee55 (особистий) | Vercel auto-deploy (дзеркало) |

Обидва репо синхронізовані, `main` однаковий.

### Git-акаунти і токени

**Platon (розробник) = акаунт `ecl1pseee55`** — через нього ведеться вся розробка. Він запрошений у `rontoday` як колаборатор і робить всі коміти/PR через цей акаунт.

**Токени в `.env.local`:**
- `GITHUB_TOKEN` — токен акаунту `ecl1pseee55` → використовується для пушу в `rontoday` (як колаборатор) і в `deploy` ремоут (форк ecl1pseee55)
- `GITHUB_TOKEN1` — токен іншого акаунту (`dev-comakers`) → синхронізований дзеркальний репо, також підключений для деплою

**Git ремоути локально:**
```
origin       → rontoday/farline-platforma-nabidky   (без токена в URL — через Keychain або треба додати GITHUB_TOKEN)
deploy       → ecl1pseee55/farline-platforma-nabidky (GITHUB_TOKEN) → Vercel auto-deploy
dev-comakers → dev-comakers/farline-platforma-nabidky (GITHUB_TOKEN1)
```

**Воркфлоу для нових змін:**
1. Комітити локально
2. `git push origin main` → rontoday (основний репо)
3. `git push deploy main` → ecl1pseee55 → Vercel auto-deploy (для тестування)
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

### Проблема: Vercel Hobby plan + два акаунти

**Симптом:** коміти від git user `coMakers` (lokálny config) блокуються Vercel — "Deployment Blocked, commit author did not have contributing access".

**Причина:** Vercel проєкт під акаунтом `ecl1pseee55`, але коміти підписані іншим git user. Hobby план не підтримує співпрацю.

**Що ще виявилось:** при спробі зробити Redeploy вручну через dashboard Vercel показав попередження про team collaboration і можливо перевів проєкт у team workspace, який потребує Pro план.

### Останній задеплоєний commit
- `4e9d18a` — "Merge develop → main: production-ready release (Blocks 0-11 + fixes)" — **живий на prod**
- `75203b3` — "fix: offer editor layout overflow" — **є в коді, але не задеплоєний** (заблокований Vercel)

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

## Workflow для нових змін

1. Розробляти в `develop` гілці
2. Мерджити в `main`
3. Пушити в **обидва** репозиторії:
   ```bash
   git push origin main          # rontoday
   git push deploy main          # ecl1pseee55 → Vercel
   ```
   (remote `deploy` треба додати: `git remote add deploy https://TOKEN@github.com/ecl1pseee55/farline-platforma-nabidky.git`)

---

## Credentials (не комітити!)

Всі реальні значення — в `.env.local` (gitignored) і у Vercel dashboard env vars.  
Структура змінних — в `.env.example`.

---

## Наступний крок

Вирішити Vercel deployment issue (варіант A або B вище), потім починати Блок 6 (НДС + статуси позицій) — він найважливіший для реального використання.
