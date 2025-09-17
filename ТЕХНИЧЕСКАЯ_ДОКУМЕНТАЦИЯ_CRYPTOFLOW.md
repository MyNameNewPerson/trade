# 📋 CryptoFlow - Полная техническая документация

## 🎯 Обзор проекта

**CryptoFlow** — это некастодиальная криптовалютная биржевая платформа, которая позволяет безопасно обменивать криптовалюты между собой и на фиатные деньги. 

### Ключевые возможности:
- ✅ Обмен криптовалют (crypto-to-crypto и crypto-to-fiat)
- ✅ Фиксированные и плавающие курсы обмена
- ✅ Ручное управление выплатами операторами
- ✅ Опциональная KYC/AML проверка
- ✅ Виджет React для обменов
- ✅ Отслеживание заказов в реальном времени
- ✅ Админ-панель для операторов
- ✅ Поддержка 3 языков (русский, английский, румынский)

---

## 🏗️ Архитектура системы

### Frontend (Клиентская часть)
- **Технологии**: React 18 + Vite + TypeScript
- **UI Framework**: ShadCN UI + Radix UI + Tailwind CSS
- **Маршрутизация**: Wouter
- **Управление состоянием**: React Query + React Context
- **Интернационализация**: React i18next
- **Валидация форм**: React Hook Form + Zod
- **Real-time**: WebSocket соединения

### Backend (Серверная часть)  
- **Технологии**: Node.js + Express + TypeScript
- **База данных**: PostgreSQL (Neon) через Drizzle ORM
- **Авторизация**: Replit Auth + OAuth (Google, GitHub)
- **Real-time**: WebSocket сервер
- **Безопасность**: Rate limiting, CORS, валидация Zod
- **Email**: Nodemailer для уведомлений

### База данных
- **ORM**: Drizzle с миграциями
- **Основные таблицы**: currencies, exchange_rates, orders, kyc_requests, users
- **Fallback**: In-memory хранилище для разработки

---

## 📁 Детальная структура папок

```
project/
├── 📂 client/                    # Frontend приложение (React)
│   ├── 📂 src/
│   │   ├── 📂 components/        # React компоненты
│   │   │   ├── 📂 ui/           # UI компоненты (ShadCN)
│   │   │   │   ├── button.tsx   # Кнопки
│   │   │   │   ├── input.tsx    # Поля ввода
│   │   │   │   ├── dialog.tsx   # Модальные окна
│   │   │   │   └── ...          # Другие UI компоненты
│   │   │   ├── exchange-widget.tsx    # ⭐ ГЛАВНЫЙ компонент обмена
│   │   │   ├── currency-grid.tsx      # Сетка валют
│   │   │   ├── admin-*.tsx           # Админ компоненты
│   │   │   ├── auth-providers.tsx    # Провайдеры авторизации
│   │   │   └── ...                   # Другие компоненты
│   │   ├── 📂 pages/            # Страницы приложения
│   │   │   ├── home.tsx         # Главная страница
│   │   │   ├── admin-panel.tsx  # Админ панель
│   │   │   ├── exchange-only.tsx # Страница только обмена
│   │   │   ├── user-dashboard.tsx # Личный кабинет
│   │   │   └── ...              # Другие страницы
│   │   ├── 📂 hooks/            # React хуки
│   │   │   ├── useAuth.ts       # ⭐ Хук авторизации
│   │   │   ├── use-websocket.ts # WebSocket соединение
│   │   │   └── ...              # Другие хуки
│   │   ├── 📂 lib/              # Библиотеки и утилиты
│   │   │   ├── i18n.ts          # ⭐ Настройка переводов
│   │   │   ├── queryClient.ts   # React Query настройка
│   │   │   ├── websocket.ts     # WebSocket клиент
│   │   │   └── utils.ts         # Общие утилиты
│   │   ├── 📂 locales/          # Файлы переводов
│   │   │   ├── en.json          # Английский
│   │   │   ├── ru.json          # Русский
│   │   │   └── ro.json          # Румынский
│   │   ├── App.tsx              # ⭐ Главный компонент приложения
│   │   └── main.tsx             # ⭐ Точка входа React
│   └── index.html               # HTML шаблон
├── 📂 server/                   # Backend приложение (Express)
│   ├── 📂 routes/               # API маршруты
│   │   ├── auth.ts              # ⭐ Авторизация и регистрация
│   │   └── admin.ts             # ⭐ Админ API
│   ├── 📂 services/             # Бизнес-логика
│   │   ├── exchange-api.ts      # ⭐ API внешних бирж (курсы)
│   │   ├── crypto.ts            # Криптографические операции
│   │   ├── currency-converter.ts # Конвертация валют
│   │   ├── email.ts             # Отправка писем
│   │   └── telegram.ts          # Telegram интеграция
│   ├── 📂 middleware/           # Middleware
│   │   ├── auth.ts              # ⭐ Проверка авторизации
│   │   ├── security.ts          # Безопасность (rate limit, CORS)
│   │   └── admin-logger.ts      # Логирование админ действий
│   ├── index.ts                 # ⭐ Главный файл сервера
│   ├── routes.ts                # ⭐ Регистрация всех маршрутов
│   ├── db.ts                    # ⭐ Подключение к базе данных
│   ├── storage.ts               # ⭐ Интерфейс хранилища данных
│   ├── replitAuth.ts            # Replit авторизация
│   └── oauthProviders.ts        # OAuth провайдеры
├── 📂 shared/                   # Общий код между фронтендом и бэкендом
│   └── schema.ts                # ⭐ Схемы базы данных (Drizzle + Zod)
├── 📂 scripts/                  # Утилиты
│   └── create-admin.ts          # ⭐ Создание админ пользователя
├── 📂 types/                    # TypeScript типы
├── package.json                 # ⭐ Зависимости и скрипты
├── vite.config.ts               # ⭐ Конфигурация Vite
├── drizzle.config.ts            # ⭐ Конфигурация базы данных
├── tailwind.config.ts           # Конфигурация Tailwind CSS
└── replit.md                    # Документация проекта
```

---

## 🔧 Ключевые файлы и их назначение

### ⚡ Файлы конфигурации

#### `package.json` 
**Назначение**: Определяет зависимости проекта и команды запуска
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",     // Запуск разработки
    "build": "vite build && esbuild server/index.ts ...", // Сборка продакшена
    "start": "NODE_ENV=production node dist/index.js",    // Запуск продакшена
    "db:push": "drizzle-kit push"                         // Применить изменения БД
  }
}
```

#### `vite.config.ts`
**Назначение**: Конфигурация сборщика и dev-сервера
- Настраивает алиасы для импортов (`@` для `src/`, `@assets` для `attached_assets/`)
- Интегрирует плагины Replit
- Настраивает прокси для API запросов

#### `drizzle.config.ts`
**Назначение**: Конфигурация ORM и миграций базы данных
- Определяет подключение к PostgreSQL
- Настраивает папки для схем и миграций

---

### 🎯 Основные серверные файлы

#### `server/index.ts` - ⭐ ГЛАВНЫЙ ФАЙЛ СЕРВЕРА
**Назначение**: Точка входа в приложение
- Создает Express сервер
- Подключает middleware безопасности
- Регистрирует маршруты из `server/routes.ts`
- Запускает WebSocket сервер
- В разработке интегрирует Vite

#### `server/routes.ts` - ⭐ МАРШРУТИЗАТОР
**Назначение**: Центральная регистрация всех API маршрутов
- `/api/currencies` - получение списка валют
- `/api/rates` - получение курсов обмена  
- `/api/orders` - создание/получение заказов
- `/api/auth/*` - авторизация (из `server/routes/auth.ts`)
- `/api/admin/*` - админ панель (из `server/routes/admin.ts`)
- WebSocket маршрут `/ws` для real-time обновлений

#### `server/storage.ts` - ⭐ ХРАНИЛИЩЕ ДАННЫХ
**Назначение**: Единый интерфейс для работы с данными
- `IStorage` - интерфейс для всех операций
- `MemoryStorage` - хранилище в памяти (для разработки)
- `DatabaseStorage` - PostgreSQL через Drizzle ORM
- Автоматически переключается между ними в зависимости от `DATABASE_URL`

#### `shared/schema.ts` - ⭐ СХЕМА БАЗЫ ДАННЫХ
**Назначение**: Определяет структуру данных (используется и фронтендом, и бэкендом)
- Таблицы Drizzle: `currencies`, `exchange_rates`, `orders`, `users`, `kyc_requests`
- Zod схемы для валидации: `createOrderSchema`, `currencySchema`, и др.
- TypeScript типы, выведенные из схем

---

### 🎨 Основные фронтенд файлы

#### `client/src/main.tsx` - ⭐ ТОЧКА ВХОДА
**Назначение**: Инициализация React приложения
- Настройка React Query
- Подключение переводов (i18next)
- Рендер корневого компонента `App`

#### `client/src/App.tsx` - ⭐ ГЛАВНЫЙ КОМПОНЕНТ
**Назначение**: Маршрутизация и общий layout
- Настройка маршрутов через Wouter
- Темы (светлая/темная)
- Общий header и footer

#### `client/src/components/exchange-widget.tsx` - ⭐ ЯДРО ПРИЛОЖЕНИЯ
**Назначение**: Главный компонент для обмена валют
- Получение курсов через React Query
- Расчет сумм обмена
- Создание заказов
- Real-time обновления через WebSocket
- **ЭТО САМЫЙ ВАЖНЫЙ КОМПОНЕНТ ДЛЯ ПОНИМАНИЯ БИЗНЕС-ЛОГИКИ**

#### `client/src/hooks/useAuth.ts` - ⭐ АВТОРИЗАЦИЯ
**Назначение**: Управление состоянием авторизации пользователя
- Получение текущего пользователя
- Проверка прав доступа (админ/обычный)
- Интеграция с Replit Auth

#### `client/src/lib/i18n.ts` - ⭐ ПЕРЕВОДЫ
**Назначение**: Настройка многоязычности
- Конфигурация i18next
- Загрузка переводов из `locales/*.json`
- Определение языка браузера

---

## 🗃️ База данных

### Схема БД (PostgreSQL через Drizzle ORM)

#### Таблица `currencies` - Валюты
```typescript
{
  id: string,           // btc, eth, usd, eur
  name: string,         // Bitcoin, Ethereum, US Dollar
  symbol: string,       // BTC, ETH, USD
  type: 'crypto'|'fiat',
  networks?: string[],  // TRC20, ERC20, BTC (только для крипты)
  decimals: number      // Точность (8 для BTC, 2 для USD)
}
```

#### Таблица `exchange_rates` - Курсы обмена  
```typescript
{
  id: string,
  fromCurrency: string, // btc
  toCurrency: string,   // usd
  rate: number,         // 45000.50
  type: 'fixed'|'floating',
  createdAt: timestamp,
  expiresAt?: timestamp // только для фиксированных
}
```

#### Таблица `orders` - Заказы на обмен
```typescript
{
  id: string,
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number,
  toAmount: number,
  rate: number,
  depositAddress: string,
  payoutAddress: string,
  status: 'awaiting_deposit'|'processing'|'completed'|'failed',
  createdAt: timestamp,
  // ... много других полей
}
```

#### Таблица `users` - Пользователи
```typescript
{
  id: string,
  email?: string,
  name?: string,
  role: 'user'|'admin',
  isActive: boolean,
  // OAuth поля
  // KYC поля
}
```

---

## 🔌 API Endpoints

### 📱 Публичные API

#### `GET /api/currencies`
**Назначение**: Получить список всех поддерживаемых валют
**Ответ**: `Currency[]`

#### `GET /api/rates`
**Назначение**: Получить все актуальные курсы обмена
**Ответ**: `ExchangeRate[]`

#### `POST /api/orders`
**Назначение**: Создать новый заказ на обмен
**Тело запроса**: 
```json
{
  "fromCurrency": "btc",
  "toCurrency": "usd",
  "fromAmount": 0.1,
  "payoutAddress": "4242424242424242",
  "rateType": "fixed"
}
```

#### `GET /api/orders/:id`
**Назначение**: Получить информацию о заказе
**Ответ**: `Order`

### 🔐 API авторизации

#### `GET /api/auth/user`
**Назначение**: Получить текущего пользователя
**Требует**: авторизацию

#### `POST /api/auth/register`
**Назначение**: Регистрация нового пользователя

#### `GET /api/auth/google`
**Назначение**: OAuth авторизация через Google

### 👨‍💼 Админ API (требует admin роль)

#### `GET /api/admin/stats`
**Назначение**: Статистика платформы

#### `GET /api/admin/orders`
**Назначение**: Список всех заказов для управления

#### `PUT /api/admin/orders/:id/status`
**Назначение**: Изменить статус заказа

#### `GET /api/admin/users`
**Назначение**: Управление пользователями

---

## 🔄 WebSocket соединения

### Подключение: `ws://localhost:5000/ws`

#### События от сервера к клиенту:
- `rates_update` - обновление курсов в реальном времени
- `order_status_update` - изменение статуса заказа
- `currencies_update` - обновление списка валют

#### События от клиента к серверу:
- `ping` - проверка соединения (ответ `pong`)
- `subscribe_order` - подписка на обновления заказа
- `subscribe_rates` - подписка на обновления курсов

---

## 🚀 Как запустить проект

### 🔧 Локальная разработка (Windows/Mac/Linux)

#### 1. Установить зависимости
```bash
# Node.js 18+ и npm
npm install -g npm@latest

# Клонировать проект (или скачать)
git clone <your-repo>
cd cryptoflow

# Установить зависимости
npm install
```

#### 2. Вариант А: Запуск БЕЗ базы данных (простой способ)
```bash
# Запуск в режиме памяти (данные не сохраняются)
npm run dev

# Проект будет доступен на http://localhost:5000
```

#### 3. Вариант Б: Запуск С базой данных PostgreSQL

**Установка PostgreSQL:**

**Windows:**
```bash
# Через Chocolatey
choco install postgresql

# Или скачать с https://www.postgresql.org/download/windows/
```

**Mac:**
```bash
# Через Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Настройка базы данных:**
```bash
# Создать пользователя и базу
sudo -u postgres psql

postgres=# CREATE DATABASE cryptoflow;
postgres=# CREATE USER cryptoflow_user WITH PASSWORD 'your_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE cryptoflow TO cryptoflow_user;
postgres=# \q
```

**Настройка проекта:**
```bash
# Создать файл .env в корне проекта
echo "DATABASE_URL=postgresql://cryptoflow_user:your_password@localhost:5432/cryptoflow" > .env

# Применить схему к базе данных
npm run db:push

# Создать администратора
npx tsx scripts/create-admin.ts

# Запустить проект
npm run dev
```

#### 4. Настройка переменных окружения

Создайте файл `.env` в корне проекта:
```bash
# База данных (опционально)
DATABASE_URL=postgresql://user:password@localhost:5432/cryptoflow

# Email (для регистрации пользователей)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth (опционально)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram (для уведомлений)
TELEGRAM_SIGNING_SECRET=your-secret-key

# Безопасность
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
```

---

## 📝 Как добавить новую функциональность

### 🆕 Добавить новую страницу

#### 1. Создать компонент страницы
```typescript
// client/src/pages/my-new-page.tsx
import { useTranslation } from 'react-i18next';

export default function MyNewPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto p-4">
      <h1>{t('myNewPage.title')}</h1>
      {/* содержимое страницы */}
    </div>
  );
}
```

#### 2. Добавить маршрут
```typescript
// client/src/App.tsx
import MyNewPage from './pages/my-new-page';

// В функции App добавить:
<Route path="/my-page" component={MyNewPage} />
```

#### 3. Добавить переводы
```json
// client/src/locales/ru.json
{
  "myNewPage": {
    "title": "Моя новая страница"
  }
}
```

### 🔌 Добавить новый API endpoint

#### 1. Добавить маршрут
```typescript
// server/routes.ts или новый файл server/routes/my-routes.ts
app.get('/api/my-endpoint', async (req, res) => {
  try {
    const data = await storage.getMyData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 2. Добавить метод в хранилище (если нужно)
```typescript
// server/storage.ts
interface IStorage {
  // ... существующие методы
  getMyData(): Promise<MyData[]>;
}

// Реализовать в MemoryStorage и DatabaseStorage
```

#### 3. Использовать в React
```typescript
// client/src/hooks/use-my-data.ts
import { useQuery } from '@tanstack/react-query';

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: () => fetch('/api/my-endpoint').then(res => res.json())
  });
}

// В компоненте:
const { data, isLoading } = useMyData();
```

### 📝 Добавить новую форму

#### 1. Создать схему валидации
```typescript
// shared/schema.ts
export const myFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

export type MyFormData = z.infer<typeof myFormSchema>;
```

#### 2. Создать компонент формы
```typescript
// client/src/components/my-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { myFormSchema, type MyFormData } from '@/shared/schema';

export function MyForm() {
  const form = useForm<MyFormData>({
    resolver: zodResolver(myFormSchema),
  });

  const onSubmit = (data: MyFormData) => {
    // отправка данных
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* поля формы с использованием ShadCN компонентов */}
    </form>
  );
}
```

### 🗄️ Добавить новую таблицу в базу данных

#### 1. Обновить схему
```typescript
// shared/schema.ts
export const myTable = pgTable('my_table', {
  id: text('id').primaryKey().default(''),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertMyTableSchema = createInsertSchema(myTable);
export type MyTableData = typeof myTable.$inferSelect;
```

#### 2. Применить миграцию
```bash
npm run db:push
```

#### 3. Добавить методы в хранилище
```typescript
// server/storage.ts - добавить в IStorage и реализации
getMyTableData(): Promise<MyTableData[]>;
createMyTableRecord(data: MyTableData): Promise<MyTableData>;
```

---

## 🎨 Настройка стилей и UI

### Использование ShadCN компонентов
Все UI компоненты находятся в `client/src/components/ui/`. Для добавления нового:

```bash
# Через CLI (если установлен)
npx shadcn-ui@latest add button

# Или скопировать из https://ui.shadcn.com/docs/components/button
```

### Кастомизация темы
```typescript
// tailwind.config.ts - изменить цвета, шрифты и пр.
theme: {
  extend: {
    colors: {
      primary: {
        // ваши цвета
      }
    }
  }
}
```

---

## 🔒 Безопасность и авторизация

### Роли пользователей
- `user` - обычный пользователь (может создавать заказы)
- `admin` - администратор (полный доступ к админ панели)

### Защита маршрутов
```typescript
// client/src/components/protected-route.tsx
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

### Middleware безопасности
- `server/middleware/auth.ts` - проверка авторизации
- `server/middleware/security.ts` - CORS, rate limiting, валидация
- `server/middleware/secure-admin.ts` - дополнительная защита админ операций

---

## 🌍 Интернационализация (i18n)

### Добавление нового языка

#### 1. Создать файл переводов
```json
// client/src/locales/es.json (испанский)
{
  "header": {
    "title": "Intercambio de Criptomonedas",
    "exchange": "Intercambio"
  }
}
```

#### 2. Зарегистрировать язык
```typescript
// client/src/lib/i18n.ts
import esTranslations from '../locales/es.json';

i18n.init({
  resources: {
    // ... существующие языки
    es: { translation: esTranslations }
  }
});
```

#### 3. Добавить в селектор языков
```typescript
// client/src/components/language-selector.tsx
const languages = [
  // ... существующие
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];
```

---

## 📊 Мониторинг и логирование

### Логи разработки
- Сервер: консоль и файлы в `/tmp/logs/`
- Браузер: DevTools консоль
- База данных: Drizzle логи SQL запросов

### Продакшен логи
- Настройка через переменные окружения
- Интеграция с внешними сервисами (LogRocket, Sentry)

---

## 🚀 Деплой в продакшен

### Replit (рекомендуемый)
```bash
# Проект уже настроен для Replit
# Просто нажмите "Run" или используйте команды:
npm run dev    # для разработки
npm run build  # для сборки
npm run start  # для продакшена
```

### Другие платформы (Vercel, Railway, Render)

#### 1. Сборка проекта
```bash
npm run build
```

#### 2. Настройка переменных окружения
Все переменные из `.env` нужно настроить в панели платформы

#### 3. Настройка базы данных
- Создать PostgreSQL базу
- Применить схему: `npm run db:push`
- Создать админа: `npx tsx scripts/create-admin.ts`

---

## 🛠️ Разработка и отладка

### Полезные команды
```bash
npm run dev        # Запуск разработки
npm run build      # Сборка проекта
npm run start      # Запуск продакшена
npm run check      # Проверка TypeScript
npm run db:push    # Применить изменения БД

# Отладка
npm run dev        # смотрите логи в консоли
# Откройте http://localhost:5000 в браузере
# DevTools -> Network/Console для отладки фронтенда
# Сервер логи выводятся в терминал
```

### Структура для отладки
1. **Проблемы фронтенда**: `client/src/` + DevTools браузера
2. **Проблемы API**: `server/routes/` + логи консоли
3. **Проблемы базы данных**: `server/db.ts` + `shared/schema.ts`
4. **Проблемы WebSocket**: `server/routes.ts` (WebSocket сервер) + `client/src/hooks/use-websocket.ts`

### Частые проблемы и решения

#### "tsx not found"
```bash
npm install  # переустановить зависимости
```

#### "Database connection failed"
```bash
# Проверить DATABASE_URL в .env
# Убедиться что PostgreSQL запущен
# Попробовать без БД (удалить DATABASE_URL)
```

#### "CORS errors"
```bash
# Проверить server/middleware/security.ts
# В разработке должен быть localhost разрешен
```

---

## 📞 Поддержка и помощь

### Где искать помощь
1. **Логи**: всегда первым делом смотрите логи в консоли
2. **DevTools браузера**: для фронтенд проблем  
3. **Database logs**: если проблемы с данными
4. **Network tab**: если проблемы с API запросами

### Контакты разработчика
- Документация проекта: `replit.md`
- Схема базы данных: `shared/schema.ts`
- Конфигурация: `package.json`, `vite.config.ts`, `drizzle.config.ts`

---

## 🎯 Заключение

**CryptoFlow** - это современное приложение для обмена криптовалют с модульной архитектурой, которая позволяет легко добавлять новую функциональность.

### Ключевые принципы:
1. **Разделение обязанностей**: четкое разделение фронтенда, бэкенда и данных
2. **Типобезопасность**: TypeScript везде + Zod валидация  
3. **Современный стек**: React 18, Express, Drizzle ORM, Tailwind
4. **Безопасность**: многоуровневая защита и валидация
5. **Интернационализация**: готовность к множественным языкам
6. **Real-time**: WebSocket для мгновенных обновлений

### Для быстрого старта:
1. `npm install` - установить зависимости
2. `npm run dev` - запустить разработку  
3. Открыть http://localhost:5000
4. Изучить `client/src/components/exchange-widget.tsx` - ядро приложения
5. При необходимости настроить PostgreSQL и переменные окружения

**Удачной разработки! 🚀**

---

*Документация создана для проекта CryptoFlow. Версия 1.0*