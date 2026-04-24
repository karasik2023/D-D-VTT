# 🎲 Задача: Система бросков кубиков

Реализация бросков кубиков (д4, д6, д8, д10, д12, д20, д100) с поддержкой мульти-бросков, формул и реалтайм-синхронизацией между игроками.

---

## ✅ Статус бэкенда

Бэкенд **готов** к интеграции. Реализовано:

- Файл `apps/backend/src/sockets/diceHandlers.ts`
- Парсер формул (`1d20`, `3d6`, `2d4+3d12`, `1d20+5`, `2d6-1`)
- Генерация случайных чисел через `crypto.randomInt` (криптостойкая, на сервере для честности)
- Проверка что игрок находится в комнате
- Рассылка результата всем в комнате через `io.to(roomId).emit(...)`
- Валидация: типы кубиков (4, 6, 8, 10, 12, 20, 100), количество (1–100)

---

## 📡 Socket.io события

### Клиент → Сервер

**`dice-roll`**
```typescript
{
  roomId: string
  formula: string       // "1d20", "3d6+5", "2d4+3d12-1"
  playerId: string
  playerName: string
  playerColor: string
}
```

### Сервер → Все клиенты в комнате

**`dice-result`**
```typescript
{
  id: string            // uuid
  playerId: string
  playerName: string
  playerColor: string
  formula: string       // исходная формула
  rolls: Array<{
    die: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
    count: number
    values: number[]    // результаты каждого кубика
    groupSum: number    // сумма по группе
  }>
  modifier: number      // +5, -3 и т.д.
  total: number         // итог всех групп + модификатор
  timestamp: number
}
```

### Сервер → Отправитель (при ошибке)

**`dice-error`**
```typescript
{
  formula?: string
  error?: string
  message?: string
}
```

---

## 🎯 Что нужно реализовать на фронтенде

### 1. Zustand стор: `stores/diceStore.ts`

Хранит историю последних 20 бросков.

```typescript
import { create } from 'zustand'

export interface DiceGroup {
  die: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
  count: number
  values: number[]
  groupSum: number
}

export interface DiceRollResult {
  id: string
  playerId: string
  playerName: string
  playerColor: string
  formula: string
  rolls: DiceGroup[]
  modifier: number
  total: number
  timestamp: number
}

interface DiceStore {
  history: DiceRollResult[]
  addRoll: (result: DiceRollResult) => void
  clearHistory: () => void
}

const MAX_HISTORY = 20

export const useDiceStore = create<DiceStore>((set) => ({
  history: [],
  addRoll: (result) => set((state) => ({
    history: [result, ...state.history].slice(0, MAX_HISTORY)
  })),
  clearHistory: () => set({ history: [] }),
}))
```

### 2. Хук: `hooks/useDice.ts`

Подписка на события и функция броска.

```typescript
import { useEffect } from 'react'
import { getSocket } from './useSocket'
import { useDiceStore, DiceRollResult } from '../stores/diceStore'
import { usePermissionsStore } from '../stores/permissionsStore'
import { usePlayersStore } from '../stores/playersStore'

export function useDice(roomId: string | undefined) {
  const { history, addRoll, clearHistory } = useDiceStore()

  useEffect(() => {
    if (!roomId) return
    const socket = getSocket()

    socket.on('dice-result', (result: DiceRollResult) => {
      addRoll(result)
    })

    socket.on('dice-error', (err: { error?: string; message?: string }) => {
      console.warn('Dice error:', err.error || err.message)
      // Можно показать тост/уведомление
    })

    return () => {
      socket.off('dice-result')
      socket.off('dice-error')
    }
  }, [roomId])

  const rollDice = (formula: string) => {
    const myId = usePermissionsStore.getState().myId
    const players = usePlayersStore.getState().players
    const me = players.find(p => p.id === myId)

    if (!me) return

    getSocket().emit('dice-roll', {
      roomId,
      formula,
      playerId: me.id,
      playerName: me.username,
      playerColor: me.color,
    })
  }

  return { history, rollDice, clearHistory }
}
```

### 3. Подключение в `useRoom.ts`

Добавь импорт и пробрось функции наружу:

```typescript
import { useDice } from './useDice'

export function useRoom(roomId: string | undefined) {
  // ... остальной код
  const { history: diceHistory, rollDice, clearHistory: clearDiceHistory } = useDice(roomId)

  return {
    // ... остальные поля
    diceHistory,
    rollDice,
    clearDiceHistory,
  }
}
```

### 4. UI в `RoomPage.tsx`

Панель "Броски" открывается из левого верхнего тулбара (кнопка д20 уже есть). Нужно заменить заглушку на полный интерфейс:

**Требования к UI:**
- Быстрые кнопки: д4, д6, д8, д10, д12, д20, д100 — клик по кнопке бросает один кубик этого типа (`rollDice('1d4')` и т.д.)
- Поле ввода формулы + кнопка "Бросить" (submit на Enter тоже)
- История бросков снизу со скроллом (последние 20)
- Каждая запись в истории содержит:
  - Цветной кружок (`player.color`)
  - Имя игрока
  - Формула (`2d6+3`)
  - Итог жирным (`= 14`)
  - Детали мелким шрифтом: `д6: [4, 6] = 10` (значения каждого кубика в квадратных скобках)
  - Если есть модификатор — показать его (`+3`)

---

## 🧪 Формат формул

Поддерживаемые форматы:

| Формула | Что означает |
|---|---|
| `1d20` или `d20` | Один д20 |
| `3d6` | Три д6, суммировать |
| `2d4+3d12` | Два д4 + три д12, общая сумма |
| `1d20+5` | д20 + модификатор 5 |
| `2d6-1` | 2д6 с модификатором -1 |
| `3d6+2d8+10` | Мульти-броски с модификатором |

Пробелы игнорируются, регистр не важен.

---

## ⚠️ Важные моменты

1. **Логика бросков — на сервере**, клиент только отправляет формулу и получает результат. Это защита от подмены результатов через DevTools.

2. **Броски не сохраняются в БД** — только real-time. История живёт в Zustand сторе до перезагрузки страницы.

3. **Типы дублируются** на фронте и бэке. В будущем их можно вынести в `packages/shared`, но пока просто копируются.

4. **Использовать `getSocket()`** из `hooks/useSocket.ts` — не создавать новое подключение.

5. **Следовать архитектуре проекта:**
   - Логика → `hooks/useDice.ts`
   - Состояние → `stores/diceStore.ts`
   - UI → `pages/RoomPage.tsx` (только рендер)

---

## 📋 Чеклист

- [ ] Создан `stores/diceStore.ts`
- [ ] Создан `hooks/useDice.ts`
- [ ] Подключен `useDice` в `useRoom.ts`, пробрасываются `diceHistory`, `rollDice`, `clearDiceHistory`
- [ ] Заменена заглушка панели "Броски" в `RoomPage.tsx` на реальный UI
- [ ] Быстрые кнопки д4–д100 работают
- [ ] Поле формулы + кнопка "Бросить"
- [ ] История бросков с цветным индикатором игрока, именем, формулой, итогом, деталями
- [ ] Проверено: два игрока в комнате видят броски друг друга в реальном времени
- [ ] Проверено: ошибки формулы (`asdf`, `1d7`, `0d6`) корректно обрабатываются
