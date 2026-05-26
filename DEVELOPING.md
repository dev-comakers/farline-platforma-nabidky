# Developing — Farline Nabídky

## Ланцюг читання (читати по порядку перед будь-яким кодом)

Це не просто список — це послідовність. Кожен документ будується на попередньому. Пропускати не можна.

```
1. ONBOARDING.md           ← точка входу, загальний контекст
2. docs/PRD.md             ← що будуємо: ролі, acceptance-критерії, §3 матриця «є→доробити», §9 заборони
3. docs/TECH-SPEC.md       ← як будуємо: стек, Prisma-схема §3, API §5, auth §4, ENV §8, інфра §9
4. docs/DESIGN-SYSTEM.md   ← заморожений візуал: токени, компоненти, анімації, чек-лист §9
5. docs/IMPLEMENTATION-PLAN.md ← поточний блок роботи та залежності між блоками
6. desc-from-contract.md   ← юридичне ТЗ (Příloha č. 1), на нього посилається PRD
```

Після прочитання — перевірити поточний блок у `IMPLEMENTATION-PLAN.md` і йти від нього.

---

## Поточний стан проєкту

**Є:** рабочий клієнтський прототип (Next.js 16 + React 19 + Tailwind v4), UI узгоджений клієнтом і заморожений. Дані живуть in-memory у `lib/store.tsx`, скидаються при перезавантаженні.

**Немає:** БД, авторизація, реальна пошта, реальний імпорт, збереження файлів на сервері.

**Завдання:** підключити готовий UI до Postgres/Prisma + додати відсутній функціонал по блоках з `IMPLEMENTATION-PLAN.md`. **Не переписувати UI**.

---

## Правила гілок і PR

- `main` — стабільна версія. Прямий push заборонений.
- `develop` — основна гілка розробки. Прямий push заборонений.
- Кожен блок плану — окрема гілка від `develop`: `feat/block-N-name` або `chore/...`/`fix/...`.
- **Будь-які зміни — тільки через Pull Request.** PR описувати: що зроблено, які acceptance-критерії PRD закриті, як перевірити.
- Перед PR локально: `lint + typecheck + build + test`. CI повинен бути зеленим.

---

## Команди

```bash
npm run dev      # dev-сервер (Turbopack), http://localhost:3000
npm run build    # production build
npm run start    # запуск production build
```

TypeScript-перевірка (немає окремого скрипту поки — Блок 0):
```bash
npx tsc --noEmit
```

Тестування PDF/Excel вручну:
```bash
node scripts/test-pdf.mjs
node scripts/test-excel.mjs
```

---

## Що переиспользувати (не переписувати)

| Файл(и) | Що це | Коли використовуєш |
|---|---|---|
| `app/(internal)/**`, `components/**` | Увесь UI (дашборд, список КП, каталог, конструктор, share-сторінка, модалки) | Блоки 3–8 — підключати до БД |
| `lib/calculations.ts` | Вся грошова математика | Блок 6 — додати НДС, не переписувати |
| `lib/pdf-export.ts` | PDF у стилі Farline | Блок 9 — додати showVat/hideCode |
| `lib/excel-export.ts` | Excel через ExcelJS | Блок 9 |
| `components/ProductIconBox.tsx`, `lib/productIcons.ts` | Заглушка фото | Блок 4 |
| `components/PhotoUploader.tsx` | UI завантаження фото | Блок 4 — перевести на серверний upload, вигляд не чіпати |
| `app/globals.css` | Дизайн-токени та анімації | Скрізь |

---

## Що видалити/мігрувати з демо (по блоках)

| Що | Де | Коли (блок) |
|---|---|---|
| `lib/store.tsx` (in-memory) | замінити на Prisma + локальний state конструктора | Блок 3 |
| `data/*.json` | перенести в Prisma seed | Блок 1 |
| `app/share/[id]/` | видалити цілком, замінити на `app/nabidka/[id]/` | Блок 3 |
| Заглушка імпорту в `ImportModal.tsx` | наповнити реальним парсингом | Блок 10 |
| Хардкод «Filip Kott» в Sidebar | брати з сесії | Блок 2 |
| `StoreProvider` на share-сторінці | прибрати разом зі `share/[id]` | Блок 3 |

---

## Архітектурні межі (не порушувати)

**Internal vs Public:** маршрути під `app/(internal)/` — тільки для Filip (admin/manager). Маршрут `/nabidka/[shareId]` — публічний, без сайдбару, без auth. **`internalNote` та внутрішні поля ніколи не потрапляють у `/api/public/*`.**

**Мутації — тільки Route Handlers** (`app/api/**`). Server Actions не використовуємо. Prisma — тільки серверний код, ніколи в `"use client"` файлах.

**Гроші — `Decimal` (Prisma), не `Float`.** Конвертація `.toNumber()` — тільки на межі API/серверного компонента, не всередині розрахункових циклів. Вся математика — `lib/calculations.ts`.

**`shareId` ≠ `id`** на Offer. Публічна сторінка шукає по `shareId`, внутрішній `id` в публічні URL/відповіді не потрапляє.

**`unitPriceSnapshot`** — ціна фіксується при додаванні позиції до КП; розрахунки беруть знімок, не поточну ціну продукту.

---

## Ключові точки TECH-SPEC, які легко пропустити

- **Next.js 16:** `middleware.ts` → **`proxy.ts`** (codemod: `npx @next/codemod@latest middleware-to-proxy .`). Перед нетривіальними речами читати `node_modules/next/dist/docs/`.
- **Satoshi** зараз вантажиться зовнішнім `<link>`. У Блоці 0 перенести на `next/font/local`.
- **`output: "standalone"`** в `next.config.ts` — потрібно для Docker (Блок 12), додати в Блоці 0.
- **Авторизація в кожному хендлері**, не тільки в proxy. `proxy.ts` перевіряє лише аутентифікацію. Ролі — хелпер `requireAdmin()` першим рядком хендлера.
- **Throttle логіну:** ≤5–10 невдач / 15 хв → `429`. Відповідь завжди загальна (без розкриття чи існує user).
- **Rate-limit публічного POST коментарів:** ≤5/10 хв на IP, ≤20/день на КП.
- **Єдиний формат помилки:** `{ "error": { "code", "message", "fields"? } }`. Валідація — Zod, схеми в `lib/validation/`.
- **Імпорт — два кроки:** `/preview` (парс в пам'яті, без запису) → `/commit` (запис у БД).

---

## Структура блоків (поточний прогрес)

```
0 → 1 → 2 → 3 ─┬─ 4 → 5
               ├─ 6 → 9
               ├─ 7 → 8
               └─ 11
1 → 4 → 10 → 13
всё → 12
```

| Блок | Ветка | Суть |
|---|---|---|
| 0 | `chore/project-baseline` | CI, ESLint, тести, standalone, Satoshi local |
| 1 | `feat/db-prisma-setup` | Prisma схема + міграція + seed |
| 2 | `feat/auth-jwt` | Логін, JWT, proxy.ts, ролі |
| 3 | `feat/replace-store-with-db` | Замінити store на БД, rename share→nabidka |
| 4 | `feat/catalog-product-crud` | CRUD продуктів + файли |
| 5 | `feat/category-fields-and-product-detail` | Поля категорій (admin) + детальна картка |
| 6 | `feat/offer-builder-statuses-vat` | Статуси позицій, НДС, EUR |
| 7 | `feat/share-public-offer` | Шаринг + публічна сторінка з БД |
| 8 | `feat/comments-resend-notifications` | Коментарі + Resend |
| 9 | `feat/export-vat-hidecode` | PDF/Excel з НДС та hideCode |
| 10 | `feat/product-import` | Реальний імпорт CSV/XLSX |
| 11 | `feat/user-management` | Управління користувачами (admin) |
| 12 | `chore/deploy-hetzner` | Docker + Caddy + Hetzner |
| 13 | `chore/catalog-seed-suppliers` | Наповнення каталогу (блокується клієнтом) |

Детальний чек-лист кожного блоку — `docs/IMPLEMENTATION-PLAN.md`.
