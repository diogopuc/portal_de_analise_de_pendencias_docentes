import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { dashboardAPI } from '../../services/api';

export function Layout() {
  const [sidebarAberta, setSidebarAberta] = useState(true);

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardAPI.getDados,
    staleTime: 30000,
  });

  const percRevisado = data && data.totalDocentes > 0
    ? Math.round(((data.totalPendenciaAgenda + data.totalPendenciaTach) / (data.totalDocentes * 2)) * 100)
    : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header sidebarAberta={sidebarAberta} onToggleSidebar={() => setSidebarAberta(p => !p)} percRevisado={percRevisado} />
      <div style={{ display: 'flex', flex: 1, paddingTop: 64 }}>
        <Sidebar aberta={sidebarAberta} />
        <main
          className="sidebar-transition flex-1 flex flex-col"
          style={{
            marginLeft: sidebarAberta ? 220 : 56,
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, padding: '24px 32px', backgroundColor: '#F0F2F2' }}>
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
