import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Eye, FolderOpen, BarChart2, ChevronRight } from 'lucide-react';

interface SidebarProps {
  aberta: boolean;
}

const navItems = [
  { grupo: 'VISÃO GERAL', items: [{ to: '/', label: 'Painel', icon: LayoutDashboard }] },
  {
    grupo: 'DOCUMENTOS',
    items: [
      { to: '/relatorios', label: 'Relatórios', icon: FileText },
      { to: '/revisar', label: 'Revisar Relatório', icon: Eye },
      { to: '/todos-relatorios', label: 'Todos os Relatórios', icon: FolderOpen },
    ],
  },
  { grupo: 'SAIBA MAIS', items: [{ to: '/analise', label: 'Análise', icon: BarChart2 }] },
];

export function Sidebar({ aberta }: SidebarProps) {
  return (
    <aside
      className="sidebar-transition fixed left-0 top-16 bottom-0 z-40 overflow-y-auto overflow-x-hidden flex flex-col"
      style={{
        width: aberta ? 220 : 56,
        backgroundColor: '#1E1E1E',
        borderRight: '1px solid #2a2a2a',
      }}
    >
      <nav className="flex-1 py-4">
        {navItems.map((grupo) => (
          <div key={grupo.grupo} className="mb-2">
            {aberta && (
              <p style={{ color: '#787878', fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '8px 16px 4px', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                {grupo.grupo}
              </p>
            )}
            {!aberta && <div style={{ height: 8 }} />}
            {grupo.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  title={!aberta ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: aberta ? '10px 16px' : '10px 0',
                    justifyContent: aberta ? 'flex-start' : 'center',
                    color: isActive ? 'white' : '#787878',
                    backgroundColor: isActive ? '#8A0538' : 'transparent',
                    borderLeft: isActive ? '3px solid #E5C3D0' : '3px solid transparent',
                    textDecoration: 'none',
                    fontFamily: 'Source Sans 3, sans-serif',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s',
                    borderRadius: aberta ? '0 8px 8px 0' : 0,
                    margin: '2px 0',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} color={isActive ? 'white' : '#787878'} style={{ flexShrink: 0 }} />
                      {aberta && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                      {aberta && isActive && <ChevronRight size={14} color="white" style={{ marginLeft: 'auto' }} />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {aberta && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a' }}>
          <p style={{ color: '#787878', fontSize: 10, margin: 0, fontFamily: 'Source Sans 3, sans-serif' }}>
            Grupo Marista · GPCA
          </p>
        </div>
      )}
    </aside>
  );
}
