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

## Figma-дизайн (узгоджений, заморожений)

Файл: `https://www.figma.com/design/cATUEsDfluk1F9X9d5f8mz/`  
Сторінка: `Screens` (node `0:1`). Всі 9 екранів — фрейми верхнього рівня.

| Екран | Figma node | Маршрут | Статус у коді |
|---|---|---|---|
| 01-homepage (Dashboard) | `1:2` | `/` | Є, майже відповідає |
| 02-nabidky (Список КП) | `1:77` | `/nabidky` | Є, майже відповідає |
| 03-katalog | `1:144` | `/katalog` | Є, майже відповідає |
| 04-nabidka-detail (RD Nebušice, scroll) | `1:241` | `/nabidky/[id]` | Є, є дрібні відмінності |
| 05-nabidka-katalog-panel (з відкритою панеллю) | `1:417` | `/nabidky/[id]` | Є |
| 06-nabidka-adr (USD КП, повна) | `1:644` | `/nabidky/[id]` | Є |
| 07-share-architekt (публічна сторінка) | `1:764` | `/nabidka/[id]` ← потрібно rename | Є як `share/[id]` |
| 08-share-clicked (модалка «Sdílet odkaz») | `1:879` | `/nabidky/[id]` | Є як `ShareModal` |
| 09-produkt-detail-modal | `1:1057` | `/katalog` (модалка) | **Відсутній** |

### Ключові спостереження з Figma

**Sidebar** (`components/Sidebar.tsx`):
- Лого: «FARLINE» (великий, bold) + «LIVING · NABÍDKY» (малий, tracking-wide) — вже є
- Навігація: Přehled, Nabídky (з badge), Katalog produktů — вже є
- User внизу: аватар brass-кола «FK», ім'я + компанія — вже є

**Dashboard** (`app/(internal)/page.tsx`):
- Layout `grid-cols-[2fr_1fr]`: ліво — метрики+таблиця, право — Aktivita — **вже відповідає Figma**
- 4 метрики: CELKEM NABÍDEK, ROZPRACOVANÉ, ODESLANÉ, NOVÉ KOMENTÁŘE — є
- Таблиця «Poslední nabídky»: AKCE, ARCHITEKT, CENA, STAV — є
- Aktivita: іконки PaperPlaneTilt (odeslána) і ChatCircleDots (komentář) з датою — є

**Список КП** (`app/(internal)/nabidky/page.tsx`):
- Таби-фільтри з лічильниками: Všechny N, Rozpracované N, Odeslané N, Okomentované N, Potvrzené N
- Колонки таблиці: AKCE, ARCHITEKT, DATUM, POLOŽKY, CENA PO SLEVĚ, STAV

**Каталог** (`app/(internal)/katalog/page.tsx`):
- Пошук (wide input) + «Všechny ▾» dropdown-фільтр + «+ Přidat» button
- Grid 4 колонки: фото placeholder, PRO-код (mono), назва, brand · decor, ціна

**Конструктор КП** (`app/(internal)/nabidky/[id]/page.tsx`):
- Хедер: «← Zpět na seznam» + status badge + дата «Vytvořeno»
- **Права панель дій (sticky):** «Sdílet nabídku» (brass, primary) → після кліку «Sdílet odkaz» | «Označit jako odeslanou» | «Stáhnout PDF» | «Stáhnout Excel» | «Smazat nabídku» (red, destructive)
- Таблиця позицій: PRODUKT (фото+код+назва+brand·decor), POČET, CENA JEDNOTKY, SLEVA, CENA PO SLEVĚ
- Summary внизу: PŘED SLEVOU | SLEVA (accent color, minus) | CENA PO SLEVĚ
- «Interní poznámka» textarea (тільки Filip)
- «Komentáře architekta (N)» + «Označit jako přečtené» link

**Публічна сторінка** (`app/share/[id]` → перейменувати на `app/nabidka/[id]`):
- Центрований layout без sidebar
- «FARLINE / LIVING» header (центр)
- «NABÍDKA PRO» label → велика назва КП
- Таблиця: PRODUKT, POČET, JEDNOTKA, SLEVA, CENA
- Summary: PŘED SLEVOU | SLEVA | CENA PO SLEVĚ + кнопки PDF/Excel
- Секція «Komentáře» → список + форма «Přidat komentář»

**Модалка деталей продукту** (`09-produkt-detail-modal`) — **НОВИЙ компонент**:
- Розмір: широка модалка (≈ 500px), overlay на каталозі
- Ліво: велике фото продукту (square)
- Право: PRO-код (mono, small), назва (H2), brand · decor, короткий опис, «CENA: X Kč» (bold)
- Параметри (key-value рядки): Materiál, Šířka, Záruka, Kód
- «Technický list» секція: dashed upload zone «Nahrát PDF» (max. 10 MB)
- «+ Přidat do nabídky» (brass, full-width) внизу
- ×-кнопка закриття

---

## Поза скоупом (не реалізовувати)

Money S3 інтеграція, логін-портал архітектора, AI-асистент, newsletter, AR-візуалізація, проєктний портал. При дрейфі туди — зупинитись і запитати.
