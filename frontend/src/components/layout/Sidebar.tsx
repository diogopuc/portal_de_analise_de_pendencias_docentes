import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Eye, FolderOpen, BarChart2, ChevronRight, GraduationCap } from 'lucide-react';

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
  {
    grupo: 'COORDENAÇÃO',
    items: [{ to: '/coordenador', label: 'Visão do Coordenador', icon: GraduationCap }],
  },
  { grupo: 'SAIBA MAIS', items: [{ to: '/analise', label: 'Análise', icon: BarChart2 }] },
];

export function Sidebar({ aberta }: SidebarProps) {
  return (
    <aside
      className="app-sidebar"
      style={{ width: aberta ? 220 : 56 }}
      data-collapsed={aberta ? undefined : ''}
    >
      <nav className="flex-1 py-4">
        {navItems.map((grupo) => (
          <div key={grupo.grupo} className="mb-2">
            {aberta && <p className="sidebar-group-label">{grupo.grupo}</p>}
            {!aberta && <div style={{ height: 8 }} />}
            {grupo.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  title={!aberta ? item.label : undefined}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'white' : '#787878' }} />
                      <span className="sidebar-nav-label"><span>{item.label}</span></span>
                      {isActive && (
                        <ChevronRight size={14} className="sidebar-chevron" style={{ marginLeft: 'auto', color: 'white' }} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {aberta && (
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">PUCPR · GPCA</p>
        </div>
      )}
    </aside>
  );
}
