# PG Dashboard - Рекомендации по улучшению

Анализ проведён: 2026-02-02
Режим приложения: **Read-Only** (только мониторинг и анализ, без изменения БД)

---

## Оглавление

1. [Критические проблемы](#1-критические-проблемы)
2. [UI/UX - Конкретные баги](#2-uiux---конкретные-баги)
3. [UI/UX - Улучшения дизайна](#3-uiux---улучшения-дизайна)
4. [Функциональные улучшения](#4-функциональные-улучшения)
5. [Производительность](#5-производительность)
6. [Bottlenecks (Узкие места)](#6-bottlenecks-узкие-места)
7. [Качество кода](#7-качество-кода)
8. [Приоритизация](#8-приоритизация)

---

## 1. Критические проблемы

### 1.1 Безопасность: Пароли в plaintext

**Файл:** `src-tauri/src/db/storage.rs` (строки 14-16, 94-102)

**Проблема:** Пароли БД сохраняются в открытом виде в `%AppData%/pg-dashboard/servers.json`.

**Решение:**
```rust
// Cargo.toml
[dependencies]
keyring = "2.0"

// Использование OS keyring
let entry = keyring::Entry::new("pg-dashboard", &server_id)?;
entry.set_password(&password)?;
```

### 1.2 Безопасность: SQL-инъекции через format!()

**Файл:** `src-tauri/src/db/queries.rs` (строки 84-101, 178-199, 235-248)

**Проблема:** `format!()` для LIMIT значений вместо параметризации.

**Решение:**
```rust
// Было
let query = format!(r#"... LIMIT {}"#, limit);

// Стало
let query = "SELECT ... LIMIT $1";
client.query(query, &[&limit]).await?;
```

### 1.3 UI: Несуществующая CSS переменная

**Файл:** `src/components/ExplainPlanModal.tsx` (строка 248)

**Проблема:** Используется `bg-[var(--bg-primary)]`, но такой переменной нет в App.css.

**Решение:** Заменить на `bg-[var(--bg-surface)]` или `bg-[var(--bg-elevated)]`.

---

## 2. UI/UX - Конкретные баги

### 2.1 Текст выходит за границы

| Файл | Строка | Проблема | Решение |
|------|--------|----------|---------|
| `Layout.tsx` | 72-76 | Длинные имена серверов в sidebar обрезаются некорректно | Добавить `max-w-[180px]` и `title` атрибут |
| `ExplainPlanModal.tsx` | 330 | Query code block с `max-h-24` обрезает без индикации | Добавить gradient fade или "show more" |
| `MetricsPage.tsx` | 199 | Текст запроса truncate без title hover | Убедиться что `title={String(value)}` везде |

**Пример исправления Layout.tsx:**
```tsx
// Было
<p className="text-sm font-medium text-[var(--text-primary)] truncate">
  {currentServer.name}
</p>

// Стало
<p
  className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[180px]"
  title={currentServer.name}
>
  {currentServer.name}
</p>
```

### 2.2 Двойные рамки на карточках ошибок

**Файлы:** `DashboardPage.tsx` (строки 157, 401), `MetricsPage.tsx` (строка 486)

**Проблема:** `.card` класс уже имеет border, плюс добавляется `border-l-4`.

**Решение:**
```tsx
// Было
<div className="card p-5 border-l-4 border-[var(--error)]">

// Стало - убрать card class или сделать отдельный компонент AlertCard
<div className="bg-[var(--bg-surface)] p-5 rounded-lg border-l-4 border-[var(--error)]">
```

### 2.3 Неправильное позиционирование иконок в инпутах

**Файл:** `AddServerModal.tsx` (строки 119-126, 149-156)

**Проблема:** CSS `.input-with-icon { padding-left: 44px }`, но иконка на `left-3` (12px).

**Решение:**
```tsx
// Было
<Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />

// Стало - выровнять с padding
<Server className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5" />
```

### 2.4 Несогласованное позиционирование toast-уведомлений

**Проблема:**
- `DashboardPage.tsx` (строка 400): `bottom-6 right-6`
- `MetricsPage.tsx` (строка 485): `bottom-4 right-4`

**Решение:** Унифицировать в `bottom-4 right-4` или вынести в компонент Toast.

### 2.5 Асимметричный padding в деталях issue

**Файл:** `IssuesPage.tsx` (строка 212)

**Проблема:** `px-4 pb-4 pl-14` - `pl-14` перебивает левый `px-4`.

**Решение:**
```tsx
// Было
<div className="px-4 pb-4 pl-14 space-y-3">

// Стало
<div className="pr-4 pb-4 pl-14 space-y-3">
```

---

## 3. UI/UX - Улучшения дизайна

### 3.1 Избыточные закругления

**Проблема:** Практически все элементы используют `rounded-xl` или `rounded-2xl`, создавая визуальную монотонность.

**Текущее состояние:**
- Карточки: `rounded-xl` (14px)
- Модальные окна: `rounded-2xl` (20px)
- Кнопки: `rounded-lg` (10px)
- Badges: `rounded-full`
- Иконки в контейнерах: `rounded-xl`

**Рекомендация:** Уменьшить радиусы для визуальной иерархии:
```css
/* App.css - новые значения */
--radius-sm: 4px;    /* было 6px */
--radius-md: 6px;    /* было 8px */
--radius-lg: 8px;    /* было 14px */
--radius-xl: 12px;   /* было 20px */
```

### 3.2 Вложенные карточки создают визуальный шум

**Файл:** `MetricsPage.tsx` (строки 472-481)

**Проблема:** Card → Tabs (с border-b) → div wrapper → content. Слишком много уровней.

**Решение:**
```tsx
// Упростить структуру
<div className="bg-[var(--bg-surface)] rounded-lg overflow-hidden">
  <Tabs ... />
  {renderContent()}  {/* Без дополнительного wrapper */}
</div>
```

### 3.3 Несогласованные размеры Badge

**Проблема:**
- `ServersPage.tsx` (строка 202): hardcoded `text-[10px] px-1.5`
- `ConfigurationPage.tsx` (строка 263): `<Badge size="sm">`
- `IssuesPage.tsx`: default size

**Решение:** Расширить Badge компонент:
```tsx
// components/ui/Badge.tsx
const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};
```

### 3.4 Sidebar не адаптивен

**Файл:** `Layout.tsx` (строка 45)

**Проблема:** Фиксированная ширина `w-[260px]` на всех экранах.

**Решение:**
```tsx
// Мобильная версия с бургер-меню
const [sidebarOpen, setSidebarOpen] = useState(false);

<aside className={`
  fixed lg:relative
  w-[260px] lg:w-[240px]
  transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
  transition-transform duration-200
  ...
`}>
```

### 3.5 Непоследовательные hover-состояния

**Проблема:** Разные элементы используют разные hover-цвета:
- `hover:bg-[var(--bg-elevated)]`
- `hover:bg-[var(--bg-overlay)]`
- Некоторые без hover вообще

**Решение:** Стандартизировать:
```css
/* Интерактивные элементы */
.interactive {
  @apply hover:bg-[var(--bg-elevated)] transition-colors;
}

/* Карточки */
.card-interactive {
  @apply hover:border-[var(--border-default)] transition-all;
}
```

### 3.6 Недостаточный контраст текста

**Проблема:** `--text-muted: #475569` на `--bg-base: #0c0e14` может не соответствовать WCAG AA.

**Решение:**
```css
/* Увеличить яркость muted текста */
--text-muted: #64748b;  /* было #475569 */
```

### 3.7 Непоследовательные gap в гридах

**Текущее состояние:**
- `DashboardPage.tsx`: `gap-4`
- `ConfigurationPage.tsx`: `gap-6`
- `ServersPage.tsx`: `gap-4`

**Решение:** Стандартизировать `gap-4` для карточек, `gap-6` для секций.

---

## 4. Функциональные улучшения

> **Примечание:** Приложение работает в read-only режиме. Все функции направлены на анализ и рекомендации, без изменения данных в БД.

### 4.1 Экспорт данных

**Текущее состояние:** Нет возможности экспортировать данные.

**Улучшение:**
- Export to CSV для всех таблиц
- Export to JSON для полных отчётов
- Copy to clipboard для EXPLAIN плана и запросов
- Export PDF отчёта по производительности

### 4.2 Рекомендации по оптимизации (read-only)

**Текущее состояние:** Базовый анализ конфигурации.

**Улучшение - умные рекомендации:**
```typescript
interface Recommendation {
  type: 'index' | 'query' | 'config' | 'maintenance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  sqlExample?: string;  // Пример SQL для копирования (DBA выполнит вручную)
  impact: string;
}
```

Примеры рекомендаций:
- "Таблица `orders` не имеет индекса по `customer_id`. Рекомендуемый индекс: `CREATE INDEX ...`"
- "Запрос выполняется seq scan на 1M строк. Рекомендуем: ..."
- "shared_buffers слишком мал для объёма данных"

### 4.3 Сравнение периодов

**Улучшение:**
- История метрик (хранить локально)
- "Сейчас vs час назад" / "Сейчас vs вчера"
- Графики с timeline
- Выделение аномалий

### 4.4 Профили сравнения конфигурации

**Улучшение:**
```typescript
// Предустановленные профили для сравнения
const profiles = {
  'web-oltp': { shared_buffers: '25%', work_mem: '64MB', ... },
  'data-warehouse': { shared_buffers: '40%', work_mem: '256MB', ... },
  'mixed': { ... }
};

// UI показывает отклонения от рекомендуемого профиля
```

### 4.5 Группировка и теги серверов

**Улучшение:**
- Папки: Production, Staging, Development
- Цветовые метки
- Фильтрация по тегам
- Quick switch между группами

### 4.6 Keyboard shortcuts

| Shortcut | Действие |
|----------|----------|
| `Ctrl+R` / `Cmd+R` | Обновить данные |
| `Ctrl+1-5` | Переключение страниц |
| `Esc` | Закрыть модальное окно |
| `Ctrl+K` | Command palette |
| `Ctrl+C` (в таблице) | Копировать выделенное |

### 4.7 Алерты и пороговые значения

**Улучшение:**
```typescript
interface AlertRule {
  id: string;
  metric: 'connections_percent' | 'cache_hit_ratio' | 'deadlocks' | 'long_queries';
  condition: {
    operator: '>' | '<' | '>=';
    value: number;
  };
  notification: 'toast' | 'system' | 'sound';
  enabled: boolean;
}
```

### 4.8 Bookmarks для запросов

**Улучшение:** Сохранять интересные запросы для отслеживания их метрик со временем.

### 4.9 Сравнение серверов

**Улучшение:** Side-by-side сравнение метрик и конфигурации двух серверов.

---

## 5. Производительность

### 5.1 Отсутствие кэширования на фронтенде

**Проблема:** Каждый переход на страницу = новый запрос к БД.

**Решение:**
```typescript
// Использовать TanStack Query
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['databaseStats', serverId],
  queryFn: () => api.getDatabaseStats(serverId),
  staleTime: 5000,
  refetchInterval: autoRefresh ? 5000 : false,
});
```

### 5.2 Последовательные API вызовы

**Файл:** `IssuesPage.tsx` (строки 44-70)

**Проблема:**
```typescript
const issues = await api.analyzeConfiguration(serverId);
const perfIssues = await api.detectPerformanceIssues(serverId);
```

**Решение:**
```typescript
const [issues, perfIssues] = await Promise.all([
  api.analyzeConfiguration(serverId),
  api.detectPerformanceIssues(serverId)
]);
```

### 5.3 Нет lazy loading страниц

**Решение:**
```typescript
// App.tsx
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<PageSkeleton />}>
  <Routes>...</Routes>
</Suspense>
```

### 5.4 Нет виртуализации больших списков

**Проблема:** Таблицы с 100+ строками рендерятся полностью.

**Решение:** `@tanstack/react-virtual` для таблиц.

### 5.5 Debouncing для фильтрации

**Файл:** `ConfigurationPage.tsx`

**Решение:**
```typescript
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

---

## 6. Bottlenecks (Узкие места)

### 6.1 Connection Pool без таймаутов

**Файл:** `src-tauri/src/db/connection.rs` (строки 74-86)

**Проблема:** Зависший запрос может заблокировать весь pool.

**Решение:**
```rust
use std::time::Duration;

let pool_config = PoolConfig {
    max_size: 16,
    timeouts: Timeouts {
        wait: Some(Duration::from_secs(5)),
        create: Some(Duration::from_secs(5)),
        recycle: Some(Duration::from_secs(5)),
    },
    ..Default::default()
};

// + statement_timeout на уровне сессии
```

### 6.2 Неправильное определение CPU cores

**Файл:** `src-tauri/src/db/config.rs` (строки 83-100)

**Проблема:** Подсчёт backend процессов вместо реальных CPU.

**Решение:**
```rust
use num_cpus;
let cpu_cores = num_cpus::get();
```

### 6.3 Отсутствие graceful handling pg_stat_statements

**Проблема:** Ошибка при отсутствии расширения.

**Решение:**
```rust
pub async fn get_top_queries(...) -> Result<Vec<QueryStat>, String> {
    let check = client.query_opt(
        "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'",
        &[]
    ).await?;

    if check.is_none() {
        return Ok(vec![]);  // Пустой список вместо ошибки
    }
    // ...
}
```

### 6.4 Избыточные вызовы pg_database_size()

**Файл:** `src-tauri/src/db/queries.rs` (строки 353-361)

**Проблема:** Функция вызывается 3 раза на строку.

**Решение:**
```sql
SELECT datname, pg_database_size(datname) as size_bytes
FROM pg_database WHERE datistemplate = false;
-- Форматирование на клиенте
```

### 6.5 Auto-refresh накапливает запросы

**Проблема:** При медленном backend интервалы накладываются.

**Решение:** Использовать setTimeout вместо setInterval:
```typescript
const fetchData = async () => {
  await loadData();
  if (autoRefresh) {
    timeoutId = setTimeout(fetchData, 5000);
  }
};
```

---

## 7. Качество кода

### 7.1 Слабая типизация API

**Файл:** `src/lib/api.ts`

**Проблема:** `Promise<any[]>` вместо конкретных типов.

**Решение:**
```typescript
async getDatabaseStats(serverId: string): Promise<DatabaseStats[]>
```

### 7.2 Нет Error Boundaries

**Решение:**
```tsx
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 7.3 Дублирование логики загрузки

**Решение:** Custom hook:
```typescript
function useServerData<T>(fetcher: (id: string) => Promise<T>) {
  const { serverId } = useServer();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...
  return { data, loading, error, refetch };
}
```

### 7.4 Toast вместо alert()

**Решение:** Создать Toast компонент и контекст:
```typescript
const { toast } = useToast();
toast.error('Connection failed');
toast.success('Server added');
```

---

## 8. Приоритизация

### Критический (неделя 1)

| # | Задача | Файл | Тип |
|---|--------|------|-----|
| 1 | Исправить `--bg-primary` → `--bg-surface` | ExplainPlanModal.tsx:248 | Bug |
| 2 | Шифрование паролей через OS keyring | storage.rs | Security |
| 3 | Параметризация SQL запросов | queries.rs | Security |
| 4 | Connection pool timeouts | connection.rs | Stability |

### Высокий приоритет (неделя 2)

| # | Задача | Файл | Тип |
|---|--------|------|-----|
| 5 | Убрать двойные рамки на error cards | DashboardPage, MetricsPage | UI |
| 6 | Исправить позицию иконок в инпутах | AddServerModal.tsx | UI |
| 7 | Унифицировать toast positioning | Все страницы | UI |
| 8 | Добавить title для truncated текста | Layout.tsx, таблицы | UX |
| 9 | Toast notifications вместо alert() | Все страницы | UX |
| 10 | Error Boundary | App.tsx | Stability |

### Средний приоритет (неделя 3-4)

| # | Задача | Тип |
|---|--------|-----|
| 11 | Уменьшить border-radius для иерархии | UI |
| 12 | Стандартизировать Badge sizes | UI |
| 13 | Консистентные hover states | UI |
| 14 | Responsive sidebar | UI |
| 15 | TanStack Query для кэширования | Performance |
| 16 | Lazy loading страниц | Performance |
| 17 | Типизация API слоя | DX |

### Низкий приоритет (backlog)

| # | Задача | Тип |
|---|--------|-----|
| 18 | Export to CSV/JSON | Feature |
| 19 | Keyboard shortcuts | UX |
| 20 | Группировка серверов | Feature |
| 21 | Система алертов | Feature |
| 22 | История метрик | Feature |
| 23 | Сравнение серверов | Feature |
| 24 | Dark/Light theme toggle | UX |
| 25 | Виртуализация списков | Performance |

---

## Чеклист перед релизом

### UI/UX
- [ ] Все truncated тексты имеют title tooltip
- [ ] Нет двойных borders на карточках
- [ ] Консистентные радиусы скруглений
- [ ] Единый стиль hover states
- [ ] Toast уведомления вместо alert()
- [ ] Confirm dialog для опасных действий
- [ ] Loading states на всех кнопках действий

### Безопасность
- [ ] Пароли зашифрованы через OS keyring
- [ ] Все SQL запросы параметризованы
- [ ] Нет hardcoded credentials

### Стабильность
- [ ] Error Boundary на уровне приложения
- [ ] Connection pool с таймаутами
- [ ] Graceful handling отсутствия pg_stat_statements
- [ ] AbortController для отмены запросов при unmount

### Производительность
- [ ] Кэширование через React Query
- [ ] Lazy loading страниц
- [ ] Параллельные API вызовы где возможно
- [ ] setTimeout вместо setInterval для polling

---

## Заключение

Приложение имеет хорошую архитектуру. Основные области для улучшения:

1. **Безопасность** - критически важно исправить хранение паролей
2. **UI консистентность** - много мелких несоответствий в стилях
3. **UX обратная связь** - недостаточно feedback для пользователя
4. **Производительность** - отсутствие кэширования создаёт лишнюю нагрузку

Все рекомендации учитывают read-only режим приложения: функции направлены на анализ, мониторинг и генерацию рекомендаций (SQL для копирования), без прямого изменения данных в PostgreSQL.
