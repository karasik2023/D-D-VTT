# ⚔️ DND-VTT — Virtual Tabletop for Dungeons & Dragons

Браузерный виртуальный игровой стол для D&D с реалтайм-синхронизацией, картой, токенами, туманом войны и системой инициативы.

---

## 🛠 Требования

| Инструмент | Версия | Ссылка |
|---|---|---|
| Node.js | 20+ (LTS) | https://nodejs.org |
| Git | любая | https://git-scm.com/download/win |
| PostgreSQL | 18+ | https://www.postgresql.org/download/windows/ |
| VS Code | любая | https://code.visualstudio.com |

---

## 🚀 Установка и запуск

### 1. Клонируй репозиторий

```bash
git clone https://github.com/karasik2023/D-D-VTT.git
cd D-D-VTT
```

### 2. Установи зависимости

```bash
cd apps/backend && npm install
cd ../frontend && npm install
```

### 3. Настрой базу данных

Создай файл `apps/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:ТВОй_ПАРОЛЬ@localhost:5432/dndvtt"
```

> ⚠️ Файл `.env` не хранится в репозитории — создавай вручную на каждом устройстве.

Примени миграции:
```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Запуск

**Терминал 1 — Backend:**
```bash
cd apps/backend
npx ts-node src/index.ts
```
→ `Backend running on http://localhost:3001`

**Терминал 2 — Frontend:**
```bash
cd apps/frontend
npm run dev
```
→ `Local: http://localhost:5173`

---

## 🗂 Структура проекта

```
apps/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Схема БД (User, Room, RoomMember)
│   │   └── migrations/
│   ├── prisma.config.ts         # Конфиг Prisma 7
│   └── src/
│       └── index.ts             # Express + Socket.io сервер
└── frontend/src/
    ├── pages/
    │   ├── LobbyPage.tsx        # Лобби с вкладками GM/Player
    │   ├── RoomPage.tsx         # Игровая комната (только UI)
    │   ├── LoginPage.tsx
    │   └── RegisterPage.tsx
    ├── components/
    │   └── PrivateRoute.tsx
    ├── hooks/
    │   ├── useSocket.ts         # Socket.io подключение и все события
    │   ├── useRoom.ts           # Главный хук комнаты
    │   ├── useInitiative.ts     # Логика инициативы
    │   └── usePlayers.ts        # Логика игроков
    └── stores/
        ├── tokenStore.ts        # Zustand — токены
        ├── roomStore.ts         # Zustand — UI состояние комнаты
        ├── playersStore.ts      # Zustand — игроки
        └── initiativeStore.ts   # Zustand — инициатива
```

---

## 🧰 Технический стек

**Frontend:**
- React + TypeScript + Vite
- Konva.js — canvas (карта, токены, зум, пан)
- Zustand — управление состоянием
- Socket.io client — реалтайм
- React Router — роутинг
- React Icons v5
- use-image — загрузка изображений в Konva

**Backend:**
- Node.js + Express
- Socket.io — реалтайм-синхронизация
- Prisma 7 — ORM (конфиг через `prisma.config.ts`)
- PostgreSQL — база данных
- JWT + bcrypt — аутентификация

---

## 👥 Команда и роли

| Участник | Роль | Зона ответственности |
|---|---|---|
| Alex | Tech Lead / Fullstack | Архитектура, бэкенд, реалтайм, деплой |
| Dev #2 | Frontend Canvas | Konva.js, карта, токены, туман войны |
| Dev #3 | Frontend UI | Лобби, кубики, чат, интеграция |
| PO | Product Owner | Беклог, мокапы, тестирование |

---

## 📋 Статус MVP

### ✅ Реализовано
- Регистрация и логин (JWT + PostgreSQL)
- Создание комнат (GM), вход по коду (игроки)
- Лобби: вкладка GM (свои комнаты) и Player (посещённые)
- Переименование комнат
- Canvas с картой, зум/пан
- Токены с drag-and-drop и реалтайм-синхронизацией
- Список игроков в реальном времени (онлайн/офлайн, GM метка)
- Система инициативы: добавление токенов через ПКМ, ввод числа, автосортировка, сброс, синхронизация
- Три тулбара: списки (верхний левый), ассеты (нижний), инструменты (правый)
- Адаптивный canvas при ресайзе окна
- Архитектура с разделением логики (hooks + Zustand stores) для переноса в приложение

### 🔲 В планах
- Меню ассетов с хранилищем (загрузка токенов, сцен, объектов — S3)
- Туман войны
- Броски кубиков с результатом в чате
- Чат в комнате
- Загрузка своей карты
- Сохранение позиций токенов в PostgreSQL

---

## ⚠️ Важные особенности

- **Prisma 7** использует `prisma.config.ts` — отличается от Prisma 5 и ниже
- **`.env` не в репо** — создавать вручную на каждом устройстве
- **`window.location.href`** вместо `navigate()` при входе в комнату — иначе Socket.io не переподключается
- **React Icons v5** — `size` и `color` передавать как пропсы, не через CSS
- **После `git pull`** всегда запускать: `npx prisma migrate dev` + `npx prisma generate`
- **`"type": "commonjs"`** в `package.json` бэкенда — решает конфликт ESM/CJS

---

## 🔄 Workflow для команды

```bash
# Получить изменения
git pull origin main
cd apps/backend
npx prisma migrate dev
npx prisma generate

# Запушить изменения
git add .
git commit -m "описание"
git push origin main
```

---

## 🔗 Полезные ссылки

- [Owlbear Rodeo Legacy](https://github.com/owlbear-rodeo/owlbear-rodeo-legacy) — референс
- [Konva.js docs](https://konvajs.org/docs/)
- [Prisma docs](https://www.prisma.io/docs)
- [Socket.io docs](https://socket.io/docs/v4/)
- [Zustand docs](https://zustand-demo.pmnd.rs/)
