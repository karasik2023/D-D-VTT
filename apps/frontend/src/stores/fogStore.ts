import { create } from 'zustand'

export interface FogShape {
  id: string
  type: string // "polygon" | "rect" | "circle" | "triangle" | "full"
  points: any
  isRevealed: boolean
  isVisible: boolean
  createdBy: string
}

export type FogTool = 'select' | 'polygon' | 'rect' | 'circle' | 'triangle' | 'full'

interface FogStore {
  shapes: FogShape[]
  activeTool: FogTool
  isScissorsMode: boolean // ← ножницы: модификатор вкл/выкл
  previewMode: boolean
  selectedShapeId: string | null
  isDrawing: boolean
  tempPoints: { x: number; y: number }[]

  // Actions
  setShapes: (shapes: FogShape[]) => void
  addShape: (shape: FogShape) => void
  updateShape: (id: string, updates: Partial<FogShape>) => void
  removeShape: (id: string) => void
  clearShapes: () => void

  setActiveTool: (tool: FogTool) => void
  toggleScissorsMode: () => void // ← новый
  setPreviewMode: (enabled: boolean) => void
  setSelectedShapeId: (id: string | null) => void
  setIsDrawing: (drawing: boolean) => void
  addTempPoint: (point: { x: number; y: number }) => void
  clearTempPoints: () => void

  getShapeById: (id: string) => FogShape | undefined
  isPointInFog: (x: number, y: number) => boolean
}

export const useFogStore = create<FogStore>((set, get) => ({
  shapes: [],
  activeTool: 'select',
  isScissorsMode: false,
  previewMode: false,
  selectedShapeId: null,
  isDrawing: false,
  tempPoints: [],

  setShapes: (shapes) => set({ shapes }),

  addShape: (shape) => set((state) => ({
    shapes: state.shapes.find(s => s.id === shape.id) ? state.shapes : [...state.shapes, shape]
  })),

  updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  removeShape: (id) => set((state) => ({
    shapes: state.shapes.filter(s => s.id !== id),
    selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
  })),

  clearShapes: () => set({ shapes: [], selectedShapeId: null }),

  setActiveTool: (tool) => set({ activeTool: tool, isDrawing: false, tempPoints: [] }),

  toggleScissorsMode: () => set((state) => ({ isScissorsMode: !state.isScissorsMode })),

  setPreviewMode: (enabled) => set({ previewMode: enabled }),

  setSelectedShapeId: (id) => set({ selectedShapeId: id }),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  addTempPoint: (point) => set((state) => ({
    tempPoints: [...state.tempPoints, point]
  })),

  clearTempPoints: () => set({ tempPoints: [] }),

  getShapeById: (id) => get().shapes.find(s => s.id === id),

  isPointInFog: (x, y) => {
    const { shapes } = get()
    for (const shape of shapes) {
      if (!shape.isVisible) continue
      if (shape.isRevealed && isPointInShape(x, y, shape)) {
        return false
      }
    }
    return true
  },
}))

function isPointInShape(x: number, y: number, shape: FogShape): boolean {
  switch (shape.type) {
    case 'rect': {
      const { x: rx, y: ry, w, h } = shape.points
      return x >= rx && x <= rx + w && y >= ry && y <= ry + h
    }
    case 'circle': {
      const { x: cx, y: cy, r } = shape.points
      const dx = x - cx
      const dy = y - cy
      return dx * dx + dy * dy <= r * r
    }
    case 'polygon':
    case 'triangle': {
      return isPointInPolygon(x, y, shape.points)
    }
    case 'full':
      return true
    default:
      return false
  }
}

function isPointInPolygon(x: number, y: number, points: { x: number; y: number }[]): boolean {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y
    const xj = points[j].x, yj = points[j].y
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}