# ⚔️ DND-VTT — Virtual Tabletop for Dungeons & Dragons

Браузерный виртуальный игровой стол для D&D с реалтайм-синхронизацией, картой, токенами, системой инициативы, правами доступа и бросками кубиков.

ОБНОВЫ ДЛЯ МАГИ

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
> ⚠️ Проверь что переменная именно `DATABASE_URL` (с подчёркиванием), не `DATABASEURL`.

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

### Frontend — дробленая архитектура (готова к переносу в нативное приложение)

```
apps/frontend/src/
├── pages/
│   ├── LobbyPage.tsx          # Лобби, вкладки GM/Player
│   ├── RoomPage.tsx           # Игровая комната (ТОЛЬКО UI, без логики)
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── components/
│   └── PrivateRoute.tsx
├── hooks/                     # Бизнес-логика + Socket.io
│   ├── useSocket.ts           # Подключение и все серверные события
│   ├── useRoom.ts             # Главный хук, агрегирует остальные
│   ├── useInitiative.ts
│   ├── usePlayers.ts
│   └── useDice.ts             # (в разработке)
└── stores/                    # Zustand сторы (переносимые в RN/Electron)
    ├── tokenStore.ts
    ├── roomStore.ts
    ├── playersStore.ts
    ├── initiativeStore.ts
    ├── permissionsStore.ts
    └── diceStore.ts           # (в разработке)
```

### Backend — модульная архитектура

```
apps/backend/src/
├── index.ts                   # Входная точка (подключение роутов и хендлеров)
├── config/
│   ├── prisma.ts              # Prisma клиент
│   ├── constants.ts           # JWT_SECRET, COLORS, DEFAULT_PERMISSIONS
│   └── upload.ts              # multer для загрузки файлов
├── routes/                    # REST API
│   ├── auth.ts                # Регистрация, логин
│   ├── rooms.ts               # Создание, просмотр, переименование комнат
│   └── assets.ts              # Загрузка и удаление ассетов
└── sockets/                   # Socket.io обработчики
    ├── roomState.ts           # Общее состояние комнат в памяти
    ├── playerHandlers.ts      # join-room, disconnect
    ├── tokenHandlers.ts       # token-move, token-create
    ├── initiativeHandlers.ts  # initiative-add/remove/update/clear
    ├── permissionHandlers.ts  # set-permission
    └── diceHandlers.ts        # dice-roll, dice-result, dice-error
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
- multer — загрузка файлов
- uuid — генерация уникальных ID (броски кубиков и др.)
- crypto (встроенный в Node.js) — криптостойкие случайные числа для бросков

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
- Система инициативы: ПКМ по токену → добавить, ввод числа, автосортировка, сброс, синхронизация
- Система ролей и прав (GM/Player), GM может менять права игроков
- Загрузка токенов-ассетов (multer, хранение на диске сервера)
- Бэкенд для бросков кубиков (д4–д100, мульти-броски, формулы `2d6+3`)
- Три тулбара: списки (верхний левый), ассеты (нижний), инструменты (правый)
- Адаптивный canvas при ресайзе окна
- Дробленая архитектура для переноса в нативное приложение

### 🔜 В разработке
- Фронтенд для бросков кубиков (UI панели + история бросков) — см. `DICE_FEATURE.md`

### 🔲 В планах
- Туман войны (GM рисует, игроки не видят сквозь него)
- Чат в комнате
- Обводка выделенных токенов с подписью кто выделил
- Загрузка своей карты
- Сохранение позиций токенов в PostgreSQL (сейчас только в памяти сервера)

---

## 🧩 Шаблон добавления новой фичи

Чтобы соблюдать архитектуру, при добавлении новой функции следуй шаблону:

1. **Создай Zustand стор** в `stores/` с состоянием фичи
2. **Создай хук** в `hooks/` который:
   - Подписывается на Socket.io события
   - Предоставляет функции для действий (которые эмитят события на сервер)
3. **Подключи хук** в `useRoom.ts` и пробрось его функции в return
4. **Создай обработчик** на бэкенде в `sockets/xxxHandlers.ts`
5. **Зарегистрируй** одной строкой в `index.ts`: `registerXxxHandlers(io, socket)`
6. **Используй хук** в `RoomPage.tsx` — только рендер UI, никакой логики

---

## 📦 Установленные npm-пакеты

### Backend

```
express          # HTTP сервер
socket.io        # Реалтайм
cors             # CORS
jsonwebtoken     # JWT токены
bcrypt           # Хеширование паролей
@prisma/client   # Prisma ORM
@prisma/adapter-pg
dotenv           # Переменные окружения
multer           # Загрузка файлов
uuid             # Генерация уникальных ID
ts-node          # Запуск TypeScript без сборки
typescript
```

Dev: `@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/multer`, `@types/uuid`, `@types/node`

### Frontend

```
react + react-dom
react-router-dom
typescript + vite
socket.io-client
zustand
konva + react-konva + use-image
react-icons
```

---

## ⚠️ Важные особенности

- **Prisma 7** использует `prisma.config.ts` — отличается от Prisma 5 и ниже
- **`.env` не в репо** — создавать вручную на каждом устройстве
- **Переменная `DATABASE_URL`** именно с подчёркиванием, не `DATABASEURL`
- **`window.location.href`** вместо `navigate()` при входе в комнату — иначе Socket.io не переподключается
- **React Icons v5** — `size` и `color` передавать как пропсы, не через CSS
- **После `git pull`** всегда запускать: `npx prisma migrate dev` + `npx prisma generate`
- **`"type": "commonjs"`** в `package.json` бэкенда — решает конфликт ESM/CJS
- **Логика бросков кубиков** — на сервере (`crypto.randomInt`) для честности, не на клиенте
- **Броски не хранятся в БД** — только real-time, история живёт в Zustand сторе у клиента

---

## 🔄 Workflow для команды

```bash
# Получить изменения
git pull origin main
cd apps/backend
npm install                 # если добавились новые пакеты
npx prisma migrate dev
npx prisma generate

cd ../frontend
npm install                 # если добавились новые пакеты

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
