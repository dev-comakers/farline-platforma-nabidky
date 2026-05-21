# Developing

## Правила роботи з гілками

- `main` — стабільна версія. Прямий push заборонений.
- `develop` — основна гілка розробки.
- Кожен блок або фіча — окрема гілка від `develop`: `feat/block-N-name`.

**Будь-які зміни додаються тільки через Pull Request.** Прямий push в `develop` або `main` заборонений.

---

## Структура проєкту

### Документація (читати перед розробкою)

| Файл | Що це |
|---|---|
| `README.md` | Короткий опис проєкту, стек, команда запуску |
| `ONBOARDING.md` | Точка входу для нового розробника — читати першим |
| `CLAUDE.md` | Інструкції для AI-асистента (Claude Code) |
| `AGENTS.md` | Правило для AI: Next.js 16 — читати доки перед нетривіальними речами |
| `desc-from-contract.md` | Юридичне ТЗ з контракту (Příloha č. 1) |
| `docs/PRD.md` | Продуктові вимоги: ролі, acceptance-критерії, що поза скоупом |
| `docs/TECH-SPEC.md` | Архітектура: стек, Prisma-схема, API, auth, ENV, конвенції |
| `docs/DESIGN-SYSTEM.md` | Дизайн-система — заморожена, не змінювати |
| `docs/IMPLEMENTATION-PLAN.md` | План розробки по блоках (0–13), що є / що доробити |

---

### Код застосунку

#### `app/` — Next.js App Router (сторінки)

| Шлях | Що це |
|---|---|
| `app/layout.tsx` | Кореневий layout: шрифти, глобальні стилі |
| `app/globals.css` | Дизайн-токени Tailwind v4 (кольори, шрифти, анімації) — не чіпати |
| `app/(internal)/` | Захищена зона (admin/manager): дашборд, список КП, каталог |
| `app/(internal)/page.tsx` | Дашборд — головна сторінка після логіну |
| `app/(internal)/nabidky/page.tsx` | Список всіх комерційних пропозицій |
| `app/(internal)/nabidky/[id]/page.tsx` | Конструктор КП — редагування конкретної пропозиції |
| `app/(internal)/katalog/page.tsx` | Каталог продуктів з пошуком і фільтрами |
| `app/(internal)/layout.tsx` | Layout внутрішньої зони: сайдбар + провайдери |
| `app/share/[id]/` | Публічна сторінка архітектора (без авторизації, read-only) — буде перейменована в `nabidka/[id]` в продакшені |

#### `components/` — React-компоненти (UI узгоджений клієнтом, не змінювати зовнішній вигляд)

| Файл | Що це |
|---|---|
| `Sidebar.tsx` | Бічна навігація внутрішньої зони |
| `ProductCatalogPanel.tsx` | Панель каталогу продуктів (пошук, фільтр, картки) |
| `ProductCard.tsx` | Картка одного продукту в каталозі |
| `ProductIconBox.tsx` | Заглушка-іконка продукту якщо немає фото |
| `SummaryBlock.tsx` | Блок підсумків КП (знижка, ПДВ, сума) |
| `MetricCard.tsx` | Картка метрики на дашборді |
| `PhotoUploader.tsx` | Завантаження фото продукту з даунскейлом |
| `ShareModal.tsx` | Модалка для копіювання публічного посилання на КП |
| `ImportModal.tsx` | Модалка імпорту продуктів з Excel (зараз заглушка) |
| `StatusBadge.tsx` | Бейдж статусу КП (rozpracována / odeslaná / ...) |
| `Toast.tsx` | Системні повідомлення (toast-нотифікації) |

#### `lib/` — Бізнес-логіка

| Файл | Що це |
|---|---|
| `types.ts` | TypeScript-типи: `Product`, `Offer`, `OfferItem`, `Comment` тощо |
| `calculations.ts` | Вся грошова математика: знижки, ПДВ, підсумки — тільки тут |
| `store.tsx` | **Тимчасово:** in-memory стан (React context). Буде видалений після підключення БД (Блок 3) |
| `pdf-export.ts` | Генерація PDF у стилі Farline через jsPDF |
| `excel-export.ts` | Генерація Excel через ExcelJS |
| `productIcons.ts` | Маппінг категорії продукту → іконка-заглушка |

#### `data/` — Тестові дані (тимчасово)

| Файл | Що це |
|---|---|
| `products.json` | Список продуктів для прототипу |
| `offers.json` | Список КП для прототипу |
| `comments.json` | Коментарі архітекторів для прототипу |

> Ці файли будуть перенесені в Prisma seed і видалені в Блоці 1.

#### `scripts/` — Утиліти для тестування

| Файл | Що це |
|---|---|
| `test-pdf.mjs` | Перевірка генерації PDF |
| `test-excel.mjs` | Перевірка генерації Excel |

#### `public/` — Статичні файли

| Шлях | Що це |
|---|---|
| `public/sample-photos/` | Тестові фото продуктів (ванни, змішувачі тощо) |
| `public/fonts/` | Шрифти Roboto для PDF-генерації |

---

### Конфігурація

| Файл | Що це |
|---|---|
| `package.json` | Залежності та npm-скрипти |
| `tsconfig.json` | Налаштування TypeScript |
| `next.config.ts` | Налаштування Next.js |
| `postcss.config.mjs` | PostCSS для Tailwind v4 |
| `.gitignore` | Виключення з git (node_modules, .env, .next) |

---

## З чого починати розробку

1. Прочитай `ONBOARDING.md`
2. Прочитай `docs/PRD.md` — зрозумій що будуємо
3. Прочитай `docs/TECH-SPEC.md` — зрозумій стек і архітектуру
4. Відкрий `docs/IMPLEMENTATION-PLAN.md` — знайди поточний блок
5. Створи гілку від `develop`: `git checkout -b feat/block-N-name`
6. Після завершення — PR в `develop`
