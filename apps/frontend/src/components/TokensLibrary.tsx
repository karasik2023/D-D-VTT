import { useRef } from 'react'
import { FaTrash, FaUpload } from 'react-icons/fa6'
import { useAssets } from '../hooks/useAssets'
import type { Asset } from '../services/assetsApi'

export default function TokensLibrary() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { tokens, loading, error, uploadToken, deleteToken, getAssetUrl } = useAssets()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadToken(file)
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Удалить токен?')) return
    await deleteToken(id)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, asset: Asset) => {
    e.dataTransfer.setData('application/vtt-token', JSON.stringify({
      name: asset.name,
      imageUrl: getAssetUrl(asset),
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 320, maxWidth: 420 }}>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        style={{
          background: '#0f3460', border: '1px dashed #475569', borderRadius: 8,
          padding: '10px 14px', color: '#a78bfa', fontSize: 12,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <FaUpload size={12} color="#a78bfa" />
        {loading ? 'Загрузка...' : 'Загрузить токен (PNG, JPG, WEBP, до 5 MB)'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {error && <p style={{ color: '#f87171', fontSize: 11, margin: 0, textAlign: 'center' }}>{error}</p>}

      {tokens.length === 0 ? (
        <p style={{ color: '#475569', fontSize: 11, margin: 0, textAlign: 'center', padding: '10px 0' }}>
          — библиотека пуста —
        </p>
      ) : (
        <>
          <p style={{ color: '#64748b', fontSize: 10, margin: 0, textAlign: 'center' }}>
            перетащи токен на холст
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 8,
            maxHeight: 260,
            overflowY: 'auto',
          }}>
            {tokens.map(token => (
              <div
                key={token.id}
                title={token.name}
                draggable
                onDragStart={e => handleDragStart(e, token)}
                style={{
                  position: 'relative', width: '100%', aspectRatio: '1',
                  borderRadius: 8, border: '1px solid #334155',
                  overflow: 'hidden', cursor: 'grab', background: '#0f3460',
                }}
              >
                <img
                  src={getAssetUrl(token)}
                  alt={token.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                />
                <button
                  onClick={e => handleDelete(token.id, e)}
                  style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 20, height: 20, borderRadius: 4,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <FaTrash size={10} color="#f87171" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}