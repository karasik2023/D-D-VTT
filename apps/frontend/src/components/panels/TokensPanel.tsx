export default function TokensPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button style={{ background: '#0f3460', border: '1px dashed #334155', borderRadius: 8, padding: 12, color: '#64748b', fontSize: 12 }}>
        + Загрузить
      </button>
      <p style={{ color: '#475569', fontSize: 11, textAlign: 'center', margin: 0 }}>— нет загруженных файлов —</p>
    </div>
  )
}