# MTI-HUB — Billing System

Лёгкая самохостируемая платформа для веб-студии: управление клиентами, проектами, регулярными платежами и финансами.

## Возможности

- Клиенты и проекты
- Регулярные услуги с автогенерацией ожидаемых платежей (хостинг, домены, сопровождение и др.)
- Ожидаемый платёж — конкретная оплата на конкретную дату; Транзакция — факт движения денег
- Напоминания в Telegram о предстоящих и просроченных платежах
- Учёт доходов и расходов по категориям и счетам
- Финансовый дашборд

## Быстрый старт (Docker)

```bash
cp .env.example .env
# Отредактируйте .env — минимум: JWT_SECRET и POSTGRES_PASSWORD

docker compose up --build
```

Фронтенд: http://localhost  
API health: http://localhost:5000/health

Чтобы создать стартового администратора и базовые справочники, один раз выполните:

```bash
docker compose run --rm server node prisma/seed.js
```

**Логин после seed:** `admin@studio.ru` / `admin123`

> ⚠️ Смените пароль после первого входа

## Локальная разработка

```bash
# Бэкенд
cd server
cp ../.env.example .env   # поправьте DATABASE_URL на локальный Postgres
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev               # :5000

# Фронтенд
cd client
npm install
npm run dev               # :5173 (проксирует /api → :5000)
```

## Переменные окружения

| Переменная          | Описание                              | По умолчанию                |
|---------------------|---------------------------------------|-----------------------------|
| `DATABASE_URL`      | PostgreSQL connection string          | —                           |
| `JWT_SECRET`        | Секрет для подписи токенов            | —                           |
| `JWT_ACCESS_TTL`    | Время жизни токена                    | `7d`                        |
| `TELEGRAM_TOKEN_SECRET` | Секрет для шифрования Telegram-токенов | `JWT_SECRET`             |
| `PORT`              | Порт бэкенда                          | `5000`                      |
| `POSTGRES_DB`       | Имя БД (docker-compose)               | `mtihub`                    |
| `POSTGRES_USER`     | Пользователь БД (docker-compose)      | `studio`                    |
| `POSTGRES_PASSWORD` | Пароль БД (docker-compose)            | `studio`                    |

## Производство

- Обязательно смените `JWT_SECRET` и `POSTGRES_PASSWORD`
- Поставьте Caddy перед контейнерами для TLS
- Регулярно делайте бэкап тома `postgres_data`
- Telegram-боты настраиваются в интерфейсе, токены вводятся через UI и хранятся в БД в зашифрованном виде

## Структура

```
MTI-HUB/
  server/          Node.js + Express 5 + Prisma
  client/          Vue 3 + Vite + Tailwind CSS
  docker-compose.yml
  .env.example
```
