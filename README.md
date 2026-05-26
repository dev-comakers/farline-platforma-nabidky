# Farline Nabídky

Веб-платформа для создания премиум-КП (коммерческих предложений) для архитекторов — каталог продуктов, конструктор КП, публичная ссылка для архитектора с комментариями, экспорт PDF/Excel.

**Клиент:** F.A.R. LINE / Farline Living · **Исполнитель:** coMakers.cz

---

## Як почати розробку

Починай з [DEVELOPING.md](./DEVELOPING.md) — там ланцюг читання документів і поточні правила.

## 📖 Документация (точка входа)

> Новый в проекте? Начни с **[`ONBOARDING.md`](./ONBOARDING.md)**, затем читай `docs/` по порядку.

| Документ | О чём |
|---|---|
| [`ONBOARDING.md`](./ONBOARDING.md) | С чего начать, правила, запуск |
| [`docs/PRD.md`](./docs/PRD.md) | Продукт: роли, скоуп, требования + acceptance-критерии, что вне скоупа |
| [`docs/TECH-SPEC.md`](./docs/TECH-SPEC.md) | Архитектура: стек, Prisma-схема, API, auth, инфра, ENV, конвенции |
| [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) | Заморожённый визуальный язык (не менять) |
| [`docs/IMPLEMENTATION-PLAN.md`](./docs/IMPLEMENTATION-PLAN.md) | План работ по блокам (0–13), что уже есть / доделать |
| [`desc-from-contract.md`](./desc-from-contract.md) | Юридическое ТЗ (контракт, Příloha č. 1) |

---

## ⚠️ Статус кода

Сейчас это **клиентский прототип** (Next.js 16 + React 19 + Tailwind v4): UI согласован клиентом и **заморожен**, но данные хранятся в памяти (`lib/store.tsx`) и сбрасываются при перезагрузке. Превращение в продакшен (БД, auth, почта, импорт, деплой) идёт по `docs/IMPLEMENTATION-PLAN.md` с сохранением визуала.

## 🚀 Запуск

```bash
npm install
cp .env.example .env
npm run dev   # http://localhost:3000
```

## 🧱 Стек (зафиксирован)
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · PostgreSQL + Prisma · JWT auth · jsPDF · ExcelJS · Phosphor Icons · Resend · Docker Compose + Caddy на Hetzner.
Подробности и обоснование — `docs/TECH-SPEC.md`.
