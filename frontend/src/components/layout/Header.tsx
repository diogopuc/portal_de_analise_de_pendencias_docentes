import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="app-header">
      <button onClick={onToggleSidebar} className="app-header-toggle" aria-label="Alternar menu lateral">
        <Menu size={22} color="white" />
      </button>

      <div className="flex items-center gap-3 px-2">
        <img
          src="/logoPUCPR.png"
          alt="PUCPR"
          className="app-header-logo"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="app-header-divider" />
        <div>
          <p className="app-header-title">Portal de Análise de Pendências Docentes</p>
          <p className="app-header-subtitle">PUCPR — Grupo Marista</p>
        </div>
      </div>
    </header>
  );
}
