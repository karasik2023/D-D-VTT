// frontend/src/components/panels/FogPanel.tsx
import { useState } from 'react'
import { FaMousePointer, FaDrawPolygon, FaSquare, FaCircle, FaPlay, FaEraser, FaEye, FaEyeSlash, FaCut } from 'react-icons/fa'
import { MdClearAll } from 'react-icons/md'
import { useFogStore, type FogTool } from '../../stores/fogStore'

const TOOLS: { id: FogTool; icon: React.ReactNode; label: string }[] = [
  { id: 'select', icon: <FaMousePointer size={14} />, label: 'Выбор' },
  { id: 'polygon', icon: <FaDrawPolygon size={14} />, label: 'Полигон' },
  { id: 'rect', icon: <FaSquare size={14} />, label: 'Прямоугольник' },
  { id: 'circle', icon: <FaCircle size={14} />, label: 'Круг' },
  { id: 'triangle', icon: <FaPlay size={14} style={{ transform: 'rotate(-90deg)' }} />, label: 'Треугольник' },
  { id: 'full', icon: <FaEraser size={14} />, label: 'Заливка' },
]

interface FogPanelProps {
  roomId: string | undefined
  onClearAll?: () => void
}

export default function FogPanel({ roomId, onClearAll }: FogPanelProps) {
  const {
    activeTool,
    isScissorsMode,
    previewMode,
    setActiveTool,
    toggleScissorsMode,
    setPreviewMode,
  } = useFogStore()

  const [showConfirmClear, setShowConfirmClear] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Инструменты */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => setActiveTool(tool.id)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: activeTool === tool.id ? '1px solid #a78bfa' : '1px solid transparent',
              background: activeTool === tool.id ? '#7c3aed' : 'transparent',
              color: activeTool === tool.id ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Ножницы — модификатор вкл/выкл */}
      <button
        onClick={toggleScissorsMode}
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #334155',
          background: isScissorsMode ? '#e74c3c' : 'transparent',
          color: isScissorsMode ? '#fff' : '#94a3b8',
          cursor: 'pointer',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.15s',
        }}
      >
        <FaCut size={14} />
        {isScissorsMode ? '✂️ Ножницы ВКЛ' : '✂️ Ножницы ВЫКЛ'}
      </button>

      {/* Режим предпросмотра */}
      <button
        onClick={() => setPreviewMode(!previewMode)}
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #334155',
          background: previewMode ? '#7c3aed' : 'transparent',
          color: previewMode ? '#fff' : '#94a3b8',
          cursor: 'pointer',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {previewMode ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
        {previewMode ? 'Предпросмотр вкл' : 'Предпросмотр выкл'}
      </button>

      {/* Очистить всё */}
      {showConfirmClear ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => {
              onClearAll?.()
              setShowConfirmClear(false)
            }}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Подтвердить
          </button>
          <button
            onClick={() => setShowConfirmClear(false)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Отмена
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirmClear(true)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #334155',
            background: 'transparent',
            color: '#e74c3c',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <MdClearAll size={14} />
          Очистить весь туман
        </button>
      )}

      {/* Подсказка */}
      <div style={{ padding: '8px', background: '#0f3460', borderRadius: 6 }}>
        <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, lineHeight: 1.4 }}>
          <strong style={{ color: '#a78bfa' }}>Выбор:</strong> ПКМ по фигуре — меню
          <br />
          <strong style={{ color: '#a78bfa' }}>Полигон:</strong> Клики для точек, двойной клик — завершить
          <br />
          <strong style={{ color: '#a78bfa' }}>Ножницы:</strong> Вкл/выкл — инвертирует создаваемые фигуры
          <br />
          <strong style={{ color: '#a78bfa' }}>Esc:</strong> Отмена рисования
        </p>
      </div>
    </div>
  )
}