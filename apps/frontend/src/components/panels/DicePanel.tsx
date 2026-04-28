export default function DicePanel() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'].map(d => (
          <button key={d} style={{ background: '#0f3460', border: '1px solid #334155', borderRadius: 8, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace' }}>
            {d}
          </button>
        ))}
      </div>
      <p style={{ color: '#475569', fontSize: 11, margin: 0, textAlign: 'center' }}>— функционал в разработке —</p>
    </div>
  )
}