# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Перше: прочитати ланцюг документів

Перед будь-яким кодом — прочитати по порядку:

1. `DEVELOPING.md` — навігатор: поточний стан, що є, що видалити, архітектурні межі
2. `docs/PRD.md` — що будуємо: ролі, acceptance-критерії, §3 матриця «є→доробити», §9 заборони
3. `docs/TECH-SPEC.md` — стек, Prisma-схема §3, API §5, auth §4, критичні зауваження §12
4. `docs/DESIGN-SYSTEM.md` — заморожений візуал, токени, компоненти, чек-лист §9
5. `docs/IMPLEMENTATION-PLAN.md` — поточний блок і залежності

---

## Команди

```bash
npm run dev      # dev-сервер (Turbopack)
npm run build    # production build
npm run start    # запуск production build
npx tsc --noEmit # typecheck
node scripts/test-pdf.mjs    # ручне тестування PDF
node scripts/test-excel.mjs  # ручне тестування Excel
```

---

## Проєкт: Farline Nabídky

Платформа замінює ручну роботу Filip Kott (Farline Living) з Google Sheets для створення КП архітекторам. Потік: **каталог продуктів → конструктор КП → публічне посилання → коментарі архітектора → експорт PDF/Excel**.

**Поточний стан:** рабочий клієнтський прототип, UI узгоджений і заморожений. Дані in-memory (скидаються при перезавантаженні). Задача: підключити до Postgres/Prisma + додати відсутнє, **не переписуючи UI**.

---

## Архітектура

### Межа internal / public (жорстка)

| Маршрут | Хто | Layout |
|---|---|---|
| `app/(internal)/` | Filip: admin/manager | Sidebar + StoreProvider (буде замінено на DB) |
| `app/nabidka/[id]/` | Архітектор, публічно | Без sidebar, без auth, read-only + форма коментаря |

`internalNote` та будь-які внутрішні поля **ніколи** не потрапляють у `/api/public/*`. Є окремі Prisma-select: `offerPublicSelect` і `offerPrivateSelect`.

### Шари

- **Читання:** серверні компоненти → Prisma напряму
- **Мутації:** тільки Route Handlers (`app/api/**`). Server Actions не використовуємо
- **Prisma — тільки сервер.** Ніколи не імпортувати в `"use client"` файли
- **Клієнтський стан конструктора КП:** локальний `useState` + autosave debounce 1000 мс → PATCH; індикатор `Ukládání… / Uloženo` в шапці

### Критичні деталі реалізації

- **`shareId` ≠ `id`** на Offer. Публічний маршрут шукає по `shareId` (random UUID v4)
- **Гроші — `Decimal` (Prisma), не `Float`.** `.toNumber()` тільки на межі API, не в циклах розрахунку. Вся математика — `lib/calculations.ts`
- **`unitPriceSnapshot`** — ціна фіксується при додаванні позиції, розрахунки беруть знімок
- **Next.js 16:** `middleware.ts` → `proxy.ts` (codemod: `npx @next/codemod@latest middleware-to-proxy .`)
- **Авторизація ролей — в кожному хендлері**, не тільки в proxy. Хелпер `requireAdmin()` першим рядком
- **Єдиний формат помилки:** `{ "error": { "code", "message", "fields"? } }`. Валідація — Zod в `lib/validation/`
- **Імпорт продуктів — два кроки:** `/preview` (парс без запису) → `/commit` (запис у БД)

---

## Стек (зафіксований, не замінювати)

| Шар | Технологія |
|---|---|
| Framework | Next.js 16 App Router + React 19 + TypeScript |
| Стилі | Tailwind CSS v4, токени в `app/globals.css` |
| БД | PostgreSQL self-hosted (НЕ Supabase) |
| ORM | Prisma |
| Auth | Custom JWT (httpOnly cookie) + proxy.ts (НЕ NextAuth) |
| Файли | Локальний том `/data/uploads` (НЕ S3/MinIO) |
| Email | Resend |
| PDF | jsPDF + jspdf-autotable (`lib/pdf-export.ts`) |
| Excel | ExcelJS (`lib/excel-export.ts`) |
| Іконки | @phosphor-icons/react, `weight="duotone"` для акцентних |
| Шрифти | Satoshi (`var(--font-display)`), Geist (body), Geist Mono (числа) |
| Деплой | Hetzner + Docker Compose + Caddy |

---

## Дизайн-система (заморожена — не змінювати зовнішній вигляд)

- **Акцент:** aged brass `#8B7355` → `var(--accent)`. Жодного другого акцентного кольору
- **Фон:** `#FAFAF8`, поверхні білі, текст `zinc-900`/`zinc-500`, межі `zinc-200/70`
- **Заборонено:** фіолетовий, неон, градієнтний текст, чистий `#000000`, шрифт Inter, Framer Motion, emoji в UI
- **Статуси КП:** `rozpracovana`=zinc-400, `odeslana`=sky-600, `okomentovana`=amber-500, `potvrzena`=emerald-600
- Будь-яке відрендерене число — **Geist Mono + `tabular-nums`**
- CTA — клас `btn-tactile`, фон `var(--accent)`, `active:scale-[0.98] active:-translate-y-[1px]`
- Перед будь-яким кроком UI — перечитати `docs/DESIGN-SYSTEM.md §9` (чек-лист)

---

## Ключові файли бібліотеки

| Файл | Роль |
|---|---|
| `lib/types.ts` | Всі типи + Czech label maps (`PRODUCT_TYPE_LABEL`, `OFFER_STATUS_LABEL`) |
| `lib/calculations.ts` | Вся грошова математика. Додати VAT тут (Блок 6) |
| `lib/store.tsx` | Тимчасовий in-memory store. **Видалити у Блоці 3** |
| `lib/pdf-export.ts` | Генерація PDF (Roboto з `public/fonts/`) |
| `lib/excel-export.ts` | Генерація Excel |
| `lib/productIcons.ts` | Маппінг категорія → іконка-заглушка |

---

## Мова

UI-рядки — **чеська** (зберігати існуючі). Ідентифікатори, коментарі, коміти — **англійська**.

---

## Поза скоупом (не реалізовувати)

Money S3 інтеграція, логін-портал архітектора, AI-асистент, newsletter, AR-візуалізація, проєктний портал. При дрейфі туди — зупинитись і запитати.
