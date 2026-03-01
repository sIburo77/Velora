import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from '../notifications/NotificationBell';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 border-b border-[var(--color-border)] bg-surface-sidebar md:hidden">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-surface-glass transition"
          >
            <Menu size={20} />
          </button>
          <h1 className="ml-3 text-lg font-bold glow-text">Velora</h1>
        </div>
        <NotificationBell />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto p-6 pt-20 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
}
