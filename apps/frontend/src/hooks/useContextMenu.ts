import { useCallback } from 'react'
import { useContextMenuStore, type ContextMenuItem } from '../stores/contextMenuStore'

interface OpenContextMenuParams {
  x: number
  y: number
  title: string
  subtitle?: string
  color?: string
  items: ContextMenuItem[]
}

export function useContextMenu() {
  const open = useContextMenuStore((state) => state.open)
  const close = useContextMenuStore((state) => state.close)

  const show = useCallback((params: OpenContextMenuParams) => {
    open(params)
  }, [open])

  return { show, close }
}