export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#1E1E1E',
        borderTop: '1px solid #2a2a2a',
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <p style={{ color: '#787878', fontSize: 12, margin: 0, fontFamily: 'Source Sans 3, sans-serif' }}>
        PUCPR © 2026 — Todos os direitos reservados.
      </p>
      <p style={{ color: '#787878', fontSize: 12, margin: 0, fontFamily: 'Source Sans 3, sans-serif' }}>
        Desenvolvido por{' '}
        <span style={{ color: '#E5C3D0', fontWeight: 600 }}>Diogo José Varaschin de Oliveira</span>
      </p>
    </footer>
  );
}
