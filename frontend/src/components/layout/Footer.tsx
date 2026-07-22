interface FooterProps {
  marginLeft?: number;
}

export function Footer({ marginLeft = 0 }: FooterProps) {
  return (
    <footer className="app-footer" style={{ left: marginLeft }}>
      <p className="app-footer-text">GPCA © 2026 — Todos os direitos reservados.</p>
      <p className="app-footer-text">
        Desenvolvido por{' '}
        <span className="app-footer-author">Diogo José Varaschin de Oliveira</span>
      </p>
    </footer>
  );
}
