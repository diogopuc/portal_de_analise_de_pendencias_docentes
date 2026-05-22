interface FooterProps {
  marginLeft?: number;
}

export function Footer({ marginLeft = 0 }: FooterProps) {
  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: marginLeft,
        right: 0,
        zIndex: 40,
        backgroundColor: '#1E1E1E',
        borderTop: '1px solid #2a2a2a',
        padding: '10px 32px',
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
