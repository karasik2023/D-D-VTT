import { create } from 'zustand'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  danger?: boolean // красная кнопка (удалить)
  disabled?: boolean
  onClick: () => void
}

interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  title: string
  subtitle?: string
  color?: string // цвет точки-индикатора
  items: ContextMenuItem[]
  
  open: (params: {
    x: number
    y: number
    title: string
    subtitle?: string
    color?: string
    items: ContextMenuItem[]
  }) => void
  
  close: () => void
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  title: '',
  subtitle: undefined,
  color: undefined,
  items: [],
  
  open: ({ x, y, title, subtitle, color, items }) => set({
    isOpen: true,
    x,
    y,
    title,
    subtitle,
    color,
    items,
  }),
  
  close: () => set({ isOpen: false }),
}))