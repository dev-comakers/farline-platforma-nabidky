# DESIGN-SYSTEM — Farline Nabídky

**Версия:** 1.0 · **Статус: ЗАМОРОЖЕН (согласован клиентом).**

> ⚠️ **Правило №1:** визуальный язык утверждён Филипом. **Не менять** цвета, шрифты, отступы, скругления, анимации и структуру компонентов. Задача разработчика — подключать данные к существующим компонентам, а не редизайнить. Любое изменение внешнего вида — только по явному запросу Artem.
>
> Источник истины токенов — `app/globals.css`. Существующие компоненты в `components/` — эталон. Этот документ их фиксирует.

---

## 1. Философия
Премиум-сантехника → продукт должен выглядеть premium. Чистый, материальный дизайн, фокус на фото продукта. Уровень — Lefroy & Brooks, Victoria + Albert, Radomonte.

Параметры: `DESIGN_VARIANCE=8` (асимметричные сетки, `fr`-юниты, воздух), `MOTION_INTENSITY=6` (плавные transition, spring на кнопках), `VISUAL_DENSITY=4` (воздушно, luxury).

---

## 2. Цвета (токены — `app/globals.css`)

```css
--background: #FAFAF8;   /* тёплый off-white фон */
--surface:    #FFFFFF;   /* карточки/поверхности */
--accent:     #8B7355;   /* aged brass — ЕДИНСТВЕННЫЙ акцент */
--accent-hover:#75614A;
--foreground: #18181B;   /* zinc-900, НЕ #000000 */
```
- Текст: primary `zinc-900`, secondary `zinc-500`. Границы: `slate-200/50` ≈ `zinc-200/70`.
- **Единственный акцент — aged brass `#8B7355`.** Никаких вторых акцентов.

### Цвета статусов КП (фиксированы)
| Статус | Точка | Фон бейджа | Текст |
|---|---|---|---|
| rozpracovaná | `zinc-400` | `zinc-100` | `zinc-600` |
| odeslaná | `sky-600` | `sky-50` | `sky-700` |
| okomentovaná | `amber-500` | `amber-50` | `amber-700` |
| potvrzená | `emerald-600` | `emerald-50` | `emerald-700` |

(см. `components/StatusBadge.tsx` — переиспользовать.)

### 🚫 Запрещено
Фиолетовый, неон, градиентный текст, чистый `#000000`, шрифт Inter, serif на дашборде, **эмодзи в UI**.

---

## 3. Типографика
| Элемент | Шрифт | Стиль |
|---|---|---|
| Заголовки | **Satoshi** (`var(--font-display)`) | `tracking-tight`, `font-semibold` |
| Текст | **Geist** | `text-base`, `leading-relaxed` |
| Числа/цены | **Geist Mono** | `tabular-nums`, выравнивание вправо |
| Коды продуктов | **Geist Mono** | `text-sm`/`text-xs`, `zinc-500` |

Любое отрендеренное число (цена, скидка, количество, метрика) — **Geist Mono + `tabular-nums`**.

Подключение: Geist/Geist Mono — `next/font` в `app/layout.tsx`; Satoshi — Fontshare CSS (уже подключён), используется через `var(--font-display)`.

---

## 4. Иконки
- **@phosphor-icons/react**, импорт из `/dist/ssr`.
- `weight`: `duotone` для акцентных/активных, `regular`/`bold` по контексту (как в текущем коде). `strokeWidth` 1.5 в духе PRD.
- Заглушка фото продукта — иконка категории на `zinc-100` (`ProductIconBox` + `lib/productIcons.ts`).

---

## 5. Анимации (CSS-only, без Framer Motion)
Определены в `app/globals.css` — переиспользовать классы:
- `.animate-fade-in-up` — появление (карточки каталога — staggered через `animationDelay`).
- `.animate-slide-in-right` — боковая панель каталога.
- `.animate-spring-scale` — успех/копирование (overshoot).
- `.animate-pulse-subtle` — точка статуса «okomentovaná».
- `.btn-tactile:active` → `scale(0.98) translateY(-1px)` — тактильный отклик CTA.
- Глобальный `transition` на `button/a/[role=button]`.

Hover карточки продукта: `-translate-y-0.5` + усиление тени, `duration-300`.

---

## 6. Компоненты (эталон — переиспользовать)
| Компонент | Файл | Назначение |
|---|---|---|
| Sidebar | `components/Sidebar.tsx` | навигация + бейдж новых комментариев + юзер внизу |
| MetricCard | `components/MetricCard.tsx` | метрика дашборда |
| StatusBadge | `components/StatusBadge.tsx` | бейдж статуса КП |
| SummaryBlock | `components/SummaryBlock.tsx` | итоги (před slevou / sleva / po slevě) — **сюда добавить строку DPH, сохранив стиль** |
| ProductCard | `components/ProductCard.tsx` | карточка каталога |
| ProductIconBox | `components/ProductIconBox.tsx` | фото или заглушка-иконка |
| ProductCatalogPanel | `components/ProductCatalogPanel.tsx` | боковая панель выбора |
| PhotoUploader | `components/PhotoUploader.tsx` | загрузка фото (адаптировать под серверный upload, **вид не менять**) |
| ShareModal | `components/ShareModal.tsx` | модалка ссылки |
| ImportModal | `components/ImportModal.tsx` | импорт (наполнить логикой, вид сохранить) |
| Toast | `components/Toast.tsx` | уведомления |

### Карточка продукта
- Фото: `aspect-[4/3]`, `rounded-2xl`, `object-cover`. Нет фото → `ProductIconBox`.
- Код — Geist Mono `zinc-500`; название — Satoshi semibold; бренд/декор — мелкие badge; цена — Geist Mono, заметно.

### Кнопки
- Primary (CTA): фон `var(--accent)`, белый текст, `rounded-xl`, класс `btn-tactile`.
- Secondary: `border-zinc-200`, `text-zinc-700`.
- Destructive: `text-red-500`, без фона.

### Формы / upload
- Drag&drop зона: `border-dashed`, `rounded-xl`, иконка камеры; hover/drag → border `var(--accent)`; превью + удалить/заменить.

---

## 7. Лейаут
- **Дашборд:** `grid-cols-[2fr_1fr]` (метрики+последние / активность), mobile — одна колонка.
- **Конструктор КП:** контент + sticky-панель действий справа (`xl:grid-cols-[1fr_280px]`), mobile — панель снизу.
- **Публичная страница архитектора** (`/nabidka/[id]`): другой feel — презентационная, `max-w-5xl mx-auto`, центр, белый фон, **без сайдбара**.
- Внутренние страницы: `px-10 py-8`, `max-w-[1400px]`.

---

## 8. Новые элементы, которых не было в демо — как стилизовать
Чтобы не выбиться из языка, для новых фич переиспользуй существующие паттерны:
- **Чекбоксы статусов позиции (Potvrzeno/Objednáno/Získáno):** в стиле существующих badge/контролов; цвета — нейтраль для невыбранного, `emerald`/`accent` для активного. Не вводить новые акцентные цвета.
- **Логин-страница:** минималистичная, центрированная карточка на `--background`, тот же шрифт/кнопки.
- **Экраны users / категорий:** таблицы и формы в стиле существующих секций (`bg-white border border-zinc-200/70 rounded-2xl`).
- **Строка НДС в `SummaryBlock`:** дополнительная позиция в той же сетке/типографике.
- **Детальная карточка продукта (модалка):** как `ShareModal`/`ImportModal` — `rounded-2xl`, `shadow-2xl`, `animate-fade-in-up`.
- **Логотип:** компонент `<Logo/>`; пока текстовый (как в `Sidebar`/share-header); при получении ассета — заменить в одном месте.

---

## 9. Чек-лист «дизайн не сломан» (для каждого PR)
- [ ] Не добавлены новые цвета вне палитры; акцент один — brass.
- [ ] Числа — Geist Mono + `tabular-nums`.
- [ ] Заголовки — Satoshi.
- [ ] Нет эмодзи, нет Inter, нет чистого чёрного, нет градиентного текста.
- [ ] Цвета статусов КП не изменены.
- [ ] Новые компоненты используют существующие токены/классы/анимации.
- [ ] CTA имеют `btn-tactile`.
