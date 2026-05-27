import { useEffect, useRef } from 'react'
import { useContextMenuStore } from '../stores/contextMenuStore'

const MENU_BG = '#16213e'
const MENU_BORDER = '#1e293b'
const MENU_HOVER = '#0f3460'
const TEXT_MAIN = '#e2e8f0'
const TEXT_MUTED = '#94a3b8'
const DANGER_COLOR = '#e74c3c'

export default function ContextMenu() {
  const { isOpen, x, y, title, subtitle, color, items, close } = useContextMenuStore()
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрыть при клике вне меню
  useEffect(() => {
    if (!isOpen) return
    
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }
    
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [isOpen, close])

  // Закрыть при Esc
  useEffect(() => {
    if (!isOpen) return
    
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  if (!isOpen) return null

  // Корректировка позиции чтобы меню не выходило за экран
  const menuWidth = 200
  const menuHeight = items.length * 36 + 60 // примерная высота
  
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10)
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10)

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        minWidth: 180,
        maxWidth: 260,
        background: MENU_BG,
        border: `1px solid ${MENU_BORDER}`,
        borderRadius: 10,
        padding: '6px',
        zIndex: 999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        fontSize: 13,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Заголовок */}
      <div style={{
        padding: '4px 8px 8px',
        borderBottom: `1px solid ${MENU_BORDER}`,
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {color && (
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
            }} />
          )}
          <span style={{ color: TEXT_MAIN, fontWeight: 'bold' }}>{title}</span>
        </div>
        {subtitle && (
          <span style={{ color: TEXT_MUTED, fontSize: 11, marginLeft: 18 }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Элементы меню */}
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            item.onClick()
            close()
          }}
          disabled={item.disabled}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 6,
            background: 'transparent',
            border: 'none',
            color: item.danger ? DANGER_COLOR : TEXT_MAIN,
            fontSize: 13,
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'left',
            opacity: item.disabled ? 0.5 : 1,
            transition: 'background 0.12s',
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              e.currentTarget.style.background = MENU_HOVER
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
          {item.shortcut && (
            <span style={{ marginLeft: 'auto', color: TEXT_MUTED, fontSize: 11 }}>
              {item.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}