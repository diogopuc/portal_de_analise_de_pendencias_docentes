import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function Layout() {
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const sidebarW = sidebarAberta ? 220 : 56;

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarAberta(p => !p)} />
      <div className="app-body">
        <Sidebar aberta={sidebarAberta} />
        <main className="app-main" style={{ marginLeft: sidebarW }}>
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer marginLeft={sidebarW} />
    </div>
  );
}
