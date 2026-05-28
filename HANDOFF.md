# HANDOFF — Farline Nabídky

**Дата оновлення:** 2026-05-28  
**Стан:** Готово до здачі клієнту. Всі функції реалізовані, баги виправлені, деплой на Vercel живий.

---

## Що це за проєкт

Платформа для Filip Kott (Farline Living) — замінює Google Sheets для роботи з комерційними пропозиціями (КП).

**Потік:** Каталог продуктів → конструктор КП → публічне посилання клієнту → коментарі → експорт PDF/Excel

**Стек:** Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Prisma + PostgreSQL (Supabase) + Vercel

---

## Що ЗРОБЛЕНО

### Блоки 0–11 (всі реалізовані)

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

### Сесія 2026-05-28 — всі виправлення

| PR / коміт | Що зроблено |
|-----------|-------------|
| PR #22 | Клікабельні рядки на дашборді → перехід на `/nabidky/[id]`; `noindex` на публічній сторінці; приховати вкладку Excel у модалці клієнта; вирівнювання P/O/D чекбоксів |
| PR #23 | Підтвердження набідки: popup "Potvrzením uzamknete editaci" перед зміною статусу; фікс завантаження фото при редагуванні; поле опису у формі продукту; підказка Záruka; передача categoryFields у модалку деталей з редактора |
| PR #24 | Сторінка категорій: всі категорії згорнуті за замовчуванням, chevron, inline-edit label/key, reorder кнопки вгору/вниз, delete з підтвердженням, кнопка "Přidat novou kategorii"; імпорт: 9 параметричних колонок у шаблоні CSV (material, povrch, rozmery, pripojeni, zaruka, prutok, objem, hmotnost, popis); фікс стрілки фільтра в каталозі (appearance-none + CaretDown іконка) |
| PR #25 | Публічна сторінка: коментування окремих позицій (brass-кружечок при hover → popup з email/ім'ям/текстом → відправка); X кнопка для видалення фото продукту у формі редагування (з'являється при hover) |
| `833fcc9` | Заборона видалення підтвердженої набідки: кнопка "Smazat" прихована в UI якщо статус `potvrzena`; API також повертає 403 |
| `5a81b3e` | `router.refresh()` після зміни статусу → інвалідація Next.js router cache |
| `5e6f768` | `OfferEditor` при монтуванні підтягує актуальний статус із сервера — захист від stale router cache |
| `1c37180` | При додаванні продукту що вже є в списку — збільшується кількість (+1), а не створюється дублікат |

---

## Що НЕ ЗРОБЛЕНО / Залишається

| Задача | Пріоритет | Примітка |
|--------|-----------|---------|
| Docker + Caddy + Hetzner deploy | Після здачі клієнту | Зараз на Vercel (preview) |
| Email через Resend | Потрібен API ключ від Філіпа | Код повністю написаний (`lib/resend.ts`), лише `RESEND_API_KEY=re_xxx` заглушка в `.env` |
| Наповнення каталогу реальними прайсами | Залежить від клієнта | Імпорт CSV/XLSX вже готовий |

---

## Де живе код

| Репозиторій | Гілка | Акаунт | Призначення |
|-------------|-------|--------|-------------|
| `github.com/rontoday/farline-platforma-nabidky` | `main` + `develop` | ecl1pseee55 (колаборант) | Основний репо. Весь код, PR, code review |
| `github.com/dev-comakers/farline-platforma-nabidky` | `main` | dev-comakers | Тільки для Vercel. Vercel деплоїть автоматично при кожному push |

---

## Git + Vercel — Правила роботи

### Токени

| Змінна в `.env.local` | Акаунт | Для чого |
|-----------------------|--------|----------|
| `GITHUB_TOKEN` | `ecl1pseee55` | Push в `origin/develop` та `origin/main`, GitHub API для PR/merge в rontoday |
| `GITHUB_TOKEN1` | `dev-comakers` | Push в `dev-comakers/main` → тригерить Vercel deploy |

### Git ремоути локально

```
origin       → rontoday/farline-platforma-nabidky      (GITHUB_TOKEN)
dev-comakers → dev-comakers/farline-platforma-nabidky  (GITHUB_TOKEN1) → Vercel
deploy       → ecl1pseee55/farline-platforma-nabidky   (GITHUB_TOKEN)  (застарілий, не використовувати)
```

### Git config (вже налаштований)

```bash
git config user.name   # dev-comakers
git config user.email  # dev@comakers.cz
```

---

### ПРАВИЛЬНИЙ ВОРКФЛОУ

```
1. Зробити зміни + commit локально (автор = dev-comakers через git config)
   git add <files>
   git commit -m "feat/fix: опис"

2. Push в обидва репо одночасно:
   git push origin main        → оновлює rontoday/main
   git push origin develop     → оновлює rontoday/develop (якщо не вже в sync)
   git push dev-comakers main  → тригерить Vercel deploy

   ЯКЩО dev-comakers відхиляє (non-fast-forward) — завжди force push:
   git push dev-comakers main --force

3. Перевіряємо деплой на Vercel (https://farline-platforma-nabidky.vercel.app).

4. Після підтвердження що на Vercel все працює — PR не потрібен щоразу.
   PR робимо для великих блоків фіч через GitHub API:
   curl -X POST → /pulls  (develop → main у rontoday)
   curl -X PUT  → /merge  (squash merge)
```

### Чому dev-comakers ЗАВЖДИ потребує force push

`origin/main` і `dev-comakers/main` мають різну історію:
- `origin/main` — squash merge коміти від GitHub (автор `ecl1pseee55`)
- `dev-comakers/main` — локальні коміти (автор `dev-comakers`)

Вони ніколи не будуть fast-forward один від одного. Force push — це нормально і очікувано для `dev-comakers/main`. Код однаковий, лише автор коміту різний.

### Vercel показує "GitHub user not found"

Якщо в деплої Vercel dashboard видно "No matching user" — це не помилка. Деплой проходить успішно. Це косметичне попередження що email `dev@comakers.cz` не прив'язаний до GitHub акаунту у Vercel.

Коли все правильно — Vercel показує: `GitHub User: dev-comakers`, `Vercel Account: dev-1778`.

### Що НЕ робити

- Не пушити squash-merge коміти з `origin/main` напряму на `dev-comakers` (вони підписані від `ecl1pseee55`)
- Не комітити напряму в `rontoday/main` — тільки через локальний commit + push

---

## Де живе деплой

**Production URL:** `https://farline-platforma-nabidky.vercel.app`  
**БД:** Supabase PostgreSQL (`aws-0-eu-west-1.pooler.supabase.com:5432`, порт 5432 — session pooler)  
**Env vars:** налаштовані в Vercel dashboard + в `.env.local` локально

> **Важливо про Supabase:** використовувати порт **5432** (session pooler). Порт 6543 (transaction pooler) — не підходить для Prisma, зависає.

---

## Ключові файли

```
app/(internal)/              — Filip: dashboard, список КП, каталог, конструктор
app/nabidka/[id]/            — публічна сторінка клієнта (без sidebar, read-only + коментарі)
app/api/                     — Route Handlers (всі мутації)
app/api/public/              — публічні ендпоінти (без auth, без internalNote)
proxy.ts                     — Next.js 16 auth middleware (захист internal маршрутів)
lib/calculations.ts          — грошова математика + VAT
lib/pdf-export.ts            — PDF через jsPDF
lib/excel-export.ts          — Excel через ExcelJS
lib/resend.ts                — email сповіщення (потрібен реальний RESEND_API_KEY)
lib/rate-limit.ts            — rate limit для коментарів і логіну
components/OfferEditor.tsx   — конструктор КП (autosave, items, статуси, lock)
components/NabidkaPublic.tsx — публічна сторінка КП (коментарі + inline коментарі позицій)
components/CategoryFieldsManager.tsx — управління категоріями (expand/collapse, edit, reorder)
components/ProductForm.tsx   — форма продукту (фото upload + X кнопка видалення фото)
prisma/schema.prisma         — схема БД
```

---

## Credentials (для тестування)

```
Admin: admin@farline.cz / admin1234
```

Всі реальні env значення — в `.env.local` (gitignored) і у Vercel dashboard. Структура — в `.env.example`.

---

## Наступні кроки

1. **Здача клієнту** — демо на `https://farline-platforma-nabidky.vercel.app`
2. **Resend API ключ** — Filip реєструється на resend.com, верифікує домен `farline.cz`, дає ключ → вставити в `.env` на сервері
3. **Наповнення каталогу** — Filip завантажує реальні прайси через імпорт CSV/XLSX
4. **Hetzner deploy** — Docker + Caddy + перенос БД (Блок 12) після затвердження клієнтом
