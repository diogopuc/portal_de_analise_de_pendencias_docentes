import { Menu } from 'lucide-react';

interface HeaderProps {
  sidebarAberta: boolean;
  onToggleSidebar: () => void;
  percRevisado?: number;
}

export function Header({ sidebarAberta, onToggleSidebar, percRevisado }: HeaderProps) {
  return (
    <header
      style={{ backgroundColor: '#8A0538', height: 64 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center shadow-lg"
    >
      <button
        onClick={onToggleSidebar}
        className="flex items-center justify-center w-16 h-full hover:bg-white/10 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={22} color="white" />
      </button>

      <div className="flex items-center gap-3 px-2">
        <img
          src="/logoPUCPR.png"
          alt="PUCPR"
          style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="h-7 w-px bg-white/30" />
        <div>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: 'white', margin: 0, lineHeight: 1.2 }}>
            Portal de Análise de Pendências Docentes
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            PUCPR — Grupo Marista
          </p>
        </div>
      </div>

      <div className="ml-auto px-6 flex items-center gap-3">
        {percRevisado !== undefined && (
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            borderRadius: 20,
            padding: '3px 12px',
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
          }}>
            {percRevisado}% revisado
          </span>
        )}
        <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#7EE543' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, whiteSpace: 'nowrap' }}>Sistema Online</span>
        </div>
      </div>
    </header>
  );
}
