# 🚀 CryptoFlow - Развертывание без Replit

Это подробное руководство по развертыванию приложения CryptoFlow на локальной машине или сервере без использования Replit.

## 📋 Содержание

1. [Системные требования](#системные-требования)
2. [Развертывание на локальной машине](#развертывание-на-локальной-машине)
3. [Развертывание на сервере](#развертывание-на-сервере)
4. [Настройка базы данных](#настройка-базы-данных)
5. [Создание первого администратора](#создание-первого-администратора)
6. [Настройка OAuth провайдеров](#настройка-oauth-провайдеров)
7. [Возможные проблемы и решения](#возможные-проблемы-и-решения)

---

## 🔧 Системные требования

- **Node.js**: версия 18.x или выше
- **npm**: версия 9.x или выше  
- **PostgreSQL**: версия 13.x или выше (опционально)
- **Git**: для клонирования проекта

### Проверка установленных версий:
```bash
node --version    # должно быть v18.0.0 или выше
npm --version     # должно быть 9.0.0 или выше
psql --version    # если используете PostgreSQL
```

---

## 💻 Развертывание на локальной машине

### Шаг 1: Получение проекта

```bash
# Если у вас есть архив проекта
unzip cryptoflow-project.zip
cd cryptoflow-project

# ИЛИ если проект в Git
git clone https://your-repository-url/cryptoflow.git
cd cryptoflow
```

### Шаг 2: Установка зависимостей

```bash
# Установка всех зависимостей
npm install

# Если нужно только продакшн зависимости
npm ci --omit=dev
```

### Шаг 3: Настройка переменных среды

```bash
# Создание .env файла из шаблона
cp .env.example .env
```

Отредактируйте файл `.env`:

```env
# Основные настройки
NODE_ENV=development
PORT=5000
APP_BASE_URL=http://localhost:5000

# Обязательный секретный ключ сессий (замените на свой!)
SESSION_SECRET=ваш-супер-секретный-ключ-минимум-32-символа

# Провайдер аутентификации (local для внешнего развертывания)
AUTH_PROVIDER=local

# База данных (опционально - без неё будет работать в памяти)
# DATABASE_URL=postgresql://username:password@localhost:5432/cryptoflow

# OAuth провайдеры (опционально)
# GOOGLE_CLIENT_ID=ваш-google-client-id
# GOOGLE_CLIENT_SECRET=ваш-google-client-secret
# GITHUB_CLIENT_ID=ваш-github-client-id
# GITHUB_CLIENT_SECRET=ваш-github-client-secret

# Email настройки (опционально)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=ваш-email@gmail.com
# SMTP_PASS=ваш-пароль-приложения
# EMAIL_FROM=ваш-email@gmail.com

# Функции
FEATURE_REAL_RATES=false
```

**⚠️ ВАЖНО**: Замените `SESSION_SECRET` на уникальный ключ минимум 32 символа!

### Шаг 4: Сборка приложения

```bash
# Сборка фронтенда и бэкенда
npm run build
```

### Шаг 5: Запуск приложения

```bash
# Для разработки
npm run dev

# Для продакшена
npm start
```

### Шаг 6: Проверка работы

Откройте браузер и перейдите по адресу: http://localhost:5000

✅ Вы должны увидеть главную страницу CryptoFlow!

---

## 🖥️ Развертывание на сервере

### Шаг 1: Подготовка сервера

**Для Ubuntu/Debian:**
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Установка Nginx (опционально, для reverse proxy)
sudo apt install nginx -y
```

**Для CentOS/RHEL:**
```bash
# Обновление системы
sudo yum update -y

# Установка Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка Nginx
sudo yum install nginx -y
```

### Шаг 2: Создание пользователя для приложения

```bash
# Создание пользователя cryptoflow
sudo useradd -m -s /bin/bash cryptoflow

# Переключение на пользователя
sudo su - cryptoflow
```

### Шаг 3: Развертывание приложения

```bash
# Создание директории приложения
mkdir -p /home/cryptoflow/app
cd /home/cryptoflow/app

# Копирование файлов проекта (замените на ваш способ доставки)
# Например, через scp, git или wget

# Если используете git:
git clone https://your-repository-url/cryptoflow.git .

# Если файлы уже загружены, убедитесь что владелец правильный:
sudo chown -R cryptoflow:cryptoflow /home/cryptoflow/app
```

### Шаг 4: Установка зависимостей и сборка

```bash
cd /home/cryptoflow/app

# Установка только продакшн зависимостей
npm ci --omit=dev

# Установка dev зависимостей для сборки
npm install

# Сборка приложения
npm run build

# Удаление dev зависимостей после сборки
npm prune --omit=dev
```

### Шаг 5: Настройка переменных среды

```bash
# Создание .env файла
nano .env
```

Пример конфигурации для сервера:

```env
NODE_ENV=production
PORT=5000
APP_BASE_URL=https://ваш-домен.com

# Сгенерируйте надежный ключ!
SESSION_SECRET=ваш-супер-секретный-ключ-для-продакшена-минимум-32-символа

AUTH_PROVIDER=local

# База данных (рекомендуется для продакшена)
DATABASE_URL=postgresql://cryptoflow_user:пароль@localhost:5432/cryptoflow_db

# OAuth провайдеры
GOOGLE_CLIENT_ID=ваш-google-client-id
GOOGLE_CLIENT_SECRET=ваш-google-client-secret
GITHUB_CLIENT_ID=ваш-github-client-id
GITHUB_CLIENT_SECRET=ваш-github-client-secret

# Email настройки
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@ваш-домен.com
SMTP_PASS=ваш-пароль-приложения
EMAIL_FROM=noreply@ваш-домен.com

FEATURE_REAL_RATES=true
```

### Шаг 6: Настройка PM2

```bash
# Создание конфигурации PM2
nano ecosystem.config.js
```

Содержимое файла:

```javascript
module.exports = {
  apps: [{
    name: 'cryptoflow',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
```

```bash
# Создание директории для логов
mkdir -p logs

# Запуск приложения через PM2
pm2 start ecosystem.config.js

# Настройка автозапуска
pm2 startup
pm2 save

# Проверка статуса
pm2 status
pm2 logs cryptoflow
```

### Шаг 7: Настройка Nginx (рекомендуется)

```bash
# Создание конфигурации Nginx
sudo nano /etc/nginx/sites-available/cryptoflow
```

Содержимое конфигурации:

```nginx
server {
    listen 80;
    server_name ваш-домен.com www.ваш-домен.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ваш-домен.com www.ваш-домен.com;

    # SSL сертификаты (получите через Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/ваш-домен.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ваш-домен.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Proxy к Node.js приложению
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket поддержка
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статические файлы
    location /assets/ {
        alias /home/cryptoflow/app/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/cryptoflow /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🗄️ Настройка базы данных

### Вариант 1: Работа без базы данных (простой)

Приложение может работать полностью в памяти без PostgreSQL. Это подходит для тестирования и небольших установок.

**Плюсы**: Простота установки
**Минусы**: Данные не сохраняются при перезапуске

### Вариант 2: Установка PostgreSQL (рекомендуется)

**Установка PostgreSQL:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
```

**Настройка базы данных:**

```bash
# Переключение на пользователя postgres
sudo su - postgres

# Создание базы данных и пользователя
psql -c "CREATE USER cryptoflow_user WITH PASSWORD 'надежный_пароль';"
psql -c "CREATE DATABASE cryptoflow_db OWNER cryptoflow_user;"
psql -c "GRANT ALL PRIVILEGES ON DATABASE cryptoflow_db TO cryptoflow_user;"

# Выход из пользователя postgres
exit
```

**Настройка подключения в .env:**

```env
DATABASE_URL=postgresql://cryptoflow_user:надежный_пароль@localhost:5432/cryptoflow_db
```

**Создание таблиц:**

```bash
cd /home/cryptoflow/app

# Установка Drizzle CLI (если не установлен)
npm install -g drizzle-kit

# Создание таблиц в базе данных
npm run db:push
```

### Пример создания таблиц вручную (если нужно):

```sql
-- Подключение к базе данных
psql -h localhost -U cryptoflow_user -d cryptoflow_db

-- Создание основных таблиц
CREATE TABLE IF NOT EXISTS currencies (
    id VARCHAR PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    network TEXT,
    min_amount DECIMAL(18,8) NOT NULL,
    max_amount DECIMAL(18,8) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    icon_url TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    password VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role TEXT NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Добавьте остальные таблицы по аналогии...
```

---

## 👤 Создание первого администратора

### Автоматический способ:

```bash
cd /home/cryptoflow/app

# Запуск скрипта создания админа
npm run create-admin
```

### Ручной способ через базу данных:

```sql
-- Подключение к базе данных
psql -h localhost -U cryptoflow_user -d cryptoflow_db

-- Создание админа
INSERT INTO users (id, email, first_name, last_name, role, is_active)
VALUES ('admin-1', 'admin@ваш-домен.com', 'Admin', 'User', 'admin', true);
```

### Вход в админ-панель:

1. Откройте: `https://ваш-домен.com/admin/login`
2. Используйте созданные учетные данные
3. Если используете Replit Auth, войдите через Replit аккаунт

---

## 🔐 Настройка OAuth провайдеров

### Google OAuth:

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 учетные данные:
   - **Authorized redirect URIs**: `https://ваш-домен.com/api/auth/google/callback`
5. Добавьте в .env:

```env
GOOGLE_CLIENT_ID=ваш-google-client-id
GOOGLE_CLIENT_SECRET=ваш-google-client-secret
```

### GitHub OAuth:

1. Перейдите в [GitHub Developer Settings](https://github.com/settings/developers)
2. Создайте новое OAuth приложение
3. Настройте:
   - **Homepage URL**: `https://ваш-домен.com`
   - **Authorization callback URL**: `https://ваш-домен.com/api/auth/github/callback`
4. Добавьте в .env:

```env
GITHUB_CLIENT_ID=ваш-github-client-id
GITHUB_CLIENT_SECRET=ваш-github-client-secret
```

---

## 🚨 Возможные проблемы и решения

### Проблема: "Cannot find module" ошибки

**Решение:**
```bash
# Удаление node_modules и переустановка
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Проблема: Ошибки подключения к базе данных

**Решение:**
```bash
# Проверка статуса PostgreSQL
sudo systemctl status postgresql

# Перезапуск PostgreSQL
sudo systemctl restart postgresql

# Проверка подключения
psql -h localhost -U cryptoflow_user -d cryptoflow_db -c "SELECT 1;"
```

### Проблема: Порт уже используется

**Решение:**
```bash
# Найти процесс на порту 5000
sudo lsof -i :5000

# Убить процесс (замените PID)
sudo kill -9 PID

# Или изменить порт в .env
PORT=3000
```

### Проблема: Nginx 502 Bad Gateway

**Решение:**
```bash
# Проверка статуса приложения
pm2 status

# Проверка логов
pm2 logs cryptoflow

# Перезапуск приложения
pm2 restart cryptoflow
```

### Проблема: SSL сертификат

**Решение с Let's Encrypt:**
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d ваш-домен.com -d www.ваш-домен.com

# Автообновление сертификата
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📝 Полезные команды

### Мониторинг:

```bash
# Просмотр логов приложения
pm2 logs cryptoflow

# Мониторинг ресурсов
pm2 monit

# Статус системы
systemctl status nginx postgresql
```

### Обновление приложения:

```bash
# Остановка приложения
pm2 stop cryptoflow

# Обновление кода (git pull или замена файлов)
git pull origin main

# Установка зависимостей и сборка
npm install
npm run build

# Запуск приложения
pm2 start cryptoflow
```

### Резервное копирование базы данных:

```bash
# Создание backup
pg_dump -h localhost -U cryptoflow_user cryptoflow_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление backup
psql -h localhost -U cryptoflow_user cryptoflow_db < backup_20240101_120000.sql
```

---

## ✅ Проверочный список

После развертывания проверьте:

- [ ] Приложение доступно по адресу
- [ ] Главная страница загружается
- [ ] API endpoints отвечают (`/api/health`, `/api/currencies`)
- [ ] WebSocket подключения работают
- [ ] Админ-панель доступна (`/admin`)
- [ ] Создан первый администратор
- [ ] База данных подключена (если используется)
- [ ] SSL сертификат работает (для продакшена)
- [ ] OAuth провайдеры настроены (если используются)
- [ ] Email настройки работают (если используются)
- [ ] Мониторинг и логи работают

---

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи: `pm2 logs cryptoflow`
2. Проверьте статус сервисов: `systemctl status nginx postgresql`
3. Убедитесь что все переменные среды правильно настроены
4. Проверьте файрвол и открытые порты
5. Обратитесь к разделу "Возможные проблемы и решения"

**Удачного развертывания! 🚀**