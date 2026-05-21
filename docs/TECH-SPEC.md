# TECH-SPEC — Farline Nabídky (продакшен)

**Версия:** 1.0 · **Дата:** 2026-05-21
Сопровождает `PRD.md`. Описывает архитектуру, модель данных, API, инфраструктуру и конвенции. **Стек зафиксирован — не заменять компоненты без согласования с Artem.**

---

## 1. Стек (зафиксирован)

| Слой | Технология | Примечание |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript** | уже в репо; см. `AGENTS.md` — это не привычный Next, читать `node_modules/next/dist/docs/` перед нетривиальными вещами |
| Стили | **Tailwind CSS v4** | токены в `app/globals.css`, см. `DESIGN-SYSTEM.md` |
| БД | **PostgreSQL** | self-hosted в Docker. **НЕ Supabase** |
| ORM | **Prisma** | миграции + типы + seed |
| Auth | **Custom JWT (httpOnly cookie) + middleware** | роли admin/manager. **НЕ Supabase Auth, НЕ NextAuth** |
| Хранение файлов | **Локальный том сервера** | папка `/data/uploads`, отдаётся через API/Caddy. **НЕ S3/MinIO** |
| Email | **Resend** | уведомления о комментариях |
| PDF | **jsPDF + jspdf-autotable** | уже реализовано в `lib/pdf-export.ts` |
| Excel | **ExcelJS** | уже реализовано в `lib/excel-export.ts` |
| Импорт | **xlsx (SheetJS)** | уже в зависимостях, пока не используется |
| Иконки | **@phosphor-icons/react**, `weight` по дизайну | |
| Шрифты | Satoshi (заголовки), Geist (текст), Geist Mono (числа) | |
| Деплой | **Hetzner + Docker Compose + Caddy** | TLS — Caddy/Let's Encrypt |
| Домен | `farline.comakers.cz` | DNS настраивает Artem |

---

## 2. Архитектура приложения

Сейчас демо — клиентский SPA: данные в `lib/store.tsx` (React context) из `data/*.json`, ничего не персистится. **Цель — переезд на серверную модель:** Postgres + Prisma + API (Route Handlers) + серверные компоненты для чтения.

### 2.1 Структура маршрутов

```
app/
├── (auth)/login/page.tsx          # публичный логин
├── (internal)/                    # защищено proxy.ts (admin/manager)  ⚠️ в Next 16 middleware→proxy
│   ├── layout.tsx                 # Sidebar + провайдеры
│   ├── page.tsx                   # Dashboard (Přehled)
│   ├── nabidky/page.tsx           # список КП
│   ├── nabidky/[id]/page.tsx      # конструктор КП
│   ├── katalog/page.tsx           # каталог
│   ├── uzivatele/page.tsx         # управление пользователями (ТОЛЬКО admin)
│   └── nastaveni/kategorie/page.tsx  # определения полей категорий (admin)
├── nabidka/[id]/                  # ПУБЛИЧНАЯ страница архитектора (без auth, без сайдбара)
│   ├── layout.tsx
│   └── page.tsx
└── api/                           # Route Handlers (см. §5)
```

> **Важно:** демо использует группу `(internal)` и маршрут `share/[id]`. В проде публичный маршрут переименовать в **`/nabidka/[id]`** (как в контракте §2.6), а старый `app/share/[id]` **удалить целиком**. Внутренние маршруты остаются под `(internal)` и закрываются **`proxy.ts`** (в Next.js 16 файл `middleware.ts` устарел и переименован в `proxy.ts`, экспорт-функция `proxy`; codemod: `npx @next/codemod@latest middleware-to-proxy .`).
>
> `(auth)` — это route group: URL остаётся `/login`, имя папки на путь не влияет. В matcher исключается путь `/login`, а не папка.

### 2.2 Слои
- **Чтение:** серверные компоненты тянут данные через Prisma напрямую (или через тонкий `lib/db/*` слой).
- **Запись/мутации:** **только Route Handlers** `app/api/**`. Server Actions в проекте **не используем** — так у каждой мутации есть явный URL, метод и тестируемость. Не смешивать два подхода.
- **Prisma — только сервер.** Никогда не импортировать `prisma` в файл с `"use client"` (иначе ошибка сборки — Node-модули в браузерном бандле). Клиентским компонентам данные передаём пропсами из серверного компонента или через Route Handler.
- **Клиентское состояние:** локальный `useState`/`useReducer` в конструкторе КП с сохранением на сервер. **Контракт автосейва:** debounce **1000 мс** после последнего изменения; индикатор `Ukládání… / Uloženo` в шапке КП (без тоста); при ошибке — inline-ошибка с retry; один PATCH со всеми изменёнными полями, не по одному на символ. Глобальный store не нужен.
- Удалить `lib/store.tsx` (in-memory) после переезда; `data/*.json` → перенести в Prisma seed.

---

## 3. Модель данных (Prisma)

> Это целевая схема. Стартовые значения параметров категорий — провизорные (PRD §C2), редактируются админом (FR-9).

```prisma
// schema.prisma — целевой ориентир, уточняется при реализации

enum Role {
  admin
  manager
}

enum OfferStatus {
  rozpracovana
  odeslana
  okomentovana
  potvrzena
}

enum Currency {
  CZK
  USD
  EUR
}

enum FieldType {
  text
  number
  select
  textarea
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  role         Role     @default(manager)
  passwordHash String
  offers       Offer[]                       // авторство КП (для активности/дашборда)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ProductCategory {
  id      String              @id @default(uuid())
  key     String   @unique    // "umyvadlove_baterie" и т.д. (см. ProductType из lib/types.ts)
  label   String              // "Umyvadlové baterie"
  order   Int      @default(0)
  fields  CategoryField[]
  products Product[]
}

model CategoryField {
  id         String          @id @default(uuid())
  categoryId String
  category   ProductCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  key        String          // "rozmery", "material"...
  label      String          // "Rozměry"
  type       FieldType       @default(text)
  options    String[]        // для select
  order      Int             @default(0)
  @@unique([categoryId, key])
}

model Product {
  id                 String          @id @default(uuid())
  code               String          @unique  // импорт дедуплицирует по коду (upsert)
  name               String
  brand              String
  decor              String
  categoryId         String
  category           ProductCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  unitPrice          Decimal         @db.Decimal(12, 2)  // деньги — Decimal, НЕ Float
  currency           Currency        @default(CZK)
  imagePath          String?         // путь в /data/uploads
  technicalSheetPath String?         // PDF техлиста (1 на продукт)
  parameters         Json            @default("{}")  // { CategoryField.key: value }
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  offerItems         OfferItem[]
  @@index([categoryId])
  @@index([code])
  @@index([brand])
}

model Offer {
  id            String      @id @default(uuid())
  shareId       String      @unique @default(uuid())  // публичная ссылка — ОТДЕЛЬНО от внутр. id
  name          String      @default("Nová nabídka")
  architect     String      @default("")
  status        OfferStatus @default(rozpracovana)
  currency      Currency    @default(CZK)
  internalNote  String?                      // НИКОГДА не отдавать в /api/public/*
  showVat       Boolean     @default(true)   // показывать НДС
  vatRate       Decimal     @default("0.21") @db.Decimal(5, 4)  // ставка фиксируется на момент КП
  hideCode      Boolean     @default(false)  // скрыть код продукта в экспорте/шаринге
  shareEnabled  Boolean     @default(true)   // задел: деактивация ссылки (UI позже)
  sharedAt      DateTime?                    // когда впервые расшарено
  createdById   String?
  createdBy     User?       @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  items         OfferItem[]
  comments      Comment[]
  @@index([status])
  @@index([createdAt])
}

model OfferItem {
  id                String  @id @default(uuid())
  offerId           String
  offer             Offer   @relation(fields: [offerId], references: [id], onDelete: Cascade)
  productId         String
  product           Product @relation(fields: [productId], references: [id], onDelete: Restrict)
  quantity          Int     @default(1)
  discountPercent   Decimal @default(0) @db.Decimal(5, 2)
  unitPriceSnapshot Decimal @db.Decimal(12, 2)  // цена на момент добавления — защита от ретро-изменений
  note              String?
  // статусы позиции (независимы от статуса КП), отмечает Farline:
  confirmed         Boolean @default(false)  // Potvrzeno
  ordered           Boolean @default(false)  // Objednáno
  received          Boolean @default(false)  // Získáno
  position          Int     @default(0)      // для порядка/будущего reorder
  @@index([offerId])
  @@index([productId])
}

model Comment {
  id          String   @id @default(uuid())
  offerId     String
  offer       Offer    @relation(fields: [offerId], references: [id], onDelete: Cascade)
  authorName  String
  authorEmail String
  text        String
  isNew       Boolean  @default(true)
  createdAt   DateTime @default(now())
  @@index([offerId])
  @@index([isNew])
}
```

**Заметки по модели:**
- **Деньги — `Decimal`, не `Float`.** `Float` (double) даёт накопительную погрешность на суммах/скидках. Prisma `Decimal` возвращает `Decimal`-объекты — конвертируй в `number` через `.toNumber()` **на границе** (при чтении в API/серверном компоненте), и передавай чистые `number` в `lib/calculations.ts` (оно работает с `number`). Не вызывай `.toNumber()` внутри циклов расчёта.
- **`shareId` ≠ `id`.** Публичная страница `/nabidka/[shareId]` и `/api/public/offers/:shareId` ищут по `shareId` (random uuid v4). Внутренний `id` в публичные URL/ответы не попадает. `shareEnabled=false` → 404 и на странице, и в public API. Это единственный контроль доступа к публичной странице — не делать ID последовательными.
- **Снапшот цены.** `unitPriceSnapshot` заполняется при добавлении позиции; расчёты берут снапшот, а не текущую `product.unitPrice` — иначе редактирование цены продукта задним числом меняет уже подтверждённые КП и экспортированные PDF. Seed обязан заполнить снапшоты.
- **Ставка НДС** хранится на КП (`vatRate`), не хардкодится — на случай изменения ставки в будущем без правки истории.
- **`ProductType`** из `lib/types.ts` остаётся как `ProductCategory.key`. Категории и их поля теперь в БД (admin-editable).
- **`parameters`** — JSONB key→value; на сохранении продукта API должен оставлять только ключи, присутствующие в текущих `CategoryField` категории (отбрасывать «осиротевшие»). Рендер карточки — по `CategoryField`.
- **`onDelete`:** удаление `ProductCategory`/`Product`, на которые есть ссылки, заблокировано (`Restrict`) — API должен вернуть `409` с понятным сообщением, а не падать.
- **Enums** Postgres неизменяемы: добавить значение статуса позже = `ALTER TYPE ... ADD VALUE` (нельзя внутри транзакции Prisma). Учитывать при будущих правках.
- **EUR с первого дня:** добавить `EUR` в enum `Currency` (Блок 1) и в `lib/types.ts`, даже если в UI переключатель валют включит EUR только в Блоке 6 — чтобы БД и типы не расходились.
- Стартовые поля категории (provisional): `rozmery`, `material`, `povrch`, `pripojeni`, `hmotnost`, `prutok`/`objem`, `zaruka`. Засеять, далее редактирует admin.

---

## 4. Авторизация и доступ

- **Пароли:** хэш `argon2` или `bcrypt`. Никогда не хранить в открытом виде.
- **JWT:** подпись `JWT_SECRET`, payload `{ userId, role }`, срок ~7 дней, в **httpOnly + Secure + SameSite=Lax** cookie. Не класть в localStorage.
- **Middleware** (`middleware.ts`): пропускает `/login`, `/nabidka/*`, `/api/auth/*`, статику; остальное требует валидный JWT. Без токена → redirect `/login`.
- **Проверка ролей на сервере (не только в UI):**
  - удаление КП — только `admin`;
  - `/api/users/*` и `/nastaveni/kategorie` — только `admin`;
  - всё прочее — `admin` и `manager`.
- **Публичные эндпоинты** (страница КП и POST комментария) **не требуют auth**, но: rate-limit на POST комментария, валидация/санитизация полей, проверка `shareEnabled`.
- Первый admin — seed из ENV (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).

---

## 5. API (Route Handlers)

Ориентир (REST, JSON). Защищённые — за middleware; публичные помечены `[public]`.

```
POST   /api/auth/login            { email, password } → set cookie
POST   /api/auth/logout           → clear cookie
GET    /api/auth/me               → текущий пользователь

GET    /api/products              ?q=&brand=&decor=&type=
POST   /api/products              создать
PATCH  /api/products/:id          обновить
DELETE /api/products/:id          удалить
POST   /api/products/:id/image    upload фото (multipart) → imagePath
DELETE /api/products/:id/image
POST   /api/products/:id/sheet    upload техлиста PDF → technicalSheetPath
DELETE /api/products/:id/sheet
POST   /api/products/import       CSV/XLSX → предпросмотр/коммит

GET    /api/offers                список
POST   /api/offers                создать пустую
GET    /api/offers/:id            детали
PATCH  /api/offers/:id            шапка/настройки/статус (showVat, hideCode...)
DELETE /api/offers/:id            [admin]
POST   /api/offers/:id/items      добавить позицию { productId }
PATCH  /api/offers/:id/items/:iid { quantity, discountPercent, confirmed, ordered, received, note }
DELETE /api/offers/:id/items/:iid
POST   /api/offers/:id/share      сгенерировать/подтвердить ссылку, статус→odeslana

GET    /api/public/offers/:id     [public] данные КП для страницы архитектора (без internalNote!)
POST   /api/public/offers/:id/comments  [public] { authorName, authorEmail, text } → коммент + email Filipу

GET    /api/categories            список категорий + полей
POST   /api/categories/:id/fields [admin] CRUD определений полей
PATCH/DELETE соответственно       [admin]

GET    /api/users                 [admin]
POST   /api/users                 [admin] создать (email, name, role, password)
PATCH  /api/users/:id             [admin] сменить роль/пароль/имя
DELETE /api/users/:id             [admin]
```

> **`internalNote` и любые внутренние поля не должны попадать в `/api/public/*`.** Это жёсткая граница приватности.

PDF/Excel экспорт остаётся **клиентским** (`lib/pdf-export.ts`, `lib/excel-export.ts`) — переиспользуем; данные прокидываются из загруженной КП. Учесть `showVat` и `hideCode`.

---

## 6. Загрузка файлов
- Хранилище: локальный том, смонтированный в контейнер (`/data/uploads`). Структура: `/data/uploads/products/{productId}/image.jpg` и `/sheet.pdf`.
- Принимаем фото: JPG/PNG/WebP; даунскейл на сервере (или переиспользовать клиентский даунскейл из `PhotoUploader.tsx`, но валидировать и на сервере). Техлист: только PDF, лимит размера (напр. 10 МБ).
- Отдача файлов: через Caddy (статический путь) или Route Handler с проверкой. Имена на диске — не доверять имени из браузера (генерировать).
- Бэкап папки uploads — см. §9.

---

## 7. Email (Resend)
- Триггер: новый комментарий на публичной странице → письмо Филипу.
- Содержимое (чешский): название КП, имя+email архитектора, текст комментария, ссылка на КП в админке.
- Адрес-отправитель: верифицированный домен в Resend (`RESEND_FROM`, например `nabidky@farline.comakers.cz`) — настройку DNS/домена согласовать с Artem.
- Отказ Resend не должен ронять сохранение комментария: сначала пишем коммент в БД (200 архитектору), письмо — best-effort с логом ошибки.

---

## 8. Конфигурация (ENV)

```
DATABASE_URL=postgresql://farline:***@db:5432/farline
JWT_SECRET=***
SEED_ADMIN_EMAIL=filip@farline.cz
SEED_ADMIN_PASSWORD=***
RESEND_API_KEY=***
RESEND_FROM=nabidky@farline.comakers.cz
NOTIFY_TO=filip@farline.cz          # кому слать уведомления о комментариях
UPLOADS_DIR=/data/uploads
APP_URL=https://farline.comakers.cz
NODE_ENV=production
```
`.env.example` с этими ключами — в репо. Реальные значения — только на сервере / в секретах, не коммитить.

---

## 9. Инфраструктура (Hetzner, Docker Compose, Caddy)

Целевой `docker-compose.yml` (ориентир):

```yaml
services:
  app:          # Next.js (standalone build)
    build: .
    env_file: .env
    depends_on: [db]
    volumes:
      - uploads:/data/uploads
  db:           # PostgreSQL
    image: postgres:16
    environment:
      POSTGRES_USER: farline
      POSTGRES_DB: farline
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}   # из .env, НЕ хардкодить
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U farline"]
      interval: 5s
      timeout: 5s
      retries: 10
  caddy:        # reverse-proxy + автоTLS
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
volumes:
  uploads:
  pgdata:
  caddy_data:
```

`Caddyfile` (авто Let's Encrypt):
```
farline.comakers.cz {
  reverse_proxy app:3000
  # при отдаче загрузок напрямую — настроить путь /uploads на том
}
```

- Next.js собирать в `output: "standalone"` (см. `next.config.ts`) для лёгкого образа.
- Миграции Prisma применять на деплое (`prisma migrate deploy`), seed — один раз.
- DNS `farline.comakers.cz → IP Hetzner` настраивает **Artem**.

### 9.1 Бэкапы (в скоупе)
- Ночной `pg_dump` по cron (контейнер/хост), хранение N последних дампов; ротация.
- Бэкап `/data/uploads` (rsync/tar по cron).
- Документировать процедуру restore в `README` деплоя.

---

## 10. Конвенции разработки (обязательны)

- **Ветки:** описательно и понятно, kebab-case с префиксом типа: `feat/db-prisma-setup`, `feat/auth-jwt`, `feat/offer-item-statuses`, `fix/pdf-vat-row`. Одна ветка = один блок/PR.
- **Коммиты:** императив, понятное описание (Conventional Commits приветствуется: `feat:`, `fix:`, `chore:`). По-английски (см. `CLAUDE.md`).
- **PR:** перед каждым PR — прогнать тесты локально; описание PR обязательно (что сделано, какие критерии PRD закрыты, как проверить). Один PR на блок плана.
- **CI (GitHub Actions) на каждый PR:** `lint` + `typecheck` (`tsc --noEmit`) + `build` + `test`. PR не мёржится при красном CI.
- **Тесты:** как минимум unit на `lib/calculations.ts` (НДС, скидки, итоги, округление). По возможности — на парсер импорта. E2E (Playwright) — опционально/позже.
- **Язык:** UI-строки — чешский (сохранять существующие); идентификаторы/комментарии/коммиты — английский.
- **Дизайн заморожен:** не менять токены/компоненты визуально (см. `DESIGN-SYSTEM.md`).
- Перед нестандартной работой с Next.js 16 — читать `node_modules/next/dist/docs/` (см. `AGENTS.md`).

---

## 11. Что удалить/мигрировать из демо
- `lib/store.tsx` (in-memory) → заменить серверным доступом (Prisma) + локальный state конструктора.
- `data/*.json` → Prisma seed.
- `app/share/[id]` → `app/nabidka/[id]` (публичный).
- Заглушка импорта в `components/ImportModal.tsx` → реальный парсинг.
- Добавить: формы продукта (add/edit/delete), детальную карточку, статусы позиций, экраны users и категорий, auth/login, middleware.
- Переиспользовать без изменений визуала: `Sidebar`, `MetricCard`, `StatusBadge`, `SummaryBlock`, `ProductCard`, `ProductIconBox`, `ProductCatalogPanel`, `ShareModal`, `Toast`, `PhotoUploader`, `lib/pdf-export.ts`, `lib/excel-export.ts`, `lib/calculations.ts`.

---

## 12. Дополнения по итогам ревью (обязательно)

Эти пункты уточняют разделы выше и закрывают места, где джун с большой вероятностью сделает небезопасно/неверно «по умолчанию».

### 12.1 Next.js 16 — фактические отличия
- `middleware.ts` **устарел → `proxy.ts`** (экспорт `proxy`). Codemod: `npx @next/codemod@latest middleware-to-proxy .`. Перед auth читать `node_modules/next/dist/docs/01-app/02-guides/authentication.md` и `.../03-file-conventions/proxy.md`.
- В `next.config.ts` добавить `output: "standalone"` (нужно для Docker-образа — Блок 12). В Dockerfile после сборки скопировать `public/` и `.next/static` в `.next/standalone`, запускать `node server.js` (не `next start`).
- **Satoshi** сейчас грузится внешним `<link>` (render-blocking, сторонний запрос). Заменить на `next/font/local`: скачать woff2, положить в `public/fonts/`, токен `--font-display` не трогать. Вид не меняется.
- Для фото-загрузок использовать обычный `<img>` (как в прототипе) + `images: { unoptimized: true }` — оптимизатор `next/image` не работает с файлами из локального тома без доп. конфигурации.

### 12.2 Безопасность авторизации
- **`JWT_SECRET` ≥ 32 байта** (`openssl rand -base64 48`), уникальный на окружение. При verify **пинить алгоритм** (`algorithms: ['HS256']`), отвергать `alg:none`. Ротация секрета = разлогин всех (ок для пилота).
- Cookie: `httpOnly + Secure(в проде) + SameSite=Lax`. Это и есть CSRF-защита → **ни один GET не должен менять состояние** (все мутации POST/PATCH/DELETE), отдельные CSRF-токены не нужны.
- **Авторизация — в каждом хендлере, не только в proxy.** `proxy.ts` проверяет лишь *аутентификацию* (валидный JWT). Роли (`[admin]`: удаление КП, `/api/users/*`, `/api/categories/*`) проверять первой строкой хендлера хелпером `requireAdmin()` → `403`. UI-скрытие кнопок не считается защитой.
- **Throttle логина:** ≤ 5–10 неудач на IP+email / 15 мин → `429`; ответ всегда обобщённый «neplatný e-mail nebo heslo» (без user-enumeration). `SEED_ADMIN_PASSWORD` сменить с дефолта при первом деплое.
- Logout: `Set-Cookie … Max-Age=0`. JWT stateless → серверной ревокации в пилоте нет (осознанный компромисс).

### 12.3 Контракт API (дополняет §5)
- **Единый формат ошибки:** `{ "error": { "code", "message", "fields"? } }`. Коды: `400` валидация (с `fields`), `401` нет/протух JWT, `403` не та роль, `404` не найдено, `409` конфликт (дубль кода/удаление связанного), `413` файл велик, `429` rate-limit, `500` без стектрейса наружу.
- **Валидация входа — Zod** на каждый body (`safeParse` → `400` с `fields`). Общие схемы в `lib/validation/`.
- **Аннотации доступа** у каждого эндпоинта: `[public]` / `[auth]` (admin+manager) / `[admin]`.
- **Списки — пагинация:** `GET /api/products?…&page=1&limit=48`, `GET /api/offers?…&page=1&limit=20` → `{ data, total, page, limit }`. Фильтры brand/decor/type — multiselect (повтор query-параметра).
- **Импорт — два шага** (вместо одного): `POST /api/products/import/preview` (multipart, парс в памяти, без записи) → `{ rows, errors }`; `POST /api/products/import/commit` (валидированные строки) → `{ imported, skipped }`. Дедуп по `code` (upsert).
- **Загрузки (multipart/form-data):** имена полей `image` / `sheet` / `file`; лимиты — фото ~5 МБ (JPG/PNG/WebP), техлист ≤ 10 МБ (PDF), импорт CSV/XLSX; ответ — обновлённый продукт или `{ path }`.
- **`GET /api/auth/me`** → `{ id, email, name, role }` (никогда `passwordHash`), `401` без cookie.
- **`POST /api/offers/:id/share`** идемпотентен: `sharedAt` ставится только если был null; `status` → `odeslana` только из `rozpracovana`; ответ `{ url, alreadyShared }`. Ручная кнопка «Označit jako odeslané» остаётся и работает независимо (без генерации ссылки).
- **Пометка прочтения:** `POST /api/offers/:id/comments/read` `[auth]` → `isNew=false` для всех комментариев КП (иначе счётчик «Nové komentáře» и бейдж в сайдбаре не обнулятся). В прототипе это `markCommentsRead`.
- **Поля категорий (полный CRUD путей):** `GET /api/categories`; `POST/PATCH/DELETE /api/categories/:catId`; `POST /api/categories/:catId/fields`; `PATCH|DELETE /api/categories/:catId/fields/:fieldId` `[admin]`. При удалении поля — решить судьбу осиротевших ключей в `parameters` (отбрасывать на рендере/сохранении).
- **Публичный ответ — белый список полей** (а не Prisma `include` всей строки). Отдавать только: name, architect, currency, showVat, vatRate, items (display-поля + `confirmed/ordered/received`), comments (`authorName`, `text`, `createdAt` — **без `authorEmail`** прошлых комментаторов). **Никогда:** `internalNote`, `id`, `createdBy`/users, `shareEnabled`. Сделать отдельные Prisma-`select`: `offerPublicSelect` и `offerPrivateSelect`; добавить тест, что в public нет `internalNote`. `hideCode` применять на сервере (вырезать код), а не отдавать флаг клиенту.
- **Скачивание техлиста архитектором:** `GET /api/public/products/:id/sheet` (или статический путь Caddy) — задокументировать, чтобы публичная страница знала URL.

### 12.4 Безопасность комментариев, загрузок, почты
- **Rate-limit публичного `POST …/comments`:** in-memory окно по IP (Caddy должен проставлять/прокидывать `X-Forwarded-For`), напр. ≤ 5/10 мин на IP и ≤ 20/день на КП → `429`, письмо не слать. Сбрасывается при рестарте — ок для пилота.
- **XSS:** текст комментария рендерится через JSX (авто-экранируется) — **не использовать `dangerouslySetInnerHTML`**. В HTML-письме Resend поля `authorName/authorEmail/text` **HTML-экранировать** перед вставкой. Длины: `authorName` ≤ 100, `text` ≤ 5000, email по regex — иначе `400`.
- **Email-инъекция:** `from` = всегда фиксированный `RESEND_FROM`; `to` = всегда `NOTIFY_TO`. В `from/to/subject` пользовательский ввод не подставлять. `reply_to` = email архитектора только после валидации (без переводов строк/контрол-символов).
- **Файлы:** проверять, что `:id` — валидный UUID существующего продукта; собранный путь резолвить и убедиться, что он внутри `UPLOADS_DIR` (`path.resolve` + `startsWith`) — защита от traversal. Тип — по magic bytes, не по расширению/Content-Type. Отдавать с `X-Content-Type-Options: nosniff`; PDF — `Content-Disposition: attachment`. Эндпоинты загрузки — `[auth]` (за proxy).
- **UUID:** публичный `shareId` — Prisma `uuid()` (v4). Не копировать демо-генератор `uid()` из `lib/store.tsx` (`Math.random`) — он не криптостойкий.

### 12.5 Деплой и эксплуатация (дополняет §9)
- **Артефакты создать и закоммитить** (секретов не содержат): `Dockerfile` (multi-stage, standalone), `docker-compose.yml`, `Caddyfile`, `.github/workflows/ci.yml`, `entrypoint.sh`. В демо их нет — это Блок 0 (CI) и Блок 12 (остальное).
- **Compose:** `restart: unless-stopped` на всех сервисах; healthcheck у `db`; `app` ждёт БД (`depends_on: { db: { condition: service_healthy } }`); порты наружу публикует **только `caddy`** (80/443), у `app`/`db` портов наружу нет.
- **Миграции/seed:** в `entrypoint.sh` → `npx prisma migrate deploy && node server.js`; seed — один раз и **идемпотентно** (`upsert` админа по email). Скрипты в `package.json`: `"typecheck":"tsc --noEmit"`, `"test":"vitest run"`, `prisma seed`.
- **Build vs runtime ENV:** на `docker build` дать `DATABASE_URL` с плейсхолдером (для `prisma generate`, реальный URL не нужен и не должен попасть в слой образа); реальный `DATABASE_URL` — в рантайме через `env_file: .env`.
- **Отдача загрузок:** Caddy статикой `handle /uploads/products/*/image.* { root * /data/uploads; file_server }`, том примонтировать в caddy `:ro`; техлист — через `[auth]`/public-роут с проверкой.
- **Заголовки в Caddyfile:** `Strict-Transport-Security`, `X-Content-Type-Options nosniff`, `X-Frame-Options DENY` (особенно для `/nabidka/*`), `Referrer-Policy`.
- **CI на каждый PR (`ci.yml`):** `npm ci` → `lint` → `typecheck` → `build` → `test`. Тесты — unit-only (без тест-БД); минимум — `lib/calculations.ts` (НДС/скидки/итоги/округление). E2E — вне пилота.
- **Бэкапы + restore (конкретно):**
  ```
  0 3 * * * docker exec farline-db pg_dump -U farline -Fc farline > /backups/db/farline-$(date +\%Y\%m\%d).dump
  0 4 * * * find /backups/db -name "*.dump" -mtime +14 -delete
  0 5 * * * rsync -az /backups/ user@offsite:/farline-backups/
  ```
  Restore: `docker exec -i farline-db pg_restore -U farline -d farline < farline-YYYYMMDD.dump`. **Проверить restore в staging до прода.** Бэкап `/data/uploads` синхронизировать по времени с дампом.
- **Опасная команда:** `docker compose down -v` удаляет тома (БД + загрузки + TLS-сертификаты Caddy → риск упереться в rate-limit Let's Encrypt). В проде только `docker compose down` без `-v`.
- **Шпаргалка операций:** логи `docker compose logs -f app`; рестарт `docker compose build app && docker compose up -d app`; psql `docker compose exec db psql -U farline farline`; диск `du -sh` по томам. Внешний uptime-монитор на домен — желательно.
