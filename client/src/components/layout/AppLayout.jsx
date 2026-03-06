import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('velora_sidebar_hidden') === '1';
  });
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.classList.remove('page-enter');
      void mainRef.current.offsetWidth;
      mainRef.current.classList.add('page-enter');
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('velora_sidebar_hidden', desktopSidebarHidden ? '1' : '0');
  }, [desktopSidebarHidden]);

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
      </div>

      {desktopSidebarHidden && (
        <button
          onClick={() => setDesktopSidebarHidden(false)}
          className="hidden md:flex fixed top-4 left-4 z-30 p-2 rounded-xl border border-[var(--color-border)] bg-surface-sidebar hover:bg-surface-glass transition"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <Menu size={18} />
        </button>
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        desktopHidden={desktopSidebarHidden}
        onDesktopHide={() => setDesktopSidebarHidden(true)}
      />

      <main ref={mainRef} className="flex-1 overflow-y-auto p-3 sm:p-6 pt-20 md:pt-6 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
