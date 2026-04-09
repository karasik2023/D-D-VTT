[README.md](https://github.com/user-attachments/files/26608002/README.md)
# ⚔️ DND-VTT — Virtual Tabletop for Dungeons & Dragons

Браузерный виртуальный игровой стол для D&D с реалтайм-синхронизацией, картой, токенами и туманом войны.

---

## 🛠 Требования

Перед началом установи следующее ПО:

| Инструмент | Версия | Ссылка |
|---|---|---|
| Node.js | 20+ (LTS) | https://nodejs.org |
| Git | любая | https://git-scm.com/download/win |
| PostgreSQL | 15+ | https://www.postgresql.org/download/windows/ |
| VS Code | любая | https://code.visualstudio.com |

---

## 🚀 Установка и запуск

### 1. Клонируй репозиторий

```bash
git clone https://github.com/ВАШ_НИК/dnd-vtt.git
cd dnd-vtt
```

### 2. Установи зависимости

**Backend:**
```bash
cd apps/backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Настрой базу данных

При установке PostgreSQL ты задал пароль для пользователя `postgres` — он понадобится здесь.

Создай файл `apps/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:ТВОй_ПАРОЛЬ@localhost:5432/dndvtt"
```

Примени миграции:
```bash
cd apps/backend
npx prisma migrate dev --name init
```

### 4. Запуск

Открой **два терминала**:

**Терминал 1 — Backend:**
```bash
cd apps/backend
npx ts-node src/index.ts
```
Должно вывести: `Backend running on http://localhost:3001`

**Терминал 2 — Frontend:**
```bash
cd apps/frontend
npm run dev
```
Должно вывести: `Local: http://localhost:5173`

### 5. Открой в браузере

```
http://localhost:5173
```

---

## 🗂 Структура проекта

```
dnd-vtt/
├── apps/
│   ├── backend/          # Node.js + Express + Socket.io
│   │   ├── prisma/       # Схема базы данных
│   │   └── src/
│   │       └── index.ts  # Точка входа бэкенда
│   └── frontend/         # React + TypeScript + Vite + Konva.js
│       └── src/
│           ├── pages/    # Страницы (Lobby, Room, Login, Register)
│           ├── components/
│           └── main.tsx
```

---

## 🧰 Технический стек

**Frontend:**
- React + TypeScript
- Vite
- Konva.js — canvas (карта, токены)
- Zustand — управление состоянием
- Socket.io client — реалтайм
- React Router — роутинг

**Backend:**
- Node.js + Express
- Socket.io — реалтайм-синхронизация
- Prisma 7 — ORM
- PostgreSQL — база данных
- JWT — аутентификация
- bcrypt — хэширование паролей

---

## 👥 Команда и роли

| Участник | Роль | Зона ответственности |
|---|---|---|
| Alex | Tech Lead / Fullstack | Архитектура, бэкенд, реалтайм, деплой |
| Dev #2 | Frontend Canvas | Konva.js, карта, токены, туман войны |
| Dev #3 | Frontend UI | Лобби, кубики, чат, интеграция |
| PO | Product Owner | Беклог, мокапы, тестирование |

---

## 📋 Текущий статус MVP

- [x] Реалтайм-синхронизация токенов
- [x] Карта с зумом и паном
- [x] Регистрация и авторизация (JWT + PostgreSQL)
- [x] Создание и вход в комнату
- [x] Сохранение позиций токенов на сервере
- [ ] Туман войны
- [ ] Броски кубиков
- [ ] Чат
- [ ] Загрузка своей карты

---

## ⚠️ Известные особенности

- **Prisma 7** использует `prisma.config.ts` вместо `.env` для конфигурации — не путать со старыми версиями
- **PostgreSQL** должен быть запущен как служба Windows — запускается автоматически после установки
- При первом запуске нужно зарегистрироваться на `/register` — существующие аккаунты не переносятся между машинами

---

## 🔗 Полезные ссылки

- [Owlbear Rodeo Legacy](https://github.com/owlbear-rodeo/owlbear-rodeo-legacy) — референс проекта
- [Konva.js docs](https://konvajs.org/docs/)
- [Prisma docs](https://www.prisma.io/docs)
- [Socket.io docs](https://socket.io/docs/v4/)
